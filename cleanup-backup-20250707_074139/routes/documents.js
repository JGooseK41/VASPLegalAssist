const express = require('express');
const router = express.Router();
const {
  createDocument,
  getDocuments,
  getDocument,
  duplicateDocument,
  importTransactions,
  uploadCSV
} = require('../controllers/documentController');
const { authMiddleware, demoMiddleware } = require('../middleware/auth');

// All document routes require authentication
router.use(authMiddleware);

// GET /api/documents
router.get('/', getDocuments);

// GET /api/documents/:id
router.get('/:id', getDocument);

// POST /api/documents
router.post('/', demoMiddleware, createDocument);

// POST /api/documents/:id/duplicate
router.post('/:id/duplicate', demoMiddleware, duplicateDocument);

// POST /api/documents/import-transactions
router.post('/import-transactions', uploadCSV, importTransactions);

module.exports = router;