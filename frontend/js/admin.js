window.onload = function() {
  checkAuth();
  loadStats();
  loadBookings();
 
}

function showTab(tab) {
  document.getElementById('bookingsTab').style.display = 'none';
  document.getElementById('driversTab').style.display  = 'none';
  document.getElementById('usersTab').style.display    = 'none';
  document.getElementById(tab + 'Tab').style.display   = 'block';

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');

   if (tab === 'drivers')  loadDrivers();
  if (tab === 'users')    loadUsers();
  if (tab === 'bookings') loadBookings();
}

async function loadStats() {
  try {
    const res  = await fetch('http://localhost:5000/api/admin/stats', {
      headers: { 'Authorization': getToken() }
    });
    const data = await res.json();
    document.getElementById('statUsers').textContent     = data.totalUsers;
    document.getElementById('statDrivers').textContent   = data.totalDrivers;
    document.getElementById('statBookings').textContent  = data.totalBookings;
    document.getElementById('statPending').textContent   = data.pending;
    document.getElementById('statCompleted').textContent = data.completed;
  } catch (err) {
    console.log('Stats error:', err);
  }
}

async function loadBookings() {
  try {
    const res  = await fetch('http://localhost:5000/api/admin/bookings', {
      headers: { 'Authorization': getToken() }
    });
    const data = await res.json();
    document.getElementById('bookingsBody').innerHTML = data.map(b => `
      <tr>
        <td>${b.customer ? b.customer.name : 'N/A'}</td>
        <td>${b.serviceType === 'pickup_drop' ? '🚗 Pickup & Drop' : '👤 With Client'}</td>
        <td>${b.pickup}</td>
        <td>${b.drop}</td>
        <td>₹${b.fare}</td>
        <td><span class="badge badge-${b.status}">${b.status}</span></td>
        <td>${b.driver ? b.driver.name : 'Unassigned'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.log('Bookings error:', err);
  }
}

async function loadDrivers() {
  try {
    const res  = await fetch('http://localhost:5000/api/admin/drivers', {
      headers: { 'Authorization': getToken() }
    });
    const data = await res.json();
    document.getElementById('driversBody').innerHTML = data.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>${d.email}</td>
        <td>${d.phone}</td>
        <td>
          <span class="badge ${d.isApproved ? 'badge-approved' : 'badge-waiting'}">
            ${d.isApproved ? 'Approved' : 'Pending'}
          </span>
        </td>
        <td>
          ${!d.isApproved ? `
            <button class="btn btn-primary"
              style="padding:6px 16px;font-size:13px"
              onclick="approveDriver('${d._id}')">
              Approve
            </button>` : '✅'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.log('Drivers error:', err);
  }
}

async function loadUsers() {
  try {
    const res  = await fetch('http://localhost:5000/api/admin/users', {
      headers: { 'Authorization': getToken() }
    });
    const data = await res.json();
    document.getElementById('usersBody').innerHTML = data.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.log('Users error:', err);
  }
}

async function approveDriver(driverId) {
  try {
    const res = await fetch(`http://localhost:5000/api/admin/drivers/${driverId}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': getToken() }
    });
    if (res.ok) {
      alert('Driver approved!');
      loadDrivers();
      loadStats();
    }
  } catch (err) {
    console.log('Approve error:', err);
  }
}
