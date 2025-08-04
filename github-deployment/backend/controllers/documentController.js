const { PrismaClient } = require('@prisma/client');
const pdfGenerator = require('../services/pdfGenerator');
const wordGenerator = require('../services/wordGenerator');
const csvParser = require('../services/csvParser');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const createDocument = async (req, res) => {
  try {
    const {
      vaspId,
      vaspName,
      vaspJurisdiction,
      vaspEmail,
      vaspAddress,
      templateId,
      documentType,
      caseNumber,
      crimeDescription,
      statute,
      transactions,
      requestedInfo,
      outputFormat = 'pdf', // Default to PDF for backward compatibility
      isClientEncrypted,
      encryptionVersion,
      // Support for client-encrypted fields
      metadata
    } = req.body;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Get template
    const template = templateId 
      ? await prisma.documentTemplate.findFirst({
          where: { id: templateId, userId: req.userId }
        })
      : await prisma.documentTemplate.findFirst({
          where: { userId: req.userId, templateType: documentType, isDefault: true }
        });

    if (!template) {
      return res.status(400).json({ error: 'No template found' });
    }

    // Prepare document data
    const documentData = {
      caseNumber,
      vaspName,
      vaspEmail,
      vaspAddress,
      vaspJurisdiction,
      investigatorName: `${user.firstName} ${user.lastName}`,
      agencyName: user.agencyName,
      badgeNumber: user.badgeNumber,
      statute,
      crimeDescription,
      transactions: transactions || [],
      requestedInfo: requestedInfo || [],
      // Add new fields for enhanced placeholder support
      agentName: `${user.firstName} ${user.lastName}`,
      agentTitle: user.title || '',
      agentPhone: user.phone || '',
      agentEmail: user.email || '',
      agentBadge: user.badgeNumber || '',
      agencyAddress: template.agencyAddress || '',
      agencyContact: template.agencyContact || '',
      signatureBlock: template.signatureBlock || '',
      // Support for new case fields
      crimeUnderInvestigation: req.body.crimeUnderInvestigation || crimeDescription,
      factsOfTheCase: req.body.factsOfTheCase || '',
      jurisdiction: req.body.jurisdiction || vaspJurisdiction || ''
    };

    let generatedDoc;
    let documentUrl;
    let documentPath;

    // Generate document based on output format and template type
    if (outputFormat === 'docx' && template.fileType === 'docx' && template.fileUrl) {
      // Generate Word document from smart template
      generatedDoc = await wordGenerator.generateFromSmartTemplate(
        template.id,
        req.userId,
        documentData
      );
      documentUrl = generatedDoc.url;
      documentPath = generatedDoc.filepath;
    } else {
      // Generate PDF (default behavior)
      generatedDoc = await pdfGenerator.generateDocument(
        documentData,
        template,
        documentType.toLowerCase()
      );
      documentUrl = generatedDoc.url;
      documentPath = generatedDoc.filepath;
    }

    // Prepare document data for storage
    const documentStoreData = {
      userId: req.userId,
      vaspId: parseInt(vaspId),
      documentType,
      pdfUrl: documentUrl, // This field name is kept for backward compatibility
      outputFormat: outputFormat,
      filePath: documentPath,
      isClientEncrypted: isClientEncrypted || false,
      encryptionVersion: encryptionVersion || null
    };
    
    // Handle encrypted vs unencrypted data
    if (isClientEncrypted) {
      // Store encrypted data as-is
      documentStoreData.vaspName = vaspName;
      documentStoreData.vaspJurisdiction = vaspJurisdiction;
      documentStoreData.vaspEmail = vaspEmail;
      documentStoreData.caseNumber = caseNumber;
      documentStoreData.crimeDescription = crimeDescription;
      documentStoreData.statute = statute;
      documentStoreData.transactionDetails = JSON.stringify(transactions || []);
      documentStoreData.requestedData = JSON.stringify(requestedInfo || []);
      // Store encrypted metadata if provided
      if (metadata) {
        documentStoreData.metadata = JSON.stringify(metadata);
      }
    } else {
      // Store unencrypted data (legacy support)
      documentStoreData.vaspName = vaspName;
      documentStoreData.vaspJurisdiction = vaspJurisdiction;
      documentStoreData.vaspEmail = vaspEmail;
      documentStoreData.caseNumber = caseNumber;
      documentStoreData.crimeDescription = crimeDescription;
      documentStoreData.statute = statute;
      documentStoreData.transactionDetails = JSON.stringify(transactions || []);
      documentStoreData.requestedData = JSON.stringify(requestedInfo || []);
    }
    
    // Save document record
    const document = await prisma.document.create({
      data: documentStoreData
    });

    res.status(201).json({
      document,
      documentUrl,
      outputFormat,
      filename: generatedDoc.filename,
      isClientEncrypted: isClientEncrypted || false
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const documents = await prisma.document.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        transactionImports: {
          select: { id: true, processed: true }
        }
      }
    });

    const total = await prisma.document.count({
      where: { userId: req.userId }
    });
    
    // Parse JSON fields for non-encrypted documents
    const processedDocuments = documents.map(doc => {
      if (!doc.isClientEncrypted) {
        // For non-encrypted documents, parse JSON fields
        try {
          if (doc.transactionDetails) {
            doc.transactions = JSON.parse(doc.transactionDetails);
          }
          if (doc.requestedData) {
            doc.requested_info = JSON.parse(doc.requestedData);
          }
        } catch (e) {
          console.error('Error parsing document fields:', e);
        }
      }
      return doc;
    });

    res.json({
      documents: processedDocuments,
      total,
      hasMore: total > parseInt(offset) + documents.length
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
};

const getDocument = async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: {
        transactionImports: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Parse JSON fields only for non-encrypted documents
    if (!document.isClientEncrypted) {
      try {
        document.transactionDetails = JSON.parse(document.transactionDetails);
        document.requestedData = JSON.parse(document.requestedData);
      } catch (e) {
        console.error('Error parsing document fields:', e);
      }
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
};

const duplicateDocument = async (req, res) => {
  try {
    const originalDoc = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!originalDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Create a copy with a new case number
    const newCaseNumber = `${originalDoc.caseNumber}-COPY-${Date.now()}`;
    
    const newDoc = await prisma.document.create({
      data: {
        userId: req.userId,
        vaspId: originalDoc.vaspId,
        vaspName: originalDoc.vaspName,
        vaspJurisdiction: originalDoc.vaspJurisdiction,
        vaspEmail: originalDoc.vaspEmail,
        documentType: originalDoc.documentType,
        caseNumber: newCaseNumber,
        crimeDescription: originalDoc.crimeDescription,
        statute: originalDoc.statute,
        transactionDetails: originalDoc.transactionDetails,
        requestedData: originalDoc.requestedData,
        pdfUrl: null // Will need to regenerate
      }
    });

    res.json(newDoc);
  } catch (error) {
    console.error('Duplicate document error:', error);
    res.status(500).json({ error: 'Failed to duplicate document' });
  }
};

const importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf8');
    const transactions = await csvParser.parseTransactionCSV(fileContent);
    
    const { valid, errors } = csvParser.validateTransactions(transactions);

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'CSV validation errors',
        details: errors,
        validTransactions: valid
      });
    }

    // If documentId is provided, save the import
    if (req.body.documentId) {
      await prisma.transactionImport.create({
        data: {
          documentId: req.body.documentId,
          csvData: JSON.stringify(valid),
          processed: true
        }
      });
    }

    res.json({
      transactions: valid,
      count: valid.length
    });
  } catch (error) {
    console.error('Import transactions error:', error);
    res.status(500).json({ error: 'Failed to import transactions' });
  }
};

// Get total document count across all users (for platform stats)
const getTotalDocumentCount = async (req, res) => {
  try {
    // Get the actual count from the database
    const totalCount = await prisma.document.count();
    
    res.json({ count: totalCount });
  } catch (error) {
    console.error('Get total document count error:', error);
    res.status(500).json({ error: 'Failed to get total document count' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if the document exists and belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: id,
        userId: req.userId
      }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete the document
    await prisma.document.delete({
      where: { id: id }
    });
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  duplicateDocument,
  importTransactions,
  getTotalDocumentCount,
  deleteDocument,
  uploadCSV: upload.single('file')
};