/**
 * Middleware to handle routing between encrypted and regular controllers
 * Now supports client-side encryption
 */

// Always use regular controllers since encryption is now client-side
const regularTemplateController = require('../controllers/templateController');
const regularDocumentController = require('../controllers/documentController');

// Export the regular controllers
const templateController = regularTemplateController;
const documentController = regularDocumentController;

// Log encryption status on startup
console.log('🔐 Client-side encryption is supported - server stores encrypted data as-is');

module.exports = {
  templateController,
  documentController,
  encryptionEnabled: false // Server-side encryption is disabled
};