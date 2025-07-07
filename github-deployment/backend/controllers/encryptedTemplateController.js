const { PrismaClient } = require('@prisma/client');
const encryptionService = require('../utils/encryption');

const prisma = new PrismaClient();

/**
 * Encrypts sensitive template fields for a user
 */
const encryptTemplateFields = (template, userId) => {
  const encrypted = { ...template };
  
  // Encrypt sensitive fields
  if (template.templateContent) {
    encrypted.encryptedContent = encryptionService.encryptForUser(template.templateContent, userId);
    delete encrypted.templateContent; // Remove plaintext
  }
  
  if (template.markers) {
    encrypted.encryptedMarkers = encryptionService.encryptForUser(template.markers, userId);
    delete encrypted.markers; // Remove plaintext
  }
  
  if (template.markerMappings) {
    encrypted.encryptedMappings = encryptionService.encryptForUser(template.markerMappings, userId);
    delete encrypted.markerMappings; // Remove plaintext
  }
  
  if (template.customFields) {
    encrypted.encryptedCustomFields = encryptionService.encryptForUser(template.customFields, userId);
    delete encrypted.customFields; // Remove plaintext
  }
  
  encrypted.isEncrypted = true;
  return encrypted;
};

/**
 * Decrypts sensitive template fields for a user
 */
const decryptTemplateFields = (template, userId) => {
  if (!template.isEncrypted) {
    return template;
  }
  
  const decrypted = { ...template };
  
  try {
    if (template.encryptedContent) {
      decrypted.templateContent = encryptionService.decryptForUser(template.encryptedContent, userId);
    }
    
    if (template.encryptedMarkers) {
      decrypted.markers = encryptionService.decryptForUser(template.encryptedMarkers, userId);
    }
    
    if (template.encryptedMappings) {
      decrypted.markerMappings = encryptionService.decryptForUser(template.encryptedMappings, userId);
    }
    
    if (template.encryptedCustomFields) {
      decrypted.customFields = encryptionService.decryptForUser(template.encryptedCustomFields, userId);
    }
    
    // Remove encrypted fields from response
    delete decrypted.encryptedContent;
    delete decrypted.encryptedMarkers;
    delete decrypted.encryptedMappings;
    delete decrypted.encryptedCustomFields;
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt template data');
  }
};

const getTemplates = async (req, res) => {
  try {
    const templates = await prisma.documentTemplate.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    // Decrypt templates for the user
    const decryptedTemplates = templates.map(template => 
      decryptTemplateFields(template, req.userId)
    );

    res.json(decryptedTemplates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
};

const getTemplate = async (req, res) => {
  try {
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Decrypt template for the user
    const decryptedTemplate = decryptTemplateFields(template, req.userId);
    res.json(decryptedTemplate);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
};

const createTemplate = async (req, res) => {
  try {
    const {
      templateType,
      templateName,
      agencyHeader,
      agencyAddress,
      agencyContact,
      footerText,
      signatureBlock,
      customFields,
      // Smart template fields
      templateContent,
      markers,
      markerMappings
    } = req.body;

    // Prepare data with encryption
    const templateData = {
      userId: req.userId,
      templateType,
      templateName,
      agencyHeader,
      agencyAddress,
      agencyContact,
      footerText,
      signatureBlock
    };

    // Encrypt sensitive fields
    if (customFields || templateContent || markers || markerMappings) {
      const encryptedData = encryptTemplateFields({
        customFields: customFields ? JSON.stringify(customFields) : null,
        templateContent,
        markers,
        markerMappings
      }, req.userId);
      
      Object.assign(templateData, encryptedData);
    }

    const template = await prisma.documentTemplate.create({
      data: templateData
    });

    // Return decrypted version
    const decryptedTemplate = decryptTemplateFields(template, req.userId);
    res.status(201).json(decryptedTemplate);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const {
      templateName,
      agencyHeader,
      agencyAddress,
      agencyContact,
      footerText,
      signatureBlock,
      customFields,
      // Smart template fields
      templateContent,
      markers,
      markerMappings
    } = req.body;

    // Get existing template to check ownership
    const existingTemplate = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Prepare update data
    const updateData = {
      templateName,
      agencyHeader,
      agencyAddress,
      agencyContact,
      footerText,
      signatureBlock,
      updatedAt: new Date()
    };

    // Encrypt sensitive fields if provided
    const fieldsToEncrypt = {};
    if (customFields !== undefined) {
      fieldsToEncrypt.customFields = JSON.stringify(customFields);
    }
    if (templateContent !== undefined) {
      fieldsToEncrypt.templateContent = templateContent;
    }
    if (markers !== undefined) {
      fieldsToEncrypt.markers = markers;
    }
    if (markerMappings !== undefined) {
      fieldsToEncrypt.markerMappings = markerMappings;
    }

    if (Object.keys(fieldsToEncrypt).length > 0) {
      const encryptedData = encryptTemplateFields(fieldsToEncrypt, req.userId);
      Object.assign(updateData, encryptedData);
    }

    await prisma.documentTemplate.update({
      where: { id: req.params.id },
      data: updateData
    });

    const updatedTemplate = await prisma.documentTemplate.findUnique({
      where: { id: req.params.id }
    });

    // Return decrypted version
    const decryptedTemplate = decryptTemplateFields(updatedTemplate, req.userId);
    res.json(decryptedTemplate);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const template = await prisma.documentTemplate.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId,
        isDefault: false // Prevent deletion of default templates
      }
    });

    if (template.count === 0) {
      return res.status(404).json({ error: 'Template not found or cannot be deleted' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

const setDefaultTemplate = async (req, res) => {
  try {
    const { templateType } = req.body;

    // Verify ownership
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Remove default flag from all templates of this type
    await prisma.documentTemplate.updateMany({
      where: {
        userId: req.userId,
        templateType
      },
      data: { isDefault: false }
    });

    // Set the new default
    await prisma.documentTemplate.update({
      where: { id: req.params.id },
      data: { isDefault: true }
    });

    res.json({ message: 'Default template updated' });
  } catch (error) {
    console.error('Set default template error:', error);
    res.status(500).json({ error: 'Failed to set default template' });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  encryptTemplateFields,
  decryptTemplateFields
};