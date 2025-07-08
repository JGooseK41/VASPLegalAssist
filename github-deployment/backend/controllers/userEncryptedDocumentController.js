const { PrismaClient } = require('@prisma/client');
const {
  encryptForUser,
  decryptForUser,
  encryptFileForUser,
  decryptFileForUser,
  createEncryptedPackage,
  decryptPackage
} = require('../services/userKeyEncryption');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

/**
 * Creates a document with user-specific encryption
 */
const createUserEncryptedDocument = async (originalController) => {
  return async (req, res) => {
    try {
      // First, let the original controller create the document
      const originalJson = res.json;
      let documentResponse = null;
      
      // Intercept the response
      res.json = (data) => {
        documentResponse = data;
        return res;
      };
      
      // Call original controller
      await originalController(req, res);
      
      // Restore original json method
      res.json = originalJson;
      
      if (!documentResponse || !documentResponse.success) {
        return res.json(documentResponse);
      }
      
      // If user encryption is enabled and document was created
      if (process.env.ENABLE_USER_ENCRYPTION === 'true' && documentResponse.document) {
        const { document } = documentResponse;
        const userId = req.userId;
        
        // Encrypt sensitive fields in database
        const sensitiveData = {
          crimeDescription: document.crimeDescription,
          statute: document.statute,
          caseNumber: document.caseNumber,
          transactionDetails: document.transactionDetails,
          requestedData: document.requestedData
        };
        
        // Encrypt all sensitive data as a single JSON object
        const { encrypted: encryptedData } = await encryptForUser(
          JSON.stringify(sensitiveData),
          userId
        );
        
        // Update document record
        await prisma.document.update({
          where: { id: document.id },
          data: {
            // Replace sensitive fields with placeholders
            crimeDescription: '[ENCRYPTED]',
            statute: '[ENCRYPTED]',
            caseNumber: '[ENCRYPTED]',
            transactionDetails: '[ENCRYPTED]',
            requestedData: '[ENCRYPTED]',
            
            // Store encrypted data
            encryptedContent: encryptedData,
            isEncrypted: true,
            isClientEncrypted: false,
            encryptionVersion: 'user-key-1.0'
          }
        });
        
        // Don't encrypt the file immediately - it will be encrypted when downloaded
        // This allows for better performance and on-demand encryption
      }
      
      return res.json(documentResponse);
    } catch (error) {
      console.error('User encrypted document creation error:', error);
      return res.status(500).json({ 
        error: 'Failed to create encrypted document',
        details: error.message 
      });
    }
  };
};

/**
 * Retrieves and decrypts a document for the authorized user
 */
const getUserEncryptedDocument = async (req, res) => {
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
    
    // Decrypt if encrypted with user key
    if (document.isEncrypted && document.encryptionVersion === 'user-key-1.0') {
      try {
        // Decrypt the sensitive data
        const decryptedBuffer = await decryptForUser(document.encryptedContent, userId);
        const decryptedData = JSON.parse(decryptedBuffer.toString('utf8'));
        
        // Merge decrypted data back into document
        const decryptedDoc = {
          ...document,
          ...decryptedData
        };
        
        return res.json(decryptedDoc);
      } catch (error) {
        console.error('Document decryption failed:', error);
        return res.status(500).json({ 
          error: 'Failed to decrypt document. This may not be your document.' 
        });
      }
    }
    
    return res.json(document);
  } catch (error) {
    console.error('Get user encrypted document error:', error);
    return res.status(500).json({ error: 'Failed to retrieve document' });
  }
};

/**
 * Downloads a document as an encrypted package
 */
const downloadEncryptedPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Find document
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
      // Extract filename from URL
      const filename = document.pdfUrl.split('/').pop();
      filePath = path.join(__dirname, '../generated-docs', filename);
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Document file not found' });
    }
    
    // Create encrypted package
    const documentInfo = {
      documentId: document.id,
      documentType: document.documentType,
      vaspName: document.vaspName,
      createdAt: document.createdAt
    };
    
    const { packagePath, packageFilename } = await createEncryptedPackage(
      filePath,
      userId,
      documentInfo
    );
    
    // Send encrypted package
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${packageFilename}"`);
    
    const packageData = await fs.readFile(packagePath);
    await fs.unlink(packagePath); // Clean up temp file
    
    return res.send(packageData);
  } catch (error) {
    console.error('Download encrypted package error:', error);
    return res.status(500).json({ error: 'Failed to create encrypted package' });
  }
};

/**
 * Decrypts an uploaded encrypted package
 */
const decryptUploadedPackage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.userId;
    const packagePath = req.file.path;
    
    try {
      // Decrypt the package
      const { documentData, metadata, filename } = await decryptPackage(packagePath, userId);
      
      // Clean up uploaded file
      await fs.unlink(packagePath).catch(() => {});
      
      // Send decrypted document
      res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.send(documentData);
    } catch (error) {
      // Clean up uploaded file
      await fs.unlink(packagePath).catch(() => {});
      
      if (error.message.includes('not encrypted for your account')) {
        return res.status(403).json({ 
          error: 'This document was encrypted for a different user and cannot be decrypted with your account.' 
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Decrypt uploaded package error:', error);
    return res.status(500).json({ error: 'Failed to decrypt package' });
  }
};

/**
 * Gets all documents for a user with encryption status
 */
const getUserDocumentsWithEncryption = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10, offset = 0 } = req.query;
    
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        vaspName: true,
        documentType: true,
        createdAt: true,
        isEncrypted: true,
        encryptionVersion: true,
        outputFormat: true,
        pdfUrl: true,
        // Don't include sensitive fields
        caseNumber: false,
        crimeDescription: false,
        statute: false
      }
    });
    
    const total = await prisma.document.count({
      where: { userId }
    });
    
    // For encrypted documents, show placeholder case numbers
    const processedDocuments = documents.map(doc => ({
      ...doc,
      caseNumber: doc.isEncrypted ? '[ENCRYPTED]' : doc.caseNumber,
      requiresDecryption: doc.isEncrypted && doc.encryptionVersion === 'user-key-1.0'
    }));
    
    res.json({
      documents: processedDocuments,
      total,
      encrypted: documents.filter(d => d.isEncrypted).length
    });
  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
};

/**
 * Migrates existing documents to user-specific encryption
 */
const migrateToUserEncryption = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all unencrypted documents for this user
    const documents = await prisma.document.findMany({
      where: {
        userId,
        isEncrypted: false
      }
    });
    
    let migrated = 0;
    let failed = 0;
    
    for (const doc of documents) {
      try {
        // Prepare sensitive data
        const sensitiveData = {
          crimeDescription: doc.crimeDescription,
          statute: doc.statute,
          caseNumber: doc.caseNumber,
          transactionDetails: doc.transactionDetails,
          requestedData: doc.requestedData
        };
        
        // Encrypt data
        const { encrypted } = await encryptForUser(
          JSON.stringify(sensitiveData),
          userId
        );
        
        // Update document
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            crimeDescription: '[ENCRYPTED]',
            statute: '[ENCRYPTED]',
            caseNumber: '[ENCRYPTED]',
            transactionDetails: '[ENCRYPTED]',
            requestedData: '[ENCRYPTED]',
            encryptedContent: encrypted,
            isEncrypted: true,
            encryptionVersion: 'user-key-1.0'
          }
        });
        
        migrated++;
      } catch (error) {
        console.error(`Failed to migrate document ${doc.id}:`, error);
        failed++;
      }
    }
    
    res.json({
      success: true,
      total: documents.length,
      migrated,
      failed
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
};

module.exports = {
  createUserEncryptedDocument,
  getUserEncryptedDocument,
  downloadEncryptedPackage,
  decryptUploadedPackage,
  getUserDocumentsWithEncryption,
  migrateToUserEncryption
};