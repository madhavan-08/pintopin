const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  serviceType: {
    type: String,
    enum: ['pickup_drop', 'driver_with_client'],
    required: true
  },
  pickup: { type: String, required: true },
  drop:   { type: String, required: true },
  datetime: { type: Date, required: true },
  vehicleNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  fare: { type: Number, default: 0 },
  rating:     { type: Number, min: 1, max: 5, default: null },
  review:     { type: String, default: '' },
  confirmOTP: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);