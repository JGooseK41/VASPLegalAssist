const mammoth = require('mammoth');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// Define available smart markers
const SMART_MARKERS = {
  // VASP Information
  '{{VASP_NAME}}': 'vaspName',
  '{{VASP_LEGAL_NAME}}': 'vaspLegalName',
  '{{VASP_EMAIL}}': 'vaspEmail',
  '{{VASP_ADDRESS}}': 'vaspAddress',
  '{{VASP_JURISDICTION}}': 'vaspJurisdiction',
  '{{VASP_PHONE}}': 'vaspPhone',
  
  // Case Information
  '{{CASE_NUMBER}}': 'caseNumber',
  '{{CASE_STATUTE}}': 'statute',
  '{{CRIME_DESCRIPTION}}': 'crimeDescription',
  '{{DATE_TODAY}}': 'dateToday',
  '{{DATE_DEADLINE}}': 'dateDeadline',
  '{{VICTIM_NAME}}': 'victimName',
  '{{SUSPECT_NAME}}': 'suspectName',
  '{{COMPLY_BY_DATE}}': 'complyByDate',
  
  // Agency Information
  '{{AGENCY_NAME}}': 'agencyName',
  '{{AGENCY_ADDRESS}}': 'agencyAddress',
  '{{AGENCY_PHONE}}': 'agencyPhone',
  '{{AGENCY_EMAIL}}': 'agencyEmail',
  '{{INVESTIGATOR_NAME}}': 'investigatorName',
  '{{INVESTIGATOR_TITLE}}': 'investigatorTitle',
  '{{INVESTIGATOR_BADGE}}': 'investigatorBadge',
  
  // Transaction Information
  '{{TRANSACTION_LIST}}': 'transactionList',
  '{{TRANSACTION_COUNT}}': 'transactionCount',
  '{{TRANSACTION_TABLE}}': 'transactionTable',
  
  // Requested Information
  '{{REQUESTED_INFO_LIST}}': 'requestedInfoList',
  '{{REQUESTED_INFO_CHECKBOXES}}': 'requestedInfoCheckboxes',
  
  // Custom Fields
  '{{CUSTOM_FIELD_1}}': 'customField1',
  '{{CUSTOM_FIELD_2}}': 'customField2',
  '{{CUSTOM_FIELD_3}}': 'customField3'
};

// Helper to format transaction table
handlebars.registerHelper('transactionTable', function(transactions) {
  if (!transactions || transactions.length === 0) {
    return 'No transactions';
  }
  
  let table = `<table border="1" cellpadding="5" cellspacing="0">
    <tr>
      <th>Transaction ID</th>
      <th>Date</th>
      <th>From</th>
      <th>To</th>
      <th>Amount</th>
      <th>Currency</th>
    </tr>`;
  
  transactions.forEach(tx => {
    table += `<tr>
      <td>${tx.transaction_id || ''}</td>
      <td>${tx.date || ''}</td>
      <td>${tx.from_address || ''}</td>
      <td>${tx.to_address || ''}</td>
      <td>${tx.amount || ''}</td>
      <td>${tx.currency || ''}</td>
    </tr>`;
  });
  
  table += '</table>';
  return new handlebars.SafeString(table);
});

// Helper to format requested info as checkboxes
handlebars.registerHelper('requestedInfoCheckboxes', function(requestedInfo) {
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
  
  let checkboxes = '<div>';
  allOptions.forEach(option => {
    const checked = requestedInfo && requestedInfo.includes(option.key) ? '☑' : '☐';
    checkboxes += `<p>${checked} ${option.label}</p>`;
  });
  checkboxes += '</div>';
  
  return new handlebars.SafeString(checkboxes);
});

// Helper to format date
handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

class TemplateParser {
  // Extract text content from uploaded file
  async extractContent(filePath, fileType) {
    try {
      switch (fileType) {
        case 'docx':
          return await this.extractDocxContent(filePath);
        case 'html':
          return await this.extractHtmlContent(filePath);
        case 'txt':
          return await this.extractTxtContent(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error extracting content:', error);
      throw error;
    }
  }
  
  // Extract content from DOCX file
  async extractDocxContent(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  
  // Extract content from HTML file
  async extractHtmlContent(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    // Keep HTML as is for better formatting
    return content;
  }
  
  // Extract content from TXT file
  async extractTxtContent(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  }
  
  // Find all smart markers in the template
  findMarkers(content) {
    const markers = [];
    const markerRegex = /\{\{([^}]+)\}\}/g;
    let match;
    
    while ((match = markerRegex.exec(content)) !== null) {
      const fullMarker = match[0];
      const markerName = match[1].trim();
      
      // Check if it's a known marker
      const fieldName = SMART_MARKERS[fullMarker];
      
      markers.push({
        marker: fullMarker,
        name: markerName,
        field: fieldName || null,
        isKnown: !!fieldName
      });
    }
    
    // Remove duplicates
    const uniqueMarkers = markers.filter((marker, index, self) => 
      index === self.findIndex(m => m.marker === marker.marker)
    );
    
    return uniqueMarkers;
  }
  
  // Process template with data
  async processTemplate(templateContent, data, markerMappings = {}) {
    // Prepare data with mappings
    const processedData = this.prepareData(data, markerMappings);
    
    // Create a version that handles case-insensitive markers
    let processedContent = templateContent;
    
    // Replace lowercase markers with data
    Object.entries(processedData).forEach(([key, value]) => {
      // Handle both uppercase and lowercase versions
      const upperKey = key.toUpperCase();
      const lowerKey = key.toLowerCase();
      
      // Replace both {{KEY}} and {{key}} formats
      processedContent = processedContent.replace(new RegExp(`{{${upperKey}}}`, 'g'), value || '');
      processedContent = processedContent.replace(new RegExp(`{{${lowerKey}}}`, 'g'), value || '');
    });
    
    // Also compile with handlebars for complex helpers
    const template = handlebars.compile(processedContent);
    const result = template(processedData);
    
    return result;
  }
  
  // Prepare data for template processing
  prepareData(data, markerMappings) {
    const processedData = {};
    
    // Apply default mappings
    Object.entries(SMART_MARKERS).forEach(([marker, field]) => {
      const markerName = marker.replace(/[{}]/g, '');
      processedData[markerName] = this.getNestedValue(data, field);
    });
    
    // Apply custom mappings
    Object.entries(markerMappings).forEach(([marker, field]) => {
      const markerName = marker.replace(/[{}]/g, '');
      processedData[markerName] = this.getNestedValue(data, field);
    });
    
    // Add computed fields
    processedData.DATE_TODAY = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    processedData.DATE_DEADLINE = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Add new case-related placeholders
    processedData.CRIME_UNDER_INVESTIGATION = data.crimeUnderInvestigation || data.crime_under_investigation || data.crimeDescription || '';
    processedData.FACTS_OF_THE_CASE = data.factsOfTheCase || data.facts_of_the_case || '';
    processedData.JURISDICTION = data.jurisdiction || data.caseJurisdiction || '';
    
    // Add victim, suspect, and comply by date
    processedData.VICTIM_NAME = data.victimName || data.victim_name || '';
    processedData.SUSPECT_NAME = data.suspectName || data.suspect_name || '';
    processedData.COMPLY_BY_DATE = data.complyByDate || data.comply_by_date || data.dateDeadline || processedData.DATE_DEADLINE || '';
    
    // Also add lowercase versions
    processedData.crime_under_investigation = processedData.CRIME_UNDER_INVESTIGATION;
    processedData.facts_of_the_case = processedData.FACTS_OF_THE_CASE;
    processedData.jurisdiction = processedData.JURISDICTION;
    processedData.victim_name = processedData.VICTIM_NAME;
    processedData.suspect_name = processedData.SUSPECT_NAME;
    processedData.comply_by_date = processedData.COMPLY_BY_DATE;
    
    // Add agency/agent placeholders
    processedData.AGENCY_NAME = data.agencyName || data.agency_name || '';
    processedData.AGENCY_ADDRESS = data.agencyAddress || data.agency_address || '';
    processedData.AGENCY_CONTACT = data.agencyContact || data.agency_contact || '';
    processedData.AGENT_NAME = data.agentName || data.agent_name || '';
    processedData.AGENT_TITLE = data.agentTitle || data.agent_title || '';
    processedData.AGENT_PHONE = data.agentPhone || data.agent_phone || '';
    processedData.AGENT_EMAIL = data.agentEmail || data.agent_email || '';
    processedData.AGENT_BADGE = data.agentBadge || data.agent_badge || data.badgeNumber || '';
    processedData.SIGNATURE_BLOCK = data.signatureBlock || data.signature_block || '';
    
    // Add lowercase versions
    processedData.agency_name = processedData.AGENCY_NAME;
    processedData.agency_address = processedData.AGENCY_ADDRESS;
    processedData.agency_contact = processedData.AGENCY_CONTACT;
    processedData.agent_name = processedData.AGENT_NAME;
    processedData.agent_title = processedData.AGENT_TITLE;
    processedData.agent_phone = processedData.AGENT_PHONE;
    processedData.agent_email = processedData.AGENT_EMAIL;
    processedData.agent_badge = processedData.AGENT_BADGE;
    processedData.signature_block = processedData.SIGNATURE_BLOCK;
    
    // Add date_today as lowercase
    processedData.date_today = processedData.DATE_TODAY;
    
    processedData.TRANSACTION_COUNT = data.transactions ? data.transactions.length : 0;
    
    processedData.TRANSACTION_LIST = data.transactions ? 
      data.transactions.map(tx => `Transaction ${tx.transaction_id} on ${tx.date}`).join('\n') : 
      'No transactions';
    
    processedData.TRANSACTION_TABLE = handlebars.helpers.transactionTable(data.transactions);
    
    processedData.REQUESTED_INFO_LIST = data.requestedInfo ? 
      data.requestedInfo.join(', ') : 
      'No information requested';
    
    processedData.REQUESTED_INFO_CHECKBOXES = handlebars.helpers.requestedInfoCheckboxes(data.requestedInfo);
    
    // Add lowercase versions of all placeholders for flexibility
    processedData.vasp_name = data.vaspName || data.vasp?.name || '';
    processedData.vasp_email = data.vaspEmail || data.vasp?.email || '';
    processedData.vasp_address = data.vaspAddress || data.vasp?.address || '';
    processedData.vasp_legal_name = data.vaspLegalName || data.vasp?.legal_name || processedData.vasp_name;
    processedData.vasp_jurisdiction = data.vaspJurisdiction || data.vasp?.jurisdiction || '';
    
    processedData.case_number = data.caseNumber || data.case_number || '';
    processedData.statute = data.statute || '';
    processedData.crime_description = data.crimeDescription || data.crime_description || '';
    
    processedData.transaction_table = processedData.TRANSACTION_TABLE;
    processedData.transaction_list = processedData.TRANSACTION_LIST;
    processedData.transaction_count = processedData.TRANSACTION_COUNT;
    processedData.requested_info_list = processedData.REQUESTED_INFO_LIST;
    processedData.requested_info = processedData.REQUESTED_INFO_LIST;
    
    // Handle individual transaction fields (use first transaction if available)
    if (data.transactions && data.transactions.length > 0) {
      const firstTx = data.transactions[0];
      processedData.transaction_id = firstTx.transaction_id || '';
      processedData.transaction_date = firstTx.date || '';
      processedData.from_address = firstTx.from_address || '';
      processedData.to_address = firstTx.to_address || '';
      processedData.amount = firstTx.amount || '';
      processedData.currency = firstTx.currency || '';
    }
    
    return processedData;
  }
  
  // Get nested value from object
  getNestedValue(obj, path) {
    if (!path) return '';
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return '';
      }
    }
    
    return value || '';
  }
  
  // Validate template
  validateTemplate(content, markers) {
    const errors = [];
    const warnings = [];
    
    // Check for unclosed markers
    const openBrackets = (content.match(/\{\{/g) || []).length;
    const closeBrackets = (content.match(/\}\}/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      errors.push('Template has unclosed markers');
    }
    
    // Check for unknown markers
    const unknownMarkers = markers.filter(m => !m.isKnown);
    if (unknownMarkers.length > 0) {
      warnings.push(`Unknown markers found: ${unknownMarkers.map(m => m.marker).join(', ')}`);
    }
    
    // Check for required markers
    const requiredMarkers = ['{{VASP_NAME}}', '{{CASE_NUMBER}}'];
    const foundMarkers = markers.map(m => m.marker);
    const missingRequired = requiredMarkers.filter(rm => !foundMarkers.includes(rm));
    
    if (missingRequired.length > 0) {
      warnings.push(`Recommended markers not found: ${missingRequired.join(', ')}`);
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
  }
}

module.exports = new TemplateParser();