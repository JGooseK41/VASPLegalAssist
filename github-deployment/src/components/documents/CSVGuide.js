import React, { useState } from 'react';
import { Download, FileSpreadsheet, Info, ChevronDown, ChevronUp, Database, FileText, AlertCircle } from 'lucide-react';

const CSVGuide = ({ onClose }) => {
  const [expandedSection, setExpandedSection] = useState('overview');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const downloadSampleCSV = () => {
    const csvContent = `Date,Transaction_ID,From,To,Amount,Currency,VASP_Name,VASP_Email,VASP_Address
2024-01-15,0x1234567890abcdef,1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa,3FKj82Ld5E8aPV2zW8Kx9N4Mb7JcENq8xR,1.5,BTC,Binance,compliance@binance.com,"Binance Holdings Ltd, Level 14, Currency House, 39 Cybercity, Ebene 72201, Mauritius"
2024-01-16,0xabcdef1234567890,0x742d35Cc6634C0532925a3b844Bc9e7595f8E79b,0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed,2.75,ETH,Binance,compliance@binance.com,"Binance Holdings Ltd, Level 14, Currency House, 39 Cybercity, Ebene 72201, Mauritius"
2024-01-17,0x9876543210fedcba,bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh,bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4,0.5,BTC,Coinbase,legal@coinbase.com,"Coinbase Global Inc, 100 Pine Street Suite 1250, San Francisco, CA 94111"
2024-01-18,0xfedcba0987654321,TN3W4FS7u4iF5KJzKqE1XwZ8Hpg5BpJ5qN,TRX9DGDzVLZGqYzqEwpkiZfBPpfKW8WZSU,100,USDT,Kraken,compliance@kraken.com,"Payward Inc (Kraken), 237 Kearny Street Suite 102, San Francisco, CA 94108"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vasp_batch_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FileSpreadsheet className="h-6 w-6 mr-2 text-blue-600" />
            CSV Preparation Guide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {/* Overview Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('overview')}
              className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Overview
              </h3>
              {expandedSection === 'overview' ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSection === 'overview' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 mb-4">
                  The batch document generation feature allows you to create multiple legal documents for different VASPs 
                  (Virtual Asset Service Providers) from a single CSV file. This is particularly useful when your investigation 
                  involves multiple exchanges or crypto services.
                </p>
                
                <div className="bg-white p-4 rounded border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Required CSV Columns:</h4>
                  <ul className="space-y-2 text-sm">
                    <li><code className="bg-gray-100 px-1 rounded">Date</code> - Transaction date (YYYY-MM-DD format)</li>
                    <li><code className="bg-gray-100 px-1 rounded">Transaction_ID</code> - Transaction hash or ID</li>
                    <li><code className="bg-gray-100 px-1 rounded">From</code> - Sending wallet address</li>
                    <li><code className="bg-gray-100 px-1 rounded">To</code> - Receiving wallet address</li>
                    <li><code className="bg-gray-100 px-1 rounded">Amount</code> - Transaction amount</li>
                    <li><code className="bg-gray-100 px-1 rounded">Currency</code> - Cryptocurrency type (BTC, ETH, USDT, etc.)</li>
                    <li><code className="bg-gray-100 px-1 rounded">VASP_Name</code> - Name of the exchange/service</li>
                    <li><code className="bg-gray-100 px-1 rounded">VASP_Email</code> - Compliance contact email</li>
                    <li><code className="bg-gray-100 px-1 rounded">VASP_Address</code> - Physical/legal address</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('manual')}
              className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-green-900 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Method 1: Manual Investigation Entry
              </h3>
              {expandedSection === 'manual' ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSection === 'manual' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 mb-4">
                  For smaller investigations or when you've manually identified transactions:
                </p>
                
                <ol className="space-y-3">
                  <li className="flex">
                    <span className="font-bold text-green-600 mr-2">1.</span>
                    <div>
                      <p className="font-medium">Create a new spreadsheet</p>
                      <p className="text-sm text-gray-600">Use Excel, Google Sheets, or any spreadsheet application</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <span className="font-bold text-green-600 mr-2">2.</span>
                    <div>
                      <p className="font-medium">Add column headers</p>
                      <p className="text-sm text-gray-600">Copy exactly: Date,Transaction_ID,From,To,Amount,Currency,VASP_Name,VASP_Email,VASP_Address</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <span className="font-bold text-green-600 mr-2">3.</span>
                    <div>
                      <p className="font-medium">Enter your investigation data</p>
                      <p className="text-sm text-gray-600">For each suspicious transaction, fill in:</p>
                      <ul className="mt-2 ml-4 text-sm space-y-1">
                        <li>• Transaction details from blockchain explorer</li>
                        <li>• VASP information from your intelligence sources</li>
                        <li>• Use consistent VASP names for proper grouping</li>
                      </ul>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <span className="font-bold text-green-600 mr-2">4.</span>
                    <div>
                      <p className="font-medium">Save as CSV</p>
                      <p className="text-sm text-gray-600">File → Save As → Choose "CSV (Comma delimited)" format</p>
                    </div>
                  </li>
                </ol>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Pro Tip:</strong> Keep a master spreadsheet of known VASP compliance contacts. 
                    You can copy-paste the VASP_Email and VASP_Address columns to ensure consistency.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Forensic Tools Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('forensic')}
              className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Method 2: Export from Forensic Tools
              </h3>
              {expandedSection === 'forensic' ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSection === 'forensic' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-6">
                {/* TRM Labs */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <img src="/images/trm-logo.png" alt="TRM" className="h-5 w-5 mr-2" />
                    TRM Labs Export
                  </h4>
                  <ol className="space-y-2 text-sm">
                    <li><span className="font-medium">1.</span> In TRM Forensics, navigate to your investigation</li>
                    <li><span className="font-medium">2.</span> Go to "Transactions" tab → "Export" → "CSV"</li>
                    <li><span className="font-medium">3.</span> Select fields: Date, Transaction Hash, From Address, To Address, Amount, Asset</li>
                    <li><span className="font-medium">4.</span> After export, add VASP columns manually:</li>
                    <li className="ml-4">
                      • Use TRM's "Attribution" data to identify VASP names
                      <br />
                      • Look up compliance contacts from VASP websites
                      <br />
                      • Add physical addresses from public records
                    </li>
                  </ol>
                </div>

                {/* Chainalysis */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <img src="/images/chainalysis-logo.png" alt="Chainalysis" className="h-5 w-5 mr-2" />
                    Chainalysis Reactor Export
                  </h4>
                  <ol className="space-y-2 text-sm">
                    <li><span className="font-medium">1.</span> In Reactor, select your investigation graph</li>
                    <li><span className="font-medium">2.</span> Click "Export" → "Transaction List" → "CSV"</li>
                    <li><span className="font-medium">3.</span> The export includes attribution data</li>
                    <li><span className="font-medium">4.</span> Rename columns to match our format:</li>
                    <li className="ml-4">
                      • "Hash" → "Transaction_ID"
                      <br />
                      • "Sender" → "From"
                      <br />
                      • "Recipient" → "To"
                      <br />
                      • "Service Name" → "VASP_Name"
                    </li>
                    <li><span className="font-medium">5.</span> Add missing VASP_Email and VASP_Address columns</li>
                  </ol>
                </div>

                {/* Qlue */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Qlue (GraphSense) Export
                  </h4>
                  <ol className="space-y-2 text-sm">
                    <li><span className="font-medium">1.</span> In Qlue, navigate to your investigation workspace</li>
                    <li><span className="font-medium">2.</span> Select "Export" → "Transactions" → "CSV Format"</li>
                    <li><span className="font-medium">3.</span> Map Qlue fields to our format:</li>
                    <li className="ml-4">
                      • "tx_hash" → "Transaction_ID"
                      <br />
                      • "input_address" → "From"
                      <br />
                      • "output_address" → "To"
                      <br />
                      • "value" → "Amount"
                      <br />
                      • "currency" → "Currency"
                    </li>
                    <li><span className="font-medium">4.</span> Use Qlue's attribution tags to identify VASPs</li>
                    <li><span className="font-medium">5.</span> Manually add VASP contact information</li>
                  </ol>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Most forensic tools don't export VASP compliance contact information. 
                    You'll need to add VASP_Email and VASP_Address columns manually using publicly available information 
                    or your agency's intelligence database.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Data Structuring Tips */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('tips')}
              className="w-full flex items-center justify-between p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Important Tips & Best Practices
              </h3>
              {expandedSection === 'tips' ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSection === 'tips' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">VASP Name Consistency</h4>
                    <p className="text-sm text-gray-700">
                      Use exact same VASP names for proper grouping. The system groups transactions by VASP_Name.
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-green-50 p-2 rounded">
                        <p className="font-medium text-green-800">✓ Correct:</p>
                        <code>Binance</code> (consistent)
                      </div>
                      <div className="bg-red-50 p-2 rounded">
                        <p className="font-medium text-red-800">✗ Incorrect:</p>
                        <code>Binance, BINANCE, Binance.com</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Address Formats</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Bitcoin addresses: Start with 1, 3, or bc1</li>
                      <li>• Ethereum addresses: Start with 0x (42 characters)</li>
                      <li>• Include full addresses without truncation</li>
                      <li>• Case sensitivity matters for some blockchains</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Date Formatting</h4>
                    <p className="text-sm text-gray-700">
                      Use YYYY-MM-DD format (e.g., 2024-01-15) for consistency. 
                      Excel tip: Format cells as "Custom" with format: yyyy-mm-dd
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">VASP Information Sources</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Check exchange websites for compliance/legal contact</li>
                      <li>• Look for "Law Enforcement" or "Legal" sections</li>
                      <li>• Use FinCEN MSB database for US entities</li>
                      <li>• Consult your agency's VASP contact database</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-medium text-yellow-900 mb-1">Pre-Upload Checklist:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>☐ All required columns present and correctly named</li>
                      <li>☐ VASP names are consistent throughout</li>
                      <li>☐ Email addresses are valid format</li>
                      <li>☐ No empty rows or extra columns</li>
                      <li>☐ File saved as .csv (not .xlsx)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Download Section */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Ready to start?</h4>
                <p className="text-sm text-gray-600">Download our template CSV with sample data</p>
              </div>
              <button
                onClick={downloadSampleCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVGuide;