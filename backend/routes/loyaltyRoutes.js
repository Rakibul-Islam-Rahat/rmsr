// routes/loyaltyRoutes.js
const express = require('express');
const router = express.Router();
const { getLoyalty } = require('../controllers/controllers');
const { protect, authorize } = require('../middleware/auth');
router.get('/', protect, authorize('customer'), getLoyalty);
module.exports = router;