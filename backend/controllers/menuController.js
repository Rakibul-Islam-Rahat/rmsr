const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

const getMenuByRestaurant = async (req, res) => {
  try {
    const { category, available } = req.query;
    const query = { restaurant: req.params.restaurantId };

    if (category) query.category = category;
    if (available !== undefined) query.isAvailable = available === 'true';

    const items = await MenuItem.find(query).sort({ category: 1, isBestseller: -1, createdAt: -1 });

    // Group by category
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ success: true, items, grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const restaurantId = req.user.role === 'admin'
      ? req.body.restaurantId
      : restaurant._id;

    const itemData = { ...req.body, restaurant: restaurantId };

    if (req.file) {
      itemData.image = req.file.path;
    }

    if (typeof itemData.addons === 'string') {
      try { itemData.addons = JSON.parse(itemData.addons); } catch { itemData.addons = []; }
    }

    const item = await MenuItem.create(itemData);

    res.status(201).json({ success: true, message: 'Menu item added', item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const isOwner = restaurant && item.restaurant._id.toString() === restaurant._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = req.file.path;
    }

    if (typeof updateData.addons === 'string') {
      try { updateData.addons = JSON.parse(updateData.addons); } catch { delete updateData.addons; }
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, message: 'Menu item updated', item: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const isOwner = restaurant && item.restaurant._id.toString() === restaurant._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      success: true,
      message: `Item is now ${item.isAvailable ? 'available' : 'unavailable'}`,
      isAvailable: item.isAvailable
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMenuByRestaurant,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
};
