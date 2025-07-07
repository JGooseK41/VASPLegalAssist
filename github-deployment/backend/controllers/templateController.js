const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getTemplates = async (req, res) => {
  try {
    // Get user's own templates and all global templates
    const templates = await prisma.documentTemplate.findMany({
      where: {
        OR: [
          { userId: req.userId },
          { isGlobal: true }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(templates);
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
        OR: [
          { userId: req.userId },
          { isGlobal: true }
        ]
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
};

const createTemplate = async (req, res) => {
  try {
    console.log('Create template request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.userId);
    
    const {
      templateType,
      templateName,
      agencyHeader,
      agencyAddress,
      agencyContact,
      footerText,
      signatureBlock,
      customFields,
      isClientEncrypted,
      encryptionVersion,
      document_type,
      name,
      header_info,
      footer_text,
      custom_fields,
      // Smart template fields
      templateContent,
      markers,
      markerMappings,
      fileUrl,
      fileType,
      fileSize,
      originalFilename,
      isGlobal
    } = req.body;

    // Handle both old format and new format
    const actualTemplateType = templateType || document_type;
    const actualTemplateName = templateName || name;
    const actualFooterText = footerText || footer_text;
    const actualCustomFields = customFields || custom_fields;
    
    // Check if user is admin for global templates
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });
    
    // For client-encrypted data, store the encrypted values as-is
    const templateData = {
      userId: req.userId,
      templateType: actualTemplateType,
      templateName: isClientEncrypted && typeof actualTemplateName === 'object' 
        ? JSON.stringify(actualTemplateName) 
        : (actualTemplateName || ''),
      isClientEncrypted: isClientEncrypted || false,
      encryptionVersion: encryptionVersion || null,
      isGlobal: user?.role === 'ADMIN' && isGlobal === true
    };
    
    if (isClientEncrypted) {
      // Store encrypted data as JSON strings
      templateData.agencyHeader = typeof agencyHeader === 'object' ? JSON.stringify(agencyHeader) : (agencyHeader || '');
      templateData.agencyAddress = typeof agencyAddress === 'object' ? JSON.stringify(agencyAddress) : (agencyAddress || '');
      templateData.agencyContact = typeof agencyContact === 'object' ? JSON.stringify(agencyContact) : (agencyContact || '');
      templateData.footerText = typeof actualFooterText === 'object' ? JSON.stringify(actualFooterText) : (actualFooterText || '');
      templateData.signatureBlock = typeof signatureBlock === 'object' ? JSON.stringify(signatureBlock) : (signatureBlock || '');
      templateData.customFields = actualCustomFields ? JSON.stringify(actualCustomFields) : null;
    } else {
      // Store unencrypted data (legacy support)
      templateData.agencyHeader = agencyHeader || header_info?.agency_name || '';
      templateData.agencyAddress = agencyAddress || header_info?.address || '';
      templateData.agencyContact = agencyContact || header_info?.email || '';
      templateData.footerText = actualFooterText || '';
      templateData.signatureBlock = signatureBlock || '';
      templateData.customFields = actualCustomFields ? JSON.stringify(actualCustomFields) : null;
    }
    
    // Add smart template fields if provided
    if (templateContent) {
      templateData.templateContent = isClientEncrypted && typeof templateContent === 'object' 
        ? JSON.stringify(templateContent)
        : templateContent;
    }
    if (markers) {
      templateData.markers = typeof markers === 'object' && !Array.isArray(markers)
        ? JSON.stringify(markers) 
        : (typeof markers === 'string' ? markers : JSON.stringify(markers));
    }
    if (markerMappings) {
      templateData.markerMappings = typeof markerMappings === 'object' && !Array.isArray(markerMappings)
        ? JSON.stringify(markerMappings)
        : (typeof markerMappings === 'string' ? markerMappings : JSON.stringify(markerMappings));
    }
    if (fileUrl) {
      templateData.fileUrl = fileUrl;
    }
    if (fileType) {
      templateData.fileType = fileType;
    }
    if (fileSize) {
      templateData.fileSize = fileSize;
    }
    if (originalFilename) {
      templateData.originalFilename = originalFilename;
    }

    const template = await prisma.documentTemplate.create({
      data: templateData
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // More detailed error for debugging
    let errorMessage = 'Failed to create template';
    if (error.code === 'P2002') {
      errorMessage = 'A template with this name already exists';
    } else if (error.code === 'P2003') {
      errorMessage = 'Invalid reference in template data';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
      isClientEncrypted,
      encryptionVersion,
      name,
      header_info,
      footer_text,
      custom_fields
    } = req.body;

    // Handle both old format and new format
    const actualTemplateName = templateName || name;
    const actualFooterText = footerText || footer_text;
    const actualCustomFields = customFields || custom_fields;
    
    const updateData = {
      templateName: actualTemplateName,
      isClientEncrypted: isClientEncrypted || false,
      encryptionVersion: encryptionVersion || null,
      updatedAt: new Date()
    };
    
    if (isClientEncrypted) {
      // Store encrypted data as-is
      updateData.agencyHeader = agencyHeader;
      updateData.agencyAddress = agencyAddress;
      updateData.agencyContact = agencyContact;
      updateData.footerText = actualFooterText;
      updateData.signatureBlock = signatureBlock;
      updateData.customFields = actualCustomFields ? JSON.stringify(actualCustomFields) : null;
    } else {
      // Store unencrypted data (legacy support)
      updateData.agencyHeader = agencyHeader || header_info?.agency_name;
      updateData.agencyAddress = agencyAddress || header_info?.address;
      updateData.agencyContact = agencyContact || header_info?.email;
      updateData.footerText = actualFooterText;
      updateData.signatureBlock = signatureBlock;
      updateData.customFields = actualCustomFields ? JSON.stringify(actualCustomFields) : null;
    }

    const template = await prisma.documentTemplate.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      data: updateData
    });

    if (template.count === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updatedTemplate = await prisma.documentTemplate.findUnique({
      where: { id: req.params.id }
    });

    res.json(updatedTemplate);
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

    // Remove default flag from all templates of this type
    await prisma.documentTemplate.updateMany({
      where: {
        userId: req.userId,
        templateType
      },
      data: { isDefault: false }
    });

    // Set the new default
    await prisma.documentTemplate.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId
      },
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
  setDefaultTemplate
};