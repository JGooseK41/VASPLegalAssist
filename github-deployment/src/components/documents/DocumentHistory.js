import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, Calendar, Building, Hash, AlertCircle, Plus, Lock, MessageSquare, CheckCircle, Trophy } from 'lucide-react';
import { documentAPI } from '../../services/api';
import { useEncryption } from '../../hooks/useEncryption';
import { createEncryptedDocumentAPI } from '../../services/encryptedApi';
import VaspResponseModal from './VaspResponseModal';
import axios from 'axios';

const DocumentHistory = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [responseModal, setResponseModal] = useState({ isOpen: false, document: null });
  const [documentResponses, setDocumentResponses] = useState({});
  
  // Initialize encryption
  const encryption = useEncryption();
  const encryptedAPI = useMemo(() => {
    if (encryption.isKeyReady) {
      return createEncryptedDocumentAPI(encryption);
    }
    return null;
  }, [encryption]);

  useEffect(() => {
    if (encryptedAPI) {
      loadDocuments();
    }
  }, [encryptedAPI]);
  
  // Check which documents have responses
  useEffect(() => {
    if (documents.length > 0) {
      checkDocumentResponses();
    }
  }, [documents]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!encryptedAPI) {
        setError('Encryption not ready. Please refresh the page.');
        return;
      }
      
      const response = await encryptedAPI.getDocuments();
      // API returns { documents, total, hasMore }
      setDocuments(response.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load document history. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const checkDocumentResponses = async () => {
    try {
      const responses = {};
      for (const doc of documents) {
        if (!doc.decryptionError) {
          try {
            const response = await axios.get(
              `/api/vasp-responses/document/${doc.id}/check`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
              }
            );
            responses[doc.id] = response.data.hasResponse;
          } catch (err) {
            console.error('Error checking document response:', err);
          }
        }
      }
      setDocumentResponses(responses);
    } catch (err) {
      console.error('Failed to check document responses:', err);
    }
  };

  const handleDownload = async (document) => {
    try {
      // If we have a stored PDF URL, use it
      if (document.pdf_url) {
        const link = window.document.createElement('a');
        link.href = document.pdf_url;
        link.download = `${document.document_type}_${document.metadata?.vasp_name}_${document.case_info?.case_number}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        // Otherwise, regenerate the PDF
        const response = await documentAPI.regenerateDocument(document.id);
        if (response.pdf_url) {
          const link = window.document.createElement('a');
          link.href = response.pdf_url;
          link.download = `${document.document_type}_${document.metadata?.vasp_name}_${document.case_info?.case_number}.pdf`;
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
        }
      }
    } catch (err) {
      console.error('Failed to download document:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'subpoena':
        return 'Subpoena';
      case 'letterhead':
        return 'Agency Letterhead';
      case 'freeze_request':
        return 'Freeze Request';
      case 'records_request':
        return 'Records Request';
      case 'seizure_warrant':
        return 'Seizure Warrant';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading document history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={loadDocuments}
                className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
              >
                Try again →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document History</h1>
            <p className="mt-1 text-sm text-gray-600">
              Your last {documents.length} generated documents
            </p>
            {encryption.isKeyReady && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <Lock className="h-3 w-3 mr-1" />
                Documents are encrypted with your personal key
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/documents/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </button>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              {success.includes('points') ? (
                <Trophy className="h-5 w-5 text-green-400" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first legal document.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/documents/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Create Document
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <li key={doc.id} className="hover:bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.decryptionError ? 'Encrypted Document' : getDocumentTypeLabel(doc.documentType || doc.document_type)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {doc.decryptionError ? 'Unable to decrypt' : `Case #${doc.caseNumber || doc.case_info?.case_number || 'N/A'}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            {doc.decryptionError ? 'Encrypted' : (doc.vaspName || doc.metadata?.vasp_name || 'Unknown VASP')}
                          </div>
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 mr-1" />
                            {doc.decryptionError ? '?' : (doc.transactionDetails ? JSON.parse(doc.transactionDetails).length : 0)} transactions
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(doc.createdAt || doc.created_at)}
                          </div>
                        </div>
                        
                        {!doc.decryptionError && (doc.crimeDescription || doc.case_info?.crime_description) && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                            {doc.crimeDescription || doc.case_info.crime_description}
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-6 flex items-center space-x-2">
                        {doc.isClientEncrypted && (
                          <span className="text-xs text-blue-600" title="Client-side encrypted">
                            <Lock className="h-4 w-4" />
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!doc.decryptionError && !documentResponses[doc.id] && (
                          <button
                            onClick={() => setResponseModal({ isOpen: true, document: doc })}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                            title="Log VASP Response"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Document Details Modal */}
        {selectedDocument && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Document Details</h3>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Document Type</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {getDocumentTypeLabel(selectedDocument.document_type)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">VASP Information</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedDocument.metadata?.vasp_name || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Case Information</h4>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Case Number: {selectedDocument.caseNumber || selectedDocument.case_info?.case_number || 'N/A'}</p>
                      {(selectedDocument.statute || selectedDocument.case_info?.statute) && (
                        <p>Statute: {selectedDocument.statute || selectedDocument.case_info.statute}</p>
                      )}
                      {(selectedDocument.crimeDescription || selectedDocument.case_info?.crime_description) && (
                        <p className="mt-1">{selectedDocument.crimeDescription || selectedDocument.case_info.crime_description}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Transactions ({selectedDocument.transactions?.length || 0})</h4>
                    {selectedDocument.transactions && selectedDocument.transactions.length > 0 && (
                      <div className="mt-1 space-y-2">
                        {selectedDocument.transactions.slice(0, 3).map((tx, index) => (
                          <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                            <p className="font-mono text-xs">{tx.transaction_id}</p>
                            <p>{tx.amount} {tx.currency} - {tx.date}</p>
                          </div>
                        ))}
                        {selectedDocument.transactions.length > 3 && (
                          <p className="text-sm text-gray-500">
                            ...and {selectedDocument.transactions.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Requested Information</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedDocument.requested_info?.map((info) => (
                        <span key={info} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {info.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Created</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatDate(selectedDocument.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* VASP Response Modal */}
        <VaspResponseModal
          isOpen={responseModal.isOpen}
          onClose={() => setResponseModal({ isOpen: false, document: null })}
          document={responseModal.document}
          onSuccess={(result) => {
            // Refresh the document responses
            checkDocumentResponses();
            // Show success message with points info
            setSuccess(result.message || 'VASP response logged successfully! You earned 5 points!');
            setTimeout(() => setSuccess(null), 5000);
          }}
        />
      </div>
    </div>
  );
};

export default DocumentHistory;