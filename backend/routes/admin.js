const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/auth');

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

// Get all users
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all drivers
router.get('/drivers', authMiddleware, isAdmin, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select('-password');
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve driver
router.put('/drivers/:id/approve', authMiddleware, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isApproved: true });
    res.json({ message: 'Driver approved!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings
router.get('/bookings', authMiddleware, isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .populate('driver', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const totalUsers    = await User.countDocuments({ role: 'customer' });
    const totalDrivers  = await User.countDocuments({ role: 'driver' });
    const totalBookings = await Booking.countDocuments();
    const pending       = await Booking.countDocuments({ status: 'pending' });
    const completed     = await Booking.countDocuments({ status: 'completed' });
    res.json({ totalUsers, totalDrivers, totalBookings, pending, completed });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;