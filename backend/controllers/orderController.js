const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { Notification, Loyalty } = require('../models/index');
const { sendPushNotification } = require('../services/notificationService');

// ─── Helper: create in-app notification ──────────────────────────────────────
const createNotification = async (userId, title, body, type, orderId, ioInstance = null) => {
  try {
    await Notification.create({ user: userId, title, body, type, order: orderId });
    // Emit real-time notification to user's room if io available
    if (ioInstance) {
      ioInstance.to(`user_${userId}`).emit('new_notification', { title, body, type });
    }
  } catch (_) {}
};

const createOrder = async (req, res) => {
  try {
    const {
      restaurantId, items, deliveryAddress, paymentMethod,
      specialInstructions, isScheduled, scheduledTime,
      loyaltyPointsToUse = 0, transactionId = ''
    } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      return res.status(400).json({ success: false, message: 'Restaurant not available' });
    }

    // Calculate order total
    let subtotal = 0;
    const orderItems = [];

    for (const orderItem of items) {
      const menuItem = await MenuItem.findById(orderItem.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Item '${menuItem?.name || 'Unknown'}' is not available`
        });
      }
      const itemPrice = menuItem.discountedPrice || menuItem.price;
      let addonTotal = 0;
      (orderItem.addons || []).forEach(a => { addonTotal += a.price || 0; });
      const itemSubtotal = (itemPrice + addonTotal) * orderItem.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: itemPrice,
        quantity: orderItem.quantity,
        addons: orderItem.addons || [],
        subtotal: itemSubtotal
      });
    }

    if (subtotal < restaurant.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ৳${restaurant.minimumOrder}`
      });
    }

    const customer = await User.findById(req.user._id);
    let discount = 0;
    let loyaltyPointsUsed = 0;
    if (loyaltyPointsToUse > 0 && customer.loyaltyPoints >= loyaltyPointsToUse) {
      loyaltyPointsUsed = loyaltyPointsToUse;
      discount = Math.floor(loyaltyPointsToUse / 100) * 10;
    }

    const total = subtotal + restaurant.deliveryFee - discount;
    const loyaltyPointsEarned = Math.floor(total / 10);

    const isOnlinePay = ['bkash', 'nagad', 'rocket'].includes(paymentMethod);
    const initialStatus = isOnlinePay ? 'payment_pending' : 'pending';

    // ── Scheduled time validation ────────────────────────────────────────
    if (isScheduled && scheduledTime) {
      const schedTime = new Date(scheduledTime);
      const now = new Date();
      const minAdvance = new Date(now.getTime() + 30 * 60 * 1000); // at least 30 min ahead
      if (isNaN(schedTime.getTime()) || schedTime < minAdvance) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be at least 30 minutes in the future.'
        });
      }
    }

    // ── TxnID uniqueness check ────────────────────────────────────────────
    if (transactionId && isOnlinePay) {
      const existing = await Order.findOne({
        transactionId: transactionId.trim(),
        paymentStatus: { $in: ['pending', 'paid'] }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This Transaction ID has already been used on another order. Please check and enter the correct TxnID.'
        });
      }
    }

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      isScheduled: isScheduled || false,
      scheduledTime: isScheduled && scheduledTime ? new Date(scheduledTime) : null,
      subtotal,
      deliveryFee: restaurant.deliveryFee,
      discount,
      loyaltyPointsUsed,
      loyaltyPointsEarned,
      total,
      transactionId: transactionId.trim() || '',
      status: initialStatus,
      statusHistory: [{ status: initialStatus, note: isOnlinePay ? 'Awaiting payment verification by admin' : 'Order placed' }]
    });

    // Deduct loyalty points ONLY for COD — for online payments, hold until verified
    if (loyaltyPointsUsed > 0 && !isOnlinePay) {
      customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - loyaltyPointsUsed);
      await customer.save();
      // Also update Loyalty record
      const { Loyalty } = require('../models/index');
      const loyaltyRecord = await Loyalty.findOne({ user: customer._id });
      if (loyaltyRecord) {
        loyaltyRecord.currentPoints = Math.max(0, (loyaltyRecord.currentPoints || 0) - loyaltyPointsUsed);
        loyaltyRecord.totalPointsRedeemed = (loyaltyRecord.totalPointsRedeemed || 0) + loyaltyPointsUsed;
        loyaltyRecord.transactions.push({
          type: 'redeemed',
          points: loyaltyPointsUsed,
          description: `Redeemed at checkout`,
          date: new Date()
        });
        await loyaltyRecord.save();
      }
    }

    const isOnlinePayment = isOnlinePay;
    const io = req.app.get('io');

    // ── Notify restaurant owner ONLY for COD (online orders wait for admin verification) ──
    if (!isOnlinePayment) {
      const restaurantOwner = await User.findById(restaurant.owner);
      if (restaurantOwner) {
        await createNotification(
          restaurantOwner._id,
          `🔔 New Order #${order.orderNumber}`,
          `${customer.name} ordered ৳${total} | Cash on Delivery`,
          'order',
          order._id
        );
        if (restaurantOwner.fcmToken) {
          await sendPushNotification(
            restaurantOwner.fcmToken,
            `New Order — ৳${total}`,
            `Order #${order.orderNumber} from ${customer.name}`,
            { orderId: order._id.toString(), type: 'new_order' }
          );
        }
      }
    }

    // ── Notify customer ──────────────────────────────────────────────────────
    const customerMsg = isOnlinePayment
      ? transactionId
        ? `Order placed! Your payment TxnID ${transactionId} is being verified by the restaurant.`
        : `Order placed! Please send ৳${total} via ${paymentMethod} to 01794558994 and update your transaction ID.`
      : `Order placed! Pay ৳${total} cash when delivered.`;

    await createNotification(
      req.user._id,
      `✅ Order #${order.orderNumber} Placed`,
      customerMsg,
      'order',
      order._id, io
    );

    // ── Notify admin for online payments ────────────────────────────────────
    if (isOnlinePayment) {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        await createNotification(
          adminUser._id,
          `💳 Payment Received — ৳${total}`,
          `Order #${order.orderNumber} | ${restaurant.name} | ${paymentMethod}${transactionId ? ` | TxnID: ${transactionId}` : ' | No TxnID yet'}`,
          'payment',
          order._id, io
        );
      }
    }

    // ── Emit socket event to restaurant ONLY for COD ────────────────────────
    if (!isOnlinePayment) {
      io.to(`restaurant_${restaurantId}`).emit('new_order', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total
      });
    }
    // Notify admin about pending payment verification
    if (isOnlinePayment) {
      io.to('admin_room').emit('payment_pending', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total,
        paymentMethod,
        transactionId
      });
    }

    const populated = await Order.findById(order._id)
      .populate('restaurant', 'name logo address phone deliveryTime')
      .populate('items.menuItem', 'name image');

    res.status(201).json({ success: true, message: 'Order placed successfully', order: populated });

  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { customer: req.user._id };
    if (status) query.status = status;
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('restaurant', 'name logo address phone deliveryTime')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name logo address phone deliveryTime')
      .populate('customer', 'name phone email')
      .populate('rider', 'name phone')
      .populate('items.menuItem', 'name image');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isRider = order.rider && order.rider._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    // Restaurant owner must own THIS order's restaurant
    let isOwner = false;
    if (req.user.role === 'restaurant_owner') {
      const ownedRest = await Restaurant.findOne({ owner: req.user._id });
      isOwner = ownedRest && ownedRest._id.toString() === order.restaurant._id.toString();
    }

    if (!isCustomer && !isRider && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email fcmToken')
      .populate('restaurant', 'name owner');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Block advancing orders that are not yet verified
    if (['payment_pending', 'payment_rejected'].includes(order.status) && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Order payment has not been verified yet' });
    }

    // Block setting reserved admin-only statuses
    if (['payment_pending', 'payment_rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Cannot set this status directly' });
    }

    // Role-based transition validation + ownership check
    const role = req.user.role;
    const RESTAURANT_STATUSES = ['confirmed', 'preparing', 'ready_for_pickup', 'cancelled'];
    const RIDER_STATUSES      = ['picked_up', 'on_the_way', 'delivered'];

    if (role === 'restaurant_owner') {
      if (!RESTAURANT_STATUSES.includes(status)) {
        return res.status(403).json({ success: false, message: `Restaurant cannot set status to '${status}'` });
      }
      // Verify this is their restaurant's order
      const ownedRest = await Restaurant.findOne({ owner: req.user._id });
      if (!ownedRest || ownedRest._id.toString() !== order.restaurant._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
      }
    }
    if (role === 'rider') {
      if (!RIDER_STATUSES.includes(status)) {
        return res.status(403).json({ success: false, message: `Rider cannot set status to '${status}'` });
      }
      // Verify this rider is assigned to the order
      if (!order.rider || order.rider._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this order' });
      }
    }

    order.status = status;
    order.statusHistory.push({ status, note: note || '' });

    // Status messages for notifications
    const statusMessages = {
      confirmed:        '✅ Your order has been confirmed! Restaurant is preparing.',
      preparing:        '👨‍🍳 Your food is being prepared!',
      ready_for_pickup: '🛵 Your food is ready! Waiting for rider pickup.',
      picked_up:        '🏍️ Rider has picked up your order!',
      on_the_way:       '🚀 Your order is on the way!',
      delivered:        `🎉 Order delivered! You earned ${order.loyaltyPointsEarned} loyalty points!`,
      cancelled:        '❌ Your order has been cancelled.'
    };

    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      if (order.paymentMethod === 'cash_on_delivery') order.paymentStatus = 'paid';

      // Add loyalty points
      const cust = await User.findById(order.customer._id);
      if (cust) {
        cust.loyaltyPoints += order.loyaltyPointsEarned;
        cust.totalOrders += 1;
        cust.totalSpent += order.total;
        await cust.save();
      }

      // Update loyalty record
      const { Loyalty } = require('../models/index');
      const loyalty = await Loyalty.findOne({ user: order.customer._id });
      if (loyalty) {
        loyalty.currentPoints += order.loyaltyPointsEarned;
        loyalty.totalPointsEarned += order.loyaltyPointsEarned;
        const t = loyalty.totalPointsEarned;
        if (t >= 5000) loyalty.tier = 'platinum';
        else if (t >= 2000) loyalty.tier = 'gold';
        else if (t >= 500) loyalty.tier = 'silver';
        loyalty.transactions.push({
          type: 'earned',
          points: order.loyaltyPointsEarned,
          description: `Order #${order.orderNumber}`,
          orderId: order._id
        });
        await loyalty.save();
      }

      // Update restaurant stats
      await Restaurant.findByIdAndUpdate(order.restaurant._id, {
        $inc: { totalOrders: 1, totalRevenue: order.total }
      });

      // Notify restaurant owner about delivery completion
      await createNotification(
        order.restaurant.owner,
        `✅ Order #${order.orderNumber} Delivered`,
        `Order delivered successfully. Revenue: ৳${order.total}`,
        'order',
        order._id
      );
    }

    await order.save();

    // Notify customer
    const msg = statusMessages[status];
    if (msg && order.customer?._id) {
      await createNotification(
        order.customer._id,
        `Order #${order.orderNumber} Update`,
        msg,
        'order',
        order._id
      );
      if (order.customer?.fcmToken) {
        await sendPushNotification(
          order.customer.fcmToken,
          `Order #${order.orderNumber}`,
          msg,
          { orderId: order._id.toString(), type: 'order_update' }
        );
      }
    }

    // Socket event
    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', {
      orderId: order._id,
      status,
      statusHistory: order.statusHistory
    });

    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.cancelReason = reason || 'Cancelled by customer';
    order.statusHistory.push({ status: 'cancelled', note: reason });

    // Only restore loyalty points if they were actually deducted
    // (COD orders deduct immediately; online orders deduct on verification)
    const wasDeducted = order.paymentMethod === 'cash_on_delivery' ||
                        order.paymentStatus === 'paid';
    if (order.loyaltyPointsUsed > 0 && wasDeducted) {
      // Use $max to prevent going below 0 in edge cases
      const customer = await User.findById(req.user._id);
      if (customer) {
        customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints + order.loyaltyPointsUsed);
        await customer.save();
      }
    }

    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', { orderId: order._id, status: 'cancelled' });

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRestaurantOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const { status, page = 1, limit = 20 } = req.query;
    const HIDDEN_STATUSES = ['payment_pending', 'payment_rejected'];
    const query = { restaurant: restaurant._id };
    if (status) {
      // If requesting a hidden status, return empty (restaurant shouldn't see these)
      if (HIDDEN_STATUSES.includes(status)) {
        return res.json({ success: true, orders: [], total: 0, pages: 0 });
      }
      query.status = status;
    } else {
      query.status = { $nin: HIDDEN_STATUSES };
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder, getMyOrders, getOrderById,
  updateOrderStatus, cancelOrder, getRestaurantOrders
};
