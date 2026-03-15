const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationRead, markAllRead } = require('../controllers/controllers');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);       // MUST be before /:id
router.put('/:id/read', protect, markNotificationRead);

module.exports = router;
