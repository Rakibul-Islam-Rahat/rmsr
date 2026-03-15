// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, updateFcmToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/fcm-token', protect, updateFcmToken);

module.exports = router;
