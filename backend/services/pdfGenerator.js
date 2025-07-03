const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const templateParser = require('./templateParser');

class PDFGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../generated-pdfs');
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  generateLetterhead(data, template) {
    return this.generateDocument(data, template, 'letterhead');
  }

  generateSubpoena(data, template) {
    return this.generateDocument(data, template, 'subpoena');
  }

  generateDocument(data, template, type) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `${type}-${data.caseNumber}-${uuidv4()}.pdf`;
        const filepath = path.join(this.outputDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text(template.agencyHeader, { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).font('Helvetica');
        doc.text(template.agencyAddress, { align: 'center' });
        doc.text(template.agencyContact, { align: 'center' });
        doc.moveDown(2);

        // Document Title
        doc.fontSize(14).font('Helvetica-Bold');
        const title = type === 'subpoena' ? 'SUBPOENA' : 'OFFICIAL LETTERHEAD REQUEST';
        doc.text(title, { align: 'center' });
        doc.moveDown(2);

        // Date and Case Info
        doc.fontSize(12).font('Helvetica');
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.text(`Case Number: ${data.caseNumber}`);
        doc.moveDown();

        // Recipient Info
        doc.font('Helvetica-Bold').text('TO:');
        doc.font('Helvetica');
        doc.text(data.vaspName);
        doc.text(data.vaspAddress || 'Address on file');
        doc.text(`Email: ${data.vaspEmail}`);
        doc.moveDown();

        // From Info
        doc.font('Helvetica-Bold').text('FROM:');
        doc.font('Helvetica');
        doc.text(`${data.investigatorName}`);
        doc.text(`${data.agencyName}`);
        doc.text(`Badge Number: ${data.badgeNumber}`);
        doc.moveDown(2);

        // Subject
        doc.font('Helvetica-Bold').text('RE: Request for Virtual Asset Information');
        doc.moveDown();

        // Crime Information
        doc.font('Helvetica-Bold').text('INVESTIGATION DETAILS:');
        doc.font('Helvetica');
        doc.text(`Statute: ${data.statute}`);
        doc.text(`Description: ${data.crimeDescription}`, {
          width: 500,
          align: 'justify'
        });
        doc.moveDown();

        // Transaction Details
        if (data.transactions && data.transactions.length > 0) {
          doc.font('Helvetica-Bold').text('TRANSACTION DETAILS:');
          doc.font('Helvetica');
          
          data.transactions.forEach((tx, index) => {
            doc.text(`Transaction ${index + 1}:`);
            doc.text(`  Hash: ${tx.hash || 'N/A'}`, { indent: 20 });
            doc.text(`  Date: ${tx.date || 'N/A'}`, { indent: 20 });
            doc.text(`  Amount: ${tx.amount || 'N/A'}`, { indent: 20 });
            doc.text(`  From: ${tx.from || 'N/A'}`, { indent: 20 });
            doc.text(`  To: ${tx.to || 'N/A'}`, { indent: 20 });
            doc.moveDown(0.5);
          });
          doc.moveDown();
        }

        // Requested Information
        doc.font('Helvetica-Bold').text('INFORMATION REQUESTED:');
        doc.font('Helvetica');
        if (data.requestedInfo && data.requestedInfo.length > 0) {
          data.requestedInfo.forEach(item => {
            doc.text(`• ${item}`, { indent: 20 });
          });
        }
        doc.moveDown(2);

        // Legal Authority (for subpoenas)
        if (type === 'subpoena') {
          doc.font('Helvetica-Bold').text('LEGAL AUTHORITY:');
          doc.font('Helvetica');
          doc.text('This subpoena is issued pursuant to applicable federal law and regulations governing virtual asset service providers.', {
            width: 500,
            align: 'justify'
          });
          doc.moveDown();
        }

        // Footer
        doc.text(template.footerText, {
          width: 500,
          align: 'justify'
        });
        doc.moveDown(2);

        // Signature Block
        doc.text(template.signatureBlock);

        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(10).text(
            `Page ${i + 1} of ${pages.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();

        stream.on('finish', () => {
          resolve({
            filename,
            filepath,
            url: `/pdfs/${filename}`
          });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteOldPDFs(daysToKeep = 30) {
    const files = fs.readdirSync(this.outputDir);
    const now = Date.now();
    const cutoffTime = daysToKeep * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filepath = path.join(this.outputDir, file);
      const stats = fs.statSync(filepath);
      
      if (now - stats.mtime.getTime() > cutoffTime) {
        fs.unlinkSync(filepath);
      }
    }
  }

  // Generate document from smart template
  async generateSmartDocument(data, template) {
    try {
      const markerMappings = template.markerMappings ? JSON.parse(template.markerMappings) : {};
      
      // Process template with actual data
      const processedContent = await templateParser.processTemplate(
        template.templateContent,
        data,
        markerMappings
      );

      // Generate filename
      const filename = `smart-${data.caseNumber}-${uuidv4()}.pdf`;
      const filepath = path.join(this.outputDir, filename);

      // Convert HTML to PDF using puppeteer
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Add basic styling
      const styledContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              line-height: 1.6;
            }
            h1, h2, h3 { color: #333; }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .footer {
              margin-top: 50px;
            }
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          ${processedContent}
        </body>
        </html>
      `;
      
      await page.setContent(styledContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      await page.pdf({
        path: filepath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in'
        }
      });
      
      await browser.close();

      return {
        filename,
        filepath,
        url: `/pdfs/${filename}`
      };
    } catch (error) {
      console.error('Error generating smart document:', error);
      throw error;
    }
  }

  // Enhanced document generation that checks for smart templates
  async generateDocumentWithSmartTemplate(data, template, type = 'letterhead') {
    // Check if template has smart template content
    if (template.templateContent && template.fileType) {
      return this.generateSmartDocument(data, template);
    }
    
    // Otherwise use traditional PDF generation
    return this.generateDocument(data, template, type);
  }
}

module.exports = new PDFGenerator();