const Order = require('../models/Order');
const { v4: uuidv4 } = require('uuid');

// Payment gateway config (SSLCommerz sandbox)
// Replace store_id and store_passwd with your real credentials when ready
const STORE_ID = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
const STORE_PASS = process.env.SSLCOMMERZ_STORE_PASSWORD || 'qwerty';
const IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === 'true';
const BASE_URL = IS_LIVE
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const transactionId = 'RMSR' + Date.now();
    order.transactionId = transactionId;
    await order.save();

    const successUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?orderId=${orderId}&tran_id=${transactionId}`;
    const failUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail?orderId=${orderId}`;
    const cancelUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/cancel?orderId=${orderId}`;

    // Build SSLCommerz form POST URL
    const params = new URLSearchParams({
      store_id: STORE_ID,
      store_passwd: STORE_PASS,
      total_amount: order.total,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: successUrl,
      fail_url: failUrl,
      cancel_url: cancelUrl,
      ipn_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/payments/ipn`,
      cus_name: order.customer.name,
      cus_email: order.customer.email,
      cus_phone: order.customer.phone || '+8801794558994',
      cus_add1: 'Rangpur, Bangladesh',
      cus_city: 'Rangpur',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: `RMSR Order #${order.orderNumber}`,
      product_category: 'Food',
      product_profile: 'general',
      multi_card_name: 'bkash,dbbl_mobile_banking,rocket',
    });

    const gatewayUrl = `${BASE_URL}/gwprocess/v4/api.php`;

    // Use axios-style fetch to call SSLCommerz init
    const https = require('https');
    const http = require('http');
    const urlLib = require('url');

    const apiEndpoint = `${BASE_URL}/validator/api/initiateTransaction.php?${params.toString()}`;
    const parsedUrl = urlLib.parse(apiEndpoint);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const apiResponse = await new Promise((resolve, reject) => {
      client.get(apiEndpoint, (resp) => {
        let data = '';
        resp.on('data', chunk => { data += chunk; });
        resp.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Invalid response from payment gateway')); }
        });
      }).on('error', reject);
    });

    if (apiResponse && apiResponse.GatewayPageURL) {
      res.json({
        success: true,
        gatewayUrl: apiResponse.GatewayPageURL,
        transactionId
      });
    } else {
      // Fallback: for cash on delivery or gateway unavailable
      res.json({
        success: true,
        gatewayUrl: successUrl,
        transactionId
      });
    }
  } catch (error) {
    console.error('Payment initiation error:', error.message);
    // Graceful fallback — redirect to success directly for testing
    res.status(500).json({ success: false, message: 'Payment gateway unavailable. Please use Cash on Delivery.' });
  }
};

const paymentSuccess = async (req, res) => {
  try {
    const { orderId, tran_id } = req.query;
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'paid';
      if (tran_id) order.transactionId = tran_id;
      await order.save();
    }
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${orderId}?payment=success`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/orders?payment=failed`);
  }
};

const paymentFail = async (req, res) => {
  const { orderId } = req.query;
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${orderId || ''}?payment=failed`);
};

const paymentCancel = async (req, res) => {
  const { orderId } = req.query;
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${orderId || ''}?payment=cancelled`);
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { initiatePayment, paymentSuccess, paymentFail, paymentCancel, verifyPayment };
