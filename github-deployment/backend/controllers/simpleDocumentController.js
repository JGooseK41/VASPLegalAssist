const { PrismaClient } = require('@prisma/client');
const wordGenerator = require('../services/wordGenerator');
const { generateFromTemplate } = require('../services/simpleDocumentGenerator');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Standard template content for freeze request
const FREEZE_REQUEST_TEMPLATE = `
[Your Agency Letterhead]

{{dateToday}}

{{vaspName}}
{{vaspAddress}}
{{vaspEmail}}

RE: Asset Freeze Request - {{caseNumber}}

Dear {{vaspName}} Compliance Team,

I am {{agentName}}, {{agentTitle}} with {{agencyName}}. I am writing to request an immediate freeze on cryptocurrency assets associated with an ongoing investigation.

INVESTIGATION DETAILS:
Case Number: {{caseNumber}}
Crime Under Investigation: {{crimeDescription}}
{{#if statute}}Relevant Statute: {{statute}}{{/if}}

{{#if transactions.[0]}}
TRANSACTION INFORMATION:
Transaction ID: {{transactions.[0].transaction_id}}
Date: {{transactions.[0].date}}
From Address: {{transactions.[0].from_address}}
To Address: {{transactions.[0].to_address}}
Amount: {{transactions.[0].amount}} {{transactions.[0].currency}}
{{/if}}

Pursuant to our investigation, we request that you immediately freeze any and all cryptocurrency assets associated with the above-referenced addresses and prevent any further transactions or withdrawals.

This freeze should remain in effect until further notice from our agency. Please confirm receipt of this request and the implementation of the asset freeze within 24 hours.

Should you have any questions or require additional information, please contact me directly at {{agentEmail}}{{#if agentPhone}} or {{agentPhone}}{{/if}}.

Thank you for your cooperation in this matter.

Sincerely,

{{agentName}}
{{agentTitle}}
{{agencyName}}
{{#if agentBadge}}Badge #: {{agentBadge}}{{/if}}
{{agentEmail}}
{{#if agentPhone}}{{agentPhone}}{{/if}}
`;

// Standard template content for records request
const RECORDS_REQUEST_TEMPLATE = `
[Your Agency Letterhead]

{{dateToday}}

{{vaspName}}
{{vaspAddress}}
{{vaspEmail}}

RE: Records Request - {{caseNumber}}

Dear {{vaspName}} Compliance Team,

I am {{agentName}}, {{agentTitle}} with {{agencyName}}. I am conducting an investigation and require records from your platform.

INVESTIGATION DETAILS:
Case Number: {{caseNumber}}
Crime Under Investigation: {{crimeDescription}}
{{#if statute}}Relevant Statute: {{statute}}{{/if}}

{{#if transactions.[0]}}
TRANSACTION INFORMATION:
Transaction ID: {{transactions.[0].transaction_id}}
Date: {{transactions.[0].date}}
From Address: {{transactions.[0].from_address}}
To Address: {{transactions.[0].to_address}}
Amount: {{transactions.[0].amount}} {{transactions.[0].currency}}
{{/if}}

We respectfully request the following information:

1. Complete KYC (Know Your Customer) information for all accounts associated with the above addresses
2. Full transaction history for the specified addresses
3. IP addresses and device information used to access the accounts
4. Any communications or support tickets related to these accounts
5. Source of funds documentation
6. Any linked or associated accounts

Please provide the requested information within 10 business days of receipt of this letter. The information should be sent securely to {{agentEmail}}.

If you have any questions or need clarification on this request, please contact me at {{agentEmail}}{{#if agentPhone}} or {{agentPhone}}{{/if}}.

Thank you for your assistance in this matter.

Sincerely,

{{agentName}}
{{agentTitle}}
{{agencyName}}
{{#if agentBadge}}Badge #: {{agentBadge}}{{/if}}
{{agentEmail}}
{{#if agentPhone}}{{agentPhone}}{{/if}}
`;

const createSimpleDocument = async (req, res) => {
  try {
    const {
      documentType,
      outputFormat = 'docx',
      
      // VASP Information
      vaspId,
      vaspName,
      vaspEmail,
      vaspAddress,
      vaspJurisdiction,
      
      // User/Agency Information
      agentName,
      agentTitle,
      agentEmail,
      agentPhone,
      agentBadge,
      agencyName,
      agencyAddress,
      
      // Case Information
      caseNumber,
      statute,
      crimeDescription,
      
      // Transaction Information
      transactions,
      
      // Date
      dateToday
    } = req.body;

    // Validate required fields
    if (!vaspName || !caseNumber || !crimeDescription) {
      return res.status(400).json({ 
        error: 'Missing required fields: vaspName, caseNumber, and crimeDescription are required' 
      });
    }

    // Get user info if not provided
    let user;
    
    // Check for demo user
    if (req.userId === 'demo-user-id') {
      user = {
        id: 'demo-user-id',
        email: 'demo@theblockaudit.com',
        firstName: 'Demo',
        lastName: 'User',
        agencyName: 'Demo Law Enforcement Agency',
        agencyAddress: '123 Demo Street, Washington, DC 20001',
        badgeNumber: 'DEMO-001',
        title: 'Special Agent',
        phone: '(555) 123-4567'
      };
    } else {
      user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    // Prepare document data
    const documentData = {
      // VASP Information
      vaspName,
      vaspEmail: vaspEmail || '',
      vaspAddress: vaspAddress || '',
      vaspJurisdiction: vaspJurisdiction || '',
      
      // User/Agency Information (use provided or fall back to user profile)
      agentName: agentName || `${user.firstName} ${user.lastName}`,
      agentTitle: agentTitle || user.title || 'Special Agent',
      agentEmail: agentEmail || user.email,
      agentPhone: agentPhone || user.phone || '',
      agentBadge: agentBadge || user.badgeNumber || '',
      agencyName: agencyName || user.agencyName,
      agencyAddress: agencyAddress || user.agencyAddress || '',
      
      // Case Information
      caseNumber,
      statute: statute || '',
      crimeDescription,
      
      // Transaction Information
      transactions: transactions || [],
      
      // Date
      dateToday: dateToday || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Select template based on document type
    const templateContent = documentType === 'freeze_request' 
      ? FREEZE_REQUEST_TEMPLATE 
      : RECORDS_REQUEST_TEMPLATE;

    // Create a temporary template file
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFileName = `temp-template-${Date.now()}.docx`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    // Create a simple DOCX template with the content
    const Docxtemplater = require('docxtemplater');
    const PizZip = require('pizzip');
    
    // Create a simple DOCX with the template content
    const content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${templateContent}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
    
    // Generate DOCX document
    const result = await generateFromTemplate(templateContent, documentData);
    
    // Keep the original filename with UUID to prevent collisions
    const filename = result.filename;
    const filepath = result.filepath;
    
    // Save document record (skip for demo user)
    let document = null;
    if (req.userId !== 'demo-user-id') {
      document = await prisma.document.create({
        data: {
          userId: req.userId,
          vaspId: parseInt(vaspId) || 0,
          vaspName,
          vaspJurisdiction: vaspJurisdiction || '',
          vaspEmail: vaspEmail || '',
          documentType,
          caseNumber,
          crimeDescription,
          statute: statute || '',
          transactionDetails: JSON.stringify(transactions || []),
          requestedData: JSON.stringify([]),
          pdfUrl: `/docs/${filename}`,
          outputFormat: 'docx',
          filePath: filepath
        }
      });
    }

    res.json({
      success: true,
      documentUrl: `/docs/${filename}`,
      document
    });

  } catch (error) {
    console.error('Simple document creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create document',
      details: error.message 
    });
  }
};

const createSimpleBatch = async (req, res) => {
  const multer = require('multer');
  // TODO: Consider implementing streaming for very large CSV files
  // Current implementation loads entire file into memory
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
        documentType,
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
      let user;
      
      // Check for demo user
      if (req.userId === 'demo-user-id') {
        user = {
          id: 'demo-user-id',
          email: 'demo@theblockaudit.com',
          firstName: 'Demo',
          lastName: 'User',
          agencyName: 'Demo Law Enforcement Agency',
          agencyAddress: '123 Demo Street, Washington, DC 20001',
          badgeNumber: 'DEMO-001',
          title: 'Special Agent',
          phone: '(555) 123-4567'
        };
      } else {
        user = await prisma.user.findUnique({
          where: { id: req.userId }
        });
      }
      
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
          
          // Prepare document data
          const documentData = {
            // VASP Information from DATABASE
            vaspName: vasp.name,
            vaspLegalName: vaspLegalName,
            vaspEmail,
            vaspAddress,
            vaspJurisdiction,
            
            // User/Agency Information
            agentName: agentName || `${user.firstName} ${user.lastName}`,
            agentTitle: agentTitle || user.title || 'Special Agent',
            agentEmail: agentEmail || user.email,
            agentPhone: agentPhone || user.phone || '',
            agentBadge: agentBadge || user.badgeNumber || '',
            agencyName: agencyName || user.agencyName,
            agencyAddress: user.agencyAddress || '',
            
            // Case Information (same for all documents)
            caseNumber,
            statute: statute || '',
            crimeDescription,
            
            // Transaction Information from CSV
            transactions: [],
            
            // Date
            dateToday: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          };
          
          // Check if this row has transaction data
          if (record.Transaction_ID || record.transaction_id) {
            documentData.transactions.push({
              transaction_id: record.Transaction_ID || record.transaction_id || '',
              date: record.Date || record.date || '',
              from_address: record.From_Address || record.from_address || '',
              to_address: record.To_Address || record.to_address || '',
              amount: record.Amount || record.amount || '',
              currency: record.Currency || record.currency || 'BTC'
            });
          }
          
          // Select template based on document type
          const templateContent = documentType === 'freeze_request' 
            ? FREEZE_REQUEST_TEMPLATE 
            : RECORDS_REQUEST_TEMPLATE;
          
          // Generate DOCX document
          const result = await generateFromTemplate(templateContent, documentData);
          
          // Use the original filename with UUID from the generator
          const filename = result.filename;
          const filepath = result.filepath;
          
          results.documents.push({
            vaspName,
            filename,
            filepath
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
      
      const zipFilename = `batch_${documentType}_${caseNumber.replace(/[^a-z0-9]/gi, '_')}_${uuidv4().substring(0, 8)}.zip`;
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
      console.error('Batch processing error:', error);
      res.status(500).json({ 
        error: 'Failed to process batch',
        details: error.message 
      });
    }
  });
};

module.exports = {
  createSimpleDocument,
  createSimpleBatch
};