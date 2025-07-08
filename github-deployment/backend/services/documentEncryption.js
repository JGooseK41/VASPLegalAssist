const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment or generate one
const getEncryptionKey = () => {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!key) {
    console.warn('WARNING: DOCUMENT_ENCRYPTION_KEY not set in environment. Using default key (NOT SECURE FOR PRODUCTION)');
    return crypto.scryptSync('default-encryption-key-change-this', 'salt', KEY_LENGTH);
  }
  return Buffer.from(key, 'hex');
};

/**
 * Encrypts a buffer using AES-256-GCM
 * @param {Buffer} buffer - The data to encrypt
 * @param {Buffer} key - The encryption key
 * @returns {Object} - Object containing encrypted data, iv, tag, and salt
 */
const encryptBuffer = (buffer, key) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv,
    tag
  };
};

/**
 * Decrypts a buffer using AES-256-GCM
 * @param {Buffer} encrypted - The encrypted data
 * @param {Buffer} key - The encryption key
 * @param {Buffer} iv - The initialization vector
 * @param {Buffer} tag - The authentication tag
 * @returns {Buffer} - The decrypted data
 */
const decryptBuffer = (encrypted, key, iv, tag) => {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
};

/**
 * Encrypts a file and saves it with encryption metadata
 * @param {string} filePath - Path to the file to encrypt
 * @param {string} outputPath - Path where encrypted file will be saved
 * @returns {Object} - Encryption metadata
 */
const encryptFile = async (filePath, outputPath = null) => {
  try {
    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Encrypt the file
    const { encrypted, iv, tag } = encryptBuffer(fileBuffer, key);
    
    // Create output path if not provided
    if (!outputPath) {
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath);
      outputPath = path.join(dir, `encrypted_${basename}`);
    }
    
    // Combine IV, tag, and encrypted data
    const combined = Buffer.concat([iv, tag, encrypted]);
    
    // Write encrypted file
    await fs.writeFile(outputPath, combined);
    
    // Return metadata
    return {
      originalPath: filePath,
      encryptedPath: outputPath,
      algorithm: ALGORITHM,
      ivLength: IV_LENGTH,
      tagLength: TAG_LENGTH,
      isEncrypted: true
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw error;
  }
};

/**
 * Decrypts a file
 * @param {string} encryptedPath - Path to the encrypted file
 * @param {string} outputPath - Path where decrypted file will be saved
 * @returns {Buffer} - The decrypted file buffer
 */
const decryptFile = async (encryptedPath, outputPath = null) => {
  try {
    // Read the encrypted file
    const combined = await fs.readFile(encryptedPath);
    
    // Extract IV, tag, and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Decrypt the file
    const decrypted = decryptBuffer(encrypted, key, iv, tag);
    
    // Write decrypted file if output path provided
    if (outputPath) {
      await fs.writeFile(outputPath, decrypted);
    }
    
    return decrypted;
  } catch (error) {
    console.error('File decryption error:', error);
    throw error;
  }
};

/**
 * Encrypts text data
 * @param {string} text - The text to encrypt
 * @returns {string} - Base64 encoded encrypted data with metadata
 */
const encryptText = (text) => {
  const key = getEncryptionKey();
  const { encrypted, iv, tag } = encryptBuffer(Buffer.from(text, 'utf8'), key);
  
  // Combine IV, tag, and encrypted data
  const combined = Buffer.concat([iv, tag, encrypted]);
  
  // Return as base64
  return combined.toString('base64');
};

/**
 * Decrypts text data
 * @param {string} encryptedText - Base64 encoded encrypted data
 * @returns {string} - The decrypted text
 */
const decryptText = (encryptedText) => {
  const combined = Buffer.from(encryptedText, 'base64');
  
  // Extract IV, tag, and encrypted data
  const iv = combined.slice(0, IV_LENGTH);
  const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);
  
  const key = getEncryptionKey();
  const decrypted = decryptBuffer(encrypted, key, iv, tag);
  
  return decrypted.toString('utf8');
};

/**
 * Encrypts document data for database storage
 * @param {Object} documentData - The document data to encrypt
 * @returns {Object} - Document data with sensitive fields encrypted
 */
const encryptDocumentData = (documentData) => {
  const encryptedData = { ...documentData };
  
  // List of fields to encrypt
  const fieldsToEncrypt = [
    'crimeDescription',
    'transactionDetails',
    'requestedData',
    'statute',
    'caseNumber'
  ];
  
  // Encrypt each field if it exists
  fieldsToEncrypt.forEach(field => {
    if (documentData[field]) {
      encryptedData[`encrypted_${field}`] = encryptText(
        typeof documentData[field] === 'string' 
          ? documentData[field] 
          : JSON.stringify(documentData[field])
      );
      // Remove original field
      delete encryptedData[field];
    }
  });
  
  // Mark as encrypted
  encryptedData.isEncrypted = true;
  encryptedData.encryptionVersion = '1.0';
  
  return encryptedData;
};

/**
 * Decrypts document data from database
 * @param {Object} encryptedData - The encrypted document data
 * @returns {Object} - Decrypted document data
 */
const decryptDocumentData = (encryptedData) => {
  if (!encryptedData.isEncrypted) {
    return encryptedData;
  }
  
  const decryptedData = { ...encryptedData };
  
  // List of encrypted fields
  const encryptedFields = [
    'encrypted_crimeDescription',
    'encrypted_transactionDetails',
    'encrypted_requestedData',
    'encrypted_statute',
    'encrypted_caseNumber'
  ];
  
  // Decrypt each field
  encryptedFields.forEach(field => {
    if (encryptedData[field]) {
      const originalField = field.replace('encrypted_', '');
      const decrypted = decryptText(encryptedData[field]);
      
      // Try to parse JSON if applicable
      if (originalField === 'transactionDetails' || originalField === 'requestedData') {
        try {
          decryptedData[originalField] = JSON.parse(decrypted);
        } catch {
          decryptedData[originalField] = decrypted;
        }
      } else {
        decryptedData[originalField] = decrypted;
      }
      
      // Remove encrypted field
      delete decryptedData[field];
    }
  });
  
  return decryptedData;
};

/**
 * Generates a secure encryption key
 * @returns {string} - Hex encoded encryption key
 */
const generateEncryptionKey = () => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

module.exports = {
  encryptFile,
  decryptFile,
  encryptText,
  decryptText,
  encryptDocumentData,
  decryptDocumentData,
  generateEncryptionKey,
  getEncryptionKey
};