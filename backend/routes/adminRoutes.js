const express = require('express');
const router = express.Router();
const { getDashboardStats, approveRestaurant, getAllUsers, toggleUserStatus } = require('../controllers/controllers');
const { protect, authorize } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { Notification } = require('../models/index');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.patch('/restaurants/:id/approve', approveRestaurant);
router.get('/restaurants', async (req, res) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;
    const query = {};
    if (approved !== undefined) query.isApproved = approved === 'true';
    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, restaurants, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.patch('/restaurants/:id/feature', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isFeatured: req.body.featured },
      { new: true }
    );
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .populate('restaurant', 'name')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, orders, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ── VERIFY PAYMENT ──────────────────────────────────────────────────────────
router.post('/orders/:id/verify-payment', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer restaurant');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: 'Order is not awaiting payment verification' });
    }

    order.status = 'pending';
    order.paymentStatus = 'paid';
    order.statusHistory.push({ status: 'pending', note: 'Payment verified by admin' });
    await order.save();

    // NOW deduct loyalty points (held during payment_pending)
    if (order.loyaltyPointsUsed > 0) {
      const User = require('../models/User');
      const customer = await User.findById(order.customer._id);
      if (customer) {
        customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - order.loyaltyPointsUsed);
        await customer.save();
      }
      // Update Loyalty record too
      const LoyaltyModel = require('../models/index').Loyalty;
      const loyaltyRec = await LoyaltyModel.findOne({ user: order.customer._id });
      if (loyaltyRec) {
        loyaltyRec.currentPoints = Math.max(0, (loyaltyRec.currentPoints || 0) - order.loyaltyPointsUsed);
        loyaltyRec.totalPointsRedeemed = (loyaltyRec.totalPointsRedeemed || 0) + order.loyaltyPointsUsed;
        loyaltyRec.transactions.push({
          type: 'redeemed',
          points: order.loyaltyPointsUsed,
          description: `Redeemed on Order #${order.orderNumber}`,
          date: new Date()
        });
        await loyaltyRec.save();
      }
    }

    // Notify customer
    await Notification.create({
      user: order.customer._id,
      title: '✅ Payment Verified!',
      body: `Your payment for Order #${order.orderNumber} has been verified. Restaurant is now reviewing your order.`,
      type: 'order',
      order: order._id
    });

    // Notify restaurant owner and emit socket so they see it immediately
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(order.restaurant._id);
    if (restaurant?.owner) {
      await Notification.create({
        user: restaurant.owner,
        title: '🆕 New Order — Payment Verified',
        body: `Order #${order.orderNumber} — ৳${order.total} | ${order.paymentMethod} | Payment confirmed`,
        type: 'order',
        order: order._id
      });
      // Emit socket to restaurant
      const io = req.app.get('io');
      if (io) {
        io.to(`restaurant_${restaurant._id}`).emit('new_order', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          total: order.total
        });
      }
    }

    res.json({ success: true, message: 'Payment verified. Order is now active.', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── REJECT PAYMENT ──────────────────────────────────────────────────────────
router.post('/orders/:id/reject-payment', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: 'Order is not awaiting payment verification' });
    }

    order.status = 'payment_rejected';
    order.paymentStatus = 'failed';
    order.statusHistory.push({ status: 'payment_rejected', note: reason || 'Payment rejected by admin — invalid or unverified transaction ID' });
    await order.save();

    // Notify customer
    await Notification.create({
      user: order.customer._id,
      title: '❌ Payment Not Verified',
      body: `Your payment for Order #${order.orderNumber} could not be verified. Reason: ${reason || 'Invalid transaction ID'}. Please contact support or place a new order.`,
      type: 'order',
      order: order._id
    });

    res.json({ success: true, message: 'Payment rejected. Customer notified.', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// Admin delete any user account (except other admins)
router.delete('/users/:id', async (req, res) => {
  try {
    const User = require('../models/User');
    const Order = require('../models/Order');
const { Notification } = require('../models/index');
    const Restaurant = require('../models/Restaurant');
    const { Loyalty, Rider } = require('../models/index');

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts' });

    // Check active orders
    const activeOrders = await Order.countDocuments({
      $or: [{ customer: user._id }, { rider: user._id }],
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way'] }
    });
    if (activeOrders > 0) {
      return res.status(400).json({ success: false, message: `User has ${activeOrders} active order(s). Cannot delete now.` });
    }

    // Clean up related data
    await Loyalty.deleteMany({ user: user._id });
    await Rider.deleteMany({ user: user._id });
    if (user.role === 'restaurant_owner') {
      await Restaurant.updateMany({ owner: user._id }, { isActive: false, isApproved: false });
    }

    await User.findByIdAndDelete(user._id);
    res.json({ success: true, message: `Account of ${user.name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Earnings summary — how much each restaurant is owed
router.get('/earnings', async (req, res) => {
  try {
    const Order = require('../models/Order');
const { Notification } = require('../models/index');
    const Restaurant = require('../models/Restaurant');

    // Get all delivered orders grouped by restaurant
    const earnings = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: '$restaurant',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalSubtotal: { $sum: '$subtotal' },
          totalDeliveryFee: { $sum: '$deliveryFee' },
          codOrders: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash_on_delivery'] }, 1, 0] }
          },
          onlineOrders: {
            $sum: { $cond: [{ $in: ['$paymentMethod', ['bkash', 'nagad', 'rocket']] }, 1, 0] }
          },
          codRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash_on_delivery'] }, '$total', 0] }
          },
          onlineRevenue: {
            $sum: { $cond: [{ $in: ['$paymentMethod', ['bkash', 'nagad', 'rocket']] }, '$total', 0] }
          },
          onlineSubtotal: {
            $sum: { $cond: [{ $in: ['$paymentMethod', ['bkash', 'nagad', 'rocket']] }, '$subtotal', 0] }
          },
          onlineDeliveryFee: {
            $sum: { $cond: [{ $in: ['$paymentMethod', ['bkash', 'nagad', 'rocket']] }, '$deliveryFee', 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' },
      {
        $lookup: {
          from: 'users',
          localField: 'restaurant.owner',
          foreignField: '_id',
          as: 'owner'
        }
      },
      { $unwind: '$owner' },
      { $sort: { onlineRevenue: -1 } }
    ]);

    // Platform summary
    const platformSummary = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalDeliveryFees: { $sum: '$deliveryFee' },
          totalOnlinePayments: {
            $sum: { $cond: [{ $in: ['$paymentMethod', ['bkash', 'nagad', 'rocket']] }, '$total', 0] }
          },
          totalCodPayments: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash_on_delivery'] }, '$total', 0] }
          },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      earnings,
      platform: platformSummary[0] || {
        totalRevenue: 0, totalDeliveryFees: 0,
        totalOnlinePayments: 0, totalCodPayments: 0, totalOrders: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});