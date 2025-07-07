const { parse } = require('csv-parse/sync');
const fs = require('fs');

class MultiVaspCsvParser {
  /**
   * Parse CSV containing VASP and transaction data
   * Expected columns: Date, Transaction_ID, From, To, Amount, Currency, VASP_Name, VASP_Email, VASP_Address
   */
  async parseMultiVaspCSV(fileContent) {
    try {
      // Parse CSV with headers
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: (value, context) => {
          // Auto-cast numbers for Amount column
          if (context.column === 'Amount') {
            return parseFloat(value) || 0;
          }
          return value;
        }
      });

      // Group transactions by VASP
      const vaspGroups = this.groupByVasp(records);
      
      return vaspGroups;
    } catch (error) {
      console.error('CSV parsing error:', error);
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }
  }

  /**
   * Group transactions by VASP
   */
  groupByVasp(rawData) {
    const vaspMap = new Map();
    
    rawData.forEach((row) => {
      // Extract VASP info
      const vaspKey = row.VASP_Name || row.vasp_name || row['VASP Name'] || 'Unknown VASP';
      const vaspEmail = row.VASP_Email || row.vasp_email || row['VASP Email'] || '';
      const vaspAddress = row.VASP_Address || row.vasp_address || row['VASP Address'] || '';
      
      // Extract transaction info
      const transaction = {
        transaction_id: row.Transaction_ID || row.transaction_id || row.hash || row.tx_hash || '',
        date: row.Date || row.date || row.timestamp || '',
        amount: row.Amount || row.amount || row.value || '',
        from_address: row.From || row.from || row.from_address || row.sender || '',
        to_address: row.To || row.to || row.to_address || row.receiver || '',
        currency: row.Currency || row.currency || row.asset || 'BTC',
        notes: row.Notes || row.notes || row.description || ''
      };
      
      // Get or create VASP entry
      if (!vaspMap.has(vaspKey)) {
        vaspMap.set(vaspKey, {
          name: vaspKey,
          email: vaspEmail,
          address: vaspAddress,
          transactions: []
        });
      }
      
      // Add transaction to VASP
      const vasp = vaspMap.get(vaspKey);
      
      // Update VASP info if more complete data is found
      if (vaspEmail && !vasp.email) vasp.email = vaspEmail;
      if (vaspAddress && !vasp.address) vasp.address = vaspAddress;
      
      // Add transaction if it has valid data
      if (transaction.transaction_id || (transaction.from_address && transaction.to_address)) {
        vasp.transactions.push(transaction);
      }
    });
    
    return Array.from(vaspMap.values());
  }

  /**
   * Validate the grouped VASP data
   */
  validateVaspData(vaspGroups) {
    const errors = [];
    const validGroups = [];
    
    vaspGroups.forEach((vasp, index) => {
      const vaspErrors = [];
      
      // Validate VASP info
      if (!vasp.name || vasp.name === 'Unknown VASP') {
        vaspErrors.push(`VASP ${index + 1}: Missing VASP name`);
      }
      
      if (!vasp.email) {
        vaspErrors.push(`VASP ${vasp.name}: Missing email address`);
      }
      
      if (vasp.transactions.length === 0) {
        vaspErrors.push(`VASP ${vasp.name}: No valid transactions found`);
      }
      
      // Validate transactions
      vasp.transactions.forEach((tx, txIndex) => {
        if (!tx.transaction_id && !tx.from_address && !tx.to_address) {
          vaspErrors.push(`VASP ${vasp.name}, Transaction ${txIndex + 1}: Missing critical transaction data`);
        }
        
        if (tx.amount && isNaN(parseFloat(tx.amount))) {
          vaspErrors.push(`VASP ${vasp.name}, Transaction ${txIndex + 1}: Invalid amount format`);
        }
      });
      
      if (vaspErrors.length === 0) {
        validGroups.push(vasp);
      } else {
        errors.push(...vaspErrors);
      }
    });
    
    return {
      valid: validGroups,
      errors
    };
  }

  /**
   * Generate sample CSV content for users
   */
  generateSampleCSV() {
    const headers = 'Date,Transaction_ID,From,To,Amount,Currency,VASP_Name,VASP_Email,VASP_Address\n';
    const samples = [
      '2024-01-15,tx_abc123,1A2B3C4D5E6F,6F5E4D3C2B1A,1.5,BTC,Binance,compliance@binance.com,"123 Exchange Street, Crypto City"',
      '2024-01-16,tx_def456,2B3C4D5E6F7G,7G6F5E4D3C2B,2.75,ETH,Binance,compliance@binance.com,"123 Exchange Street, Crypto City"',
      '2024-01-17,tx_ghi789,3C4D5E6F7G8H,8H7G6F5E4D3C,0.5,BTC,Coinbase,legal@coinbase.com,"456 Bitcoin Boulevard, San Francisco"',
      '2024-01-18,tx_jkl012,4D5E6F7G8H9I,9I8H7G6F5E4D,100,USDT,Kraken,compliance@kraken.com,"789 Crypto Lane, Digital District"'
    ];
    
    return headers + samples.join('\n');
  }

  /**
   * Parse file from path
   */
  async parseMultiVaspFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return this.parseMultiVaspCSV(fileContent);
  }
}

module.exports = new MultiVaspCsvParser();