const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;
const templateParser = require('../services/templateParser');
const wordGenerator = require('../services/wordGenerator');
const pdfGenerator = require('../services/pdfGenerator');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const createCustomBatch = async (req, res) => {
  const multer = require('multer');
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'), false);
      }
    }
  }).single('csv');
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'File upload failed' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
      const {
        templateId,
        outputFormat = 'pdf',
        caseNumber,
        statute,
        crimeDescription,
        agentName,
        agentTitle,
        agentEmail,
        agentPhone,
        agentBadge,
        agencyName
      } = req.body;
      
      // Get default template if specified
      let defaultTemplate = null;
      if (templateId) {
        defaultTemplate = await prisma.documentTemplate.findFirst({
          where: { 
            id: templateId,
            OR: [
              { userId: req.userId },
              { isGlobal: true }
            ]
          }
        });
        
        if (!defaultTemplate) {
          return res.status(404).json({ error: 'Default template not found' });
        }
      }
      
      // Get all user's templates for per-VASP selection
      const userTemplates = await prisma.documentTemplate.findMany({
        where: {
          OR: [
            { userId: req.userId },
            { isGlobal: true }
          ]
        }
      });
      
      // Parse CSV
      const csvContent = req.file.buffer.toString();
      const { parse } = require('csv-parse/sync');
      
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      if (records.length === 0) {
        return res.status(400).json({ error: 'CSV file is empty' });
      }
      
      if (records.length > 100) {
        return res.status(400).json({ 
          error: 'Too many records. Maximum 100 VASPs per batch allowed.' 
        });
      }
      
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });
      
      const results = {
        total: records.length,
        successful: 0,
        failed: 0,
        documents: []
      };
      
      // Process each record
      for (const record of records) {
        try {
          // Extract VASP name from CSV row
          const vaspName = record.VASP_Name || record.vasp_name || record.Vasp || record.VASP || '';
          
          if (!vaspName) {
            console.error('No VASP name found in row:', record);
            results.failed++;
            continue;
          }
          
          // Look up VASP details from database
          const vasp = await prisma.vasp.findFirst({
            where: {
              OR: [
                { name: { equals: vaspName, mode: 'insensitive' } },
                { legal_name: { equals: vaspName, mode: 'insensitive' } }
              ],
              isActive: true
            }
          });
          
          if (!vasp) {
            console.error(`VASP not found in database: ${vaspName}`);
            results.failed++;
            continue;
          }
          
          // Use VASP details from database
          const vaspEmail = vasp.compliance_email || '';
          const vaspAddress = vasp.service_address || '';
          const vaspJurisdiction = vasp.jurisdiction || '';
          const vaspLegalName = vasp.legal_name || vasp.name;
          
          // Check if this row specifies a custom template
          const templateName = record.Template_Name || record.template_name || '';
          let template = defaultTemplate;
          
          if (templateName) {
            // Find the template by name
            const customTemplate = userTemplates.find(t => 
              t.templateName.toLowerCase() === templateName.toLowerCase()
            );
            if (customTemplate) {
              template = customTemplate;
            }
          }
          
          if (!template) {
            console.error(`No template found for VASP ${vaspName}`);
            results.failed++;
            continue;
          }
          
          // Prepare document data for template processing
          const documentData = {
            // VASP Information from DATABASE
            vaspName: vasp.name,
            vaspLegalName: vaspLegalName,
            vaspEmail,
            vaspAddress,
            vaspJurisdiction,
            vaspPhone: vasp.phone || '',
            VASP_NAME: vasp.name,
            VASP_LEGAL_NAME: vaspLegalName,
            VASP_EMAIL: vaspEmail,
            VASP_ADDRESS: vaspAddress,
            VASP_JURISDICTION: vaspJurisdiction,
            VASP_PHONE: vasp.phone || '',
            
            // User/Agency Information
            agentName: agentName || `${user.firstName} ${user.lastName}`,
            agentTitle: agentTitle || user.title || '',
            agentEmail: agentEmail || user.email,
            agentPhone: agentPhone || user.phone || '',
            agentBadge: agentBadge || user.badgeNumber || '',
            agencyName: agencyName || user.agencyName,
            agencyAddress: template.agencyAddress || '',
            agencyContact: template.agencyContact || '',
            signatureBlock: template.signatureBlock || '',
            AGENT_NAME: agentName || `${user.firstName} ${user.lastName}`,
            AGENT_TITLE: agentTitle || user.title || '',
            AGENT_EMAIL: agentEmail || user.email,
            AGENT_PHONE: agentPhone || user.phone || '',
            AGENT_BADGE: agentBadge || user.badgeNumber || '',
            AGENCY_NAME: agencyName || user.agencyName,
            
            // Case Information (same for all documents)
            caseNumber,
            statute: statute || '',
            crimeDescription,
            CASE_NUMBER: caseNumber,
            CASE_STATUTE: statute || '',
            CRIME_DESCRIPTION: crimeDescription,
            
            // Transaction Information from CSV (if present)
            transactions: [],
            
            // Date
            dateToday: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            DATE_TODAY: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            
            // Dynamic fields from CSV
            // Date fields
            dateDeadline: record.Date_Deadline || record.date_deadline || '',
            DATE_DEADLINE: record.Date_Deadline || record.date_deadline || '',
            
            // Agency contact fields from CSV (override defaults if provided)
            agencyPhone: record.Agency_Phone || record.agency_phone || user.phone || '',
            AGENCY_PHONE: record.Agency_Phone || record.agency_phone || user.phone || '',
            agencyEmail: record.Agency_Email || record.agency_email || user.email || '',
            AGENCY_EMAIL: record.Agency_Email || record.agency_email || user.email || '',
            
            // Investigator fields from CSV (override defaults if provided)
            investigatorName: record.Investigator_Name || record.investigator_name || `${user.firstName} ${user.lastName}`,
            INVESTIGATOR_NAME: record.Investigator_Name || record.investigator_name || `${user.firstName} ${user.lastName}`,
            investigatorTitle: record.Investigator_Title || record.investigator_title || user.title || '',
            INVESTIGATOR_TITLE: record.Investigator_Title || record.investigator_title || user.title || '',
            investigatorBadge: record.Investigator_Badge || record.investigator_badge || user.badgeNumber || '',
            INVESTIGATOR_BADGE: record.Investigator_Badge || record.investigator_badge || user.badgeNumber || '',
            
            // Custom fields
            customField1: record.Custom_Field_1 || record.custom_field_1 || '',
            CUSTOM_FIELD_1: record.Custom_Field_1 || record.custom_field_1 || '',
            customField2: record.Custom_Field_2 || record.custom_field_2 || '',
            CUSTOM_FIELD_2: record.Custom_Field_2 || record.custom_field_2 || '',
            customField3: record.Custom_Field_3 || record.custom_field_3 || '',
            CUSTOM_FIELD_3: record.Custom_Field_3 || record.custom_field_3 || ''
          };
          
          // Check if this row has transaction data
          if (record.Transaction_ID || record.transaction_id) {
            const transaction = {
              transaction_id: record.Transaction_ID || record.transaction_id || '',
              date: record.Date || record.date || '',
              from_address: record.From_Address || record.from_address || '',
              to_address: record.To_Address || record.to_address || '',
              amount: record.Amount || record.amount || '',
              currency: record.Currency || record.currency || 'BTC'
            };
            documentData.transactions.push(transaction);
            
            // Add transaction data for template markers
            documentData.TRANSACTION_ID = transaction.transaction_id;
            documentData.TRANSACTION_DATE = transaction.date;
            documentData.FROM_ADDRESS = transaction.from_address;
            documentData.TO_ADDRESS = transaction.to_address;
            documentData.AMOUNT = transaction.amount;
            documentData.CURRENCY = transaction.currency;
          }
          
          let generatedDoc;
          let filename;
          
          // Generate document based on output format
          if (outputFormat === 'docx' && template.fileType === 'docx' && template.fileUrl) {
            // Generate Word document from smart template
            generatedDoc = await wordGenerator.generateFromSmartTemplate(
              template.id,
              req.userId,
              documentData
            );
            filename = `${template.templateType}_${caseNumber.replace(/[^a-z0-9]/gi, '_')}_${uuidv4().substring(0, 8)}.docx`;
          } else {
            // Generate PDF
            generatedDoc = await pdfGenerator.generateDocument(
              documentData,
              template,
              template.templateType
            );
            filename = `${template.templateType}_${caseNumber.replace(/[^a-z0-9]/gi, '_')}_${uuidv4().substring(0, 8)}.pdf`;
          }
          
          results.documents.push({
            vaspName,
            filename,
            filepath: generatedDoc.filepath
          });
          
          results.successful++;
          
        } catch (error) {
          console.error(`Failed to process VASP ${record.VASP_Name}:`, error);
          results.failed++;
        }
      }
      
      // Create a ZIP file of all documents
      const archiver = require('archiver');
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      const zipFilename = `batch_custom_${caseNumber.replace(/[^a-z0-9]/gi, '_')}_${uuidv4().substring(0, 8)}.zip`;
      const zipPath = path.join(__dirname, '../generated-docs', zipFilename);
      const output = require('fs').createWriteStream(zipPath);
      
      archive.pipe(output);
      
      // Add all generated documents to the ZIP
      for (const doc of results.documents) {
        archive.file(doc.filepath, { name: doc.filename });
      }
      
      await archive.finalize();
      
      res.json({
        ...results,
        downloadUrl: `/docs/${zipFilename}`
      });
      
    } catch (error) {
      console.error('Custom batch processing error:', error);
      res.status(500).json({ 
        error: 'Failed to process batch',
        details: error.message 
      });
    }
  });
};

module.exports = {
  createCustomBatch
};