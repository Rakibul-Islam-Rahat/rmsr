// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { getChatMessages, sendMessage } = require('../controllers/controllers');
const { protect } = require('../middleware/auth');

router.get('/:orderId', protect, getChatMessages);
router.post('/', protect, sendMessage);

module.exports = router;
