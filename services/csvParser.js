const { parse } = require('csv-parse');
const fs = require('fs');

class CSVParser {
  parseTransactionCSV(fileContent) {
    return new Promise((resolve, reject) => {
      const transactions = [];
      
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
      .on('data', (row) => {
        // Map common CSV column names to our transaction format
        const transaction = {
          hash: row.transaction_hash || row.hash || row.txhash || row.tx_hash,
          date: row.date || row.timestamp || row.time,
          amount: row.amount || row.value,
          from: row.from_address || row.from || row.sender,
          to: row.to_address || row.to || row.receiver || row.recipient,
          currency: row.currency || row.asset || 'Unknown',
          notes: row.notes || row.description || ''
        };
        
        transactions.push(transaction);
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        resolve(transactions);
      });
    });
  }

  async parseTransactionFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return this.parseTransactionCSV(fileContent);
  }

  validateTransactions(transactions) {
    const errors = [];
    const validTransactions = [];

    transactions.forEach((tx, index) => {
      const rowErrors = [];
      
      // Basic validation
      if (!tx.hash && !tx.from && !tx.to) {
        rowErrors.push(`Row ${index + 1}: Missing critical transaction data`);
      }
      
      if (tx.amount && isNaN(parseFloat(tx.amount))) {
        rowErrors.push(`Row ${index + 1}: Invalid amount format`);
      }

      if (rowErrors.length === 0) {
        validTransactions.push(tx);
      } else {
        errors.push(...rowErrors);
      }
    });

    return {
      valid: validTransactions,
      errors
    };
  }
}

module.exports = new CSVParser();