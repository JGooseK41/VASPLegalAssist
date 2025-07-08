import { templateAPI, documentAPI } from './api';

/**
 * Optimized encrypted API wrapper with lazy decryption
 * Only decrypts data when actually accessed, improving performance
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
 * Create a proxy object that decrypts fields on access
 */
function createLazyDecryptProxy(obj, encryptedFields, decryptFunc) {
  const decryptedCache = {};
  
  return new Proxy(obj, {
    get(target, prop) {
      // If it's an encrypted field and we haven't decrypted it yet
      if (encryptedFields.includes(prop) && target[prop]?.isEncrypted && !decryptedCache[prop]) {
        try {
          decryptedCache[prop] = decryptFunc(target[prop]);
          return decryptedCache[prop];
        } catch (error) {
          // Failed to decrypt field
          return null;
        }
      }
      
      // Return cached decrypted value if available
      if (decryptedCache[prop] !== undefined) {
        return decryptedCache[prop];
      }
      
      // Return original value for non-encrypted fields
      return target[prop];
    }
  });
}

/**
 * Create an optimized encrypted template API
 */
export const createEncryptedTemplateAPI = (encryption) => {
  if (!encryption || !encryption.isKeyReady) {
    throw new Error('Encryption not ready');
  }

  return {
    getTemplates: async () => {
      // Get encrypted templates from server
      const templates = await templateAPI.getTemplates();
      
      // Return templates with lazy decryption proxies
      // Only decrypt templateName initially for list display
      return templates.map(template => {
        try {
          // Decrypt only the templateName for initial display
          const decryptedName = template.templateName?.isEncrypted 
            ? encryption.decrypt(template.templateName)
            : template.templateName;
          
          // Create a lazy proxy for other fields
          const lazyTemplate = createLazyDecryptProxy(
            template,
            TEMPLATE_ENCRYPTED_FIELDS,
            encryption.decrypt
          );
          
          // Override templateName with pre-decrypted value
          return {
            ...lazyTemplate,
            templateName: decryptedName,
            _isLazyDecrypted: true
          };
        } catch (error) {
          // Failed to decrypt template
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
      
      // Decrypt all fields since we're viewing the full template
      try {
        return encryption.decryptFields(template, TEMPLATE_ENCRYPTED_FIELDS);
      } catch (error) {
        // Failed to decrypt template
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
      
      // Send encrypted data to server
      const result = await templateAPI.updateTemplate(id, encryptedData);
      
      return result;
    },

    deleteTemplate: async (id) => {
      return templateAPI.deleteTemplate(id);
    },

    setDefaultTemplate: async (id, templateType) => {
      return templateAPI.setDefaultTemplate(id, templateType);
    },

    uploadTemplate: async (formData) => {
      // For file uploads with form data
      // Encrypt the text fields in formData
      const encryptedFormData = new FormData();
      
      // Copy file
      if (formData.get('template')) {
        encryptedFormData.append('template', formData.get('template'));
      }
      
      // Encrypt text fields
      const fieldsToEncrypt = [
        'templateName', 'agencyHeader', 'agencyAddress',
        'agencyContact', 'footerText', 'signatureBlock'
      ];
      
      fieldsToEncrypt.forEach(field => {
        const value = formData.get(field);
        if (value) {
          const encrypted = encryption.encrypt(value);
          encryptedFormData.append(field, JSON.stringify(encrypted));
        }
      });
      
      // Copy other fields
      ['templateType', 'isGlobal'].forEach(field => {
        const value = formData.get(field);
        if (value !== null) {
          encryptedFormData.append(field, value);
        }
      });
      
      // Add encryption flags
      encryptedFormData.append('isClientEncrypted', 'true');
      encryptedFormData.append('encryptionVersion', '1.0');
      
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
      // No need to encrypt preview data
      return templateAPI.previewTemplate(id, data);
    },

    getAvailableMarkers: async () => {
      return templateAPI.getAvailableMarkers();
    }
  };
};

/**
 * Create an optimized encrypted document API
 */
export const createEncryptedDocumentAPI = (encryption) => {
  if (!encryption || !encryption.isKeyReady) {
    throw new Error('Encryption not ready');
  }

  return {
    createDocument: async (documentData) => {
      // Encrypt sensitive fields
      const dataToEncrypt = {
        ...documentData,
        case_info: documentData.case_info || {},
        transactions: documentData.transactions || []
      };
      
      const encryptedData = encryption.encryptFields(
        dataToEncrypt,
        ['case_info', 'transactions', 'custom_data']
      );
      
      // Add encryption metadata
      encryptedData.isClientEncrypted = true;
      encryptedData.encryptionVersion = '1.0';
      
      // Send to server
      const result = await documentAPI.createDocument(encryptedData);
      
      return result;
    },

    getDocuments: async (limit = 10, offset = 0) => {
      // Get encrypted documents
      const response = await documentAPI.getDocuments(limit, offset);
      
      // Return documents with lazy decryption for list view
      const documents = response.documents || response;
      
      const decryptedDocs = documents.map(doc => {
        try {
          // Only decrypt essential fields for list display
          const decryptedCase = doc.caseNumber?.isEncrypted
            ? encryption.decrypt(doc.caseNumber)
            : doc.caseNumber;
            
          // Create lazy proxy for other fields
          const lazyDoc = createLazyDecryptProxy(
            doc,
            DOCUMENT_ENCRYPTED_FIELDS,
            encryption.decrypt
          );
          
          return {
            ...lazyDoc,
            caseNumber: decryptedCase,
            _isLazyDecrypted: true
          };
        } catch (error) {
          // Failed to decrypt document
          return {
            ...doc,
            decryptionError: true,
            errorMessage: 'Unable to decrypt'
          };
        }
      });
      
      // Preserve pagination info if present
      if (response.documents) {
        return {
          ...response,
          documents: decryptedDocs
        };
      }
      
      return decryptedDocs;
    },

    getDocument: async (id) => {
      // Get encrypted document
      const doc = await documentAPI.getDocument(id);
      
      // Decrypt all fields for full view
      try {
        return encryption.decryptFields(doc, DOCUMENT_ENCRYPTED_FIELDS);
      } catch (error) {
        // Failed to decrypt document
        return {
          ...doc,
          decryptionError: true,
          errorMessage: 'Unable to decrypt'
        };
      }
    },

    duplicateDocument: async (id) => {
      return documentAPI.duplicateDocument(id);
    },

    importTransactions: async (file, documentId) => {
      return documentAPI.importTransactions(file, documentId);
    }
  };
};