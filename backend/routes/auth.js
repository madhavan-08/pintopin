const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if email already exists
const existingEmail = await User.findOne({ email });
if (existingEmail) {
  return res.status(400).json({ message: 'Email already registered' });
}

// Check if phone already exists
const existingPhone = await User.findOne({ phone });
if (existingPhone) {
  return res.status(400).json({ message: 'Phone number already registered' });
}

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name, email, phone,
      password: hashedPassword,
      role: role || 'customer',
      isApproved: role === 'driver' ? false : true
    });

    await user.save();

    res.status(201).json({ message: 'Registered successfully!' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check driver approval
    if (user.role === 'driver' && !user.isApproved) {
      return res.status(403).json({ message: 'Your driver account is pending approval' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
const OTP = require('../models/OTP.JS');

// Generate and send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTPs for this email
    await OTP.deleteMany({ email });

    // Save new OTP
    await new OTP({ email, otp }).save();

    // Send OTP back to frontend (frontend sends email via EmailJS)
    res.json({ 
      message: 'OTP generated', 
      otp,  // frontend will use this to send email
      name: user.name 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find OTP
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    // Delete used OTP
    await OTP.deleteMany({ email });

    res.json({ message: 'Password reset successfully!' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;