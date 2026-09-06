window.onload = function() {
  checkAuth();
  loadHistory();
}

async function loadHistory() {
  try {
    const res  = await fetch('https://pintopin.onrender.com/api/bookings/my', {
      headers: { 'Authorization': getToken() }
    });
    const data = await res.json();
    renderHistory(data);
  } catch (err) {
    document.getElementById('historyList').innerHTML =
      '<p class="empty">Cannot load bookings</p>';
  }
}

function renderHistory(bookings) {
  const container = document.getElementById('historyList');
  if (!bookings.length) {
    container.innerHTML = `
      <p class="empty">
        No bookings yet.
        <a href="booking.html">Book a driver!</a>
      </p>`;
    return;
  }

  container.innerHTML = bookings.map(b => `
    <div class="booking-card">
      <span class="badge badge-${b.status}">${b.status.toUpperCase()}</span>
      <h3>${b.serviceType === 'pickup_drop' ? '🚗 Pickup & Drop' : '👤 Driver With Me'}</h3>
      <p>📍 From: ${b.pickup}</p>
      <p>🏁 To: ${b.drop}</p>
      <p>🕐 ${new Date(b.datetime).toLocaleString()}</p>
      <p>🚘 Vehicle: ${b.vehicleNumber}</p>
      <p>💰 Fare: ₹${b.fare}</p>
${b.status === 'accepted' && b.confirmOTP ? `
  <div style="background:#fff3cd;border:2px solid #ffc107;
    border-radius:8px;padding:12px;margin-top:8px">
    <p style="color:#856404;font-weight:600">
      🔐 Show this OTP to your driver:
    </p>
    <p style="font-size:28px;font-weight:bold;
      letter-spacing:8px;color:#1a1a2e;text-align:center">
      ${b.confirmOTP}
    </p>
  </div>` : ''}
      ${b.driver
        ? `<p>👤 Driver: ${b.driver.name} | 📞 ${b.driver.phone}</p>`
        : '<p style="color:#e94560">⏳ Waiting for driver...</p>'
      }
      ${b.status === 'completed' && !b.rating ? `
        <div class="rate-box">
          <p><strong>⭐ Rate your driver:</strong></p>
          <div class="stars" id="stars-${b._id}">
            ${[1,2,3,4,5].map(n => `
              <span onclick="rateBooking('${b._id}', ${n})"
                style="font-size:28px;cursor:pointer;color:#ffc107">★</span>
            `).join('')}
          </div>
        </div>` : ''
      }
      ${b.rating ? `
        <p style="color:#ffc107;margin-top:8px">
          ⭐ Your rating: ${b.rating}/5
          ${b.review ? `— "${b.review}"` : ''}
        </p>` : ''
      }
    </div>
  `).join('');
}

async function rateBooking(bookingId, rating) {
  const review = prompt(`Rate ${rating}/5 — Add a comment (optional):`);
  try {
    const res = await fetch(`https://pintopin.onrender.com/api/bookings/${bookingId}/rate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken()
      },
      body: JSON.stringify({ rating, review: review || '' })
    });
    if (res.ok) {
      alert(`⭐ Thanks for rating ${rating}/5!`);
      loadHistory();
    }
  } catch (err) {
    alert('Error saving rating');
  }
}