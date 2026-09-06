let map;
let pickupMarker = null;
let dropMarker   = null;
let estimatedFare = 0;
let nextClick = 'pickup';

window.onload = function() {
  checkAuth();
  // Add autocomplete styles
const style = document.createElement('style');
style.innerHTML = `
  .autocomplete-wrap { position: relative; }
  .suggestions-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    z-index: 9999;
    max-height: 200px;
    overflow-y: auto;
    display: none;
  }
  .suggestion-item {
    padding: 10px 14px;
    cursor: pointer;
    font-size: 13px;
    color: #333;
    border-bottom: 1px solid #f0f0f0;
  }
  .suggestion-item:hover { background: #f9f9f9; color: #e94560; }
  .suggestion-item:last-child { border-bottom: none; }
`;
document.head.appendChild(style);
  const user = getUser();
  if (user) {
    document.getElementById('userName').textContent = `Hi, ${user.name} 👋`;
  }

  // Set minimum datetime to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('datetime').min = now.toISOString().slice(0, 16);

  // Init Leaflet map centered on Bangalore
  map = L.map('map').setView([12.9716, 77.5946], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Click pickup input → next map click sets pickup
  document.getElementById('pickup').addEventListener('focus', () => {
    nextClick = 'pickup';
  });

  // Click drop input → next map click sets drop
document.getElementById('drop').addEventListener('focus', () => {
    nextClick = 'drop';
  });

  // Recalculate fare when service type changes
  document.getElementById('serviceType').addEventListener('change', function() {
    if (pickupMarker && dropMarker) {
      removeLines();
      calculateFare();
    }
  });

  // Click anywhere on map to place pin
  map.on('click', function(e) {
    const { lat, lng } = e.latlng;

    if (nextClick === 'pickup') {
      placePickupPin(lat, lng);
      document.getElementById('pickup').value =
        lat.toFixed(4) + ', ' + lng.toFixed(4);
      nextClick = 'drop';
    } else {
      placeDropPin(lat, lng);
      document.getElementById('drop').value =
        lat.toFixed(4) + ', ' + lng.toFixed(4);
      nextClick = 'pickup';
    }

    if (pickupMarker && dropMarker) {
      removeLines();
      calculateFare();
    }
  });
}

// ── Place pickup pin (draggable) ──
function placePickupPin(lat, lng) {
  if (pickupMarker) map.removeLayer(pickupMarker);

  pickupMarker = L.marker([lat, lng], {
    draggable: true,
    icon: L.divIcon({
      html: '📍',
      className: '',
      iconSize: [30, 30]
    })
  }).addTo(map)
    .bindPopup('📍 Pickup — drag to adjust')
    .openPopup();

  pickupMarker.on('dragend', function() {
    if (pickupMarker && dropMarker) {
      const pos = pickupMarker.getLatLng();
      document.getElementById('pickup').value =
        pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4);
      removeLines();
      calculateFare();
    }
  });
}

// ── Place drop pin (draggable) ──
function placeDropPin(lat, lng) {
  if (dropMarker) map.removeLayer(dropMarker);

  dropMarker = L.marker([lat, lng], {
    draggable: true,
    icon: L.divIcon({
      html: '🏁',
      className: '',
      iconSize: [30, 30]
    })
  }).addTo(map)
    .bindPopup('🏁 Drop — drag to adjust')
    .openPopup();

  dropMarker.on('dragend', function() {
    if (pickupMarker && dropMarker) {
      const pos = dropMarker.getLatLng();
      document.getElementById('drop').value =
        pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4);
      removeLines();
      calculateFare();
    }
  });
}

// ── Remove route lines ──
function removeLines() {
  map.eachLayer(layer => {
    if (layer instanceof L.Polyline) map.removeLayer(layer);
  });
}

// ── Search address and pin it ──
async function searchLocation(type) {
  const address = document.getElementById(type).value;
  if (!address) {
    alert('Please enter an address first');
    return;
  }

  try {
    const url  = 'https://nominatim.openstreetmap.org/search?format=json&q='
               + encodeURIComponent(address + ', Bangalore, India');
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.length) {
      alert('Location not found. Try a more specific address.');
      return;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    if (type === 'pickup') {
      placePickupPin(lat, lng);
      document.getElementById('pickup').value = address;
    } else {
      placeDropPin(lat, lng);
      document.getElementById('drop').value = address;
    }

    map.setView([lat, lng], 14);

    if (pickupMarker && dropMarker) {
      removeLines();
      calculateFare();
    }

  } catch (err) {
    alert('Error finding location. Check your internet.');
  }
}

// ── Calculate fare between two pins ──
function calculateFare() {
  const p = pickupMarker.getLatLng();
  const d = dropMarker.getLatLng();

  // Haversine formula for distance
  const R    = 6371;
  const dLat = (d.lat - p.lat) * Math.PI / 180;
  const dLng = (d.lng - p.lng) * Math.PI / 180;
  const a    = Math.sin(dLat/2) * Math.sin(dLat/2) +
               Math.cos(p.lat * Math.PI / 180) *
               Math.cos(d.lat * Math.PI / 180) *
               Math.sin(dLng/2) * Math.sin(dLng/2);
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Get service type
  const serviceType = document.getElementById('serviceType').value;

  // Base rates
  const BASE_FARE        = 50;
  const RATE_PICKUP_DROP = 15;  // ₹15/km for pickup & drop
  const RATE_WITH_CLIENT = 22;  // ₹22/km for driver with client

  // Pick rate based on service
  const ratePerKm = serviceType === 'pickup_drop'
    ? RATE_PICKUP_DROP
    : RATE_WITH_CLIENT;

  // Calculate base fare
  let fare = BASE_FARE + (dist * ratePerKm);

  // Night surcharge (9PM to 3AM)
  const now  = new Date();
  const hour = now.getHours();
  let nightSurcharge = false;

  if (hour >= 21 || hour < 3) {
    fare = fare * 1.5;
    nightSurcharge = true;
  }

  // Minimum fare
  const minFare = serviceType === 'pickup_drop' ? 100 : 150;
  fare = Math.max(fare, minFare);

  estimatedFare = Math.round(fare);

  // Draw dashed line between pins
  L.polyline([p, d], {
    color: '#e94560',
    weight: 4,
    dashArray: '8'
  }).addTo(map);

  // Fit both pins in view
  map.fitBounds([p, d], { padding: [50, 50] });

  // Show fare box
  document.getElementById('fareBox').style.display = 'block';
  document.getElementById('fareText').innerHTML = `
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr>
        <td>📏 Distance</td>
        <td><strong>${dist.toFixed(1)} km</strong></td>
      </tr>
      <tr>
        <td>🚗 Service</td>
        <td><strong>${serviceType === 'pickup_drop' ? 'Pickup & Drop' : 'Driver With Client'}</strong></td>
      </tr>
      <tr>
        <td>💵 Rate</td>
        <td><strong>₹${ratePerKm}/km</strong></td>
      </tr>
      ${nightSurcharge ? `
      <tr>
        <td>🌙 Night surcharge</td>
        <td><strong style="color:#e94560">1.5x applied</strong></td>
      </tr>` : ''}
      <tr style="border-top:2px solid #28a745;margin-top:8px">
        <td style="padding-top:8px;font-size:16px"><strong>💰 Total Fare</strong></td>
        <td style="padding-top:8px;font-size:20px;color:#28a745">
          <strong>₹${estimatedFare}</strong>
        </td>
      </tr>
    </table>
    ${nightSurcharge ? '<p style="color:#e94560;font-size:12px;margin-top:8px">🌙 Night charges applied (9PM - 3AM)</p>' : ''}
  `;
}

// ── Create booking ──
async function createBooking() {
  const serviceType   = document.getElementById('serviceType').value;
  const pickup        = document.getElementById('pickup').value;
  const drop          = document.getElementById('drop').value;
  const datetime      = document.getElementById('datetime').value;
  const vehicleNumber = document.getElementById('vehicleNumber').value;

  if (!pickup || !drop || !datetime || !vehicleNumber) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const res = await fetch('https://pintopin.onrender.com/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken()
      },
      body: JSON.stringify({
        serviceType, pickup, drop,
        datetime, vehicleNumber,
        fare: estimatedFare || 150
      })
    });

    const data = await res.json();

  if (res.ok) {
  const confirmOTP = data.confirmOTP;

  // Send confirmation email with OTP
  await sendBookingEmail({
    pickup:      pickup,
    drop:        drop,
    serviceType: serviceType,
    fare:        estimatedFare || 150,
    datetime:    datetime,
    confirmOTP:  confirmOTP
  });

  alert(
    '✅ Booking Confirmed!\n\n' +
    '🔐 Your Confirmation OTP: ' + confirmOTP + '\n\n' +
    'Show this OTP to your driver when they arrive.\n' +
    'A confirmation email has also been sent!'
  );
  window.location.href = 'history.html';
} else {
      alert(data.message || 'Booking failed');
    }
  } catch (err) {
    alert('Cannot connect to server. Is it running?');
  }
}

// ── Address Autocomplete ──
let suggestionTimeout = null;

function toggleBookBtn() {
  const checkbox = document.getElementById('fuelAgreed');
  const btn      = document.getElementById('bookBtn');

  if (checkbox.checked) {
    btn.disabled          = false;
    btn.style.opacity     = '1';
    btn.style.cursor      = 'pointer';
    btn.innerHTML         = '🚗 Book Driver';
  } else {
    btn.disabled          = true;
    btn.style.opacity     = '0.4';
    btn.style.cursor      = 'not-allowed';
    btn.innerHTML         = '🔒 Agree to fuel terms to Book Driver';
  }
}

async function getSuggestions(type) {
  const input = document.getElementById(type).value.trim();
  const list  = document.getElementById(type + '-suggestions');

  // Hide if less than 3 characters
  if (input.length < 3) {
    list.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  // Debounce — wait 400ms after user stops typing
  clearTimeout(suggestionTimeout);
  suggestionTimeout = setTimeout(async () => {
    try {
      const url  = 'https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=5&q='
                 + encodeURIComponent(input + ', India');
      const res  = await fetch(url);
      const data = await res.json();

      if (!data.length) {
        list.style.display = 'none';
        return;
      }

      // Build suggestion items
      list.innerHTML = data.map((place, i) => `
        <div class="suggestion-item"
          onclick="selectSuggestion('${type}', ${place.lat}, ${place.lon}, \`${place.display_name.replace(/`/g, "'")}\`)">
          📍 ${place.display_name}
        </div>
      `).join('');

      list.style.display = 'block';

    } catch (err) {
      list.style.display = 'none';
    }
  }, 400);
}

function selectSuggestion(type, lat, lng, address) {
  // Set the input value to a short version of the address
  const shortAddress = address.split(',').slice(0, 3).join(',').trim();
  document.getElementById(type).value = shortAddress;

  // Hide suggestions
  document.getElementById(type + '-suggestions').style.display = 'none';

  // Place pin on map
  if (type === 'pickup') {
    placePickupPin(parseFloat(lat), parseFloat(lng));
  } else {
    placeDropPin(parseFloat(lat), parseFloat(lng));
  }

  map.setView([parseFloat(lat), parseFloat(lng)], 14);

  // Recalculate fare if both pins exist
  if (pickupMarker && dropMarker) {
    removeLines();
    calculateFare();
  }
}

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.autocomplete-wrap')) {
    document.querySelectorAll('.suggestions-list').forEach(l => {
      l.style.display = 'none';
    });
  }
});
