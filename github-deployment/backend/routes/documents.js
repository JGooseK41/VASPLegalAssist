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
const { duplicateDocument, uploadCSV, getTotalDocumentCount, deleteDocument } = require('../controllers/documentController');

// Import demo document controller
const { generateDemoDocument } = require('../controllers/demoDocumentController');

// Import batch document controller
const batchDocumentController = require('../controllers/batchDocumentController');

// Import simple document controller
const { createSimpleDocument, createSimpleBatch } = require('../controllers/simpleDocumentController');

// Import custom batch controller
const { createCustomBatch } = require('../controllers/customBatchController');

const { authMiddleware, demoMiddleware } = require('../middleware/auth');

// Public routes (no authentication required)
// GET /api/documents/total-count - Get total document count across all users (public endpoint for stats)
router.get('/total-count', getTotalDocumentCount);

// All other document routes require authentication
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

// POST /api/documents/simple - Simple document generation without templates
router.post('/simple', createSimpleDocument);

// POST /api/documents/simple-batch - Simple batch document generation
router.post('/simple-batch', createSimpleBatch);

// POST /api/documents/custom-batch - Custom batch document generation
router.post('/custom-batch', createCustomBatch);

// POST /api/documents/:id/duplicate
router.post('/:id/duplicate', demoMiddleware, duplicateDocument);

// DELETE /api/documents/:id
router.delete('/:id', demoMiddleware, deleteDocument);

// POST /api/documents/import-transactions - Allow demo users to import transactions (just parsing, no saving)
router.post('/import-transactions', upload.single('file'), importTransactions);

// Batch document generation routes
// POST /api/documents/batch/generate
router.post('/batch/generate', batchDocumentController.generateBatchDocuments.bind(batchDocumentController));

// GET /api/documents/batch/sample-csv
router.get('/batch/sample-csv', batchDocumentController.getSampleCSV.bind(batchDocumentController));

// GET /api/documents/batch/download/:batchId/:filename
router.get('/batch/download/:batchId/:filename', batchDocumentController.downloadBatchZip.bind(batchDocumentController));

module.exports = router;