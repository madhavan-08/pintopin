let currentOTP = '';
let currentEmail = '';
let timerInterval;

// Move to next OTP input box automatically
function moveToNext(current, nextId) {
  if (current.value.length === 1 && nextId) {
    document.getElementById(nextId).focus();
  }
}

// Show a specific step
function showStep(stepNum) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + stepNum).classList.add('active');
}

// Start 5 minute countdown timer
function startTimer() {
  let seconds = 300; // 5 minutes
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timer').textContent =
      `OTP expires in: ${mins}:${secs < 10 ? '0' : ''}${secs}`;

    if (seconds <= 0) {
      clearInterval(timerInterval);
      document.getElementById('timer').textContent = 'OTP expired!';
      document.getElementById('resendBtn').disabled = false;
    }
    seconds--;
  }, 1000);
}

// Step 1 — Send OTP
async function sendOTP(isResend = false) {
  const email = isResend
    ? currentEmail
    : document.getElementById('fpEmail').value.trim();

  if (!email) {
    alert('Please enter your email');
    return;
  }

  try {
    const res  = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (!res.ok) {
      alert('❌ ' + data.message);
      return;
    }

    // Save OTP and email
    currentOTP   = data.otp;
    currentEmail = email;

    // Send OTP email via EmailJS
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_name:      data.name,
        to_email:     email,
        status:       'Password Reset OTP',
        pickup:       'Your OTP is: ' + data.otp,
        drop:         'This OTP expires in 5 minutes',
        service_type: 'Password Reset',
        fare:         '',
        datetime:     new Date().toLocaleString(),
        driver_info:  'If you did not request this, ignore this email.'
      }
    );

    // Show step 2
    document.getElementById('emailDisplay').textContent = email;
    showStep(2);
    startTimer();

    // Disable resend for 30 seconds
    const resendBtn = document.getElementById('resendBtn');
    resendBtn.disabled = true;
    setTimeout(() => resendBtn.disabled = false, 30000);

    if (isResend) alert('✅ New OTP sent to your email!');

  } catch (err) {
    alert('Error sending OTP. Try again.');
    console.log(err);
  }
}

// Step 2 — Verify OTP
function verifyOTP() {
  const enteredOTP =
    document.getElementById('otp1').value +
    document.getElementById('otp2').value +
    document.getElementById('otp3').value +
    document.getElementById('otp4').value +
    document.getElementById('otp5').value +
    document.getElementById('otp6').value;

  if (enteredOTP.length < 6) {
    alert('Please enter all 6 digits');
    return;
  }

  if (enteredOTP !== currentOTP) {
    alert('❌ Wrong OTP! Please try again.');
    return;
  }

  clearInterval(timerInterval);
  showStep(3);
}

// Step 3 — Reset Password
async function resetPassword() {
  const newPassword     = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!newPassword || !confirmPassword) {
    alert('Please fill in both fields');
    return;
  }

  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('❌ Passwords do not match!');
    return;
  }

  try {
    const res  = await fetch('http://localhost:5000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:       currentEmail,
        otp:         currentOTP,
        newPassword: newPassword
      })
    });
    const data = await res.json();

    if (res.ok) {
      alert('✅ Password reset successfully! Please login with your new password.');
      window.location.href = 'login.html';
    } else {
      alert('❌ ' + data.message);
    }
  } catch (err) {
    alert('Error resetting password. Try again.');
  }
}