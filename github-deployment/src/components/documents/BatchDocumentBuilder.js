import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, AlertCircle, CheckCircle, FileText, Users, Loader, X } from 'lucide-react';
import { templateAPI } from '../../services/api';
import { downloadFile, getFullBackendUrl } from '../../utils/urlHelpers';

const BatchDocumentBuilder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  
  // Document parameters
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [documentType, setDocumentType] = useState('letterhead');
  const [outputFormat, setOutputFormat] = useState('pdf');
  
  const [caseInfo, setCaseInfo] = useState({
    case_number: '',
    statute: '',
    crime_description: ''
  });
  
  const [requestedInfo, setRequestedInfo] = useState([]);
  
  // Results
  const [batchResults, setBatchResults] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await templateAPI.getTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

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
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    downloadFile(`${apiUrl}/documents/batch/sample-csv`, 'vasp_batch_template.csv');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file');
      return;
    }
    
    if (!caseInfo.case_number || !caseInfo.crime_description) {
      setError('Please fill in all required case information');
      return;
    }
    
    const formData = new FormData();
    formData.append('csv', selectedFile);
    formData.append('template_id', selectedTemplate);
    formData.append('document_type', documentType);
    formData.append('case_number', caseInfo.case_number);
    formData.append('statute', caseInfo.statute);
    formData.append('crime_description', caseInfo.crime_description);
    formData.append('outputFormat', outputFormat);
    formData.append('requested_info', JSON.stringify(requestedInfo));
    
    try {
      setUploading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/documents/batch/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate documents');
      }
      
      const data = await response.json();
      setBatchResults(data);
      
      if (data.needsZip) {
        setSuccess(`Successfully generated ${data.summary.successful} documents. Documents saved to history. Downloading ZIP file...`);
        
        // Download ZIP for more than 5 documents
        if (data.downloadUrl) {
          setTimeout(() => {
            downloadFile(data.downloadUrl, 'vasp_documents.zip');
          }, 1000);
        }
      } else {
        setSuccess(`Successfully generated ${data.summary.successful} documents. Documents saved to history - you can download them individually.`);
      }
      
    } catch (err) {
      console.error('Batch generation error:', err);
      setError(err.message || 'Failed to generate batch documents');
    } finally {
      setUploading(false);
    }
  };

  const infoOptions = [
    { id: 'kyc_info', label: 'KYC Information' },
    { id: 'transaction_history', label: 'Transaction History' },
    { id: 'ip_addresses', label: 'IP Addresses' },
    { id: 'device_info', label: 'Device Information' },
    { id: 'account_activity', label: 'Account Activity' },
    { id: 'linked_accounts', label: 'Linked Accounts' },
    { id: 'source_of_funds', label: 'Source of Funds' },
    { id: 'communications', label: 'Communications' }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Batch Document Generation</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate multiple documents for different VASPs from a single CSV file
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="h-5 w-5 text-red-400" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1: CSV Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
              Upload Multi-VASP CSV
            </h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Upload a CSV file containing VASP information and transactions
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  Select CSV File
                </label>
                
                {selectedFile && (
                  <div className="mt-4 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download CSV Template
                </button>
                
                <div className="text-sm text-gray-500">
                  Required columns: Date, Transaction_ID, From, To, Amount, Currency, VASP_Name, VASP_Email, VASP_Address
                </div>
              </div>
              
              {csvPreview && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">CSV Preview:</h4>
                  <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
                    {csvPreview.map((line, index) => (
                      <div key={index} className={index === 0 ? 'font-bold' : ''}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Document Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
              Document Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="letterhead">Agency Letterhead</option>
                  <option value="subpoena">Subpoena</option>
                  <option value="freeze_request">Freeze Request</option>
                  <option value="records_request">Records Request</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">Word Document</option>
                </select>
              </div>
              
              {templates.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Case Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
              Case Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={caseInfo.case_number}
                  onChange={(e) => setCaseInfo({...caseInfo, case_number: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., 2024-CF-001234"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Statute/Code
                </label>
                <input
                  type="text"
                  value={caseInfo.statute}
                  onChange={(e) => setCaseInfo({...caseInfo, statute: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., 18 U.S.C. § 1956"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crime Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={caseInfo.crime_description}
                  onChange={(e) => setCaseInfo({...caseInfo, crime_description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Brief description of the criminal activity being investigated..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Information
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {infoOptions.map(option => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={requestedInfo.includes(option.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRequestedInfo([...requestedInfo, option.id]);
                          } else {
                            setRequestedInfo(requestedInfo.filter(id => id !== option.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          {batchResults && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generation Results</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{batchResults.summary.total}</div>
                  <div className="text-sm text-gray-500">Total VASPs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{batchResults.summary.successful}</div>
                  <div className="text-sm text-gray-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{batchResults.summary.failed}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
              </div>
              
              {!batchResults.needsZip && batchResults.summary.successful > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Since you generated 5 or fewer documents, they have been saved to your document history 
                    where you can download them individually.
                  </p>
                  <button
                    onClick={() => navigate('/documents/history')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View in Document History →
                  </button>
                </div>
              )}
              
              {batchResults.needsZip && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Your documents have been generated and saved to history. Since you generated more than 5 documents, 
                    they've been packaged into a ZIP file for convenient download.
                  </p>
                </div>
              )}
              
              {batchResults.results.failed.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-600 mb-2">Failed Documents:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {batchResults.results.failed.map((fail, index) => (
                      <li key={index}>
                        {fail.vaspName}: {fail.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/documents/new')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Single Document Mode
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Generating Documents...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Batch Documents
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchDocumentBuilder;