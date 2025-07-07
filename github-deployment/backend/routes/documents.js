const express = require('express');
const router = express.Router();

// Use encryption middleware to get the appropriate controller
const { documentController } = require('../middleware/encryptionMiddleware');
const {
  createDocument,
  getDocuments,
  getDocument,
  importTransactions,
  upload
} = documentController;

// Import regular controller functions that aren't in encrypted version yet
const { duplicateDocument, uploadCSV } = require('../controllers/documentController');

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
router.post('/import-transactions', upload.single('file'), importTransactions);

module.exports = router;