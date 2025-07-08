const { PrismaClient } = require('@prisma/client');
const { 
  encryptFile, 
  decryptFile, 
  encryptText, 
  decryptText,
  encryptDocumentData,
  decryptDocumentData 
} = require('../services/documentEncryption');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

/**
 * Enhanced document creation with encryption
 */
const createEncryptedDocument = async (originalController) => {
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
      
      // If encryption is enabled and document was created
      if (process.env.ENABLE_DOCUMENT_ENCRYPTION === 'true' && documentResponse.document) {
        const { document } = documentResponse;
        
        // Encrypt the file if it exists
        if (document.filePath) {
          try {
            const encryptedFilePath = document.filePath.replace('.docx', '_encrypted.docx');
            const encryptionMetadata = await encryptFile(document.filePath, encryptedFilePath);
            
            // Update document record with encrypted file path
            await prisma.document.update({
              where: { id: document.id },
              data: {
                encryptedFilePath,
                fileEncryptionMetadata: JSON.stringify(encryptionMetadata),
                isEncrypted: true
              }
            });
            
            // Delete original unencrypted file
            await fs.unlink(document.filePath).catch(() => {});
            
            // Update response to use encrypted file
            documentResponse.documentUrl = documentResponse.documentUrl.replace(
              path.basename(document.filePath),
              path.basename(encryptedFilePath)
            );
          } catch (error) {
            console.error('File encryption failed:', error);
          }
        }
        
        // Encrypt sensitive fields in database
        const sensitiveFields = ['crimeDescription', 'statute', 'caseNumber'];
        const updateData = {};
        
        for (const field of sensitiveFields) {
          if (document[field]) {
            updateData[`encrypted_${field}`] = encryptText(document[field]);
            updateData[field] = '[ENCRYPTED]'; // Replace with placeholder
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.isEncrypted = true;
          updateData.encryptionVersion = '1.0';
          
          await prisma.document.update({
            where: { id: document.id },
            data: updateData
          });
        }
      }
      
      return res.json(documentResponse);
    } catch (error) {
      console.error('Encrypted document creation error:', error);
      return res.status(500).json({ 
        error: 'Failed to create encrypted document',
        details: error.message 
      });
    }
  };
};

/**
 * Retrieves and decrypts a document
 */
const getEncryptedDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Decrypt sensitive fields if encrypted
    if (document.isEncrypted) {
      const decryptedDoc = { ...document };
      
      // Decrypt text fields
      const encryptedFields = ['encrypted_crimeDescription', 'encrypted_statute', 'encrypted_caseNumber'];
      for (const field of encryptedFields) {
        if (document[field]) {
          const originalField = field.replace('encrypted_', '');
          try {
            decryptedDoc[originalField] = decryptText(document[field]);
          } catch (error) {
            console.error(`Failed to decrypt ${field}:`, error);
            decryptedDoc[originalField] = document[originalField] || '[DECRYPTION_FAILED]';
          }
        }
      }
      
      return res.json(decryptedDoc);
    }
    
    return res.json(document);
  } catch (error) {
    console.error('Get encrypted document error:', error);
    return res.status(500).json({ error: 'Failed to retrieve document' });
  }
};

/**
 * Downloads and decrypts a document file
 */
const downloadEncryptedDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find document by filename
    const document = await prisma.document.findFirst({
      where: {
        OR: [
          { filePath: { endsWith: filename } },
          { encryptedFilePath: { endsWith: filename } },
          { pdfUrl: { contains: filename } }
        ],
        userId: req.userId
      }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Determine file path
    let filePath = document.encryptedFilePath || document.filePath;
    if (!filePath && document.pdfUrl) {
      // Extract from URL
      filePath = path.join(__dirname, '../generated-docs', filename);
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Document file not found' });
    }
    
    // If encrypted, decrypt it
    if (document.isEncrypted && document.encryptedFilePath) {
      try {
        const decryptedBuffer = await decryptFile(filePath);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename.replace('_encrypted', '')}"`);
        
        return res.send(decryptedBuffer);
      } catch (error) {
        console.error('Document decryption failed:', error);
        return res.status(500).json({ error: 'Failed to decrypt document' });
      }
    }
    
    // Send unencrypted file
    return res.sendFile(filePath);
  } catch (error) {
    console.error('Download encrypted document error:', error);
    return res.status(500).json({ error: 'Failed to download document' });
  }
};

/**
 * Bulk encrypt existing documents
 */
const bulkEncryptDocuments = async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get all unencrypted documents
    const documents = await prisma.document.findMany({
      where: {
        isEncrypted: false
      }
    });
    
    let encrypted = 0;
    let failed = 0;
    
    for (const doc of documents) {
      try {
        // Encrypt file if exists
        if (doc.filePath) {
          const encryptedFilePath = doc.filePath.replace('.docx', '_encrypted.docx');
          await encryptFile(doc.filePath, encryptedFilePath);
          
          // Update document
          const updateData = {
            encryptedFilePath,
            isEncrypted: true,
            encryptionVersion: '1.0'
          };
          
          // Encrypt sensitive fields
          if (doc.crimeDescription) {
            updateData.encrypted_crimeDescription = encryptText(doc.crimeDescription);
            updateData.crimeDescription = '[ENCRYPTED]';
          }
          if (doc.statute) {
            updateData.encrypted_statute = encryptText(doc.statute);
            updateData.statute = '[ENCRYPTED]';
          }
          if (doc.caseNumber) {
            updateData.encrypted_caseNumber = encryptText(doc.caseNumber);
            updateData.caseNumber = '[ENCRYPTED]';
          }
          
          await prisma.document.update({
            where: { id: doc.id },
            data: updateData
          });
          
          // Delete original file
          await fs.unlink(doc.filePath).catch(() => {});
          
          encrypted++;
        }
      } catch (error) {
        console.error(`Failed to encrypt document ${doc.id}:`, error);
        failed++;
      }
    }
    
    res.json({
      success: true,
      total: documents.length,
      encrypted,
      failed
    });
  } catch (error) {
    console.error('Bulk encryption error:', error);
    res.status(500).json({ error: 'Bulk encryption failed' });
  }
};

module.exports = {
  createEncryptedDocument,
  getEncryptedDocument,
  downloadEncryptedDocument,
  bulkEncryptDocuments
};