import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import clientEncryption from '../services/clientEncryption';

/**
 * React hook for managing client-side encryption
 * Provides encryption/decryption functions with the current user's key
 */
export function useEncryption() {
  const { user } = useAuth();
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isKeyReady, setIsKeyReady] = useState(false);

  // Derive encryption key when user changes
  useEffect(() => {
    console.log('useEncryption - User object:', user);
    if (user && user.id && user.email) {
      try {
        console.log('Deriving encryption key for user:', user.id, user.email);
        const key = clientEncryption.deriveUserKey(user.id, user.email);
        setEncryptionKey(key);
        setIsKeyReady(true);
        console.log('Encryption key ready');
      } catch (error) {
        console.error('Failed to derive encryption key:', error);
        setIsKeyReady(false);
      }
    } else {
      console.log('User data incomplete:', { hasUser: !!user, hasId: !!(user?.id), hasEmail: !!(user?.email) });
      setEncryptionKey(null);
      setIsKeyReady(false);
    }
  }, [user]);

  /**
   * Encrypt data with the current user's key
   */
  const encrypt = useCallback((data) => {
    if (!isKeyReady || !encryptionKey) {
      throw new Error('Encryption key not ready');
    }
    return clientEncryption.encryptData(data, encryptionKey);
  }, [encryptionKey, isKeyReady]);

  /**
   * Decrypt data with the current user's key
   */
  const decrypt = useCallback((encryptedData) => {
    if (!isKeyReady || !encryptionKey) {
      throw new Error('Encryption key not ready');
    }
    return clientEncryption.decryptData(encryptedData, encryptionKey);
  }, [encryptionKey, isKeyReady]);

  /**
   * Encrypt specific fields in an object
   */
  const encryptFields = useCallback((obj, fields) => {
    if (!isKeyReady || !encryptionKey) {
      throw new Error('Encryption key not ready');
    }
    return clientEncryption.encryptFields(obj, fields, encryptionKey);
  }, [encryptionKey, isKeyReady]);

  /**
   * Decrypt specific fields in an object
   */
  const decryptFields = useCallback((obj, fields) => {
    if (!isKeyReady || !encryptionKey) {
      throw new Error('Encryption key not ready');
    }
    return clientEncryption.decryptFields(obj, fields, encryptionKey);
  }, [encryptionKey, isKeyReady]);

  /**
   * Check if data can be decrypted with current key
   */
  const canDecrypt = useCallback((encryptedData) => {
    if (!isKeyReady || !encryptionKey) {
      return false;
    }
    return clientEncryption.canDecrypt(encryptedData, encryptionKey);
  }, [encryptionKey, isKeyReady]);

  return {
    isKeyReady,
    encrypt,
    decrypt,
    encryptFields,
    decryptFields,
    canDecrypt,
    // Expose the service for advanced use cases
    clientEncryption
  };
}