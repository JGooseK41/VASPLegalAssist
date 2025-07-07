const pdfGenerator = require('./pdfGenerator');
const wordGenerator = require('./wordGenerator');
const archiver = require('archiver');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class BatchDocumentGenerator {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
  }

  /**
   * Generate multiple documents for different VASPs
   * @param {Array} vaspGroups - Array of VASP objects with their transactions
   * @param {Object} documentParams - Common document parameters (template, case info, etc.)
   * @param {Object} user - User object for document ownership
   */
  async generateBatchDocuments(vaspGroups, documentParams, user) {
    const results = {
      successful: [],
      failed: [],
      zipPath: null
    };

    // Create temp directory for batch
    const batchId = uuidv4();
    const batchDir = path.join(this.tempDir, batchId);
    await fs.mkdir(batchDir, { recursive: true });

    try {
      // Generate document for each VASP
      for (const vaspData of vaspGroups) {
        try {
          const document = await this.generateSingleDocument(vaspData, documentParams, user, batchDir);
          results.successful.push({
            vaspName: vaspData.name,
            documentPath: document.path,
            documentId: document.id,
            fileUrl: document.fileUrl
          });
        } catch (error) {
          results.failed.push({
            vaspName: vaspData.name,
            error: error.message
          });
        }
      }

      // Create ZIP file only if more than 5 documents were generated
      if (results.successful.length > 5) {
        results.zipPath = await this.createZipArchive(results.successful, batchDir);
      }

      return results;
    } catch (error) {
      // Clean up on error
      await this.cleanupBatchDir(batchDir);
      throw error;
    }
  }

  /**
   * Generate a single document for a VASP
   */
  async generateSingleDocument(vaspData, documentParams, user, outputDir) {
    // Prepare document data with VASP-specific information
    const documentData = {
      ...documentParams,
      vasp: {
        name: vaspData.name,
        email: vaspData.email,
        address: vaspData.address,
        legal_name: vaspData.legal_name || vaspData.name
      },
      transactions: vaspData.transactions,
      metadata: {
        vasp_name: vaspData.name,
        created_at: new Date().toISOString(),
        batch_generated: true
      }
    };

    // Generate filename
    const safeVaspName = vaspData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${documentParams.document_type}_${safeVaspName}_${documentParams.case_info.case_number}`;

    // Generate document based on format
    let generatedDoc;
    const documentId = uuidv4();
    
    if (documentParams.outputFormat === 'docx') {
      // For Word documents, we need to generate from a template file
      // For now, we'll create a simple document structure
      const templatePath = path.join(__dirname, '../templates/letterhead-template.docx');
      let result;
      
      try {
        if (documentParams.template && documentParams.template.filePath) {
          result = await wordGenerator.generateFromTemplate(documentParams.template.filePath, documentData);
        } else {
          // If no template, skip Word generation for now
          throw new Error('Word template not available for batch generation');
        }
      } catch (error) {
        // Fall back to PDF if Word generation fails
        documentParams.outputFormat = 'pdf';
        return this.generateSingleDocument(vaspData, documentParams, user, outputDir);
      }
      
      const docPath = path.join(outputDir, `${filename}.docx`);
      
      if (result && result.buffer) {
        await fs.writeFile(docPath, result.buffer);
      }
      
      // Create public URL for individual download
      const publicDir = path.join(__dirname, '../../public/documents', user.id.toString());
      await fs.mkdir(publicDir, { recursive: true });
      const publicPath = path.join(publicDir, `${documentId}.docx`);
      await fs.copyFile(docPath, publicPath);
      
      return { 
        path: docPath, 
        id: documentId,
        fileUrl: `/documents/${user.id}/${documentId}.docx`
      };
    } else {
      // Use the appropriate generator method based on document type
      let result;
      if (documentParams.template && documentParams.template.templateContent) {
        result = await pdfGenerator.generateSmartDocument(documentData, documentParams.template);
      } else {
        result = await pdfGenerator.generateDocument(documentData, documentParams.template || {}, documentParams.document_type);
      }
      
      const pdfPath = path.join(outputDir, `${filename}.pdf`);
      
      // Copy generated file to our output directory
      if (result.filepath) {
        const pdfContent = await fs.readFile(result.filepath);
        await fs.writeFile(pdfPath, pdfContent);
      }
      
      // Create public URL for individual download
      const publicDir = path.join(__dirname, '../../public/documents', user.id.toString());
      await fs.mkdir(publicDir, { recursive: true });
      const publicPath = path.join(publicDir, `${documentId}.pdf`);
      await fs.copyFile(pdfPath, publicPath);
      
      return { 
        path: pdfPath, 
        id: documentId,
        fileUrl: `/documents/${user.id}/${documentId}.pdf`
      };
    }
  }

  /**
   * Create ZIP archive of all generated documents
   */
  async createZipArchive(documents, batchDir) {
    const zipPath = path.join(batchDir, 'documents.zip');
    const output = require('fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(zipPath));
      archive.on('error', reject);

      archive.pipe(output);

      // Add each document to the archive
      documents.forEach(doc => {
        const filename = path.basename(doc.documentPath);
        archive.file(doc.documentPath, { name: filename });
      });

      archive.finalize();
    });
  }

  /**
   * Clean up temporary batch directory
   */
  async cleanupBatchDir(batchDir) {
    try {
      await fs.rm(batchDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up batch directory:', error);
    }
  }

  /**
   * Schedule cleanup of old batch directories (older than 1 hour)
   */
  async cleanupOldBatches() {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > oneHour) {
          await fs.rm(filePath, { recursive: true, force: true });
        }
      }
    } catch (error) {
      console.error('Error cleaning up old batches:', error);
    }
  }
}

module.exports = new BatchDocumentGenerator();