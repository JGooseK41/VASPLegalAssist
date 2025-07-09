const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, updateSurveyReminderShown, deleteAccount } = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/auth');

// All profile routes require authentication
router.use(authMiddleware);

// GET /api/profile
router.get('/', getProfile);

// PUT /api/profile
router.put('/', updateProfile);

// PUT /api/profile/password
router.put('/password', changePassword);

// PUT /api/profile/survey-reminder
router.put('/survey-reminder', updateSurveyReminderShown);

// DELETE /api/profile
router.delete('/', deleteAccount);

module.exports = router;