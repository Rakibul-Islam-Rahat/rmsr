const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  cuisine: [{
    type: String
  }],
  address: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, default: 'Rangpur' },
    district: { type: String, default: 'Rangpur' },
    coordinates: {
      lat: { type: Number, default: 25.7439 },
      lng: { type: Number, default: 89.2752 }
    }
  },
  phone: {
    type: String,
    required: true
  },
  email: String,
  openingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
  },
  deliveryTime: {
    min: { type: Number, default: 20 },
    max: { type: Number, default: 45 }
  },
  deliveryFee: {
    type: Number,
    default: 30
  },
  minimumOrder: {
    type: Number,
    default: 100
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
