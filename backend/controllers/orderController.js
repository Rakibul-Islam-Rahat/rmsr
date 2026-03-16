const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { Notification, Loyalty } = require('../models/index');
const { sendPushNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

const createOrder = async (req, res) => {
  try {
    const {
      restaurantId, items, deliveryAddress, paymentMethod,
      specialInstructions, isScheduled, scheduledTime,
      loyaltyPointsToUse = 0
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
          message: `Item '${menuItem?.name || orderItem.menuItemId}' is not available`
        });
      }

      const itemPrice = menuItem.discountedPrice || menuItem.price;
      let addonTotal = 0;

      const addons = orderItem.addons || [];
      addons.forEach(addon => { addonTotal += addon.price || 0; });

      const itemSubtotal = (itemPrice + addonTotal) * orderItem.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: itemPrice,
        quantity: orderItem.quantity,
        addons,
        subtotal: itemSubtotal
      });
    }

    if (subtotal < restaurant.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ৳${restaurant.minimumOrder}`
      });
    }

    // Loyalty points discount (100 points = ৳10)
    const customer = await User.findById(req.user._id);
    let discount = 0;
    let loyaltyPointsUsed = 0;

    if (loyaltyPointsToUse > 0 && customer.loyaltyPoints >= loyaltyPointsToUse) {
      loyaltyPointsUsed = loyaltyPointsToUse;
      discount = Math.floor(loyaltyPointsToUse / 100) * 10;
    }

    const total = subtotal + restaurant.deliveryFee - discount;
    const loyaltyPointsEarned = Math.floor(total / 10); // 1 point per ৳10

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      isScheduled: isScheduled || false,
      scheduledTime: isScheduled ? scheduledTime : null,
      subtotal,
      deliveryFee: restaurant.deliveryFee,
      discount,
      loyaltyPointsUsed,
      loyaltyPointsEarned,
      total,
      transactionId: req.body.transactionId || '',
      statusHistory: [{ status: 'pending', note: 'Order placed' }]
    });

    // Deduct loyalty points
    if (loyaltyPointsUsed > 0) {
      customer.loyaltyPoints -= loyaltyPointsUsed;
      await customer.save();
    }

    // Notify restaurant owner
    const restaurantOwner = await User.findById(restaurant.owner);
    if (restaurantOwner?.fcmToken) {
      await sendPushNotification(
        restaurantOwner.fcmToken,
        'New Order Received!',
        `Order #${order.orderNumber} — ৳${total}`,
        { orderId: order._id.toString(), type: 'new_order' }
      );
    }

    // Save notification in DB
    await Notification.create({
      user: restaurant.owner,
      title: 'New Order Received!',
      body: `Order #${order.orderNumber} — ৳${total}`,
      type: 'order',
      order: order._id
    });

    // Send order confirmation email
    await sendEmail({
      to: customer.email,
      subject: `Order Confirmed — #${order.orderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#e53e3e">Order Confirmed!</h2>
          <p>Hi ${customer.name}, your order has been placed successfully.</p>
          <p><strong>Order #:</strong> ${order.orderNumber}</p>
          <p><strong>Restaurant:</strong> ${restaurant.name}</p>
          <p><strong>Total:</strong> ৳${total}</p>
          <p><strong>Payment:</strong> ${paymentMethod.replace(/_/g, ' ').toUpperCase()}</p>
          <p>We'll notify you when the restaurant confirms your order.</p>
        </div>
      `
    });

    // Emit to restaurant via socket
    const io = req.app.get('io');
    io.to(`restaurant_${restaurantId}`).emit('new_order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total
    });

    const populated = await Order.findById(order._id)
      .populate('restaurant', 'name logo address phone')
      .populate('items.menuItem', 'name image');

    res.status(201).json({ success: true, message: 'Order placed successfully', order: populated });
  } catch (error) {
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
      .populate('restaurant', 'name logo address phone')
      .populate('customer', 'name phone email')
      .populate('rider', 'name phone')
      .populate('items.menuItem', 'name image');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check access
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isRider = order.rider && order.rider._id.toString() === req.user._id.toString();
    const isRestaurantOwner = req.user.role === 'restaurant_owner';
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isRider && !isRestaurantOwner && !isAdmin) {
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

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({ status, note: note || '' });

    // Handle delivery completion
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      order.paymentStatus = order.paymentMethod === 'cash_on_delivery' ? 'paid' : order.paymentStatus;

      // Add loyalty points to customer
      const customer = await User.findById(order.customer._id);
      customer.loyaltyPoints += order.loyaltyPointsEarned;
      customer.totalOrders += 1;
      customer.totalSpent += order.total;
      await customer.save();

      // Update loyalty record
      const { Loyalty } = require('../models/index');
      const loyalty = await Loyalty.findOne({ user: order.customer._id });
      if (loyalty) {
        loyalty.currentPoints += order.loyaltyPointsEarned;
        loyalty.totalPointsEarned += order.loyaltyPointsEarned;
        const totalEarned = loyalty.totalPointsEarned;
        if (totalEarned >= 5000) loyalty.tier = 'platinum';
        else if (totalEarned >= 2000) loyalty.tier = 'gold';
        else if (totalEarned >= 500) loyalty.tier = 'silver';
        loyalty.transactions.push({
          type: 'earned',
          points: order.loyaltyPointsEarned,
          description: `Order #${order.orderNumber} delivered`,
          orderId: order._id
        });
        await loyalty.save();
      }

      // Update restaurant stats
      await Restaurant.findByIdAndUpdate(order.restaurant._id, {
        $inc: { totalOrders: 1, totalRevenue: order.total }
      });
    }

    await order.save();

    // Notify customer
    const statusMessages = {
      confirmed: 'Your order has been confirmed by the restaurant!',
      preparing: 'The restaurant is now preparing your food.',
      ready_for_pickup: 'Your order is ready for pickup by the rider.',
      picked_up: 'Your order has been picked up by the rider!',
      on_the_way: 'Your order is on the way!',
      delivered: `Your order has been delivered! You earned ${order.loyaltyPointsEarned} loyalty points!`,
      cancelled: 'Your order has been cancelled.'
    };

    const msg = statusMessages[status];
    if (msg && order?.customer?.fcmToken) {
      await sendPushNotification(
        order.customer?.fcmToken,
        `Order #${order.orderNumber}`,
        msg,
        { orderId: order._id.toString(), type: 'order_update' }
      );
    }

    if (msg) {
      await Notification.create({
        user: order.customer._id,
        title: `Order #${order.orderNumber} Update`,
        body: msg,
        type: 'order',
        order: order._id
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', {
      orderId: order._id,
      status,
      statusHistory: order.statusHistory
    });

    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'cancelled';
    order.cancelReason = reason || 'Cancelled by customer';
    order.statusHistory.push({ status: 'cancelled', note: reason });

    // Refund loyalty points if used
    if (order.loyaltyPointsUsed > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { loyaltyPoints: order.loyaltyPointsUsed }
      });
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
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { restaurant: restaurant._id };
    if (status) query.status = status;

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
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getRestaurantOrders
};
