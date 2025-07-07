const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Use encryption middleware to get the appropriate controller
const { documentController } = require('../middleware/encryptionMiddleware');
const {
  createDocument,
  getDocuments,
  getDocument,
  importTransactions
} = documentController;

// Import regular controller functions that aren't in encrypted version yet
const { duplicateDocument, uploadCSV } = require('../controllers/documentController');

// Import demo document controller
const { generateDemoDocument } = require('../controllers/demoDocumentController');

const { authMiddleware, demoMiddleware } = require('../middleware/auth');

// All document routes require authentication
router.use(authMiddleware);

// GET /api/documents
router.get('/', getDocuments);

// GET /api/documents/:id
router.get('/:id', getDocument);

// POST /api/documents - Handle demo users differently
router.post('/', (req, res, next) => {
  if (req.userRole === 'DEMO') {
    // For demo users, generate document without saving
    return generateDemoDocument(req, res);
  }
  // For regular users, proceed with normal document creation
  createDocument(req, res, next);
});

// POST /api/documents/:id/duplicate
router.post('/:id/duplicate', demoMiddleware, duplicateDocument);

// POST /api/documents/import-transactions - Allow demo users to import transactions (just parsing, no saving)
router.post('/import-transactions', upload.single('file'), importTransactions);

module.exports = router;