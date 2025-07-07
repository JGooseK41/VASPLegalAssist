const multiVaspCsvParser = require('../services/multiVaspCsvParser');
const batchDocumentGenerator = require('../services/batchDocumentGenerator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const fs = require('fs').promises;

// Configure multer for CSV uploads
const upload = multer({
  dest: 'temp/uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
}).single('csv');

class BatchDocumentController {
  /**
   * Import multi-VASP CSV and generate documents
   */
  async generateBatchDocuments(req, res) {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      try {
        // Parse the CSV file
        const fileContent = await fs.readFile(req.file.path, 'utf8');
        const vaspGroups = await multiVaspCsvParser.parseMultiVaspCSV(fileContent);
        
        // Validate the data
        const validation = multiVaspCsvParser.validateVaspData(vaspGroups);
        
        if (validation.errors.length > 0) {
          // Clean up uploaded file
          await fs.unlink(req.file.path);
          return res.status(400).json({ 
            error: 'CSV validation failed',
            details: validation.errors 
          });
        }

        // Extract document parameters from request
        const documentParams = {
          template_id: req.body.template_id,
          document_type: req.body.document_type || 'letterhead',
          case_info: {
            case_number: req.body.case_number,
            statute: req.body.statute,
            crime_description: req.body.crime_description
          },
          outputFormat: req.body.outputFormat || 'pdf',
          requested_info: req.body.requested_info ? JSON.parse(req.body.requested_info) : []
        };

        // Validate required fields
        if (!documentParams.case_info.case_number) {
          await fs.unlink(req.file.path);
          return res.status(400).json({ error: 'Case number is required' });
        }

        // Fetch template if template_id is provided
        if (documentParams.template_id) {
          try {
            const template = await prisma.documentTemplate.findUnique({
              where: { id: documentParams.template_id }
            });
            
            if (template) {
              documentParams.template = template;
            }
          } catch (error) {
            console.error('Error fetching template:', error);
          }
        }

        // Generate documents for each VASP
        const results = await batchDocumentGenerator.generateBatchDocuments(
          validation.valid,
          documentParams,
          req.user
        );

        // Save document records to database (if not demo user)
        const savedDocuments = [];
        if (!req.user.isDemo) {
          for (const success of results.successful) {
            try {
              // Try to find VASP ID by name
              let vaspId = 0;
              let vaspJurisdiction = 'Unknown';
              let vaspEmail = '';
              
              try {
                const vasp = await prisma.vasp.findFirst({
                  where: {
                    name: {
                      contains: success.vaspName,
                      mode: 'insensitive'
                    }
                  }
                });
                
                if (vasp) {
                  vaspId = vasp.id;
                  vaspJurisdiction = vasp.jurisdiction || 'Unknown';
                  vaspEmail = vasp.complianceEmail || '';
                }
              } catch (error) {
                console.error('Error finding VASP:', error);
              }
              
              const document = await prisma.document.create({
                data: {
                  userId: req.user.id,
                  vaspId: vaspId,
                  vaspName: success.vaspName,
                  vaspJurisdiction: vaspJurisdiction,
                  vaspEmail: vaspEmail,
                  documentType: documentParams.document_type,
                  caseNumber: documentParams.case_info.case_number,
                  statute: documentParams.case_info.statute || '',
                  crimeDescription: documentParams.case_info.crime_description,
                  transactionDetails: '[]', // Empty array as string
                  requestedData: JSON.stringify(documentParams.requested_info || []),
                  isClientEncrypted: false,
                  filePath: success.fileUrl || null,
                  outputFormat: documentParams.outputFormat,
                  metadata: JSON.stringify({
                    batch_generated: true,
                    batch_id: new Date().toISOString(),
                    outputFormat: documentParams.outputFormat
                  })
                }
              });
              savedDocuments.push({
                id: document.id,
                vaspName: success.vaspName,
                fileUrl: success.fileUrl
              });
            } catch (dbError) {
              console.error('Error saving document record:', dbError);
            }
          }
        }

        // Clean up uploaded file
        await fs.unlink(req.file.path);

        // Determine if ZIP is needed (more than 5 documents)
        const needsZip = results.successful.length > 5;
        let downloadUrl = null;

        if (needsZip && results.zipPath) {
          // Extract just the filename from the full path for security
          const zipFilename = path.basename(results.zipPath);
          const batchId = path.basename(path.dirname(results.zipPath));
          downloadUrl = `/api/documents/batch/download/${batchId}/${zipFilename}`;
        } else if (results.zipPath) {
          // Clean up ZIP file if not needed
          await fs.unlink(results.zipPath).catch(() => {});
        }

        // Send response
        res.json({
          message: 'Batch document generation completed',
          summary: {
            total: validation.valid.length,
            successful: results.successful.length,
            failed: results.failed.length
          },
          results: {
            successful: results.successful.map(s => ({
              vaspName: s.vaspName,
              documentId: s.documentId
            })),
            failed: results.failed,
            savedDocuments: savedDocuments // Include saved document info for history
          },
          needsZip,
          downloadUrl
        });

      } catch (error) {
        console.error('Batch document generation error:', error);
        
        // Clean up uploaded file
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        
        res.status(500).json({ 
          error: 'Failed to generate batch documents',
          details: error.message 
        });
      }
    });
  }

  /**
   * Download batch ZIP file
   */
  async downloadBatchZip(req, res) {
    try {
      const { batchId, filename } = req.params;
      
      // Security check - validate inputs
      if (!batchId || !filename || batchId.includes('..') || filename.includes('..')) {
        return res.status(403).json({ error: 'Invalid download path' });
      }
      
      // Construct the safe path
      const tempDir = path.join(__dirname, '../../temp');
      const zipPath = path.join(tempDir, batchId, filename);
      
      // Additional security check
      const normalizedPath = path.normalize(zipPath);
      if (!normalizedPath.startsWith(tempDir)) {
        return res.status(403).json({ error: 'Invalid download path' });
      }

      // Check if file exists
      await fs.access(zipPath);

      // Set headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=vasp_documents.zip');

      // Stream the file
      const stream = require('fs').createReadStream(zipPath);
      stream.pipe(res);

      // Schedule cleanup after download
      stream.on('end', () => {
        setTimeout(() => {
          fs.unlink(zipPath).catch(() => {});
        }, 5000);
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(404).json({ error: 'File not found' });
    }
  }

  /**
   * Get sample CSV template
   */
  async getSampleCSV(req, res) {
    try {
      const sampleContent = multiVaspCsvParser.generateSampleCSV();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vasp_batch_template.csv');
      res.send(sampleContent);
    } catch (error) {
      console.error('Sample CSV error:', error);
      res.status(500).json({ error: 'Failed to generate sample CSV' });
    }
  }
}

module.exports = new BatchDocumentController();