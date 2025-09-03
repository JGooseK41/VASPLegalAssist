const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
  getTopContributor, 
  getLeaderboard, 
  getUserScore,
  checkMilestone,
  submitMilestoneFeedback,
  acknowledgeMilestone,
  checkLeaderboardAchievement,
  acknowledgeLeaderboardAchievement,
  getUserContributionDetails
} = require('../controllers/contributorController');

// Test endpoint (no auth)
router.get('/test', (req, res) => {
  res.json({ 
    status: 'Contributors route working',
    timestamp: new Date().toISOString(),
    version: '1.0.1'
  });
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get top contributor
router.get('/top', getTopContributor);

// Get full leaderboard
router.get('/leaderboard', getLeaderboard);

// Get current user's score
router.get('/my-score', getUserScore);

// Check for milestone achievements
router.get('/check-milestone', checkMilestone);

// Submit milestone feedback
router.post('/milestone-feedback', submitMilestoneFeedback);

// Acknowledge milestone without feedback
router.post('/acknowledge-milestone', acknowledgeMilestone);

// Check for leaderboard achievement
router.get('/check-leaderboard-achievement', checkLeaderboardAchievement);

// Acknowledge leaderboard achievement
router.post('/acknowledge-leaderboard-achievement', acknowledgeLeaderboardAchievement);

// Get user contribution details
router.get('/:userId/details', getUserContributionDetails);

module.exports = router;