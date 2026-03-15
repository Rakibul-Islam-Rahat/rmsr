// routes/riderRoutes.js
const express = require('express');
const router = express.Router();
const { getRiderOrders, getAvailableOrders, acceptOrder, updateRiderLocation, toggleRiderOnline } = require('../controllers/controllers');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('rider'));
router.get('/orders', getRiderOrders);
router.get('/available', getAvailableOrders);
router.post('/orders/:id/accept', acceptOrder);
router.put('/location', updateRiderLocation);
router.patch('/toggle-online', toggleRiderOnline);

module.exports = router;
