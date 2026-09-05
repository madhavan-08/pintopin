const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/auth');

// Create booking (customer)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { serviceType, pickup, drop, datetime, vehicleNumber, fare } = req.body;

    // Generate 6 digit confirmation OTP
    const confirmOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const booking = new Booking({
      customer: req.user.id,
      serviceType, pickup, drop, datetime, vehicleNumber,
      fare: fare || 150,
      confirmOTP
    });
    await booking.save();
    res.status(201).json({ message: 'Booking created!', booking, confirmOTP });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all pending bookings (driver sees these)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my bookings (customer)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id })
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get driver's accepted bookings
router.get('/my-jobs', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      driver: req.user.id,
      status: { $in: ['accepted', 'in_progress'] }
    })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept booking (driver)
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted', driver: req.user.id },
      { new: true }
    );
    res.json({ message: 'Booking accepted!', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start trip (driver)
router.put('/:id/start', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'in_progress' },
      { new: true }
    );
    res.json({ message: 'Trip started!', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete trip (driver)
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    res.json({ message: 'Trip completed!', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate driver (customer)
router.put('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { rating, review },
      { new: true }
    );
    res.json({ message: 'Rating saved!', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Driver verifies OTP to start trip
router.put('/:id/verify-otp', authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.confirmOTP !== otp) {
      return res.status(400).json({ message: '❌ Wrong OTP! Ask customer for correct OTP.' });
    }

    booking.status    = 'in_progress';
    booking.confirmOTP = null; // clear OTP after use
    await booking.save();

    res.json({ message: '✅ OTP verified! Trip started.', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;