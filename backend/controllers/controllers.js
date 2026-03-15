const { Notification, Message, Review, Loyalty, Rider } = require('../models/index');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

// ==================== NOTIFICATIONS ====================
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CHAT ====================
const getChatMessages = async (req, res) => {
  try {
    const messages = await Message.find({ order: req.params.orderId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { orderId, message } = req.body;
    if (!orderId || !message) {
      return res.status(400).json({ success: false, message: 'orderId and message required' });
    }

    const msg = await Message.create({
      order: orderId,
      sender: req.user._id,
      senderRole: req.user.role,
      message: message.trim()
    });

    const populated = await Message.findById(msg._id)
      .populate('sender', 'name avatar role');

    // Emit to chat room - includes order reference for notification
    const io = req.app.get('io');
    const emitData = { ...populated.toObject(), order: orderId };
    io.to(`chat_${orderId}`).emit('new_message', emitData);

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== REVIEWS ====================
const addReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const order = await Order.findById(orderId);
    if (!order || order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Can only review delivered orders' });
    }
    if (order.isReviewed) {
      return res.status(400).json({ success: false, message: 'Order already reviewed' });
    }

    const images = req.files ? req.files.map(f => f.path) : [];
    const review = await Review.create({
      customer: req.user._id,
      restaurant: order.restaurant,
      order: orderId,
      rating: Number(rating),
      comment,
      images
    });

    order.isReviewed = true;
    await order.save();

    const reviews = await Review.find({ restaurant: order.restaurant });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Restaurant.findByIdAndUpdate(order.restaurant, {
      'rating.average': Math.round(avgRating * 10) / 10,
      'rating.count': reviews.length
    });

    res.status(201).json({ success: true, message: 'Review added', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRestaurantReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.restaurantId, isVisible: true })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== LOYALTY ====================
const getLoyalty = async (req, res) => {
  try {
    let loyalty = await Loyalty.findOne({ user: req.user._id });
    if (!loyalty) loyalty = await Loyalty.create({ user: req.user._id });
    res.json({ success: true, loyalty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== RIDER ====================
const getRiderOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      rider: req.user._id,
      status: { $in: ['picked_up', 'on_the_way'] }
    })
      .populate('restaurant', 'name address phone')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'ready_for_pickup', rider: null })
      .populate('restaurant', 'name address phone logo')
      .populate('customer', 'name phone')
      .sort({ createdAt: 1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'ready_for_pickup') {
      return res.status(400).json({ success: false, message: 'Order is no longer available' });
    }
    if (order.rider) return res.status(400).json({ success: false, message: 'Order already assigned to another rider' });

    order.rider = req.user._id;
    order.status = 'picked_up';
    order.statusHistory.push({ status: 'picked_up', note: 'Accepted and picked up by rider' });
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', { orderId: order._id, status: 'picked_up' });

    res.json({ success: true, message: 'Order accepted', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateRiderLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });

    await Rider.findOneAndUpdate(
      { user: req.user._id },
      { currentLocation: { lat, lng } },
      { upsert: true }
    );

    const io = req.app.get('io');
    const activeOrder = await Order.findOne({
      rider: req.user._id,
      status: { $in: ['picked_up', 'on_the_way'] }
    });

    if (activeOrder) {
      io.to(`order_${activeOrder._id}`).emit('rider_location', {
        lat, lng,
        orderId: activeOrder._id
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleRiderOnline = async (req, res) => {
  try {
    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      [{ $set: { isOnline: { $not: '$isOnline' } } }],
      { new: true, upsert: true }
    );
    res.json({ success: true, isOnline: rider.isOnline });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADMIN ====================
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalRestaurants, totalOrders, revenueAgg, pendingRestaurants, activeOrders, todayOrders] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Restaurant.countDocuments({ isApproved: true }),
      Order.countDocuments(),
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Restaurant.countDocuments({ isApproved: false }),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way'] } }),
      Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
    ]);

    const recentOrders = await Order.find()
      .populate('customer', 'name').populate('restaurant', 'name')
      .sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers, totalRestaurants, totalOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
        pendingRestaurants, activeOrders, todayOrders
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.approve },
      { new: true }
    );
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, message: `Restaurant ${req.body.approve ? 'approved' : 'rejected'}`, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, users, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== AI RECOMMENDATIONS ====================
const getRecommendations = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id, status: 'delivered' })
      .populate('items.menuItem', 'name category')
      .sort({ createdAt: -1 }).limit(10);

    const categories = [...new Set(
      orders.flatMap(o => o.items.map(i => i.menuItem?.category).filter(Boolean))
    )];

    let items;
    if (categories.length > 0) {
      items = await MenuItem.find({ category: { $in: categories }, isAvailable: true })
        .populate('restaurant', 'name logo rating isActive isApproved')
        .sort({ totalOrders: -1, 'rating.average': -1 }).limit(8);
    } else {
      items = await MenuItem.find({ isAvailable: true, isBestseller: true })
        .populate('restaurant', 'name logo rating isActive isApproved')
        .sort({ totalOrders: -1 }).limit(8);
    }

    items = (items || []).filter(i => i.restaurant?.isActive && i.restaurant?.isApproved);
    res.json({ success: true, recommendations: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications, markNotificationRead, markAllRead,
  getChatMessages, sendMessage,
  addReview, getRestaurantReviews,
  getLoyalty,
  getRiderOrders, getAvailableOrders, acceptOrder, updateRiderLocation, toggleRiderOnline,
  getDashboardStats, approveRestaurant, getAllUsers, toggleUserStatus,
  getRecommendations
};
