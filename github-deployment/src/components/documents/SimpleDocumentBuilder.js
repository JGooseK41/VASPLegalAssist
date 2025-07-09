import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Download, AlertCircle, CheckCircle, Search, Users, Info, X } from 'lucide-react';
import { documentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { downloadFile } from '../../utils/urlHelpers';

const SimpleDocumentBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showLetterheadNotice, setShowLetterheadNotice] = useState(true);
  
  // Document type
  const [documentType, setDocumentType] = useState('freeze_request');
  
  // VASP Data (auto-filled when selected)
  const [selectedVASP, setSelectedVASP] = useState(null);
  
  // Case Information
  const [caseInfo, setCaseInfo] = useState({
    caseNumber: '',
    statute: '',
    crimeDescription: ''
  });
  
  // Transaction Information
  const [transaction, setTransaction] = useState({
    transactionId: '',
    fromAddress: '',
    toAddress: '',
    amount: '',
    currency: 'BTC',
    date: ''
  });

  useEffect(() => {
    // Check for selected VASP from session storage
    const vaspData = sessionStorage.getItem('selectedVASP');
    if (vaspData) {
      setSelectedVASP(JSON.parse(vaspData));
      sessionStorage.removeItem('selectedVASP');
    }
    
    // Restore form state if returning from VASP selection
    const savedState = sessionStorage.getItem('simpleDocumentState');
    if (savedState) {
      const state = JSON.parse(savedState);
      setDocumentType(state.documentType);
      setCaseInfo(state.caseInfo);
      setTransaction(state.transaction);
      sessionStorage.removeItem('simpleDocumentState');
    }
    
    // Check if user has already seen the letterhead notice
    const hasSeenNotice = sessionStorage.getItem('hasSeenLetterheadNotice');
    if (hasSeenNotice) {
      setShowLetterheadNotice(false);
    }
    
    // Clean up on unmount
    return () => {
      sessionStorage.removeItem('selectedVASP');
      sessionStorage.removeItem('simpleDocumentState');
    };
  }, []);

  const handleSelectVASP = () => {
    // Save current form state
    sessionStorage.setItem('simpleDocumentState', JSON.stringify({
      documentType,
      caseInfo,
      transaction
    }));
    navigate('/search');
  };

  const handleGenerateDocument = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!selectedVASP) {
      setError('Please select a VASP');
      return;
    }
    
    if (!caseInfo.caseNumber || !caseInfo.crimeDescription) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare document data with auto-filled user info
      const documentData = {
        documentType,
        outputFormat: 'docx',
        
        // VASP Information (auto-filled)
        vaspId: selectedVASP.id,
        vaspName: selectedVASP.name || selectedVASP.service_name,
        vaspEmail: selectedVASP.compliance_email || selectedVASP.legal_contact_email || '',
        vaspAddress: selectedVASP.service_address || '',
        vaspJurisdiction: selectedVASP.jurisdiction || '',
        
        // User/Agency Information (auto-filled from profile)
        agentName: `${user.firstName} ${user.lastName}`,
        agentTitle: user.title || 'Special Agent',
        agentEmail: user.email,
        agentPhone: user.phone || '',
        agentBadge: user.badgeNumber || '',
        agencyName: user.agencyName,
        agencyAddress: user.agencyAddress || user.agency || '', // Fallback to agency field if agencyAddress not available
        
        // Case Information
        caseNumber: caseInfo.caseNumber,
        statute: caseInfo.statute,
        crimeDescription: caseInfo.crimeDescription,
        
        // Transaction Information (only include if at least transaction ID is provided)
        transactions: transaction.transactionId ? [{
          transaction_id: transaction.transactionId,
          from_address: transaction.fromAddress || '',
          to_address: transaction.toAddress || '',
          amount: transaction.amount || '',
          currency: transaction.currency || 'BTC',
          date: transaction.date || ''
        }] : [],
        
        // Date (auto-filled)
        dateToday: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
      
      const response = await documentAPI.createSimpleDocument(documentData);
      
      if (response.documentUrl) {
        // Download the document using the utility function
        downloadFile(response.documentUrl, `${documentType}_${selectedVASP.name}_${caseInfo.caseNumber}.docx`);
        
        setSuccess('Document generated successfully! The download should start automatically.');
        
        // Clear form after successful generation
        setTimeout(() => {
          setCaseInfo({ caseNumber: '', statute: '', crimeDescription: '' });
          setTransaction({
            transactionId: '',
            fromAddress: '',
            toAddress: '',
            amount: '',
            currency: 'BTC',
            date: ''
          });
          setSuccess(null);
        }, 5000);
      }
    } catch (err) {
      console.error('Failed to generate document:', err);
      setError(err.response?.data?.error || 'Failed to generate document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Letterhead Notice Popup */}
      {showLetterheadNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start">
                <Info className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <h3 className="text-lg font-semibold text-gray-900">Important: Letterhead Required</h3>
              </div>
              <button
                onClick={() => {
                  setShowLetterheadNotice(false);
                  sessionStorage.setItem('hasSeenLetterheadNotice', 'true');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                The documents generated by this tool are <strong>templates only</strong> and must be transferred to your agency's official letterhead before sending.
              </p>
              <p>
                <strong>To use these documents:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Generate and download the document</li>
                <li>Open the downloaded file in Microsoft Word or Google Docs</li>
                <li>Copy the entire content</li>
                <li>Paste into your agency's official letterhead template</li>
                <li>Review and send from your official email</li>
              </ol>
              <p className="text-xs text-gray-500 mt-4">
                Legal requests must always be sent on official agency letterhead to be valid.
              </p>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Need fully formatted templates?</strong> Use our{' '}
                  <Link
                    to="/templates"
                    onClick={() => {
                      setShowLetterheadNotice(false);
                      sessionStorage.setItem('hasSeenLetterheadNotice', 'true');
                    }}
                    className="font-medium text-blue-700 hover:text-blue-800 underline"
                  >
                    Custom Template Builder
                  </Link>{' '}
                  to create complete letterheads, subpoenas, and search warrants with your agency's branding and formatting.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowLetterheadNotice(false);
                sessionStorage.setItem('hasSeenLetterheadNotice', 'true');
              }}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Simple Document Generator</h1>
            <p className="mt-2 text-gray-600">
              Generate standard freeze requests and records requests with auto-filled information
            </p>
          </div>
          <Link
            to="/documents/batch"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Users className="h-4 w-4 mr-2" />
            Batch Mode
          </Link>
        </div>
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

      <form onSubmit={handleGenerateDocument} className="space-y-6">
        {/* VASP Selection - Moved to top */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Step 1: Select VASP
            <span className="text-sm text-gray-500 ml-2 font-normal">Choose the Virtual Asset Service Provider</span>
          </h2>
          {selectedVASP ? (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedVASP.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedVASP.jurisdiction}</p>
                  {selectedVASP.compliance_email && (
                    <p className="text-sm text-gray-600">{selectedVASP.compliance_email}</p>
                  )}
                  {selectedVASP.service_address && (
                    <p className="text-sm text-gray-600">{selectedVASP.service_address}</p>
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

        {/* Document Type Selection */}
        <div className="bg-white shadow rounded-lg p-6" data-tour="document-mode">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Step 2: Document Type
            <span className="text-sm text-gray-500 ml-2 font-normal">Choose the type of legal request</span>
          </h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="freeze_request"
                checked={documentType === 'freeze_request'}
                onChange={(e) => setDocumentType(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <span>
                  <span className="font-medium">Freeze Request</span>
                  <span className="text-sm text-gray-500 ml-2">Request to freeze cryptocurrency assets</span>
                </span>
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
              <span className="ml-3 flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <span>
                  <span className="font-medium">Records Request</span>
                  <span className="text-sm text-gray-500 ml-2">Request for transaction records and KYC information</span>
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Case Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Step 3: Case Information
            <span className="text-sm text-gray-500 ml-2 font-normal">Provide case details</span>
          </h2>
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

        {/* Transaction Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Step 4: Transaction Information
            <span className="text-sm text-gray-500 ml-2 font-normal">Optional - Add specific transaction details</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transaction ID
              </label>
              <input
                type="text"
                value={transaction.transactionId}
                onChange={(e) => setTransaction({...transaction, transactionId: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., abc123..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={transaction.date}
                onChange={(e) => setTransaction({...transaction, date: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Address
              </label>
              <input
                type="text"
                value={transaction.fromAddress}
                onChange={(e) => setTransaction({...transaction, fromAddress: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Sender address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Address
              </label>
              <input
                type="text"
                value={transaction.toAddress}
                onChange={(e) => setTransaction({...transaction, toAddress: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Recipient address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="text"
                value={transaction.amount}
                onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
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

        {/* Auto-filled Information Preview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Auto-filled from your profile:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Agent:</span> {user.firstName} {user.lastName}
            </div>
            <div>
              <span className="text-gray-500">Agency:</span> {user.agencyName}
            </div>
            <div>
              <span className="text-gray-500">Email:</span> {user.email}
            </div>
            <div>
              <span className="text-gray-500">Badge #:</span> {user.badgeNumber || 'Not provided'}
            </div>
            <div>
              <span className="text-gray-500">Title:</span> {user.title || 'Not provided'}
            </div>
            <div>
              <span className="text-gray-500">Phone:</span> {user.phone || 'Not provided'}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !selectedVASP}
            className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default SimpleDocumentBuilder;