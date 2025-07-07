const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getTopContributor, getLeaderboard } = require('../controllers/contributorController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get top contributor
router.get('/top', getTopContributor);

// Get full leaderboard
router.get('/leaderboard', getLeaderboard);

module.exports = router;