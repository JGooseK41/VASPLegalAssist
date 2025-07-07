const crypto = require('crypto');

// Encryption configuration
const algorithm = 'aes-256-gcm';
const saltLength = 64; // 32 bytes
const tagLength = 16;
const pbkdf2Iterations = 100000;
const pbkdf2KeyLength = 32;

class EncryptionService {
  constructor() {
    // Use environment variable or generate a secure master key
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || this.generateMasterKey();
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      console.warn('WARNING: Using generated master key. Set ENCRYPTION_MASTER_KEY in production!');
    }
  }

  generateMasterKey() {
    // In production, this should be stored securely and loaded from environment
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Derives a user-specific encryption key from the master key and user ID
   * @param {string} userId - The user's ID
   * @returns {Buffer} - The derived key
   */
  deriveUserKey(userId) {
    const salt = crypto.createHash('sha256').update(userId).digest();
    return crypto.pbkdf2Sync(this.masterKey, salt, pbkdf2Iterations, pbkdf2KeyLength, 'sha256');
  }

  /**
   * Encrypts data for a specific user
   * @param {string} plaintext - The data to encrypt
   * @param {string} userId - The user's ID
   * @returns {string} - Base64 encoded encrypted data with salt, iv, tag
   */
  encryptForUser(plaintext, userId) {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(saltLength);
      const iv = crypto.randomBytes(16);
      
      // Derive user-specific key
      const userKey = this.deriveUserKey(userId);
      
      // Create cipher
      const cipher = crypto.createCipheriv(algorithm, userKey, iv);
      
      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine salt, iv, tag, and encrypted data
      const combined = Buffer.concat([salt, iv, tag, encrypted]);
      
      // Return base64 encoded
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts data for a specific user
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} userId - The user's ID
   * @returns {string} - The decrypted plaintext
   */
  decryptForUser(encryptedData, userId) {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = combined.slice(0, saltLength);
      const iv = combined.slice(saltLength, saltLength + 16);
      const tag = combined.slice(saltLength + 16, saltLength + 16 + tagLength);
      const encrypted = combined.slice(saltLength + 16 + tagLength);
      
      // Derive user-specific key
      const userKey = this.deriveUserKey(userId);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(algorithm, userKey, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt the data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypts a JSON object for a user
   * @param {object} obj - The object to encrypt
   * @param {string} userId - The user's ID
   * @returns {string} - Base64 encoded encrypted data
   */
  encryptObjectForUser(obj, userId) {
    const jsonString = JSON.stringify(obj);
    return this.encryptForUser(jsonString, userId);
  }

  /**
   * Decrypts a JSON object for a user
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} userId - The user's ID
   * @returns {object} - The decrypted object
   */
  decryptObjectForUser(encryptedData, userId) {
    const jsonString = this.decryptForUser(encryptedData, userId);
    return JSON.parse(jsonString);
  }

  /**
   * Generates a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} - Hex encoded token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hashes sensitive data (one-way)
   * @param {string} data - Data to hash
   * @returns {string} - Hex encoded hash
   */
  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;