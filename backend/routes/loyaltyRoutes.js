// routes/loyaltyRoutes.js
const express = require('express');
const router = express.Router();
const { getLoyalty } = require('../controllers/controllers');
const { protect } = require('../middleware/auth');
router.get('/', protect, getLoyalty);
module.exports = router;
