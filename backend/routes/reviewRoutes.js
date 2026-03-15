// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { addReview, getRestaurantReviews } = require('../controllers/controllers');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/', protect, authorize('customer'), upload.array('images', 3), addReview);
router.get('/restaurant/:restaurantId', getRestaurantReviews);

module.exports = router;
