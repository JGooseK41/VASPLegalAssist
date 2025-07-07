const { PrismaClient } = require('@prisma/client');
const pdfGenerator = require('../services/pdfGenerator');
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
      requestedInfo
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

    // Generate PDF
    const pdfData = await pdfGenerator.generateDocument({
      caseNumber,
      vaspName,
      vaspEmail,
      vaspAddress,
      investigatorName: `${user.firstName} ${user.lastName}`,
      agencyName: user.agencyName,
      badgeNumber: user.badgeNumber,
      statute,
      crimeDescription,
      transactions: transactions || [],
      requestedInfo: requestedInfo || []
    }, template, documentType.toLowerCase());

    // Save document record
    const document = await prisma.document.create({
      data: {
        userId: req.userId,
        vaspId: parseInt(vaspId),
        vaspName,
        vaspJurisdiction,
        vaspEmail,
        documentType,
        caseNumber,
        crimeDescription,
        statute,
        transactionDetails: JSON.stringify(transactions || []),
        requestedData: JSON.stringify(requestedInfo || []),
        pdfUrl: pdfData.url
      }
    });

    res.status(201).json({
      document,
      pdfUrl: pdfData.url
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

    res.json({
      documents,
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

    // Parse JSON fields
    document.transactionDetails = JSON.parse(document.transactionDetails);
    document.requestedData = JSON.parse(document.requestedData);

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

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  duplicateDocument,
  importTransactions,
  uploadCSV: upload.single('file')
};