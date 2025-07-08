const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { 
  encryptForUser, 
  decryptForUser,
  deriveUserKey 
} = require('./userKeyEncryption');

/**
 * Hybrid encryption approach:
 * 1. Database fields are always encrypted (case details, etc.)
 * 2. Files can be downloaded normally OR as encrypted packages
 * 3. Batch operations work seamlessly
 */

/**
 * Encrypts sensitive document data in database only
 * Files remain accessible for normal download
 */
const encryptDocumentMetadata = async (documentData, userId) => {
  // List of sensitive fields to encrypt in database
  const sensitiveFields = [
    'crimeDescription',
    'statute',
    'caseNumber',
    'transactionDetails',
    'requestedData'
  ];
  
  const encryptedData = { ...documentData };
  const fieldsToEncrypt = {};
  
  // Collect sensitive fields
  sensitiveFields.forEach(field => {
    if (documentData[field]) {
      fieldsToEncrypt[field] = documentData[field];
      // Keep original for document generation, will be cleared after
    }
  });
  
  // Encrypt all sensitive fields as one JSON object
  if (Object.keys(fieldsToEncrypt).length > 0) {
    const { encrypted } = await encryptForUser(
      JSON.stringify(fieldsToEncrypt),
      userId
    );
    
    encryptedData.encryptedContent = encrypted;
    encryptedData.isEncrypted = true;
    encryptedData.encryptionVersion = 'hybrid-1.0';
    
    // Replace sensitive fields with placeholders in database
    sensitiveFields.forEach(field => {
      if (documentData[field]) {
        encryptedData[field] = '[ENCRYPTED]';
      }
    });
  }
  
  return encryptedData;
};

/**
 * Decrypts document metadata for authorized user
 */
const decryptDocumentMetadata = async (document, userId) => {
  if (!document.isEncrypted || document.encryptionVersion !== 'hybrid-1.0') {
    return document;
  }
  
  try {
    // Decrypt the sensitive data
    const decryptedBuffer = await decryptForUser(document.encryptedContent, userId);
    const decryptedData = JSON.parse(decryptedBuffer.toString('utf8'));
    
    // Merge decrypted data back
    return {
      ...document,
      ...decryptedData
    };
  } catch (error) {
    console.error('Failed to decrypt document metadata:', error);
    throw new Error('Unable to decrypt document - may not belong to this user');
  }
};

/**
 * Creates encrypted file ONLY when specifically requested
 * This allows normal downloads to work as before
 */
const createEncryptedFilePackage = async (filePath, userId, metadata = {}) => {
  const fileData = await fs.readFile(filePath);
  const { encrypted } = await encryptForUser(fileData, userId);
  
  const packageData = {
    version: '1.0',
    type: 'encrypted-document',
    encrypted: encrypted,
    metadata: {
      ...metadata,
      originalFilename: path.basename(filePath),
      encryptedAt: new Date().toISOString(),
      userId: userId
    }
  };
  
  return packageData;
};

/**
 * Handles batch document encryption
 * Encrypts metadata but keeps files accessible
 */
const processBatchDocuments = async (documents, userId) => {
  const results = [];
  
  for (const doc of documents) {
    try {
      // Encrypt metadata only
      const encryptedMetadata = await encryptDocumentMetadata(doc, userId);
      
      results.push({
        ...doc,
        encryptedMetadata,
        // File remains unencrypted for batch download
        filePath: doc.filePath
      });
    } catch (error) {
      console.error(`Failed to process document ${doc.id}:`, error);
      results.push({
        ...doc,
        error: 'Encryption failed'
      });
    }
  }
  
  return results;
};

/**
 * Provides option for secure download
 * User can choose between normal download or encrypted package
 */
const getDownloadOptions = (document, isOwner) => {
  const options = [];
  
  if (document.filePath || document.pdfUrl) {
    // Normal download (file is not encrypted on disk)
    options.push({
      type: 'normal',
      label: 'Download Document',
      description: 'Download as Word/PDF file',
      icon: 'download',
      available: true
    });
    
    if (isOwner && document.isEncrypted) {
      // Encrypted download option
      options.push({
        type: 'encrypted',
        label: 'Download Encrypted',
        description: 'Download as encrypted package (maximum security)',
        icon: 'lock',
        available: true
      });
    }
  }
  
  return options;
};

/**
 * Temporary file encryption for ultra-sensitive operations
 * File is encrypted, sent, then deleted
 */
const createTemporaryEncryptedFile = async (filePath, userId) => {
  const tempDir = path.join(path.dirname(filePath), 'temp-encrypted');
  await fs.mkdir(tempDir, { recursive: true });
  
  const tempFile = path.join(tempDir, `temp_${Date.now()}_${path.basename(filePath)}`);
  
  try {
    // Read and encrypt file
    const fileData = await fs.readFile(filePath);
    const { encrypted } = await encryptForUser(fileData, userId);
    
    // Write encrypted file
    await fs.writeFile(tempFile, encrypted, 'base64');
    
    // Schedule deletion after 5 minutes
    setTimeout(async () => {
      try {
        await fs.unlink(tempFile);
      } catch (error) {
        console.error('Failed to delete temporary file:', error);
      }
    }, 5 * 60 * 1000);
    
    return tempFile;
  } catch (error) {
    // Clean up on error
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw error;
  }
};

module.exports = {
  encryptDocumentMetadata,
  decryptDocumentMetadata,
  createEncryptedFilePackage,
  processBatchDocuments,
  getDownloadOptions,
  createTemporaryEncryptedFile
};