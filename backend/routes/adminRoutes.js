const express = require('express');
const router = express.Router();
const { getDashboardStats, approveRestaurant, getAllUsers, toggleUserStatus } = require('../controllers/controllers');
const { protect, authorize } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

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

module.exports = router;
