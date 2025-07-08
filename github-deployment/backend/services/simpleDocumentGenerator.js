const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create a basic DOCX template in memory
function createBasicDocxTemplate(content) {
  // This is a minimal DOCX structure
  const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${content.split('\n').map(line => 
      `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`
    ).join('')}
  </w:body>
</w:document>`;

  // Create a minimal DOCX file structure
  const zip = new PizZip();
  
  // Add required DOCX structure
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  // Add _rels folder
  zip.folder('_rels');
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // Add word folder
  zip.folder('word');
  zip.folder('word/_rels');
  zip.file('word/document.xml', docxContent);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

  return zip;
}

async function generateSimpleDocx(content, filename) {
  try {
    const outputDir = path.join(__dirname, '../generated-docs');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Failed to create output directory:', mkdirError);
      throw new Error('Failed to create output directory');
    }
    
    // Create a DOCX from the content
    const zip = createBasicDocxTemplate(content);
    
    // Generate buffer
    const buffer = zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });
    
    // Save the document
    const filepath = path.join(outputDir, filename);
    try {
      await fs.writeFile(filepath, buffer);
    } catch (writeError) {
      console.error('Failed to write document file:', writeError);
      throw new Error('Failed to save document file');
    }
    
    return {
      filename,
      filepath,
      url: `/docs/${filename}`,
      size: buffer.length
    };
  } catch (error) {
    console.error('Error generating simple DOCX:', error);
    throw error;
  }
}

// Alternative: Use a pre-made template approach
// Helper function to escape XML special characters
function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') {
    return String(unsafe || '');
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function generateFromTemplate(templateContent, data) {
  try {
    const outputDir = path.join(__dirname, '../generated-docs');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Failed to create output directory:', mkdirError);
      throw new Error('Failed to create output directory');
    }
    
    // Create a simple template with placeholders
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${templateContent.split('\n').map(line => {
      // Replace template variables with data
      let processedLine = line;
      Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedLine = processedLine.replace(regex, escapeXml(value || ''));
      });
      return `<w:p><w:r><w:t>${escapeXml(processedLine)}</w:t></w:r></w:p>`;
    }).join('')}
  </w:body>
</w:document>`;
    
    // Create DOCX structure
    const zip = new PizZip();
    
    // Add required files
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
    
    zip.folder('_rels');
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
    
    zip.folder('word');
    zip.folder('word/_rels');
    zip.file('word/document.xml', templateXml);
    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);
    
    // Generate filename
    const filename = `document_${Date.now()}_${uuidv4().substring(0, 8)}.docx`;
    
    // Generate buffer and save
    const buffer = zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });
    
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, buffer);
    
    return {
      filename,
      filepath,
      url: `/docs/${filename}`,
      size: buffer.length
    };
  } catch (error) {
    console.error('Error generating DOCX from template:', error);
    throw error;
  }
}

module.exports = {
  generateSimpleDocx,
  generateFromTemplate
};