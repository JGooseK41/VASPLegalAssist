const { PrismaClient } = require('@prisma/client');
const {
  encryptDocumentMetadata,
  decryptDocumentMetadata,
  createEncryptedFilePackage,
  getDownloadOptions
} = require('../services/hybridEncryption');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

/**
 * Enhanced document creation with hybrid encryption
 * - Encrypts sensitive metadata in database
 * - Keeps files accessible for normal operations
 */
const createHybridEncryptedDocument = (originalController) => {
  return async (req, res, next) => {
    // Skip encryption for demo users
    if (req.userId === 'demo-user-id' || process.env.ENABLE_USER_ENCRYPTION !== 'true') {
      return originalController(req, res, next);
    }
    
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    let documentCreated = false;
    
    res.json = async function(data) {
      if (data.success && data.document && !documentCreated) {
        documentCreated = true;
        
        try {
          // Encrypt sensitive metadata
          const encryptedMetadata = await encryptDocumentMetadata(
            data.document,
            req.userId
          );
          
          // Update document in database with encrypted fields
          const updatedDoc = await prisma.document.update({
            where: { id: data.document.id },
            data: {
              crimeDescription: encryptedMetadata.crimeDescription,
              statute: encryptedMetadata.statute,
              caseNumber: encryptedMetadata.caseNumber,
              transactionDetails: encryptedMetadata.transactionDetails,
              requestedData: encryptedMetadata.requestedData,
              encryptedContent: encryptedMetadata.encryptedContent,
              isEncrypted: encryptedMetadata.isEncrypted,
              encryptionVersion: encryptedMetadata.encryptionVersion
            }
          });
          
          // Return success with normal download URL
          // File remains unencrypted for seamless downloads
          return originalJson({
            ...data,
            document: {
              ...data.document,
              isEncrypted: true,
              // Keep original URL for backward compatibility
              documentUrl: data.documentUrl
            }
          });
        } catch (error) {
          console.error('Hybrid encryption failed:', error);
          // Continue without encryption on error
          return originalJson(data);
        }
      }
      
      return originalJson(data);
    };
    
    return originalController(req, res, next);
  };
};

/**
 * Get document with decrypted metadata
 */
const getDocumentWithDecryption = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId
      }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Decrypt metadata if encrypted
    let decryptedDocument = document;
    if (document.isEncrypted && document.encryptionVersion === 'hybrid-1.0') {
      try {
        decryptedDocument = await decryptDocumentMetadata(document, userId);
      } catch (error) {
        console.error('Decryption failed:', error);
        // Return document with encrypted placeholders
      }
    }
    
    // Add download options
    const downloadOptions = getDownloadOptions(document, true);
    
    res.json({
      ...decryptedDocument,
      downloadOptions
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
};

/**
 * Download document with optional encryption
 */
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { encrypted } = req.query; // ?encrypted=true for encrypted download
    const userId = req.userId;
    
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId
      }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Get file path
    let filePath = document.filePath;
    if (!filePath && document.pdfUrl) {
      const filename = document.pdfUrl.split('/').pop();
      filePath = path.join(__dirname, '../generated-docs', filename);
    }
    
    // Check file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Document file not found' });
    }
    
    // Handle encrypted download if requested
    if (encrypted === 'true' && document.isEncrypted) {
      const packageData = await createEncryptedFilePackage(filePath, userId, {
        documentId: document.id,
        documentType: document.documentType,
        vaspName: document.vaspName
      });
      
      const filename = `${path.basename(filePath, path.extname(filePath))}_encrypted.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.json(packageData);
    }
    
    // Normal download - file is not encrypted
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.pdf': 'application/pdf'
    };
    
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    
    const fileData = await fs.readFile(filePath);
    res.send(fileData);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

/**
 * Batch download handler - works normally
 */
const downloadBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const userId = req.userId;
    
    // Verify ownership
    const documents = await prisma.document.findMany({
      where: {
        userId,
        metadata: {
          contains: batchId
        }
      }
    });
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    // For batch downloads, use normal files (not encrypted)
    // This ensures batch operations work seamlessly
    const zipPath = path.join(__dirname, '../generated-docs', `batch_${batchId}.zip`);
    
    try {
      await fs.access(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="batch_${batchId}.zip"`);
      const zipData = await fs.readFile(zipPath);
      res.send(zipData);
    } catch {
      res.status(404).json({ error: 'Batch file not found' });
    }
  } catch (error) {
    console.error('Batch download error:', error);
    res.status(500).json({ error: 'Failed to download batch' });
  }
};

/**
 * Get encryption status for all documents
 */
const getEncryptionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    
    const total = await prisma.document.count({ where: { userId } });
    const encrypted = await prisma.document.count({ 
      where: { 
        userId, 
        isEncrypted: true 
      } 
    });
    
    res.json({
      total,
      encrypted,
      percentage: total > 0 ? Math.round((encrypted / total) * 100) : 0,
      encryptionEnabled: process.env.ENABLE_USER_ENCRYPTION === 'true'
    });
  } catch (error) {
    console.error('Get encryption status error:', error);
    res.status(500).json({ error: 'Failed to get encryption status' });
  }
};

module.exports = {
  createHybridEncryptedDocument,
  getDocumentWithDecryption,
  downloadDocument,
  downloadBatch,
  getEncryptionStatus
};