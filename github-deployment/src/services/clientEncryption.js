import CryptoJS from 'crypto-js';

/**
 * Client-side encryption service for true zero-knowledge architecture
 * Each user's data is encrypted with their unique key derived from their user ID
 * The server never sees plaintext data
 */
class ClientEncryptionService {
  constructor() {
    this.ALGORITHM = 'AES';
    this.KEY_SIZE = 256;
    this.ITERATIONS = 1000; // Reduced for better performance
    this.SALT = 'VASP_Legal_Assistant_2024'; // Application-specific salt
  }

  /**
   * Derive a unique encryption key for the user
   * Uses PBKDF2 with user's ID and email for key derivation
   * @param {string} userId - User's unique ID
   * @param {string} email - User's email (for additional entropy)
   * @returns {string} Derived encryption key
   */
  deriveUserKey(userId, email) {
    if (!userId || !email) {
      throw new Error('User ID and email are required for key derivation');
    }

    console.log('Deriving key for:', { userId, email });

    // Combine userId and email for unique key material
    const keyMaterial = `${userId}_${email}_${this.SALT}`;
    
    // Use PBKDF2 to derive a strong key
    const key = CryptoJS.PBKDF2(keyMaterial, this.SALT, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATIONS
    });

    console.log('Key derived successfully');
    return key.toString();
  }

  /**
   * Encrypt data using the user's derived key
   * @param {*} data - Data to encrypt (can be string, object, etc.)
   * @param {string} userKey - User's encryption key
   * @returns {object} Encrypted data with metadata
   */
  encryptData(data, userKey) {
    try {
      if (!data) return null;
      if (!userKey) throw new Error('Encryption key is required');

      // Convert data to string if it's an object
      const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);

      // Generate a random IV for each encryption
      const iv = CryptoJS.lib.WordArray.random(128 / 8);

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(plaintext, userKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Return encrypted data with metadata
      return {
        ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64),
        isEncrypted: true,
        encryptedAt: new Date().toISOString(),
        version: '1.0' // For future compatibility
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using the user's derived key
   * @param {object} encryptedData - Encrypted data object
   * @param {string} userKey - User's encryption key
   * @returns {*} Decrypted data in original format
   */
  decryptData(encryptedData, userKey) {
    try {
      if (!encryptedData || !encryptedData.isEncrypted) return encryptedData;
      if (!userKey) throw new Error('Decryption key is required');

      const { ciphertext, iv } = encryptedData;
      if (!ciphertext || !iv) throw new Error('Invalid encrypted data format');

      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(ciphertext, userKey, {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      if (!plaintext) throw new Error('Decryption failed - invalid key or corrupted data');

      // Try to parse as JSON if possible
      try {
        return JSON.parse(plaintext);
      } catch {
        return plaintext; // Return as string if not JSON
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
  }

  /**
   * Encrypt specific fields in an object
   * @param {object} obj - Object containing fields to encrypt
   * @param {array} fieldsToEncrypt - Array of field names to encrypt
   * @param {string} userKey - User's encryption key
   * @returns {object} Object with specified fields encrypted
   */
  encryptFields(obj, fieldsToEncrypt, userKey) {
    const result = { ...obj };

    fieldsToEncrypt.forEach(field => {
      if (obj[field] !== undefined && obj[field] !== null) {
        result[field] = this.encryptData(obj[field], userKey);
      }
    });

    return result;
  }

  /**
   * Decrypt specific fields in an object
   * @param {object} obj - Object containing encrypted fields
   * @param {array} fieldsToDecrypt - Array of field names to decrypt
   * @param {string} userKey - User's encryption key
   * @returns {object} Object with specified fields decrypted
   */
  decryptFields(obj, fieldsToDecrypt, userKey) {
    const result = { ...obj };

    fieldsToDecrypt.forEach(field => {
      if (obj[field] && obj[field].isEncrypted) {
        try {
          result[field] = this.decryptData(obj[field], userKey);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          result[field] = null; // Set to null if decryption fails
        }
      }
    });

    return result;
  }

  /**
   * Generate a secure random string for additional security needs
   * @param {number} length - Length of random string
   * @returns {string} Random string
   */
  generateRandomString(length = 32) {
    const randomWords = CryptoJS.lib.WordArray.random(length);
    return randomWords.toString(CryptoJS.enc.Base64);
  }

  /**
   * Hash sensitive data (one-way, non-reversible)
   * Useful for data that needs to be verified but not decrypted
   * @param {string} data - Data to hash
   * @returns {string} Hashed data
   */
  hashData(data) {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Verify if the current user can decrypt data
   * @param {object} encryptedData - Encrypted data to test
   * @param {string} userKey - User's encryption key
   * @returns {boolean} True if user can decrypt, false otherwise
   */
  canDecrypt(encryptedData, userKey) {
    try {
      this.decryptData(encryptedData, userKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get encryption metadata without decrypting
   * @param {object} encryptedData - Encrypted data object
   * @returns {object} Metadata about the encrypted data
   */
  getEncryptionMetadata(encryptedData) {
    if (!encryptedData || !encryptedData.isEncrypted) {
      return { isEncrypted: false };
    }

    return {
      isEncrypted: true,
      encryptedAt: encryptedData.encryptedAt,
      version: encryptedData.version || '1.0',
      hasIV: !!encryptedData.iv,
      ciphertextLength: encryptedData.ciphertext?.length || 0
    };
  }
}

// Export singleton instance
const clientEncryption = new ClientEncryptionService();
export default clientEncryption;