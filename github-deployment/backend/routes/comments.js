const express = require('express');
const router = express.Router();
const { authMiddleware, demoMiddleware } = require('../middleware/auth');
const {
  getVaspComments,
  createComment,
  updateComment,
  deleteComment,
  voteComment
} = require('../controllers/commentController');

// All routes require authentication
router.use(authMiddleware);

// Get comments for a specific VASP
router.get('/vasp/:vaspId', getVaspComments);

// Create a new comment (demo users cannot create comments)
router.post('/vasp/:vaspId', demoMiddleware, createComment);

// Update a comment (demo users cannot update comments)
router.put('/:commentId', demoMiddleware, updateComment);

// Delete a comment (demo users cannot delete comments)
router.delete('/:commentId', demoMiddleware, deleteComment);

// Vote on a comment (demo users cannot vote)
router.post('/:commentId/vote', demoMiddleware, voteComment);

module.exports = router;