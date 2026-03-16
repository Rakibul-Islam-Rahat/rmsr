const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile,
  changePassword, updateFcmToken,
  forgotPassword, verifyOtp, resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/fcm-token', protect, updateFcmToken);

// Forgot password flow (no auth required)
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
