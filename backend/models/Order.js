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
      'payment_pending',
      'payment_rejected',
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
    // Use timestamp + 5 random chars for much lower collision probability
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = 'RMSR-' + ts + '-' + rand;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);