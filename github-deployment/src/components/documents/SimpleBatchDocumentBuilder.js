import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, AlertCircle, CheckCircle, FileText, Users, Info } from 'lucide-react';
import { documentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SimpleBatchDocumentBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  
  // Document parameters
  const [documentType, setDocumentType] = useState('freeze_request');
  const [caseInfo, setCaseInfo] = useState({
    caseNumber: '',
    statute: '',
    crimeDescription: ''
  });
  
  // Results
  const [batchResults, setBatchResults] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    // Preview first few lines
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').slice(0, 6);
      setCsvPreview(lines);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = `VASP_Name,VASP_Email,VASP_Address,VASP_Jurisdiction,Transaction_ID,Date,From_Address,To_Address,Amount,Currency
Binance US,compliance@binance.us,"1 Main St, San Francisco, CA",United States,abc123def456,2024-01-15,1A2B3C4D5E,5E4D3C2B1A,0.5,BTC
Coinbase,legal@coinbase.com,"100 Pine St, San Francisco, CA",United States,xyz789ghi012,2024-01-16,6F7G8H9I0J,0J9I8H7G6F,1.2,ETH
Kraken,compliance@kraken.com,"237 Kearny St, San Francisco, CA",United States,def456abc123,2024-01-17,2B3C4D5E6F,6F5E4D3C2B,100,USDT`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'simple_batch_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file');
      return;
    }
    
    if (!caseInfo.caseNumber || !caseInfo.crimeDescription) {
      setError('Please fill in all required case information');
      return;
    }
    
    setLoading(true);
    setError(null);
    setBatchResults(null);
    
    try {
      const formData = new FormData();
      formData.append('csv', selectedFile);
      formData.append('documentType', documentType);
      formData.append('caseNumber', caseInfo.caseNumber);
      formData.append('statute', caseInfo.statute);
      formData.append('crimeDescription', caseInfo.crimeDescription);
      
      // Add user profile data for auto-fill
      formData.append('agentName', `${user.firstName} ${user.lastName}`);
      formData.append('agentTitle', user.title || 'Special Agent');
      formData.append('agentEmail', user.email);
      formData.append('agentPhone', user.phone || '');
      formData.append('agentBadge', user.badgeNumber || '');
      formData.append('agencyName', user.agencyName);
      
      const response = await documentAPI.createSimpleBatch(formData);
      
      setBatchResults(response);
      setSuccess(`Successfully generated ${response.successful} documents!`);
      
      // Clear form
      setSelectedFile(null);
      setCsvPreview(null);
      setCaseInfo({
        caseNumber: '',
        statute: '',
        crimeDescription: ''
      });
      
    } catch (err) {
      console.error('Batch generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate batch documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Simple Batch Document Generator</h1>
        <p className="mt-2 text-gray-600">
          Generate multiple freeze requests or records requests from a CSV file
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* CSV Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h3>
            <p className="text-sm text-blue-800 mb-3">
              Your CSV file should include the following columns:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 mb-4">
              <li><strong>VASP_Name</strong> - The name of the Virtual Asset Service Provider</li>
              <li><strong>VASP_Email</strong> - Contact email for the VASP</li>
              <li><strong>VASP_Address</strong> - Physical address of the VASP</li>
              <li><strong>VASP_Jurisdiction</strong> - Country/jurisdiction of the VASP</li>
              <li><strong>Transaction_ID</strong> - Unique transaction identifier (optional)</li>
              <li><strong>Date</strong> - Transaction date (optional)</li>
              <li><strong>From_Address</strong> - Sender's crypto address (optional)</li>
              <li><strong>To_Address</strong> - Recipient's crypto address (optional)</li>
              <li><strong>Amount</strong> - Transaction amount (optional)</li>
              <li><strong>Currency</strong> - Cryptocurrency type (optional)</li>
            </ul>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </button>
          </div>
        </div>
      </div>

      {/* Document Type Selection */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Document Type</h2>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              value="freeze_request"
              checked={documentType === 'freeze_request'}
              onChange={(e) => setDocumentType(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3">
              <span className="font-medium">Freeze Request</span>
              <span className="text-sm text-gray-500 ml-2">Request to freeze cryptocurrency assets</span>
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="records_request"
              checked={documentType === 'records_request'}
              onChange={(e) => setDocumentType(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3">
              <span className="font-medium">Records Request</span>
              <span className="text-sm text-gray-500 ml-2">Request for transaction records and KYC information</span>
            </span>
          </label>
        </div>
      </div>

      {/* Case Information */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Case Information (Applied to All Documents)</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Case Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={caseInfo.caseNumber}
              onChange={(e) => setCaseInfo({...caseInfo, caseNumber: e.target.value})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2024-CF-001234"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Statute/Law
            </label>
            <input
              type="text"
              value={caseInfo.statute}
              onChange={(e) => setCaseInfo({...caseInfo, statute: e.target.value})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 18 U.S.C. § 1956"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Crime Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={caseInfo.crimeDescription}
              onChange={(e) => setCaseInfo({...caseInfo, crimeDescription: e.target.value})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Brief description of the crime under investigation"
              required
            />
          </div>
        </div>
      </div>

      {/* CSV Upload */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h2>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label htmlFor="csv-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                <span>Upload a CSV file</span>
                <input
                  id="csv-upload"
                  name="csv-upload"
                  type="file"
                  className="sr-only"
                  accept=".csv"
                  onChange={handleFileSelect}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              CSV files only, up to 10MB
            </p>
          </div>
        </div>
        
        {selectedFile && (
          <div className="mt-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({(selectedFile.size / 1024).toFixed(2)} KB)
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setCsvPreview(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {csvPreview && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">CSV Preview:</h4>
                <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-xs text-gray-300">
                    {csvPreview.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => navigate('/documents/simple')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Single Document
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedFile || !caseInfo.caseNumber || !caseInfo.crimeDescription}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Batch...
            </>
          ) : (
            <>
              <Users className="h-5 w-5 mr-2" />
              Generate Batch Documents
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {batchResults && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Generation Results</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">Total VASPs Processed:</span>
              <span className="text-sm text-gray-900">{batchResults.total}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">Documents Generated:</span>
              <span className="text-sm text-green-600">{batchResults.successful}</span>
            </div>
            {batchResults.failed > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Failed:</span>
                <span className="text-sm text-red-600">{batchResults.failed}</span>
              </div>
            )}
            {batchResults.downloadUrl && (
              <div className="mt-4 pt-4 border-t">
                <a
                  href={batchResults.downloadUrl}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Documents (ZIP)
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleBatchDocumentBuilder;