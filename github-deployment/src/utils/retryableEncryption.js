/**
 * Utility for retryable encryption operations
 * Helps handle transient failures and improves reliability
 */

/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - The async operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of the operation
 */
export async function retryWithBackoff(operation, maxRetries = 3, baseDelay = 100) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's a permanent error
      if (error.message?.includes('invalid key') || 
          error.message?.includes('corrupted data')) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * delay * 0.1;
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }
  
  throw lastError;
}

/**
 * Create a retryable version of encryption functions
 * @param {object} encryption - The encryption object from useEncryption
 * @returns {object} Wrapped encryption functions with retry logic
 */
export function createRetryableEncryption(encryption) {
  return {
    ...encryption,
    
    encrypt: async (data) => {
      return retryWithBackoff(() => encryption.encrypt(data));
    },
    
    decrypt: async (encryptedData) => {
      return retryWithBackoff(() => encryption.decrypt(encryptedData));
    },
    
    encryptFields: async (obj, fields) => {
      return retryWithBackoff(() => encryption.encryptFields(obj, fields));
    },
    
    decryptFields: async (obj, fields) => {
      return retryWithBackoff(() => encryption.decryptFields(obj, fields));
    },
    
    // canDecrypt doesn't need retry as it's a test operation
    canDecrypt: encryption.canDecrypt
  };
}

/**
 * Batch encryption with progress callback
 * Useful for encrypting multiple items with progress updates
 * @param {Array} items - Array of items to encrypt
 * @param {Function} encryptFunc - Function to encrypt a single item
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Array>} Array of encrypted items
 */
export async function batchEncryptWithProgress(items, encryptFunc, onProgress) {
  const results = [];
  const total = items.length;
  
  for (let i = 0; i < total; i++) {
    try {
      const encrypted = await retryWithBackoff(() => encryptFunc(items[i]));
      results.push(encrypted);
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percentage: ((i + 1) / total) * 100
        });
      }
    } catch (error) {
      console.error(`Failed to encrypt item ${i}:`, error);
      results.push({
        error: true,
        originalIndex: i,
        message: error.message
      });
    }
  }
  
  return results;
}

/**
 * Encrypt with timeout to prevent hanging operations
 * @param {Function} encryptFunc - The encryption function
 * @param {any} data - Data to encrypt
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Encrypted data
 */
export async function encryptWithTimeout(encryptFunc, data, timeout = 5000) {
  return Promise.race([
    encryptFunc(data),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Encryption timeout')), timeout)
    )
  ]);
}