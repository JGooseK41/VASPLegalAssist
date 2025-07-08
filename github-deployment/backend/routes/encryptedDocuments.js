const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { 
  downloadEncryptedPackage,
  decryptUploadedPackage,
  getUserDocumentsWithEncryption,
  migrateToUserEncryption
} = require('../controllers/userEncryptedDocumentController');

// Configure multer for encrypted file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.encrypted')) {
      cb(null, true);
    } else {
      cb(new Error('Only .encrypted files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// All routes require authentication
router.use(authMiddleware);

// GET /api/encrypted-documents/download/:id - Download document as encrypted package
router.get('/download/:id', downloadEncryptedPackage);

// POST /api/encrypted-documents/decrypt - Decrypt uploaded package
router.post('/decrypt', upload.single('file'), decryptUploadedPackage);

// GET /api/encrypted-documents - Get user documents with encryption status
router.get('/', getUserDocumentsWithEncryption);

// POST /api/encrypted-documents/migrate - Migrate user's documents to user encryption
router.post('/migrate', migrateToUserEncryption);

module.exports = router;