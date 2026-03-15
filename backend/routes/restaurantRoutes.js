const express = require('express');
const router = express.Router();
const {
  getAllRestaurants, getRestaurant, createRestaurant,
  updateRestaurant, getMyRestaurant, toggleRestaurantStatus, getFeaturedRestaurants
} = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const multiUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

router.get('/', getAllRestaurants);
router.get('/featured', getFeaturedRestaurants);                         // BEFORE /:id
router.get('/my', protect, authorize('restaurant_owner'), getMyRestaurant); // BEFORE /:id
router.patch('/toggle-status', protect, authorize('restaurant_owner'), toggleRestaurantStatus); // BEFORE /:id
router.post('/', protect, authorize('restaurant_owner'), multiUpload, createRestaurant);
router.put('/', protect, authorize('restaurant_owner'), multiUpload, updateRestaurant);
router.get('/:id', getRestaurant);                                       // AFTER specific routes

module.exports = router;
