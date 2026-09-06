const API = 'https://pintopin.onrender.com/api';

async function handleRegister() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  if (!name || !email || !phone || !password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, role })
    });

    const data = await res.json();

    if (res.ok) {
  alert('✅ Registered successfully! Please login.');
  window.location.href = 'login.html';
} else {
  alert('❌ ' + (data.message || 'Registration failed'));
}
  } catch (err) {
    alert('Cannot connect to server. Is it running?');
  }
}

async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

    if (!name || !email || !phone || !password) {
    alert('Please fill in all fields');
    return;
  }

  // Phone must be exactly 10 digits starting with 6-9
  if (!/^[6-9]\d{9}$/.test(phone)) {
    alert('❌ Invalid phone number!\nMust be 10 digits starting with 6, 7, 8 or 9\nExample: 9876543210');
    return;
  }

  // Password must be at least 6 characters
  if (password.length < 6) {
    alert('❌ Password must be at least 6 characters!');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      // Save token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      alert(`Welcome ${data.user.name}!`);

      // Redirect based on role
      if (data.user.role === 'customer') {
        window.location.href = 'booking.html';
      } else if (data.user.role === 'driver') {
        window.location.href = 'driver.html';
      } else if (data.user.role === 'admin') {
        window.location.href = 'admin.html';
      }
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    alert('Cannot connect to server. Is it running?');
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}

function getUser() {
  return JSON.parse(localStorage.getItem('user'));
}

function getToken() {
  return localStorage.getItem('token');
}

function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = '../pages/login.html';
  }
}