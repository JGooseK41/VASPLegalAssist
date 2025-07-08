const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * User-specific key-based encryption service
 * Each user has their own encryption key derived from their user ID
 * This ensures that only the user can decrypt their own documents
 */

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 64;
const ITERATIONS = 100000;

/**
 * Derives a unique encryption key for a user
 * @param {string} userId - The user's ID
 * @param {string} salt - Optional salt for key derivation
 * @returns {Object} - Object containing key and salt
 */
const deriveUserKey = async (userId, salt = null) => {
  // Generate new salt if not provided
  if (!salt) {
    salt = crypto.randomBytes(SALT_LENGTH);
  } else if (typeof salt === 'string') {
    salt = Buffer.from(salt, 'hex');
  }
  
  // Combine userId with master secret for additional security
  const masterSecret = process.env.USER_KEY_MASTER_SECRET || 'default-master-secret-change-this';
  const keyMaterial = `${userId}:${masterSecret}`;
  
  // Derive key using PBKDF2
  const key = await new Promise((resolve, reject) => {
    crypto.pbkdf2(keyMaterial, salt, ITERATIONS, KEY_LENGTH, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  
  return {
    key,
    salt: salt.toString('hex')
  };
};

/**
 * Encrypts data using user-specific key
 * @param {Buffer|string} data - Data to encrypt
 * @param {string} userId - User ID for key derivation
 * @returns {Object} - Encrypted data with metadata
 */
const encryptForUser = async (data, userId) => {
  // Convert string to buffer if needed
  if (typeof data === 'string') {
    data = Buffer.from(data, 'utf8');
  }
  
  // Derive user key
  const { key, salt } = await deriveUserKey(userId);
  
  // Generate IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt data
  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);
  
  // Get auth tag
  const tag = cipher.getAuthTag();
  
  // Combine all components
  // Format: [salt(64)][iv(16)][tag(16)][encrypted data]
  const combined = Buffer.concat([
    Buffer.from(salt, 'hex'),
    iv,
    tag,
    encrypted
  ]);
  
  return {
    encrypted: combined.toString('base64'),
    metadata: {
      algorithm: ALGORITHM,
      saltLength: SALT_LENGTH,
      ivLength: IV_LENGTH,
      tagLength: TAG_LENGTH,
      userId: userId,
      encryptedAt: new Date().toISOString()
    }
  };
};

/**
 * Decrypts data using user-specific key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} userId - User ID for key derivation
 * @returns {Buffer} - Decrypted data
 */
const decryptForUser = async (encryptedData, userId) => {
  // Decode from base64
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  // Derive user key with the stored salt
  const { key } = await deriveUserKey(userId, salt);
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  // Decrypt data
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted;
};

/**
 * Encrypts a file for a specific user
 * @param {string} filePath - Path to file to encrypt
 * @param {string} userId - User ID
 * @param {string} outputPath - Optional output path
 * @returns {Object} - Encryption result with metadata
 */
const encryptFileForUser = async (filePath, userId, outputPath = null) => {
  try {
    // Read file
    const fileData = await fs.readFile(filePath);
    
    // Encrypt file data
    const { encrypted, metadata } = await encryptForUser(fileData, userId);
    
    // Create output path if not provided
    if (!outputPath) {
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath);
      outputPath = path.join(dir, `encrypted_${userId}_${basename}`);
    }
    
    // Save encrypted file
    await fs.writeFile(outputPath, encrypted, 'base64');
    
    return {
      success: true,
      originalPath: filePath,
      encryptedPath: outputPath,
      metadata,
      fileSize: fileData.length,
      encryptedSize: encrypted.length
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw error;
  }
};

/**
 * Decrypts a file for a specific user
 * @param {string} encryptedPath - Path to encrypted file
 * @param {string} userId - User ID
 * @param {string} outputPath - Optional output path
 * @returns {Buffer} - Decrypted file data
 */
const decryptFileForUser = async (encryptedPath, userId, outputPath = null) => {
  try {
    // Read encrypted file
    const encryptedData = await fs.readFile(encryptedPath, 'utf8');
    
    // Decrypt file data
    const decrypted = await decryptForUser(encryptedData, userId);
    
    // Save decrypted file if output path provided
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
 * Creates an encrypted document package for download
 * This includes the encrypted document and decryption instructions
 * @param {string} filePath - Path to document to encrypt
 * @param {string} userId - User ID
 * @param {Object} documentInfo - Document metadata
 * @returns {Object} - Package information
 */
const createEncryptedPackage = async (filePath, userId, documentInfo = {}) => {
  try {
    // Read document
    const documentData = await fs.readFile(filePath);
    
    // Encrypt document
    const { encrypted, metadata } = await encryptForUser(documentData, userId);
    
    // Create package metadata
    const packageData = {
      version: '1.0',
      encrypted: encrypted,
      metadata: {
        ...metadata,
        ...documentInfo,
        originalFilename: path.basename(filePath),
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        packageCreated: new Date().toISOString()
      },
      instructions: {
        description: 'This document is encrypted for your security. Only you can decrypt it.',
        steps: [
          '1. Save this .encrypted file to your computer',
          '2. Visit the VASP Records Assistant website',
          '3. Go to Documents > Decrypt Document',
          '4. Upload this file to decrypt it',
          '5. The decrypted document will download automatically'
        ]
      }
    };
    
    // Create package filename
    const packageFilename = `${path.basename(filePath, path.extname(filePath))}_encrypted_${Date.now()}.encrypted`;
    const packagePath = path.join(path.dirname(filePath), packageFilename);
    
    // Save package
    await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
    
    return {
      packagePath,
      packageFilename,
      packageSize: Buffer.byteLength(JSON.stringify(packageData))
    };
  } catch (error) {
    console.error('Package creation error:', error);
    throw error;
  }
};

/**
 * Decrypts an encrypted package
 * @param {string} packagePath - Path to encrypted package
 * @param {string} userId - User ID
 * @returns {Object} - Decrypted document info
 */
const decryptPackage = async (packagePath, userId) => {
  try {
    // Read package
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);
    
    // Verify package version
    if (packageData.version !== '1.0') {
      throw new Error('Unsupported package version');
    }
    
    // Verify user ID matches
    if (packageData.metadata.userId !== userId) {
      throw new Error('This document was not encrypted for your account');
    }
    
    // Decrypt document
    const decrypted = await decryptForUser(packageData.encrypted, userId);
    
    return {
      documentData: decrypted,
      metadata: packageData.metadata,
      filename: packageData.metadata.originalFilename
    };
  } catch (error) {
    console.error('Package decryption error:', error);
    throw error;
  }
};

/**
 * Generates a user's key fingerprint for verification
 * @param {string} userId - User ID
 * @returns {string} - Key fingerprint
 */
const getUserKeyFingerprint = async (userId) => {
  const { key } = await deriveUserKey(userId);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return hash.substring(0, 16); // Return first 16 chars for display
};

module.exports = {
  deriveUserKey,
  encryptForUser,
  decryptForUser,
  encryptFileForUser,
  decryptFileForUser,
  createEncryptedPackage,
  decryptPackage,
  getUserKeyFingerprint
};