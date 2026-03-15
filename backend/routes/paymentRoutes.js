const express = require('express');
const router = express.Router();
const { initiatePayment, paymentSuccess, paymentFail, paymentCancel, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/initiate', protect, initiatePayment);
router.get('/success', paymentSuccess);
router.get('/fail', paymentFail);
router.get('/cancel', paymentCancel);
router.get('/verify/:orderId', protect, verifyPayment);

module.exports = router;
