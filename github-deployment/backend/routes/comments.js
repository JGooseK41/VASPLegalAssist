const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getVaspComments,
  createComment,
  updateComment,
  deleteComment,
  voteComment
} = require('../controllers/commentController');

// All routes require authentication
router.use(auth);

// Get comments for a specific VASP
router.get('/vasp/:vaspId', getVaspComments);

// Create a new comment
router.post('/vasp/:vaspId', createComment);

// Update a comment
router.put('/:commentId', updateComment);

// Delete a comment
router.delete('/:commentId', deleteComment);

// Vote on a comment
router.post('/:commentId/vote', voteComment);

module.exports = router;