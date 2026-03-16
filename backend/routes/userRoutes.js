const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { Loyalty, Rider } = require('../models/index');

// Get user by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete own account
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    // Admin cannot delete their own account
    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin account cannot be deleted' });
    }

    // Check for active orders
    const activeOrders = await Order.countDocuments({
      $or: [{ customer: userId }, { rider: userId }],
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have active orders. Please wait for them to complete before deleting your account.'
      });
    }

    // Delete related data
    await Loyalty.deleteMany({ user: userId });
    await Rider.deleteMany({ user: userId });

    // If restaurant owner, deactivate restaurant (don't delete — keep order history)
    if (role === 'restaurant_owner') {
      await Restaurant.updateMany({ owner: userId }, { isActive: false, isApproved: false });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
