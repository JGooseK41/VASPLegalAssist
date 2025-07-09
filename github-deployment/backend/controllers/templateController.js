const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getTemplates = async (req, res) => {
  try {
    // Check if user is a demo user
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true }
    });
    
    const isDemo = user?.email?.includes('demo@');
    
    // Build where clause based on user type
    const whereClause = {
      OR: [
        { userId: req.userId },
        { isGlobal: true }
      ]
    };
    
    // Only include user-shared templates for non-demo users
    if (!isDemo) {
      whereClause.OR.push({ isUserShared: true });
    }
    
    const templates = await prisma.documentTemplate.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            agencyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Filter by domain restrictions if applicable
    const userDomain = user?.email?.split('@')[1]?.toLowerCase();
    const filteredTemplates = templates.filter(template => {
      // Always include user's own templates and global templates
      if (template.userId === req.userId || template.isGlobal) {
        return true;
      }
      
      // Check domain restrictions for shared templates
      if (template.isUserShared && template.allowedDomains && template.allowedDomains.length > 0) {
        return template.allowedDomains.includes(userDomain);
      }
      
      return true;
    });

    res.json(filteredTemplates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
};

const getTemplate = async (req, res) => {
  try {
    // Check if user is a demo user
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true }
    });
    
    const isDemo = user?.email?.includes('demo@');
    const userDomain = user?.email?.split('@')[1]?.toLowerCase();
    
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.userId },
          { isGlobal: true },
          // Only allow non-demo users to access shared templates
          ...(!isDemo ? [{ isUserShared: true }] : [])
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            agencyName: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Check domain restrictions
    if (template.isUserShared && template.userId !== req.userId && 
        template.allowedDomains && template.allowedDomains.length > 0) {
      if (!template.allowedDomains.includes(userDomain)) {
        return res.status(403).json({ error: 'Access denied - domain restriction' });
      }
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
      isGlobal,
      isUserShared
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
    
    // Handle user sharing
    if (isUserShared === true && !isClientEncrypted) {
      templateData.isUserShared = true;
      // Award 5 points to user for sharing
      await prisma.user.update({
        where: { id: req.userId },
        data: { points: { increment: 5 } }
      });
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
      custom_fields,
      isUserShared,
      sharedTitle,
      sharedDescription,
      allowedDomains
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
    
    // Handle sharing updates - owner can update or revoke sharing
    if (isUserShared !== undefined) {
      updateData.isUserShared = isUserShared;
      if (isUserShared) {
        updateData.sharedTitle = sharedTitle || null;
        updateData.sharedDescription = sharedDescription || null;
        updateData.allowedDomains = allowedDomains || [];
      } else {
        // If revoking sharing, clear sharing fields
        updateData.sharedTitle = null;
        updateData.sharedDescription = null;
        updateData.allowedDomains = [];
      }
    }
    
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

const trackTemplateUsage = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Verify template exists and is shared
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        isUserShared: true,
        userId: true
      }
    });
    
    if (!template || !template.isUserShared) {
      return res.status(404).json({ error: 'Shared template not found' });
    }
    
    // Don't track if user is using their own template
    if (template.userId === req.userId) {
      return res.json({ message: 'Usage not tracked for template owner' });
    }
    
    // Create usage record
    await prisma.templateUsage.create({
      data: {
        templateId: templateId,
        userId: req.userId
      }
    });
    
    // Award 1 point to template creator
    await prisma.user.update({
      where: { id: template.userId },
      data: { points: { increment: 1 } }
    });
    
    // Update template share points
    await prisma.documentTemplate.update({
      where: { id: templateId },
      data: { sharePoints: { increment: 1 } }
    });
    
    res.json({ message: 'Template usage tracked successfully' });
  } catch (error) {
    console.error('Track template usage error:', error);
    res.status(500).json({ error: 'Failed to track template usage' });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  trackTemplateUsage
};