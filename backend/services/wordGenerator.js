const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class WordGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../generated-docs');
  }

  async init() {
    // Create output directory if it doesn't exist
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async generateFromTemplate(templatePath, data, outputFormat = 'docx') {
    try {
      await this.init();

      // Load the docx file as binary content
      const content = await fs.readFile(templatePath, 'binary');
      const zip = new PizZip(content);
      
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}'
        }
      });

      // Prepare data with all necessary fields
      const processedData = this.prepareTemplateData(data);

      // Set the templateVariables
      doc.setData(processedData);

      try {
        // Render the document (replace all occurrences of {placeholders})
        doc.render();
      } catch (error) {
        console.error('Template rendering error:', error);
        throw new Error(`Failed to render template: ${error.message}`);
      }

      // Generate buffer
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
      });

      // Save the document
      const filename = `document-${data.caseNumber || 'draft'}-${uuidv4()}.${outputFormat}`;
      const filepath = path.join(this.outputDir, filename);
      
      await fs.writeFile(filepath, buf);

      return {
        filename,
        filepath,
        url: `/docs/${filename}`,
        size: buf.length
      };
    } catch (error) {
      console.error('Word generation error:', error);
      throw error;
    }
  }

  prepareTemplateData(data) {
    // Ensure all expected fields have values (empty string if not provided)
    const prepared = {
      // VASP Information
      VASP_NAME: data.vaspName || data.VASP_NAME || '',
      VASP_LEGAL_NAME: data.vaspLegalName || data.VASP_LEGAL_NAME || '',
      VASP_EMAIL: data.vaspEmail || data.VASP_EMAIL || '',
      VASP_ADDRESS: data.vaspAddress || data.VASP_ADDRESS || '',
      VASP_JURISDICTION: data.vaspJurisdiction || data.VASP_JURISDICTION || '',
      VASP_PHONE: data.vaspPhone || data.VASP_PHONE || '',
      
      // Case Information
      CASE_NUMBER: data.caseNumber || data.CASE_NUMBER || '',
      CASE_STATUTE: data.statute || data.CASE_STATUTE || '',
      CRIME_DESCRIPTION: data.crimeDescription || data.CRIME_DESCRIPTION || '',
      DATE_TODAY: data.dateToday || data.DATE_TODAY || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      DATE_DEADLINE: data.dateDeadline || data.DATE_DEADLINE || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      
      // Agency Information
      AGENCY_NAME: data.agencyName || data.AGENCY_NAME || '',
      AGENCY_ADDRESS: data.agencyAddress || data.AGENCY_ADDRESS || '',
      AGENCY_PHONE: data.agencyPhone || data.AGENCY_PHONE || '',
      AGENCY_EMAIL: data.agencyEmail || data.AGENCY_EMAIL || '',
      INVESTIGATOR_NAME: data.investigatorName || data.INVESTIGATOR_NAME || '',
      INVESTIGATOR_TITLE: data.investigatorTitle || data.INVESTIGATOR_TITLE || '',
      INVESTIGATOR_BADGE: data.investigatorBadge || data.badgeNumber || data.INVESTIGATOR_BADGE || '',
      
      // Transaction Information
      TRANSACTION_COUNT: data.transactions ? data.transactions.length : 0,
      TRANSACTION_LIST: this.formatTransactionList(data.transactions),
      TRANSACTION_TABLE: this.formatTransactionTable(data.transactions),
      
      // Requested Information
      REQUESTED_INFO_LIST: this.formatRequestedInfoList(data.requestedInfo),
      REQUESTED_INFO_CHECKBOXES: this.formatRequestedInfoCheckboxes(data.requestedInfo),
      
      // Custom Fields
      CUSTOM_FIELD_1: data.customField1 || data.CUSTOM_FIELD_1 || '',
      CUSTOM_FIELD_2: data.customField2 || data.CUSTOM_FIELD_2 || '',
      CUSTOM_FIELD_3: data.customField3 || data.CUSTOM_FIELD_3 || '',
      
      // Additional fields that might be used
      ...data
    };

    // Also add lowercase versions for compatibility
    Object.keys(prepared).forEach(key => {
      prepared[key.toLowerCase()] = prepared[key];
    });

    return prepared;
  }

  formatTransactionList(transactions) {
    if (!transactions || transactions.length === 0) {
      return 'No transactions provided';
    }
    
    return transactions.map((tx, index) => 
      `${index + 1}. Transaction ${tx.transaction_id || tx.hash || tx.id || index + 1} on ${tx.date || 'N/A'} - Amount: ${tx.amount || 'N/A'} ${tx.currency || ''}`
    ).join('\n');
  }

  formatTransactionTable(transactions) {
    if (!transactions || transactions.length === 0) {
      return 'No transactions provided';
    }
    
    // For Word documents, we'll create a formatted text table
    let table = 'Transaction Details:\n';
    table += '─'.repeat(80) + '\n';
    table += 'ID\t\tDate\t\tAmount\t\tFrom\t\tTo\n';
    table += '─'.repeat(80) + '\n';
    
    transactions.forEach(tx => {
      const id = (tx.transaction_id || tx.hash || 'N/A').substring(0, 10);
      const date = tx.date || 'N/A';
      const amount = `${tx.amount || 'N/A'} ${tx.currency || ''}`;
      const from = (tx.from_address || tx.from || 'N/A').substring(0, 10);
      const to = (tx.to_address || tx.to || 'N/A').substring(0, 10);
      
      table += `${id}\t${date}\t${amount}\t${from}\t${to}\n`;
    });
    
    table += '─'.repeat(80);
    return table;
  }

  formatRequestedInfoList(requestedInfo) {
    if (!requestedInfo || requestedInfo.length === 0) {
      return 'No specific information requested';
    }
    
    const infoLabels = {
      'kyc_info': 'KYC Information',
      'transaction_history': 'Transaction History',
      'ip_addresses': 'IP Addresses',
      'device_info': 'Device Information',
      'account_activity': 'Account Activity',
      'linked_accounts': 'Linked Accounts',
      'source_of_funds': 'Source of Funds',
      'communications': 'Communications'
    };
    
    return requestedInfo.map(item => infoLabels[item] || item).join(', ');
  }

  formatRequestedInfoCheckboxes(requestedInfo) {
    const allOptions = [
      { key: 'kyc_info', label: 'KYC Information' },
      { key: 'transaction_history', label: 'Transaction History' },
      { key: 'ip_addresses', label: 'IP Addresses' },
      { key: 'device_info', label: 'Device Information' },
      { key: 'account_activity', label: 'Account Activity' },
      { key: 'linked_accounts', label: 'Linked Accounts' },
      { key: 'source_of_funds', label: 'Source of Funds' },
      { key: 'communications', label: 'Communications' }
    ];
    
    return allOptions.map(option => {
      const checked = requestedInfo && requestedInfo.includes(option.key) ? '☑' : '☐';
      return `${checked} ${option.label}`;
    }).join('\n');
  }

  async generateFromSmartTemplate(templateId, userId, data) {
    try {
      // This method would be called from the controller
      // It retrieves the template from the database and generates the document
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const template = await prisma.documentTemplate.findFirst({
        where: {
          id: templateId,
          userId
        }
      });

      if (!template || !template.fileUrl) {
        throw new Error('Template not found or has no file');
      }

      // Get the full path to the template file
      const templatePath = path.join(__dirname, '..', template.fileUrl);
      
      // Generate the document
      const result = await this.generateFromTemplate(templatePath, data);
      
      await prisma.$disconnect();
      
      return result;
    } catch (error) {
      console.error('Smart template generation error:', error);
      throw error;
    }
  }

  async deleteOldDocuments(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      const cutoffTime = daysToKeep * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filepath = path.join(this.outputDir, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > cutoffTime) {
          await fs.unlink(filepath);
        }
      }
    } catch (error) {
      console.error('Error cleaning old documents:', error);
    }
  }
}

module.exports = new WordGenerator();