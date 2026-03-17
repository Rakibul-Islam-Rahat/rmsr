const mongoose = require('mongoose');

// Review Model
const reviewSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
  images: [String],
  reply: { type: String, default: '' },
  isVisible: { type: Boolean, default: true }
}, { timestamps: true });

// Notification Model
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['order', 'promotion', 'payment', 'system', 'chat', 'loyalty'],
    default: 'system'
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }
}, { timestamps: true });

// Message Model
const messageSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer', 'restaurant_owner', 'rider', 'admin'] },
  message: { type: String, required: true, trim: true, maxlength: [1000, 'Message cannot exceed 1000 characters'] },
  isRead: { type: Boolean, default: false },
  attachmentUrl: { type: String, default: '' }
}, { timestamps: true });

// Loyalty Tier Model
const loyaltySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  totalPointsEarned: { type: Number, default: 0 },
  totalPointsRedeemed: { type: Number, default: 0 },
  currentPoints: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['earned', 'redeemed'] },
    points: Number,
    description: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Rider Profile Model
const riderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicleType: { type: String, enum: ['bicycle', 'motorcycle', 'car'], default: 'motorcycle' },
  vehicleNumber: String,
  nidNumber: String,
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  currentLocation: {
    lat: { type: Number, default: 25.7439 },
    lng: { type: Number, default: 89.2752 }
  },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  rating: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = {
  Review: mongoose.model('Review', reviewSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Message: mongoose.model('Message', messageSchema),
  Loyalty: mongoose.model('Loyalty', loyaltySchema),
  Rider: mongoose.model('Rider', riderSchema)
};