const { PrismaClient } = require('@prisma/client');
const pdfGenerator = require('../services/pdfGenerator');
const wordGenerator = require('../services/wordGenerator');
const csvParser = require('../services/csvParser');
const encryptionService = require('../utils/encryption');
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

/**
 * Encrypts sensitive document fields for a user
 */
const encryptDocumentFields = (document, userId) => {
  const encrypted = { ...document };
  
  // Encrypt sensitive fields
  if (document.transactionDetails) {
    encrypted.encryptedTransactionDetails = encryptionService.encryptForUser(document.transactionDetails, userId);
    // Keep plaintext for backward compatibility, but mark as encrypted
    encrypted.transactionDetails = '[ENCRYPTED]';
  }
  
  if (document.requestedData) {
    encrypted.encryptedRequestedData = encryptionService.encryptForUser(document.requestedData, userId);
    // Keep plaintext for backward compatibility, but mark as encrypted
    encrypted.requestedData = '[ENCRYPTED]';
  }
  
  encrypted.isEncrypted = true;
  return encrypted;
};

/**
 * Decrypts sensitive document fields for a user
 */
const decryptDocumentFields = (document, userId) => {
  if (!document.isEncrypted) {
    return document;
  }
  
  const decrypted = { ...document };
  
  try {
    if (document.encryptedTransactionDetails) {
      decrypted.transactionDetails = encryptionService.decryptForUser(document.encryptedTransactionDetails, userId);
    }
    
    if (document.encryptedRequestedData) {
      decrypted.requestedData = encryptionService.decryptForUser(document.encryptedRequestedData, userId);
    }
    
    // Remove encrypted fields from response
    delete decrypted.encryptedTransactionDetails;
    delete decrypted.encryptedRequestedData;
    delete decrypted.encryptedContent;
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt document data');
  }
};

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
      outputFormat = 'pdf'
    } = req.body;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Get template (with decryption if needed)
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

    // Decrypt template if encrypted
    const { decryptTemplateFields } = require('./encryptedTemplateController');
    const decryptedTemplate = decryptTemplateFields(template, req.userId);

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
      requestedInfo: requestedInfo || []
    };

    let generatedDoc;
    let documentUrl;
    let documentPath;

    // Generate document based on output format and template type
    if (outputFormat === 'docx' && decryptedTemplate.fileType === 'docx' && decryptedTemplate.fileUrl) {
      // Generate Word document from smart template
      generatedDoc = await wordGenerator.generateFromSmartTemplate(
        decryptedTemplate.id,
        req.userId,
        documentData
      );
      documentUrl = generatedDoc.url;
      documentPath = generatedDoc.filepath;
    } else {
      // Generate PDF (default behavior)
      generatedDoc = await pdfGenerator.generateDocument(
        documentData,
        decryptedTemplate,
        documentType.toLowerCase()
      );
      documentUrl = generatedDoc.url;
      documentPath = generatedDoc.filepath;
    }

    // Prepare data for encryption
    const documentRecord = {
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
      pdfUrl: documentUrl
    };

    // Encrypt sensitive fields
    const encryptedRecord = encryptDocumentFields(documentRecord, req.userId);

    // Save document record with encrypted data
    const savedDocument = await prisma.document.create({
      data: encryptedRecord
    });

    res.json({
      id: savedDocument.id,
      url: documentUrl,
      message: 'Document generated successfully'
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    // Decrypt documents for the user
    const decryptedDocuments = documents.map(doc => 
      decryptDocumentFields(doc, req.userId)
    );

    res.json(decryptedDocuments);
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
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Decrypt document for the user
    const decryptedDocument = decryptDocumentFields(document, req.userId);
    res.json(decryptedDocument);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
};

const importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const transactions = await csvParser.parseTransactions(req.file.buffer);
    
    // Encrypt the CSV data before storing
    const encryptedCsvData = encryptionService.encryptForUser(
      req.file.buffer.toString(),
      req.userId
    );

    // Save import record with encrypted data
    const importRecord = await prisma.transactionImport.create({
      data: {
        documentId: req.body.documentId,
        csvData: encryptedCsvData,
        processed: true
      }
    });

    res.json({
      transactions,
      importId: importRecord.id,
      count: transactions.length
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
  importTransactions,
  upload
};