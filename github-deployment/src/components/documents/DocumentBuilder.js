import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { documentAPI, templateAPI } from '../../services/api';

const DocumentBuilder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // VASP Data
  const [selectedVASP, setSelectedVASP] = useState(null);
  
  // Document Data
  const [documentType, setDocumentType] = useState('subpoena');
  const [caseInfo, setCaseInfo] = useState({
    case_number: '',
    statute: '',
    crime_description: ''
  });
  
  // Transactions
  const [transactions, setTransactions] = useState([{
    transaction_id: '',
    from_address: '',
    to_address: '',
    amount: '',
    currency: 'BTC',
    date: ''
  }]);
  
  
  // Template
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [outputFormat, setOutputFormat] = useState('pdf');

  useEffect(() => {
    // Check for selected VASP from session storage
    const vaspData = sessionStorage.getItem('selectedVASP');
    if (vaspData) {
      setSelectedVASP(JSON.parse(vaspData));
      sessionStorage.removeItem('selectedVASP');
    }
    
    // Load templates
    loadTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTemplates = async () => {
    try {
      const data = await templateAPI.getTemplates();
      setTemplates(data);
      // Select first template by default
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleAddTransaction = () => {
    setTransactions([...transactions, {
      transaction_id: '',
      from_address: '',
      to_address: '',
      amount: '',
      currency: 'BTC',
      date: ''
    }]);
  };

  const handleRemoveTransaction = (index) => {
    setTransactions(transactions.filter((_, i) => i !== index));
  };

  const handleTransactionChange = (index, field, value) => {
    const updated = [...transactions];
    updated[index][field] = value;
    setTransactions(updated);
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transactions/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to import CSV');
      }

      const data = await response.json();
      if (data.transactions && data.transactions.length > 0) {
        setTransactions(data.transactions);
        setSuccess(`Successfully imported ${data.transactions.length} transactions`);
      }
    } catch (err) {
      setError('Failed to import CSV file. Please check the format and try again.');
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!selectedVASP) {
        setError('Please select a VASP first');
        return;
      }
      
      if (!caseInfo.case_number || !caseInfo.crime_description) {
        setError('Please fill in all required case information');
        return;
      }
      
      if (transactions.length === 0 || !transactions[0].transaction_id) {
        setError('Please add at least one transaction');
        return;
      }

      const documentData = {
        vasp_id: selectedVASP.id,
        template_id: selectedTemplate,
        document_type: documentType,
        case_info: caseInfo,
        transactions: transactions.filter(t => t.transaction_id),
        metadata: {
          vasp_name: selectedVASP.name,
          created_at: new Date().toISOString()
        },
        outputFormat: outputFormat
      };

      const response = await documentAPI.createDocument(documentData);
      
      // Check if this is a demo response
      if (response.isDemo) {
        setSuccess('Document generated successfully! Note: Demo accounts cannot save documents permanently.');
      }
      
      if (response.documentUrl || response.pdf_url) {
        // Download the document
        const link = document.createElement('a');
        link.href = response.documentUrl || response.pdf_url;
        const fileExtension = response.outputFormat === 'docx' ? 'docx' : 'pdf';
        link.download = `${documentType}_${selectedVASP.name}_${caseInfo.case_number}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (!response.isDemo) {
          setSuccess(`Document created successfully as ${fileExtension.toUpperCase()}!`);
          
          // Navigate to history after a short delay (only for non-demo users)
          setTimeout(() => {
            navigate('/documents/history');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Failed to create document:', err);
      
      // Check if this is a demo restriction error
      if (err.response?.data?.isDemo) {
        setError(err.response.data.message || 'Demo users cannot save documents permanently.');
      } else {
        setError('Failed to create document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVASP = () => {
    navigate('/search');
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Legal Document</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate subpoenas and letterheads for cryptocurrency investigations
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto -mx-1.5 -my-1.5 bg-red-50 p-1.5 hover:bg-red-100 rounded"
              >
                <X className="h-5 w-5 text-red-500" />
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

        {/* VASP Selection */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Selected VASP</h2>
          {selectedVASP ? (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedVASP.name}</h3>
                  <p className="text-sm text-gray-600">{selectedVASP.legal_name}</p>
                  {selectedVASP.compliance_email && (
                    <p className="text-sm text-gray-500">{selectedVASP.compliance_email}</p>
                  )}
                </div>
                <button
                  onClick={handleSelectVASP}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Change VASP
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-4">No VASP selected</p>
              <button
                onClick={handleSelectVASP}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Select VASP
              </button>
            </div>
          )}
        </div>

        {/* Document Type and Template */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Document Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="subpoena">Subpoena</option>
                <option value="letterhead">Agency Letterhead</option>
                <option value="freeze_request">Freeze Request</option>
                <option value="records_request">Records Request</option>
                <option value="seizure_warrant">Seizure Warrant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template
              </label>
              <select
                value={selectedTemplate || ''}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pdf">PDF Document</option>
                <option value="docx">Word Document (DOCX)</option>
              </select>
              {outputFormat === 'docx' && (
                <p className="mt-1 text-xs text-gray-500">
                  Word output requires a Word template with smart placeholders
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Case Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Case Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={caseInfo.case_number}
                onChange={(e) => setCaseInfo({...caseInfo, case_number: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2024-CR-001234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statute
              </label>
              <input
                type="text"
                value={caseInfo.statute}
                onChange={(e) => setCaseInfo({...caseInfo, statute: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 18 U.S.C. § 1956"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crime Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={caseInfo.crime_description}
              onChange={(e) => setCaseInfo({...caseInfo, crime_description: e.target.value})}
              rows={3}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the alleged criminal activity..."
            />
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Transaction Details</h2>
            <div className="flex space-x-2">
              <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm cursor-pointer flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <button
                onClick={handleAddTransaction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Transaction
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {transactions.map((transaction, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Transaction {index + 1}</h3>
                  {transactions.length > 1 && (
                    <button
                      onClick={() => handleRemoveTransaction(index)}
                      className="text-red-600 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={transaction.transaction_id}
                      onChange={(e) => handleTransactionChange(index, 'transaction_id', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Transaction hash or ID"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={transaction.date}
                      onChange={(e) => handleTransactionChange(index, 'date', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Address
                    </label>
                    <input
                      type="text"
                      value={transaction.from_address}
                      onChange={(e) => handleTransactionChange(index, 'from_address', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Sender address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Address
                    </label>
                    <input
                      type="text"
                      value={transaction.to_address}
                      onChange={(e) => handleTransactionChange(index, 'to_address', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Recipient address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="text"
                      value={transaction.amount}
                      onChange={(e) => handleTransactionChange(index, 'amount', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={transaction.currency}
                      onChange={(e) => handleTransactionChange(index, 'currency', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            ))}
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate('/documents/history')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedVASP}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentBuilder;