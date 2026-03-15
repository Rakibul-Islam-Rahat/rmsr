const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    addons: [{
      name: String,
      price: Number
    }],
    subtotal: Number
  }],
  deliveryAddress: {
    street: String,
    area: String,
    city: { type: String, default: 'Rangpur' },
    district: { type: String, default: 'Rangpur' },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'on_the_way',
      'delivered',
      'cancelled'
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  paymentMethod: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'cash_on_delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 30 },
  discount: { type: Number, default: 0 },
  loyaltyPointsUsed: { type: Number, default: 0 },
  loyaltyPointsEarned: { type: Number, default: 0 },
  total: { type: Number, required: true },
  specialInstructions: String,
  isScheduled: { type: Boolean, default: false },
  scheduledTime: Date,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  cancelReason: String,
  isReviewed: { type: Boolean, default: false }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'RMSR' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
