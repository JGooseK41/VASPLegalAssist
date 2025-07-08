import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Download, AlertCircle, CheckCircle, Search, Upload, Plus, HelpCircle, Users, Info, ArrowLeft } from 'lucide-react';
import { documentAPI, templateAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../hooks/useEncryption';
import { createEncryptedDocumentAPI, createEncryptedTemplateAPI } from '../../services/encryptedApiOptimized';

const CustomDocumentBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Initialize encryption
  const encryption = useEncryption();
  
  // Create stable API references
  // Since the encryption functions are memoized in useEncryption,
  // they should be stable unless the key changes
  const encryptedDocumentAPI = React.useMemo(() => {
    if (encryption.isKeyReady) {
      return createEncryptedDocumentAPI(encryption);
    }
    return null;
  }, [encryption.isKeyReady, encryption.encrypt, encryption.decrypt, encryption.encryptFields, encryption.decryptFields]);
  
  const encryptedTemplateAPI = React.useMemo(() => {
    if (encryption.isKeyReady) {
      return createEncryptedTemplateAPI(encryption);
    }
    return null;
  }, [encryption.isKeyReady, encryption.encrypt, encryption.decrypt, encryption.encryptFields, encryption.decryptFields]);
  
  // Template selection
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateMarkers, setTemplateMarkers] = useState([]);
  
  // VASP Data
  const [selectedVASP, setSelectedVASP] = useState(null);
  
  // Document Data
  const [documentData, setDocumentData] = useState({
    caseNumber: '',
    statute: '',
    crimeDescription: '',
    requestedInfo: [],
    // Additional fields based on template
    customFields: {}
  });
  
  // Transaction
  const [transaction, setTransaction] = useState({
    transaction_id: '',
    from_address: '',
    to_address: '',
    amount: '',
    currency: 'BTC',
    date: ''
  });
  
  const [outputFormat, setOutputFormat] = useState('pdf');

  useEffect(() => {
    // Check for selected VASP from session storage
    const vaspData = sessionStorage.getItem('selectedVASP');
    if (vaspData) {
      setSelectedVASP(JSON.parse(vaspData));
      sessionStorage.removeItem('selectedVASP');
    }
    
    // Load templates when encryption is ready
    if (encryptedTemplateAPI) {
      loadTemplates();
    } else if (encryption.isKeyReady === false) {
      setError('Encryption is initializing. Please wait a moment and try again.');
    }
  }, [encryptedTemplateAPI, encryption.isKeyReady]);

  const loadTemplates = async () => {
    try {
      if (!encryptedTemplateAPI) return;
      
      const data = await encryptedTemplateAPI.getTemplates();
      // Filter to only show smart templates (with file uploads)
      const smartTemplates = data.filter(t => t.fileUrl && t.fileType);
      setTemplates(smartTemplates);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load templates');
    }
  };

  const handleSelectVASP = () => {
    navigate('/search');
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    
    // Find the selected template and parse its markers
    const template = templates.find(t => t.id === templateId);
    if (template && template.markers) {
      try {
        const markers = JSON.parse(template.markers);
        setTemplateMarkers(markers);
      } catch (error) {
        console.error('Failed to parse template markers:', error);
        setTemplateMarkers([]);
      }
    } else {
      setTemplateMarkers([]);
    }
  };

  // Helper function to check if a marker exists in the template
  const hasMarker = (markerName) => {
    return templateMarkers.some(marker => 
      marker.toLowerCase() === markerName.toLowerCase() ||
      marker.toLowerCase() === `{{${markerName.toLowerCase()}}}` ||
      marker === markerName
    );
  };

  const handleGenerateDocument = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }
    
    if (!selectedVASP) {
      setError('Please select a VASP');
      return;
    }
    
    if (!documentData.caseNumber || !documentData.crimeDescription) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare the document request
      const requestData = {
        vasp_id: selectedVASP.id,
        template_id: selectedTemplate,
        document_type: 'custom',
        case_info: {
          case_number: documentData.caseNumber,
          statute: documentData.statute,
          crime_description: documentData.crimeDescription
        },
        transactions: transaction.transaction_id ? [transaction] : [],
        metadata: {
          vasp_name: selectedVASP.name,
          created_at: new Date().toISOString()
        },
        outputFormat: outputFormat,
        
        // Additional data for smart placeholders
        custom_data: {
          ...documentData.customFields,
          // Auto-filled data from profile
          vaspName: selectedVASP.name,
          vaspEmail: selectedVASP.email || '',
          vaspAddress: selectedVASP.address || '',
          vaspJurisdiction: selectedVASP.jurisdiction || '',
          agentName: `${user.firstName} ${user.lastName}`,
          agentTitle: user.title || '',
          agentEmail: user.email,
          agentPhone: user.phone || '',
          agentBadge: user.badgeNumber || '',
          agencyName: user.agencyName,
          agencyAddress: user.agencyAddress || '',
          dateToday: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          // Advanced fields from form
          dateDeadline: documentData.dateDeadline || '',
          agencyPhone: documentData.agencyPhone || user.phone || '',
          agencyEmail: documentData.agencyEmail || user.email || '',
          investigatorName: documentData.investigatorName || `${user.firstName} ${user.lastName}`,
          investigatorTitle: documentData.investigatorTitle || user.title || '',
          investigatorBadge: documentData.investigatorBadge || user.badgeNumber || '',
          requestedInfo: documentData.requestedInfo || [],
          customField1: documentData.customField1 || '',
          customField2: documentData.customField2 || '',
          customField3: documentData.customField3 || ''
        }
      };
      
      if (!encryptedDocumentAPI) {
        setError('Encryption is not ready. Please wait a moment and try again, or refresh the page if this persists.');
        setLoading(false);
        return;
      }
      
      const response = await encryptedDocumentAPI.createDocument(requestData);
      
      if (response.documentUrl || response.pdf_url) {
        // Download the document
        const link = document.createElement('a');
        link.href = response.documentUrl || response.pdf_url;
        const fileExtension = outputFormat === 'docx' ? 'docx' : 'pdf';
        link.download = `custom_${selectedVASP.name}_${documentData.caseNumber}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSuccess(`Document created successfully as ${fileExtension.toUpperCase()}!`);
        
        // Clear form after a short delay
        setTimeout(() => {
          setDocumentData({
            caseNumber: '',
            statute: '',
            crimeDescription: '',
            requestedInfo: [],
            customFields: {}
          });
          setTransaction({
            transaction_id: '',
            from_address: '',
            to_address: '',
            amount: '',
            currency: 'BTC',
            date: ''
          });
          setSuccess(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to create document:', err);
      setError(err.response?.data?.error || 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </button>
      </div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Document Builder</h1>
            <p className="mt-2 text-gray-600">
              Create documents using your custom templates with smart tags
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/documents/batch"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Batch Mode
            </Link>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-blue-600 hover:text-blue-800 p-2"
              title="Help"
            >
              <HelpCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to Use Custom Documents</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>First, upload your custom templates in the "My Templates" section</li>
            <li>Select a template from your uploaded templates</li>
            <li>Choose a VASP from the database</li>
            <li>Fill in the case information</li>
            <li>The system will automatically fill in smart tags like {`{{VASP_NAME}}`}, {`{{AGENT_NAME}}`}, etc.</li>
            <li>Generate your document as PDF or Word format</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded">
            <p className="text-xs text-gray-600">
              <strong>Common Smart Tags:</strong> {`{{VASP_NAME}}`}, {`{{CASE_NUMBER}}`}, {`{{AGENT_NAME}}`}, 
              {`{{AGENCY_NAME}}`}, {`{{DATE_TODAY}}`}, {`{{CRIME_DESCRIPTION}}`}
            </p>
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

      <form onSubmit={handleGenerateDocument} className="space-y-6">
        {/* Template Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Template</h2>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">No custom templates found</p>
              <Link
                to="/templates"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Template
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <label key={template.id} className="flex items-center">
                  <input
                    type="radio"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => {
                      handleTemplateSelect(e.target.value);
                      const template = templates.find(t => t.id === e.target.value);
                      if (template) {
                        setSuccess(`Selected template: ${template.templateName}`);
                        setTimeout(() => setSuccess(null), 2000);
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
          )}
        </div>

        {/* VASP Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">VASP Information</h2>
          {selectedVASP ? (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedVASP.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedVASP.jurisdiction}</p>
                  {selectedVASP.email && (
                    <p className="text-sm text-gray-600">{selectedVASP.email}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSelectVASP}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSelectVASP}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Search className="h-4 w-4 mr-2" />
              Select VASP
            </button>
          )}
        </div>

        {/* Case Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Case Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Case Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={documentData.caseNumber}
                onChange={(e) => setDocumentData({...documentData, caseNumber: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Statute/Law
              </label>
              <input
                type="text"
                value={documentData.statute}
                onChange={(e) => setDocumentData({...documentData, statute: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Crime Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={documentData.crimeDescription}
                onChange={(e) => setDocumentData({...documentData, crimeDescription: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
              />
            </div>
          </div>
        </div>

        {/* Transaction Information (Optional) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction Information (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
              <input
                type="text"
                value={transaction.transaction_id}
                onChange={(e) => setTransaction({...transaction, transaction_id: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={transaction.date}
                onChange={(e) => setTransaction({...transaction, date: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="text"
                value={transaction.amount}
                onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                value={transaction.currency}
                onChange={(e) => setTransaction({...transaction, currency: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Template Fields Message */}
        {selectedTemplate && templateMarkers.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  This template uses only basic fields that are automatically filled from your profile and VASP selection.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Advanced Fields (Optional) - Only show if template is selected and has markers */}
        {selectedTemplate && templateMarkers.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Template Fields
              <span className="text-sm font-normal text-gray-500 ml-2">
                Fill in the fields used by your template
              </span>
            </h2>
            
            {/* Show detected markers */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Detected smart tags:</strong> {templateMarkers.join(', ')}
              </p>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Date Fields */}
            {hasMarker('DATE_DEADLINE') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Response Deadline
                  <span className="text-xs text-gray-500 ml-1">{`{{DATE_DEADLINE}}`}</span>
                </label>
                <input
                  type="date"
                  value={documentData.dateDeadline || ''}
                  onChange={(e) => setDocumentData({...documentData, dateDeadline: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {/* Agency Contact Fields */}
            {hasMarker('AGENCY_PHONE') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agency Phone
                  <span className="text-xs text-gray-500 ml-1">{`{{AGENCY_PHONE}}`}</span>
                </label>
                <input
                  type="tel"
                  value={documentData.agencyPhone || ''}
                  onChange={(e) => setDocumentData({...documentData, agencyPhone: e.target.value})}
                  placeholder="(555) 123-4567"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {hasMarker('AGENCY_EMAIL') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agency Email
                  <span className="text-xs text-gray-500 ml-1">{`{{AGENCY_EMAIL}}`}</span>
                </label>
                <input
                  type="email"
                  value={documentData.agencyEmail || ''}
                  onChange={(e) => setDocumentData({...documentData, agencyEmail: e.target.value})}
                  placeholder="contact@agency.gov"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {/* Investigator Fields */}
            {hasMarker('INVESTIGATOR_NAME') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Investigator Name
                  <span className="text-xs text-gray-500 ml-1">{`{{INVESTIGATOR_NAME}}`}</span>
                </label>
                <input
                  type="text"
                  value={documentData.investigatorName || ''}
                  onChange={(e) => setDocumentData({...documentData, investigatorName: e.target.value})}
                  placeholder="If different from your profile name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {hasMarker('INVESTIGATOR_TITLE') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Investigator Title
                  <span className="text-xs text-gray-500 ml-1">{`{{INVESTIGATOR_TITLE}}`}</span>
                </label>
                <input
                  type="text"
                  value={documentData.investigatorTitle || ''}
                  onChange={(e) => setDocumentData({...documentData, investigatorTitle: e.target.value})}
                  placeholder="If different from your profile title"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {hasMarker('INVESTIGATOR_BADGE') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Investigator Badge
                  <span className="text-xs text-gray-500 ml-1">{`{{INVESTIGATOR_BADGE}}`}</span>
                </label>
                <input
                  type="text"
                  value={documentData.investigatorBadge || ''}
                  onChange={(e) => setDocumentData({...documentData, investigatorBadge: e.target.value})}
                  placeholder="If different from your profile badge"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
          
          {/* Requested Information */}
          {(hasMarker('REQUESTED_INFO_LIST') || hasMarker('REQUESTED_INFO_CHECKBOXES')) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requested Information
                <span className="text-xs text-gray-500 ml-1">{`{{REQUESTED_INFO_LIST}}`}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'kyc_info', label: 'KYC Information' },
                { key: 'transaction_history', label: 'Transaction History' },
                { key: 'ip_addresses', label: 'IP Addresses' },
                { key: 'device_info', label: 'Device Information' },
                { key: 'account_activity', label: 'Account Activity' },
                { key: 'linked_accounts', label: 'Linked Accounts' },
                { key: 'source_of_funds', label: 'Source of Funds' },
                { key: 'communications', label: 'Communications' }
              ].map(option => (
                <label key={option.key} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option.key}
                    checked={(documentData.requestedInfo || []).includes(option.key)}
                    onChange={(e) => {
                      const current = documentData.requestedInfo || [];
                      if (e.target.checked) {
                        setDocumentData({...documentData, requestedInfo: [...current, option.key]});
                      } else {
                        setDocumentData({...documentData, requestedInfo: current.filter(i => i !== option.key)});
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
              </div>
            </div>
          )}
          
          {/* Custom Fields */}
          {(hasMarker('CUSTOM_FIELD_1') || hasMarker('CUSTOM_FIELD_2') || hasMarker('CUSTOM_FIELD_3')) && (
            <div className="space-y-4">
              {hasMarker('CUSTOM_FIELD_1') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Field 1
                    <span className="text-xs text-gray-500 ml-1">{`{{CUSTOM_FIELD_1}}`}</span>
                  </label>
                  <input
                    type="text"
                    value={documentData.customField1 || ''}
                    onChange={(e) => setDocumentData({...documentData, customField1: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              {hasMarker('CUSTOM_FIELD_2') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Field 2
                    <span className="text-xs text-gray-500 ml-1">{`{{CUSTOM_FIELD_2}}`}</span>
                  </label>
                  <input
                    type="text"
                    value={documentData.customField2 || ''}
                    onChange={(e) => setDocumentData({...documentData, customField2: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              {hasMarker('CUSTOM_FIELD_3') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Field 3
                    <span className="text-xs text-gray-500 ml-1">{`{{CUSTOM_FIELD_3}}`}</span>
                  </label>
                  <input
                    type="text"
                    value={documentData.customField3 || ''}
                    onChange={(e) => setDocumentData({...documentData, customField3: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          )}
          </div>
        )}

        {/* Output Format */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Output Format</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="pdf"
                checked={outputFormat === 'pdf'}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3">PDF Document</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="docx"
                checked={outputFormat === 'docx'}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3">Word Document (DOCX)</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/documents/simple"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Use Simple Documents
          </Link>
          <button
            type="submit"
            disabled={loading || !selectedTemplate || !selectedVASP}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Generate Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomDocumentBuilder;