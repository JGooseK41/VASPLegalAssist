const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const templateParser = require('../services/templateParser');
const wordGenerator = require('../services/wordGenerator');

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/templates');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `template-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.docx', '.html', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Also allow by MIME type
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/html',
    'text/plain'
  ];
  
  console.log('Upload file check:', file.originalname, 'ext:', ext, 'mimetype:', file.mimetype);
  
  if (allowedTypes.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only DOCX, HTML, and TXT files are allowed. (Got: ${ext}, MIME: ${file.mimetype})`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('template');

// Upload and process template
const uploadTemplate = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const {
        templateName,
        templateType,
        agencyHeader,
        agencyAddress,
        agencyContact,
        footerText,
        signatureBlock
      } = req.body;

      const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();
      
      // Extract content from uploaded file
      const content = await templateParser.extractContent(req.file.path, fileType);
      
      // Find smart markers in the content
      const markers = templateParser.findMarkers(content);
      
      // Validate template
      const validation = templateParser.validateTemplate(content, markers);
      
      // Create template record
      const template = await prisma.documentTemplate.create({
        data: {
          userId: req.userId,
          templateName: templateName || req.file.originalname,
          templateType: templateType || 'letterhead',
          agencyHeader: agencyHeader || '',
          agencyAddress: agencyAddress || '',
          agencyContact: agencyContact || '',
          footerText: footerText || '',
          signatureBlock: signatureBlock || '',
          fileUrl: `/uploads/templates/${req.file.filename}`,
          fileType,
          fileSize: req.file.size,
          originalFilename: req.file.originalname,
          templateContent: content,
          markers: JSON.stringify(markers),
          markerMappings: JSON.stringify({})
        }
      });

      res.status(201).json({
        template,
        markers,
        validation
      });
    } catch (error) {
      console.error('Upload template error:', error);
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {});
      res.status(500).json({ error: 'Failed to process template' });
    }
  });
};

// Update marker mappings
const updateMarkerMappings = async (req, res) => {
  try {
    const { mappings } = req.body;
    
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await prisma.documentTemplate.update({
      where: { id: req.params.id },
      data: {
        markerMappings: JSON.stringify(mappings)
      }
    });

    res.json({ message: 'Marker mappings updated successfully' });
  } catch (error) {
    console.error('Update marker mappings error:', error);
    res.status(500).json({ error: 'Failed to update marker mappings' });
  }
};

// Preview template with sample data
const previewTemplate = async (req, res) => {
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

    if (!template.templateContent) {
      return res.status(400).json({ error: 'Template has no content' });
    }

    // Sample data for preview
    const sampleData = {
      vaspName: 'Sample Exchange',
      vaspLegalName: 'Sample Exchange Ltd.',
      vaspEmail: 'compliance@sampleexchange.com',
      vaspAddress: '123 Crypto Street, Digital City, DC 12345',
      vaspJurisdiction: 'United States',
      vaspPhone: '+1 (555) 123-4567',
      caseNumber: 'CASE-2024-001',
      statute: '18 U.S.C. § 1956',
      crimeDescription: 'This is a sample crime description for preview purposes.',
      agencyName: req.body.agencyName || 'U.S. Department of Justice',
      agencyAddress: req.body.agencyAddress || '950 Pennsylvania Avenue NW, Washington, DC 20530',
      agencyPhone: req.body.agencyPhone || '(202) 514-2000',
      agencyEmail: req.body.agencyEmail || 'contact@justice.gov',
      investigatorName: req.body.investigatorName || 'John Doe',
      investigatorTitle: req.body.investigatorTitle || 'Special Agent',
      investigatorBadge: req.body.investigatorBadge || 'SA-12345',
      transactions: [
        {
          transaction_id: 'TX001',
          date: '2024-01-15',
          from_address: '1A2B3C4D5E6F...',
          to_address: '7G8H9I0J1K2L...',
          amount: '0.5',
          currency: 'BTC'
        },
        {
          transaction_id: 'TX002',
          date: '2024-01-16',
          from_address: '3M4N5O6P7Q8R...',
          to_address: '9S0T1U2V3W4X...',
          amount: '1.2',
          currency: 'ETH'
        }
      ],
      requestedInfo: ['kyc_info', 'transaction_history', 'ip_addresses'],
      customField1: req.body.customField1 || '',
      customField2: req.body.customField2 || '',
      customField3: req.body.customField3 || ''
    };

    const markerMappings = template.markerMappings ? JSON.parse(template.markerMappings) : {};
    
    // Process template with sample data
    const processedContent = await templateParser.processTemplate(
      template.templateContent,
      sampleData,
      markerMappings
    );

    res.json({
      preview: processedContent,
      sampleData,
      markers: template.markers ? JSON.parse(template.markers) : []
    });
  } catch (error) {
    console.error('Preview template error:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
};

// Process template with actual data for document generation
const processTemplateForDocument = async (templateId, userId, documentData, outputFormat = 'pdf') => {
  try {
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: templateId,
        userId
      }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // If Word output is requested and template is a Word file, use Word generator
    if (outputFormat === 'docx' && template.fileType === 'docx' && template.fileUrl) {
      const result = await wordGenerator.generateFromSmartTemplate(templateId, userId, documentData);
      return {
        ...result,
        fileType: 'docx',
        templateName: template.templateName
      };
    }

    // Otherwise, process for PDF generation
    if (!template.templateContent) {
      throw new Error('Template has no content for PDF generation');
    }

    const markerMappings = template.markerMappings ? JSON.parse(template.markerMappings) : {};
    
    // Process template with actual data
    const processedContent = await templateParser.processTemplate(
      template.templateContent,
      documentData,
      markerMappings
    );

    return {
      content: processedContent,
      fileType: template.fileType,
      templateName: template.templateName
    };
  } catch (error) {
    console.error('Process template error:', error);
    throw error;
  }
};

// Get available markers
const getAvailableMarkers = async (req, res) => {
  try {
    const markers = Object.entries(require('../services/templateParser').SMART_MARKERS || {}).map(([marker, field]) => ({
      marker,
      field,
      description: getMarkerDescription(marker)
    }));

    res.json(markers);
  } catch (error) {
    console.error('Get markers error:', error);
    res.status(500).json({ error: 'Failed to get available markers' });
  }
};

// Helper to get marker descriptions
const getMarkerDescription = (marker) => {
  const descriptions = {
    '{{VASP_NAME}}': 'Virtual Asset Service Provider name',
    '{{VASP_LEGAL_NAME}}': 'VASP legal/registered name',
    '{{VASP_EMAIL}}': 'VASP compliance email address',
    '{{VASP_ADDRESS}}': 'VASP physical address',
    '{{VASP_JURISDICTION}}': 'VASP jurisdiction/country',
    '{{VASP_PHONE}}': 'VASP phone number',
    '{{CASE_NUMBER}}': 'Case or investigation number',
    '{{CASE_STATUTE}}': 'Legal statute reference',
    '{{CRIME_DESCRIPTION}}': 'Description of alleged crime',
    '{{DATE_TODAY}}': "Today's date",
    '{{DATE_DEADLINE}}': 'Response deadline date',
    '{{AGENCY_NAME}}': 'Your agency name',
    '{{AGENCY_ADDRESS}}': 'Your agency address',
    '{{AGENCY_PHONE}}': 'Your agency phone',
    '{{AGENCY_EMAIL}}': 'Your agency email',
    '{{INVESTIGATOR_NAME}}': 'Investigator full name',
    '{{INVESTIGATOR_TITLE}}': 'Investigator job title',
    '{{INVESTIGATOR_BADGE}}': 'Investigator badge number',
    '{{TRANSACTION_LIST}}': 'List of transactions',
    '{{TRANSACTION_COUNT}}': 'Number of transactions',
    '{{TRANSACTION_TABLE}}': 'Formatted transaction table',
    '{{REQUESTED_INFO_LIST}}': 'List of requested information',
    '{{REQUESTED_INFO_CHECKBOXES}}': 'Checkboxes for requested info',
    '{{CUSTOM_FIELD_1}}': 'Custom field 1',
    '{{CUSTOM_FIELD_2}}': 'Custom field 2',
    '{{CUSTOM_FIELD_3}}': 'Custom field 3'
  };
  
  return descriptions[marker] || 'Custom marker';
};

module.exports = {
  uploadTemplate,
  updateMarkerMappings,
  previewTemplate,
  processTemplateForDocument,
  getAvailableMarkers
};