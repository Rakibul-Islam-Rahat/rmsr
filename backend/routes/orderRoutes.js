const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById, updateOrderStatus, cancelOrder, getRestaurantOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('customer'), createOrder);
router.get('/my', protect, authorize('customer'), getMyOrders);             // BEFORE /:id
router.get('/restaurant', protect, authorize('restaurant_owner'), getRestaurantOrders); // BEFORE /:id
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('restaurant_owner', 'admin', 'rider'), updateOrderStatus);
router.put('/:id/cancel', protect, authorize('customer'), cancelOrder);

module.exports = router;
