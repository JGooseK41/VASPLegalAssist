const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  createVaspResponse,
  getVaspAggregatedData,
  getUserVaspResponses,
  checkDocumentResponse
} = require('../controllers/vaspResponseController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create a new VASP response
router.post('/', createVaspResponse);

// Get aggregated data for a specific VASP
router.get('/vasp/:vaspId/aggregated', getVaspAggregatedData);

// Get all responses submitted by the current user
router.get('/my-responses', getUserVaspResponses);

// Check if user has submitted response for a document
router.get('/document/:documentId/check', checkDocumentResponse);

module.exports = router;