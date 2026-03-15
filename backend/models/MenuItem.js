const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  discountedPrice: {
    type: Number,
    default: null
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVeg: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  preparationTime: {
    type: Number,
    default: 15
  },
  calories: Number,
  allergens: [String],
  addons: [{
    name: String,
    price: Number
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  totalOrders: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
