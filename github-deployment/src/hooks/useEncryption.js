import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import clientEncryption from '../services/clientEncryption';
import { retryWithBackoff } from '../utils/retryableEncryption';

// Global key cache to persist across component remounts
const keyCache = new Map();

/**
 * React hook for managing client-side encryption
 * Provides encryption/decryption functions with the current user's key
 */
export function useEncryption() {
  const { user } = useAuth();
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isKeyReady, setIsKeyReady] = useState(false);
  const keyDerivationInProgress = useRef(false);

  // Derive encryption key when user changes
  useEffect(() => {
    if (user && user.id && user.email) {
      const cacheKey = `${user.id}_${user.email}`;
      
      // Check cache first
      if (keyCache.has(cacheKey)) {
        const cachedKey = keyCache.get(cacheKey);
        setEncryptionKey(cachedKey);
        setIsKeyReady(true);
        return;
      }

      // Prevent concurrent key derivations
      if (keyDerivationInProgress.current) {
        return;
      }

      keyDerivationInProgress.current = true;

      // Derive key asynchronously to avoid blocking UI
      const deriveKeyAsync = async () => {
        try {
          // Use setTimeout to move off the main thread
          await new Promise(resolve => setTimeout(resolve, 0));
          
          const key = clientEncryption.deriveUserKey(user.id, user.email);
          
          // Cache the derived key
          keyCache.set(cacheKey, key);
          
          // Clean up old cache entries if too many
          if (keyCache.size > 10) {
            const firstKey = keyCache.keys().next().value;
            keyCache.delete(firstKey);
          }
          
          setEncryptionKey(key);
          setIsKeyReady(true);
        } catch (error) {
          console.error('Failed to derive encryption key:', error);
          setIsKeyReady(false);
        } finally {
          keyDerivationInProgress.current = false;
        }
      };

      deriveKeyAsync();
    } else {
      setEncryptionKey(null);
      setIsKeyReady(false);
    }
  }, [user?.id, user?.email]); // Only re-run if user ID or email changes

  /**
   * Encrypt data with the current user's key
   * Memoized to prevent recreation unless key changes
   * Includes retry logic for transient failures
   */
  const encrypt = useCallback(async (data) => {
    if (!isKeyReady || !encryptionKey) {
      throw new Error('Encryption key not ready');
    }
    return retryWithBackoff(
      () => clientEncryption.encryptData(data, encryptionKey),
      2, // Fewer retries for encryption
      50  // Shorter delay
    );
  }, [encryptionKey, isKeyReady]);

  /**
   * Decrypt data with the current user's key
   * Memoized to prevent recreation unless key changes
   * Includes retry logic for transient failures
   */
  const decrypt = useCallback(async (encryptedData) => {
    if (!isKeyReady || !encryptionKey) {
      throw new Error('Encryption key not ready');
    }
    return retryWithBackoff(
      () => clientEncryption.decryptData(encryptedData, encryptionKey),
      3, // More retries for decryption
      100 // Standard delay
    );
  }, [encryptionKey, isKeyReady]);

  /**
   * Encrypt specific fields in an object
   * Memoized to prevent recreation unless key changes
   */
  const encryptFields = useCallback((obj, fields) => {
    if (!isKeyReady || !encryptionKey) {
      throw new Error('Encryption key not ready');
    }
    // Note: encryptFields is synchronous in current implementation
    // Return as-is to maintain backward compatibility
    return clientEncryption.encryptFields(obj, fields, encryptionKey);
  }, [encryptionKey, isKeyReady]);

  /**
   * Decrypt specific fields in an object
   * Memoized to prevent recreation unless key changes
   */
  const decryptFields = useCallback((obj, fields) => {
    if (!isKeyReady || !encryptionKey) {
      throw new Error('Encryption key not ready');
    }
    // Note: decryptFields is synchronous in current implementation
    // Return as-is to maintain backward compatibility
    return clientEncryption.decryptFields(obj, fields, encryptionKey);
  }, [encryptionKey, isKeyReady]);

  /**
   * Check if data can be decrypted with current key
   * Memoized to prevent recreation unless key changes
   */
  const canDecrypt = useCallback((encryptedData) => {
    if (!isKeyReady || !encryptionKey) {
      return false;
    }
    return clientEncryption.canDecrypt(encryptedData, encryptionKey);
  }, [encryptionKey, isKeyReady]);

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when isKeyReady changes or functions change
  return useMemo(() => ({
    isKeyReady,
    encrypt,
    decrypt,
    encryptFields,
    decryptFields,
    canDecrypt,
    // Expose the service for advanced use cases
    clientEncryption
  }), [isKeyReady, encrypt, decrypt, encryptFields, decryptFields, canDecrypt]);
}

// Export function to clear key cache (useful for testing or logout)
export function clearEncryptionKeyCache() {
  keyCache.clear();
}