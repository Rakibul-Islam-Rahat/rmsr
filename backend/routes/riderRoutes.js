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

// Get current online status
router.get('/status', async (req, res) => {
  try {
    const Rider = require('../models/index').Rider;
    const rider = await Rider.findOne({ user: req.user._id });
    res.json({ success: true, isOnline: rider?.isOnline || false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
