const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

const getAllRestaurants = async (req, res) => {
  try {
    const { cuisine, search, sort, page = 1, limit = 12 } = req.query;
    const query = { isApproved: true, isActive: true };

    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cuisine: { $in: [new RegExp(search, 'i')] } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortOption = { isFeatured: -1, createdAt: -1 };
    if (sort === 'rating') sortOption = { 'rating.average': -1 };
    if (sort === 'deliveryTime') sortOption = { 'deliveryTime.min': 1 };
    if (sort === 'deliveryFee') sortOption = { deliveryFee: 1 };

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('owner', 'name email phone');

    res.json({
      success: true,
      count: restaurants.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      restaurants
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ owner: req.user._id });
    if (existingRestaurant) {
      return res.status(400).json({ success: false, message: 'You already have a restaurant' });
    }

    const restaurantData = { ...req.body, owner: req.user._id };

    if (req.files) {
      if (req.files.logo) restaurantData.logo = req.files.logo[0].path;
      if (req.files.coverImage) restaurantData.coverImage = req.files.coverImage[0].path;
    }

    if (typeof restaurantData.cuisine === 'string') {
      restaurantData.cuisine = restaurantData.cuisine.split(',').map(c => c.trim());
    }

    const restaurant = await Restaurant.create(restaurantData);

    res.status(201).json({
      success: true,
      message: 'Restaurant created. Awaiting admin approval.',
      restaurant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const updateData = { ...req.body };

    if (req.files) {
      if (req.files.logo) updateData.logo = req.files.logo[0].path;
      if (req.files.coverImage) updateData.coverImage = req.files.coverImage[0].path;
    }

    if (typeof updateData.cuisine === 'string') {
      updateData.cuisine = updateData.cuisine.split(',').map(c => c.trim());
    }

    const updated = await Restaurant.findByIdAndUpdate(restaurant._id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, message: 'Restaurant updated', restaurant: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id })
      .populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'No restaurant found' });
    }

    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.json({
      success: true,
      message: `Restaurant is now ${restaurant.isActive ? 'open' : 'closed'}`,
      isActive: restaurant.isActive
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFeaturedRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      isApproved: true,
      isActive: true,
      isFeatured: true
    }).limit(6);

    res.json({ success: true, restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  getMyRestaurant,
  toggleRestaurantStatus,
  getFeaturedRestaurants
};
