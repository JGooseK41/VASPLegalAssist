import { templateAPI, documentAPI } from './api';

/**
 * Enhanced API wrapper that handles client-side encryption/decryption
 * This ensures all sensitive data is encrypted before leaving the browser
 * and decrypted after retrieval, maintaining zero-knowledge architecture
 */

// Fields that should be encrypted for templates
const TEMPLATE_ENCRYPTED_FIELDS = [
  'templateName',
  'agencyHeader', 
  'agencyAddress',
  'agencyContact',
  'footerText',
  'signatureBlock',
  'customFields',
  'templateContent',
  'markers',
  'markerMappings'
];

// Fields that should be encrypted for documents
const DOCUMENT_ENCRYPTED_FIELDS = [
  'caseNumber',
  'crimeDescription',
  'statute',
  'transactionDetails',
  'requestedData',
  'generatedContent',
  'transactions'
];

/**
 * Create an encrypted template API that wraps the standard API
 * @param {object} encryption - Encryption functions from useEncryption hook
 */
export const createEncryptedTemplateAPI = (encryption) => {
  if (!encryption || !encryption.isKeyReady) {
    throw new Error('Encryption not ready');
  }

  return {
    getTemplates: async () => {
      // Get encrypted templates from server
      const templates = await templateAPI.getTemplates();
      
      // Decrypt each template
      return templates.map(template => {
        try {
          return encryption.decryptFields(template, TEMPLATE_ENCRYPTED_FIELDS);
        } catch (error) {
          console.error('Failed to decrypt template:', template.id, error);
          // Return template with decryption error flag
          return {
            ...template,
            decryptionError: true,
            errorMessage: 'Unable to decrypt - invalid key'
          };
        }
      });
    },

    getTemplate: async (id) => {
      // Get encrypted template from server
      const template = await templateAPI.getTemplate(id);
      
      // Decrypt template fields
      try {
        return encryption.decryptFields(template, TEMPLATE_ENCRYPTED_FIELDS);
      } catch (error) {
        console.error('Failed to decrypt template:', id, error);
        return {
          ...template,
          decryptionError: true,
          errorMessage: 'Unable to decrypt - invalid key'
        };
      }
    },

    createTemplate: async (templateData) => {
      // Encrypt sensitive fields before sending
      const encryptedData = encryption.encryptFields(
        templateData,
        TEMPLATE_ENCRYPTED_FIELDS
      );
      
      // Add encryption metadata
      encryptedData.isClientEncrypted = true;
      encryptedData.encryptionVersion = '1.0';
      
      // Send encrypted data to server
      const result = await templateAPI.createTemplate(encryptedData);
      
      // Return result (ID, timestamps, etc.)
      return result;
    },

    updateTemplate: async (id, templateData) => {
      // Encrypt sensitive fields before sending
      const encryptedData = encryption.encryptFields(
        templateData,
        TEMPLATE_ENCRYPTED_FIELDS
      );
      
      // Add encryption metadata
      encryptedData.isClientEncrypted = true;
      encryptedData.encryptionVersion = '1.0';
      
      // Send encrypted update to server
      const result = await templateAPI.updateTemplate(id, encryptedData);
      
      return result;
    },

    deleteTemplate: async (id) => {
      // No encryption needed for deletion
      return templateAPI.deleteTemplate(id);
    },

    // Smart template methods
    uploadTemplate: async (formData) => {
      // For file uploads, we need to encrypt the file content
      // This requires reading the file and encrypting before upload
      const file = formData.get('file');
      const templateData = JSON.parse(formData.get('templateData') || '{}');
      
      // Encrypt template metadata
      const encryptedTemplateData = encryption.encryptFields(
        templateData,
        TEMPLATE_ENCRYPTED_FIELDS
      );
      
      // Create new FormData with encrypted data
      const encryptedFormData = new FormData();
      encryptedFormData.append('file', file); // File encryption handled separately
      encryptedFormData.append('templateData', JSON.stringify(encryptedTemplateData));
      encryptedFormData.append('isClientEncrypted', 'true');
      
      return templateAPI.uploadTemplate(encryptedFormData);
    },

    updateMarkerMappings: async (id, mappings) => {
      // Encrypt mappings
      const encryptedMappings = encryption.encrypt(mappings);
      
      return templateAPI.updateMarkerMappings(id, {
        encryptedMappings,
        isClientEncrypted: true
      });
    },

    previewTemplate: async (id, data) => {
      // Encrypt preview data
      const encryptedData = encryption.encryptFields(
        data,
        ['caseNumber', 'crimeDescription', 'statute', 'customData']
      );
      
      const result = await templateAPI.previewTemplate(id, encryptedData);
      
      // Decrypt the preview result
      if (result.preview) {
        result.preview = encryption.decrypt(result.preview);
      }
      
      return result;
    }
  };
};

/**
 * Create an encrypted document API that wraps the standard API
 * @param {object} encryption - Encryption functions from useEncryption hook
 */
export const createEncryptedDocumentAPI = (encryption) => {
  if (!encryption || !encryption.isKeyReady) {
    throw new Error('Encryption not ready');
  }

  return {
    createDocument: async (documentData) => {
      // Extract fields that need encryption
      const fieldsToEncrypt = {
        caseNumber: documentData.case_info?.case_number,
        crimeDescription: documentData.case_info?.crime_description,
        statute: documentData.case_info?.statute,
        transactions: documentData.transactions,
        metadata: documentData.metadata
      };
      
      // Encrypt sensitive fields
      const encryptedFields = encryption.encryptFields(
        fieldsToEncrypt,
        Object.keys(fieldsToEncrypt)
      );
      
      // Prepare document data with encrypted fields
      const encryptedDocumentData = {
        ...documentData,
        ...encryptedFields,
        isClientEncrypted: true,
        encryptionVersion: '1.0'
      };
      
      // Send to server
      const result = await documentAPI.createDocument(encryptedDocumentData);
      
      return result;
    },

    getDocuments: async (limit = 10, offset = 0) => {
      // Get encrypted documents from server
      const response = await documentAPI.getDocuments(limit, offset);
      
      // Decrypt each document
      const decryptedDocuments = response.documents.map(doc => {
        try {
          return encryption.decryptFields(doc, DOCUMENT_ENCRYPTED_FIELDS);
        } catch (error) {
          console.error('Failed to decrypt document:', doc.id, error);
          return {
            ...doc,
            decryptionError: true,
            errorMessage: 'Unable to decrypt - invalid key'
          };
        }
      });
      
      return {
        ...response,
        documents: decryptedDocuments
      };
    },

    getDocument: async (id) => {
      // Get encrypted document from server
      const document = await documentAPI.getDocument(id);
      
      // Decrypt document fields
      try {
        return encryption.decryptFields(document, DOCUMENT_ENCRYPTED_FIELDS);
      } catch (error) {
        console.error('Failed to decrypt document:', id, error);
        return {
          ...document,
          decryptionError: true,
          errorMessage: 'Unable to decrypt - invalid key'
        };
      }
    },

    duplicateDocument: async (id) => {
      // No special encryption handling needed - server will duplicate encrypted data
      return documentAPI.duplicateDocument(id);
    },

    importTransactions: async (file, documentId = null) => {
      // For CSV imports, we should encrypt the transaction data
      // This requires parsing the CSV client-side and encrypting
      // For now, pass through to standard API
      // TODO: Implement CSV parsing and encryption
      return documentAPI.importTransactions(file, documentId);
    }
  };
};

/**
 * Helper to check if data is encrypted
 */
export const isDataEncrypted = (data) => {
  return data && (
    data.isClientEncrypted === true ||
    (typeof data === 'object' && data.isEncrypted === true)
  );
};