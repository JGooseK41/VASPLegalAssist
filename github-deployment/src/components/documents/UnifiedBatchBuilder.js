import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, AlertCircle, CheckCircle, FileText, Users, Info, X, ArrowLeft, HelpCircle } from 'lucide-react';
import { documentAPI, templateAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../hooks/useEncryption';
import { createEncryptedTemplateAPI } from '../../services/encryptedApi';
import { getFullBackendUrl } from '../../utils/urlHelpers';

const UnifiedBatchBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Mode selection
  const [mode, setMode] = useState('simple'); // 'simple' or 'custom'
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  
  // Simple mode options
  const [documentType, setDocumentType] = useState('freeze_request');
  
  // Custom mode options
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [outputFormat, setOutputFormat] = useState('pdf');
  
  // Common fields
  const [caseInfo, setCaseInfo] = useState({
    caseNumber: '',
    statute: '',
    crimeDescription: ''
  });
  
  // Results
  const [batchResults, setBatchResults] = useState(null);
  
  // Template markers for custom mode
  const [selectedTemplateMarkers, setSelectedTemplateMarkers] = useState([]);
  
  // Initialize encryption for custom templates
  const encryption = useEncryption();
  const encryptedTemplateAPI = React.useMemo(() => {
    if (encryption.isKeyReady) {
      return createEncryptedTemplateAPI(encryption);
    }
    return null;
  }, [encryption]);

  useEffect(() => {
    if (mode === 'custom' && encryptedTemplateAPI) {
      loadTemplates();
    }
  }, [mode, encryptedTemplateAPI]);

  const loadTemplates = async () => {
    try {
      if (!encryptedTemplateAPI) return;
      
      const data = await encryptedTemplateAPI.getTemplates();
      const smartTemplates = data.filter(t => t.fileUrl && t.fileType);
      setTemplates(smartTemplates);
      
      if (smartTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(smartTemplates[0].id);
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

  // Helper function to check if a marker exists in the template
  const hasMarker = (markerName) => {
    return selectedTemplateMarkers.some(marker => 
      marker.marker?.toLowerCase() === markerName.toLowerCase() ||
      marker.marker?.toLowerCase() === `{{${markerName.toLowerCase()}}}` ||
      marker.name?.toLowerCase() === markerName.toLowerCase() ||
      marker === markerName ||
      marker === `{{${markerName}}}`
    );
  };

  // Generate dynamic CSV headers based on template markers
  const generateDynamicCSVHeaders = () => {
    const baseHeaders = ['VASP_Name'];
    const dynamicHeaders = [];
    
    // Transaction fields
    if (hasMarker('TRANSACTION_ID') || hasMarker('TRANSACTION_LIST') || hasMarker('TRANSACTION_TABLE')) {
      dynamicHeaders.push('Transaction_ID', 'Date', 'From_Address', 'To_Address', 'Amount', 'Currency');
    }
    
    // Date fields
    if (hasMarker('DATE_DEADLINE')) {
      dynamicHeaders.push('Date_Deadline');
    }
    
    // Agency contact fields
    if (hasMarker('AGENCY_PHONE')) {
      dynamicHeaders.push('Agency_Phone');
    }
    if (hasMarker('AGENCY_EMAIL')) {
      dynamicHeaders.push('Agency_Email');
    }
    
    // Investigator fields
    if (hasMarker('INVESTIGATOR_NAME')) {
      dynamicHeaders.push('Investigator_Name');
    }
    if (hasMarker('INVESTIGATOR_TITLE')) {
      dynamicHeaders.push('Investigator_Title');
    }
    if (hasMarker('INVESTIGATOR_BADGE')) {
      dynamicHeaders.push('Investigator_Badge');
    }
    
    // Custom fields
    if (hasMarker('CUSTOM_FIELD_1')) {
      dynamicHeaders.push('Custom_Field_1');
    }
    if (hasMarker('CUSTOM_FIELD_2')) {
      dynamicHeaders.push('Custom_Field_2');
    }
    if (hasMarker('CUSTOM_FIELD_3')) {
      dynamicHeaders.push('Custom_Field_3');
    }
    
    return [...baseHeaders, ...dynamicHeaders];
  };

  const handleDownloadTemplate = () => {
    let csvContent;
    
    if (mode === 'simple') {
      csvContent = `VASP_Name,Transaction_ID,Date,From_Address,To_Address,Amount,Currency
Binance US,abc123def456,2024-01-15,1A2B3C4D5E,5E4D3C2B1A,0.5,BTC
Coinbase,xyz789ghi012,2024-01-16,6F7G8H9I0J,0J9I8H7G6F,1.2,ETH
Kraken,def456abc123,2024-01-17,2B3C4D5E6F,6F5E4D3C2B,100,USDT`;
    } else {
      // Generate dynamic headers based on selected template
      const headers = generateDynamicCSVHeaders();
      csvContent = headers.join(',') + '\n';
      
      // Add sample rows with dynamic fields
      const sampleRow1 = ['Binance US'];
      const sampleRow2 = ['Coinbase'];
      const sampleRow3 = ['Kraken'];
      
      // Add values for each dynamic header
      headers.slice(1).forEach(header => {
        if (header.includes('Transaction') || header === 'Date' || header.includes('Address') || header === 'Amount' || header === 'Currency') {
          sampleRow1.push(header === 'Transaction_ID' ? 'abc123def456' : 
                           header === 'Date' ? '2024-01-15' :
                           header === 'From_Address' ? '1A2B3C4D5E' :
                           header === 'To_Address' ? '5E4D3C2B1A' :
                           header === 'Amount' ? '0.5' :
                           header === 'Currency' ? 'BTC' : '');
          sampleRow2.push(header === 'Transaction_ID' ? 'xyz789ghi012' : 
                           header === 'Date' ? '2024-01-16' :
                           header === 'From_Address' ? '6F7G8H9I0J' :
                           header === 'To_Address' ? '0J9I8H7G6F' :
                           header === 'Amount' ? '1.2' :
                           header === 'Currency' ? 'ETH' : '');
          sampleRow3.push(header === 'Transaction_ID' ? 'def456abc123' : 
                           header === 'Date' ? '2024-01-17' :
                           header === 'From_Address' ? '2B3C4D5E6F' :
                           header === 'To_Address' ? '6F5E4D3C2B' :
                           header === 'Amount' ? '100' :
                           header === 'Currency' ? 'USDT' : '');
        } else if (header === 'Date_Deadline') {
          sampleRow1.push('2024-02-15');
          sampleRow2.push('2024-02-16');
          sampleRow3.push('2024-02-17');
        } else {
          // For other fields, add empty sample values
          sampleRow1.push('');
          sampleRow2.push('');
          sampleRow3.push('');
        }
      });
      
      csvContent += sampleRow1.join(',') + '\n';
      csvContent += sampleRow2.join(',') + '\n';
      csvContent += sampleRow3.join(',');
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vasp_batch_template.csv';
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
    
    if (mode === 'custom' && !selectedTemplate) {
      setError('Please select a template');
      return;
    }
    
    setLoading(true);
    setError(null);
    setBatchResults(null);
    
    try {
      const formData = new FormData();
      formData.append('csv', selectedFile);
      formData.append('mode', mode);
      formData.append('caseNumber', caseInfo.caseNumber);
      formData.append('statute', caseInfo.statute);
      formData.append('crimeDescription', caseInfo.crimeDescription);
      
      // Add user profile data
      formData.append('agentName', `${user.firstName} ${user.lastName}`);
      formData.append('agentTitle', user.title || 'Special Agent');
      formData.append('agentEmail', user.email);
      formData.append('agentPhone', user.phone || '');
      formData.append('agentBadge', user.badgeNumber || '');
      formData.append('agencyName', user.agencyName);
      
      let response;
      if (mode === 'simple') {
        formData.append('documentType', documentType);
        response = await documentAPI.createSimpleBatch(formData);
      } else {
        formData.append('templateId', selectedTemplate);
        formData.append('outputFormat', outputFormat);
        response = await documentAPI.createCustomBatch(formData);
      }
      
      setBatchResults(response);
      setSuccess(`Successfully generated ${response.successful || 0} documents!`);
      
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Batch Document Generator</h1>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-600 hover:text-blue-800 p-2"
            title="Help"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-600">
          Generate multiple documents at once from a CSV file (maximum 100 VASPs per batch)
        </p>
      </div>

      {showHelp && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-blue-900 text-lg">How Batch Document Generation Works</h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">Why Use Batch Processing?</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Generate dozens of personalized documents in seconds instead of hours</li>
                <li>Maintain consistency across all documents with the same template</li>
                <li>Track all case-specific data in one CSV file for easy management</li>
                <li>Reduce errors by automating repetitive document creation</li>
                <li>Download all documents in a single ZIP file</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Simple vs Custom Mode</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-white rounded p-3">
                  <h5 className="font-medium text-blue-900 mb-1">Simple Documents</h5>
                  <p className="text-xs">Pre-built templates for freeze requests and records requests. Fixed format, quick to use.</p>
                </div>
                <div className="bg-white rounded p-3">
                  <h5 className="font-medium text-blue-900 mb-1">Custom Templates</h5>
                  <p className="text-xs">Use your uploaded templates with smart tags. CSV format adapts to your template's needs.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Custom Template Magic ✨</h4>
              <p className="mb-2">When you select a custom template, the system:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Detects all smart tags in your template (like {`{{INVESTIGATOR_NAME}}`} or {`{{DATE_DEADLINE}}`})</li>
                <li>Generates a custom CSV format with only the fields your template needs</li>
                <li>Allows you to provide different values for each VASP (e.g., different deadlines, investigators)</li>
                <li>Automatically fills in VASP details from our database and your profile</li>
              </ol>
            </div>
            
            <div className="bg-blue-100 rounded p-3">
              <p className="font-medium text-blue-900 mb-1">💡 Pro Tip:</p>
              <p className="text-xs">
                Create a master tracking spreadsheet with all your case data, then export just the columns 
                needed for each template. This lets you maintain one source of truth while generating 
                different document types as needed.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Mode Selection */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Document Mode</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode('simple')}
            className={`p-4 rounded-lg border-2 transition-all ${
              mode === 'simple'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText className={`h-8 w-8 mx-auto mb-2 ${
              mode === 'simple' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <h3 className={`font-medium ${
              mode === 'simple' ? 'text-blue-900' : 'text-gray-700'
            }`}>Simple Documents</h3>
            <p className="text-sm text-gray-600 mt-1">
              Standard freeze & records requests
            </p>
          </button>
          
          <button
            onClick={() => setMode('custom')}
            className={`p-4 rounded-lg border-2 transition-all ${
              mode === 'custom'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className={`h-8 w-8 mx-auto mb-2 ${
              mode === 'custom' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <h3 className={`font-medium ${
              mode === 'custom' ? 'text-blue-900' : 'text-gray-700'
            }`}>Custom Templates</h3>
            <p className="text-sm text-gray-600 mt-1">
              Use your uploaded templates
            </p>
          </button>
        </div>
      </div>

      {/* Document Type / Template Selection */}
      {mode === 'simple' ? (
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
      ) : (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Template</h2>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">No custom templates found</p>
              <button
                onClick={() => navigate('/templates')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Upload Template
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {templates.map((template) => (
                  <label key={template.id} className="flex items-center">
                    <input
                      type="radio"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={(e) => {
                        setSelectedTemplate(e.target.value);
                        // Find and parse template markers
                        const template = templates.find(t => t.id === e.target.value);
                        if (template && template.markers) {
                          try {
                            const markers = JSON.parse(template.markers);
                            setSelectedTemplateMarkers(markers);
                          } catch (error) {
                            console.error('Failed to parse template markers:', error);
                            setSelectedTemplateMarkers([]);
                          }
                        } else {
                          setSelectedTemplateMarkers([]);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3">
                      <span className="font-medium">{template.templateName}</span>
                      <span className="text-sm text-gray-500 ml-2">({template.templateType})</span>
                    </span>
                  </label>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pdf"
                      checked={outputFormat === 'pdf'}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3">PDF</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="docx"
                      checked={outputFormat === 'docx'}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3">Word (DOCX)</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CSV Format Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-800 mb-3">
              {mode === 'simple' 
                ? 'Your CSV should include: VASP_Name and transaction details (Transaction_ID, Date, From_Address, To_Address, Amount, Currency).'
                : selectedTemplate && selectedTemplateMarkers.length > 0 
                  ? `This template requires: VASP_Name${generateDynamicCSVHeaders().slice(1).length > 0 ? ', ' + generateDynamicCSVHeaders().slice(1).join(', ') : ''}`
                  : 'Select a template to see required CSV fields'
              }
              {' Maximum 100 VASPs per batch file.'}
            </p>
            {(mode === 'simple' || (mode === 'custom' && selectedTemplate)) && (
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </button>
            )}
          </div>
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
        
        {/* CSV Format Info */}
        {mode === 'simple' ? (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">Simplified CSV Format</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Your CSV only needs transaction data and VASP names. We automatically pull:
                </p>
                <ul className="mt-2 text-sm text-blue-800 list-disc list-inside">
                  <li>VASP compliance emails, addresses, and jurisdictions from our database</li>
                  <li>Your agency information from your profile</li>
                  <li>Case information from the form above</li>
                </ul>
                <div className="mt-3 bg-blue-100 rounded p-2">
                  <p className="text-xs font-mono text-blue-900">
                    Required columns: VASP_Name, Transaction_ID, Date, From_Address, To_Address, Amount, Currency
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          selectedTemplate && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900">Dynamic CSV Format</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    This template's CSV format adapts to the smart tags detected. We automatically provide:
                  </p>
                  <ul className="mt-2 text-sm text-blue-800 list-disc list-inside">
                    <li>VASP details from our database (just provide VASP name)</li>
                    <li>Your agency and agent information from your profile</li>
                    <li>Case information from the form above</li>
                  </ul>
                  <div className="mt-3 bg-blue-100 rounded p-2">
                    <p className="text-xs font-mono text-blue-900">
                      Required columns: {generateDynamicCSVHeaders().join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        
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
              CSV files only, up to 10MB, maximum 100 VASPs per batch
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
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedFile || !caseInfo.caseNumber || !caseInfo.crimeDescription || (mode === 'custom' && !selectedTemplate)}
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
                  href={getFullBackendUrl(batchResults.downloadUrl)}
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

export default UnifiedBatchBuilder;