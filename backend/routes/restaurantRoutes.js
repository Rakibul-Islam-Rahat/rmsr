const express = require('express');
const router = express.Router();
const {
  getAllRestaurants, getRestaurant, createRestaurant,
  updateRestaurant, getMyRestaurant, toggleRestaurantStatus, getFeaturedRestaurants
} = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const multiUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

// ── All specific routes MUST come before /:id ─────────────────────────────
router.get('/', getAllRestaurants);
router.get('/featured', getFeaturedRestaurants);
router.get('/my', protect, authorize('restaurant_owner'), getMyRestaurant);
router.patch('/toggle-status', protect, authorize('restaurant_owner'), toggleRestaurantStatus);
router.post('/', protect, authorize('restaurant_owner'), multiUpload, createRestaurant);
router.put('/', protect, authorize('restaurant_owner'), multiUpload, updateRestaurant);

// Restaurant earnings summary
router.get('/earnings', protect, authorize('restaurant_owner'), async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Restaurant = require('../models/Restaurant');

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const summary = await Order.aggregate([
      { $match: { restaurant: restaurant._id, status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalSubtotal: { $sum: '$subtotal' },
          totalDeliveryFee: { $sum: '$deliveryFee' },
          codOrders: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash_on_delivery'] }, 1, 0] } },
          onlineOrders: { $sum: { $cond: [{ $in: ['$paymentMethod', ['bkash', 'nagad', 'rocket']] }, 1, 0] } },
          codRevenue: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash_on_delivery'] }, '$total', 0] } },
          onlineRevenue: { $sum: { $cond: [{ $in: ['$paymentMethod', ['bkash', 'nagad', 'rocket']] }, '$total', 0] } },
          onlineSubtotal: { $sum: { $cond: [{ $in: ['$paymentMethod', ['bkash', 'nagad', 'rocket']] }, '$subtotal', 0] } }
        }
      }
    ]);

    const recentOnlineOrders = await Order.find({
      restaurant: restaurant._id,
      status: 'delivered',
      paymentMethod: { $in: ['bkash', 'nagad', 'rocket'] }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber total paymentMethod transactionId createdAt subtotal deliveryFee');

    res.json({
      success: true,
      summary: summary[0] || {
        totalOrders: 0, totalRevenue: 0, totalSubtotal: 0, totalDeliveryFee: 0,
        codOrders: 0, onlineOrders: 0, codRevenue: 0, onlineRevenue: 0, onlineSubtotal: 0
      },
      recentOnlineOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Dynamic /:id route LAST ───────────────────────────────────────────────
router.get('/:id', getRestaurant);

module.exports = router;
