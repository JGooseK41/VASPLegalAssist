/**
 * Middleware to conditionally use encrypted or regular controllers based on configuration
 */

const encryptionEnabled = process.env.ENABLE_ENCRYPTION === 'true';

// Import regular controllers
const regularTemplateController = require('../controllers/templateController');
const regularDocumentController = require('../controllers/documentController');

// Import encrypted controllers
const encryptedTemplateController = require('../controllers/encryptedTemplateController');
const encryptedDocumentController = require('../controllers/encryptedDocumentController');

// Export the appropriate controllers based on configuration
const templateController = encryptionEnabled ? encryptedTemplateController : regularTemplateController;
const documentController = encryptionEnabled ? encryptedDocumentController : regularDocumentController;

// Log encryption status on startup
if (encryptionEnabled) {
  console.log('🔐 Encryption is ENABLED for templates and documents');
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    console.warn('⚠️  WARNING: ENCRYPTION_MASTER_KEY not set. Using generated key (not recommended for production)');
  }
} else {
  console.log('🔓 Encryption is DISABLED');
}

module.exports = {
  templateController,
  documentController,
  encryptionEnabled
};