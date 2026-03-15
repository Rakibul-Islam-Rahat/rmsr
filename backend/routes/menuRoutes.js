const express = require('express');
const router = express.Router();
const { getMenuByRestaurant, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/restaurant/:restaurantId', getMenuByRestaurant);
router.post('/', protect, authorize('restaurant_owner', 'admin'), upload.single('image'), addMenuItem);
router.put('/:id', protect, authorize('restaurant_owner', 'admin'), upload.single('image'), updateMenuItem);
router.delete('/:id', protect, authorize('restaurant_owner', 'admin'), deleteMenuItem);
router.patch('/:id/toggle', protect, authorize('restaurant_owner', 'admin'), toggleAvailability);

module.exports = router;
