const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createSubmission,
  getMySubmissions,
  getSubmission,
  updateSubmission,
  deleteSubmission
} = require('../controllers/submissionController');

// All routes require authentication
router.use(auth);

// Create a new submission
router.post('/', createSubmission);

// Get all submissions for the authenticated user
router.get('/my', getMySubmissions);

// Get a specific submission
router.get('/:submissionId', getSubmission);

// Update a pending submission
router.put('/:submissionId', updateSubmission);

// Delete a pending submission
router.delete('/:submissionId', deleteSubmission);

module.exports = router;