const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getTemplates = async (req, res) => {
  try {
    const templates = await prisma.documentTemplate.findMany({
      where: { userId: req.userId },
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
        userId: req.userId
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
    const {
      templateType,
      templateName,
      agencyHeader,
      agencyAddress,
      agencyContact,
      footerText,
      signatureBlock,
      customFields
    } = req.body;

    const template = await prisma.documentTemplate.create({
      data: {
        userId: req.userId,
        templateType,
        templateName,
        agencyHeader,
        agencyAddress,
        agencyContact,
        footerText,
        signatureBlock,
        customFields: customFields ? JSON.stringify(customFields) : null
      }
    });

    res.status(201).json(template);
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
      customFields
    } = req.body;

    const template = await prisma.documentTemplate.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      data: {
        templateName,
        agencyHeader,
        agencyAddress,
        agencyContact,
        footerText,
        signatureBlock,
        customFields: customFields ? JSON.stringify(customFields) : null,
        updatedAt: new Date()
      }
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