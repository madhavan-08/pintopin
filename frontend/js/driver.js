window.onload = function() {
  checkAuth();
  const user = getUser();
  if (user) {
    document.getElementById('driverName').textContent = `Hi, ${user.name} 👋`;
  }
  loadAvailable();
}

function showTab(tab) {
  document.getElementById('availableTab').style.display = 'none';
  document.getElementById('myjobsTab').style.display    = 'none';
  document.getElementById(tab + 'Tab').style.display    = 'block';

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');

  if (tab === 'available') loadAvailable();
  if (tab === 'myjobs')    loadMyJobs();
}

async function loadAvailable() {
  try {
    const res  = await fetch('http://localhost:5000/api/bookings', {
      headers: { 'Authorization': getToken() }
    });
    const data = await res.json();
    renderAvailable(data);
  } catch (err) {
    document.getElementById('availableList').innerHTML =
      '<p class="empty">Cannot load bookings</p>';
  }
}

async function loadMyJobs() {
  try {
    const res  = await fetch('http://localhost:5000/api/bookings/my-jobs', {
      headers: { 'Authorization': getToken() }
    });
    const data = await res.json();
    renderMyJobs(data);
  } catch (err) {
    document.getElementById('myjobsList').innerHTML =
      '<p class="empty">Cannot load jobs</p>';
  }
}

function renderAvailable(bookings) {
  const container = document.getElementById('availableList');
  if (!bookings.length) {
    container.innerHTML = '<p class="empty">No available bookings right now</p>';
    return;
  }
  container.innerHTML = bookings.map(b => `
    <div class="booking-card">
      <span class="badge badge-${b.status}">${b.status.toUpperCase()}</span>
      <h3>${b.serviceType === 'pickup_drop' ? '🚗 Pickup & Drop' : '👤 Driver With Client'}</h3>
     <p>📍 From: ${b.pickup}</p>
<p>🏁 To: ${b.drop}</p>
<button onclick="viewRoute('${b.pickup}', '${b.drop}')"
  style="
    margin-top:10px;
    padding:8px 18px;
    font-size:13px;
    font-weight:600;
    background:rgba(77,159,255,0.15);
    color:#4d9fff;
    border:1.5px solid #4d9fff;
    border-radius:8px;
    cursor:pointer;
    width:100%;
  "
  onmouseover="this.style.background='#4d9fff';this.style.color='white'"
  onmouseout="this.style.background='rgba(77,159,255,0.15)';this.style.color='#4d9fff'">
  🗺️ View Route on Map
</button>
      <p>🕐 ${new Date(b.datetime).toLocaleString()}</p>
      <p>👤 Customer: ${b.customer ? b.customer.name : 'N/A'}</p>
      <p>📞 Phone: ${b.customer ? b.customer.phone : 'N/A'}</p>
      <p>💰 Fare: ₹${b.fare}</p>
      <button class="btn-small btn-accept"
        onclick="acceptBooking('${b._id}')">
        ✅ Accept Booking
      </button>
    </div>
  `).join('');
}

function renderMyJobs(bookings) {
  const container = document.getElementById('myjobsList');
  if (!bookings.length) {
    container.innerHTML = '<p class="empty">No active jobs right now</p>';
    return;
  }
  container.innerHTML = bookings.map(b => `
    <div class="booking-card">
      <span class="badge badge-${b.status}">${b.status.toUpperCase()}</span>
      <h3>${b.serviceType === 'pickup_drop' ? '🚗 Pickup & Drop' : '👤 Driver With Client'}</h3>
      <p>📍 From: ${b.pickup}</p>
<p>🏁 To: ${b.drop}</p>
<button onclick="viewRoute('${b.pickup}', '${b.drop}')"
  style="
    margin-top:10px;
    padding:8px 18px;
    font-size:13px;
    font-weight:600;
    background:rgba(77,159,255,0.15);
    color:#4d9fff;
    border:1.5px solid #4d9fff;
    border-radius:8px;
    cursor:pointer;
    width:100%;
  "
  onmouseover="this.style.background='#4d9fff';this.style.color='white'"
  onmouseout="this.style.background='rgba(77,159,255,0.15)';this.style.color='#4d9fff'">
  🗺️ View Route on Map
</button>
      <p>🕐 ${new Date(b.datetime).toLocaleString()}</p>
      <p>👤 Customer: ${b.customer ? b.customer.name : 'N/A'}</p>
      <p>📞 Phone: ${b.customer ? b.customer.phone : 'N/A'}</p>
      <p>💰 Fare: ₹${b.fare}</p>

      ${b.status === 'accepted' ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #eee">
          <p><strong>🔐 Enter Customer OTP to start trip:</strong></p>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            <input type="text" id="otp-${b._id}"
              maxlength="6" placeholder="Enter 6-digit OTP"
              style="padding:8px 12px;border:2px solid #ddd;
                     border-radius:8px;font-size:16px;
                     letter-spacing:4px;width:160px"/>
            <button class="btn-small btn-start"
              onclick="verifyOTP('${b._id}')">
              ✅ Verify & Start Trip
            </button>
          </div>
        </div>` : ''}

      ${b.status === 'in_progress' ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #eee">
          <p style="color:#0d6efd;font-weight:600;margin-bottom:8px">
            🚀 Trip is in progress...
          </p>
          <p>📍 Pickup: ${b.pickup}</p>
          <p>🏁 Drop: ${b.drop}</p>
          <button class="btn-small btn-complete"
            style="margin-top:10px"
            onclick="completeTrip('${b._id}')">
            ✅ Complete Trip
          </button>
        </div>` : ''}
    </div>
  `).join('');
}

async function acceptBooking(id) {
  try {
    const res = await fetch(`http://localhost:5000/api/bookings/${id}/accept`, {
      method: 'PUT',
      headers: { 'Authorization': getToken() }
    });
    if (res.ok) {
      alert('✅ Booking accepted! Go to My Active Jobs to start the trip.');
      loadAvailable();
      // Switch to my jobs tab
      document.querySelectorAll('.tab')[1].click();
    }
  } catch (err) { alert('Error accepting booking'); }
}

async function verifyOTP(id) {
  const otp = document.getElementById('otp-' + id).value.trim();

  if (otp.length !== 6) {
    alert('Please enter the 6-digit OTP from customer');
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/bookings/${id}/verify-otp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken()
      },
      body: JSON.stringify({ otp })
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ OTP Verified! Trip has started successfully.');
      loadMyJobs();
    } else {
      alert(data.message || '❌ Wrong OTP! Ask customer for correct OTP.');
    }
  } catch (err) {
    alert('Error verifying OTP');
  }
}

async function completeTrip(id) {
  if (!confirm('Are you sure you want to complete this trip?')) return;

  try {
    const res = await fetch(`http://localhost:5000/api/bookings/${id}/complete`, {
      method: 'PUT',
      headers: { 'Authorization': getToken() }
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ Trip completed successfully!\nCustomer can now rate you ⭐');
      loadMyJobs();
    } else {
      alert(data.message || 'Error completing trip');
    }
  } catch (err) {
    alert('Error completing trip');
  }

}
async function viewRoute(pickup, drop) {
  // Check if pickup/drop are coordinates (lat,lng format)
  const coordRegex = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;

  let pickupCoord = null;
  let dropCoord   = null;

  if (coordRegex.test(pickup.trim())) {
    // Already coordinates
    const parts = pickup.split(',');
    pickupCoord = parts[0].trim() + ',' + parts[1].trim();
  } else {
    // Convert address to coordinates using Nominatim
    try {
      const res  = await fetch('https://nominatim.openstreetmap.org/search?format=json&q='
                 + encodeURIComponent(pickup + ', India'));
      const data = await res.json();
      if (data.length) pickupCoord = data[0].lat + ',' + data[0].lon;
    } catch(e) {}
  }

  if (coordRegex.test(drop.trim())) {
    const parts = drop.split(',');
    dropCoord = parts[0].trim() + ',' + parts[1].trim();
  } else {
    try {
      const res  = await fetch('https://nominatim.openstreetmap.org/search?format=json&q='
                 + encodeURIComponent(drop + ', India'));
      const data = await res.json();
      if (data.length) dropCoord = data[0].lat + ',' + data[0].lon;
    } catch(e) {}
  }

  if (!pickupCoord || !dropCoord) {
    alert('Could not find locations on map. Try again.');
    return;
  }

  // Open route in OpenStreetMap in new tab
  const [pickLat, pickLng] = pickupCoord.split(',');
  const [dropLat, dropLng] = dropCoord.split(',');

  const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${pickLat}%2C${pickLng}%3B${dropLat}%2C${dropLng}`;

  window.open(url, '_blank');
}