const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/auth');

// All user routes require authentication
router.use(authMiddleware);

// PUT /api/users/profile - Update user profile
router.put('/profile', updateProfile);

module.exports = router;