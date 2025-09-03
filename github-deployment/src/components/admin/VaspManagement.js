import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Eye, FileText, Globe, Tag, RefreshCw, X, Shield, FileImage, ExternalLink } from 'lucide-react';
import { adminAPI } from '../../services/api';
import VaspForm from './VaspForm';
import { SERVICE_TYPE_DEFINITIONS, getServiceTypeColorClasses } from '../../constants/serviceTypeDefinitions';

// Update Request Detail Modal
const UpdateRequestDetail = ({ updateRequest, onClose, onApprove, onReject }) => {
  const [adminNotes, setAdminNotes] = useState('');
  
  if (!updateRequest) return null;
  
  const changes = updateRequest.proposedChanges || {};
  const originalVasp = updateRequest.vasp || {};
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Request for {originalVasp.name || changes.name || 'Unknown VASP'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Submitter Info */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Submitted By</h3>
            <p className="text-sm text-gray-900">
              {updateRequest.user?.firstName} {updateRequest.user?.lastName} - {updateRequest.user?.agencyName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(updateRequest.createdAt).toLocaleString()}
            </p>
          </div>
          
          {/* User Comments */}
          {updateRequest.userComments && (
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">User Comments</h3>
              <p className="text-sm text-blue-800">{updateRequest.userComments}</p>
            </div>
          )}
          
          {/* Proposed Changes */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Proposed Changes</h3>
            <div className="space-y-4">
              {Object.entries(changes).map(([field, newValue]) => {
                if (field === 'user_comments' || field === 'notes') return null;
                
                const originalValue = originalVasp[field];
                const hasChanged = JSON.stringify(originalValue) !== JSON.stringify(newValue);
                
                return (
                  <div key={field} className={`border rounded-lg p-4 ${hasChanged ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current</p>
                        <p className="text-sm text-gray-900">
                          {Array.isArray(originalValue) ? originalValue.join(', ') : (originalValue || 'Not set')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Proposed</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {Array.isArray(newValue) ? newValue.join(', ') : (newValue || 'Not set')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Evidence Files */}
          {updateRequest.evidenceFiles && updateRequest.evidenceFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Evidence</h3>
              <div className="space-y-3">
                {updateRequest.evidenceFiles.map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {file.mimeType.startsWith('image/') ? (
                        <img 
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${file.fileUrl}`}
                          alt={file.originalName}
                          className="h-20 w-20 object-cover rounded cursor-pointer"
                          onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${file.fileUrl}`, '_blank')}
                        />
                      ) : (
                        <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center">
                          <FileImage className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {(file.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${file.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        {file.description && (
                          <p className="mt-2 text-sm text-gray-600">{file.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Admin Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Add notes about this decision..."
            />
          </div>
          
          {/* Actions */}
          {updateRequest.status === 'PENDING' && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  updateRequest.adminNotes = adminNotes;
                  onReject(updateRequest.id);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  updateRequest.adminNotes = adminNotes;
                  onApprove(updateRequest.id);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve Changes
              </button>
            </div>
          )}
          
          {updateRequest.status !== 'PENDING' && (
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                This request was <strong>{updateRequest.status.toLowerCase()}</strong> on{' '}
                {new Date(updateRequest.updatedAt).toLocaleString()}
              </p>
              {updateRequest.adminNotes && (
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Admin Notes:</strong> {updateRequest.adminNotes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Submission Detail Modal Component
const SubmissionDetail = ({ submission, onClose, onApprove, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">VASP Submission Details</h3>
          <p className="mt-1 text-sm text-gray-500">
            Submitted by {submission.user.firstName} {submission.user.lastName} ({submission.user.agencyName})
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">VASP Name</label>
              <p className="mt-1 text-sm text-gray-900">{submission.vaspName || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Legal Name</label>
              <p className="mt-1 text-sm text-gray-900">{submission.legalName || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jurisdiction</label>
              <p className="mt-1 text-sm text-gray-900">{submission.jurisdiction || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Compliance Email</label>
              <p className="mt-1 text-sm text-gray-900">{submission.complianceEmail || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Compliance Contact</label>
              <p className="mt-1 text-sm text-gray-900">{submission.complianceContact || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{submission.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <p className="mt-1 text-sm text-gray-900">{submission.website || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Processing Time</label>
              <p className="mt-1 text-sm text-gray-900">{submission.processingTime || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Method</label>
              <p className="mt-1 text-sm text-gray-900">{submission.preferredMethod || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Required Document</label>
              <p className="mt-1 text-sm text-gray-900">{submission.requiredDocument || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Service Address</label>
            <p className="mt-1 text-sm text-gray-900">{submission.serviceAddress || 'Not provided'}</p>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Law Enforcement URL</label>
            <p className="mt-1 text-sm text-gray-900">{submission.lawEnforcementUrl || 'Not provided'}</p>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Info Types</label>
            <p className="mt-1 text-sm text-gray-900">
              {submission.infoTypes && submission.infoTypes.length > 0 
                ? submission.infoTypes.join(', ') 
                : 'Not provided'}
            </p>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Service Types</label>
            <p className="mt-1 text-sm text-gray-900">
              {submission.serviceTypes && submission.serviceTypes.length > 0 
                ? submission.serviceTypes.join(', ') 
                : 'Not provided'}
            </p>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Accepts US Service</label>
              <p className="mt-1 text-sm text-gray-900">{submission.acceptsUsService ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Has Own Portal</label>
              <p className="mt-1 text-sm text-gray-900">{submission.hasOwnPortal ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          {submission.notes && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{submission.notes}</p>
            </div>
          )}
          
          {submission.status === 'PENDING' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700">
                Rejection Reason (if rejecting)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Provide a reason for rejection..."
              />
            </div>
          )}
        </div>
        
        <div className="p-6 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {submission.status === 'PENDING' && (
            <>
              <button
                onClick={() => onReject(submission.id, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(submission.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve & Create VASP
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Service Type Quick Edit Modal
const ServiceTypeQuickEdit = ({ vasp, onClose, onSave }) => {
  const [selectedTypes, setSelectedTypes] = useState(vasp.service_types || []);
  const [saving, setSaving] = useState(false);
  
  const serviceTypeOptions = [
    { value: 'CEX', label: 'Centralized Exchange (CEX)' },
    { value: 'DEX', label: 'Decentralized Exchange (DEX)' },
    { value: 'P2P', label: 'P2P Trading' },
    { value: 'Kiosk', label: 'Crypto Kiosk/ATM' },
    { value: 'Bridge', label: 'Bridging Service' },
    { value: 'Gambling', label: 'Gambling Service' },
    { value: 'Wallet', label: 'Wallet Provider' },
    { value: 'OTC', label: 'OTC Desk' },
    { value: 'Mining', label: 'Mining Pool' },
    { value: 'Payment', label: 'Payment Processor' },
    { value: 'Staking', label: 'Staking Service' },
    { value: 'Lending', label: 'Lending Platform' },
    { value: 'NFT', label: 'NFT Marketplace' },
    { value: 'Stablecoin', label: 'Stablecoin Issuer' },
    { value: 'Mixer', label: 'Mixing Service' }
  ];
  
  const handleToggle = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(vasp.id, selectedTypes);
      onClose();
    } catch (error) {
      console.error('Failed to save service types:', error);
      alert('Failed to save service types');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit Service Types</h3>
          <p className="mt-1 text-sm text-gray-500">{vasp.name}</p>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">Select all service types that apply to this VASP:</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {serviceTypeOptions.map(({ value, label }) => {
              const isSelected = selectedTypes.includes(value);
              const definition = SERVICE_TYPE_DEFINITIONS[value];
              
              return (
                <label
                  key={value}
                  className={`relative flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(value)}
                    className="sr-only"
                  />
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(value)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getServiceTypeColorClasses(definition?.color || 'gray')} mr-2`}>
                        {definition?.label || value}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                    </div>
                    {definition?.shortDescription && (
                      <p className="text-xs text-gray-500 mt-1">{definition.shortDescription}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Required Documents Quick Edit Component
const RequiredDocsQuickEdit = ({ vasp, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    records_required_document: vasp.records_required_document || '',
    freeze_required_document: vasp.freeze_required_document || ''
  });
  const [saving, setSaving] = useState(false);
  
  const documentOptions = [
    { value: '', label: 'Unknown' },
    { value: 'Letterhead', label: 'Letterhead' },
    { value: 'Subpoena', label: 'Subpoena' },
    { value: 'Search Warrant', label: 'Search Warrant' },
    { value: 'MLAT', label: 'MLAT' },
    { value: 'No Capability', label: 'No Capability by VASP' },
    { value: 'Non-Compliant', label: 'Non-Compliant' }
  ];
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(vasp.id, formData);
      onClose();
    } catch (error) {
      console.error('Failed to save required documents:', error);
      alert('Failed to save required documents');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit Required Documents</h3>
          <p className="mt-1 text-sm text-gray-500">{vasp.name}</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Records Request - Required Document
            </label>
            <select
              value={formData.records_required_document}
              onChange={(e) => setFormData({...formData, records_required_document: e.target.value})}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {documentOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Document type required for data/records requests
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Freeze Request - Required Document
            </label>
            <select
              value={formData.freeze_required_document}
              onChange={(e) => setFormData({...formData, freeze_required_document: e.target.value})}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {documentOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Document type required for asset freeze requests
            </p>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const VaspManagement = () => {
  const [activeTab, setActiveTab] = useState('vasps');
  const [vasps, setVasps] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [updateRequests, setUpdateRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingVasp, setEditingVasp] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('PENDING');
  const [editingServiceTypes, setEditingServiceTypes] = useState(null);
  const [editingRequiredDocs, setEditingRequiredDocs] = useState(null);
  const [updateRequestStatusFilter, setUpdateRequestStatusFilter] = useState('PENDING');
  const [selectedUpdateRequest, setSelectedUpdateRequest] = useState(null);
  
  useEffect(() => {
    if (activeTab === 'vasps') {
      loadVasps();
    } else if (activeTab === 'submissions') {
      loadSubmissions();
    } else if (activeTab === 'updates') {
      loadUpdateRequests();
    }
  }, [currentPage, searchQuery, activeTab, submissionStatusFilter, updateRequestStatusFilter]);
  
  const loadVasps = async () => {
    try {
      setLoading(true);
      console.log('VaspManagement: Loading VASPs...');
      const data = await adminAPI.getVasps({
        page: currentPage,
        limit: 50,
        search: searchQuery
      });
      console.log('VaspManagement: Received data:', data);
      setVasps(data.vasps || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load VASPs:', error);
      console.error('Error response:', error.response);
      // Show empty state if error
      setVasps([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getSubmissions(submissionStatusFilter);
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateVasp = () => {
    setEditingVasp(null);
    setShowForm(true);
  };
  
  const handleEditVasp = (vasp) => {
    setEditingVasp(vasp);
    setShowForm(true);
  };
  
  const handleDeleteVasp = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this VASP?')) return;
    
    try {
      await adminAPI.deleteVasp(id);
      loadVasps();
    } catch (error) {
      console.error('Failed to delete VASP:', error);
      alert('Failed to deactivate VASP');
    }
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setEditingVasp(null);
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVasp(null);
    loadVasps();
  };
  
  const handleApproveSubmission = async (submissionId) => {
    try {
      await adminAPI.approveSubmission(submissionId);
      setSelectedSubmission(null);
      loadSubmissions();
      // Switch to VASPs tab to show the newly created VASP
      setActiveTab('vasps');
      loadVasps();
      alert('Submission approved and VASP created successfully!');
    } catch (error) {
      console.error('Failed to approve submission:', error);
      alert('Failed to approve submission');
    }
  };
  
  const handleRejectSubmission = async (submissionId, reason) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      await adminAPI.rejectSubmission(submissionId, reason);
      setSelectedSubmission(null);
      loadSubmissions();
      alert('Submission rejected successfully');
    } catch (error) {
      console.error('Failed to reject submission:', error);
      alert('Failed to reject submission');
    }
  };
  
  const handleSaveServiceTypes = async (vaspId, serviceTypes) => {
    try {
      await adminAPI.updateVasp(vaspId, { service_types: serviceTypes });
      loadVasps();
    } catch (error) {
      console.error('Failed to update service types:', error);
      throw error;
    }
  };
  
  const handleSaveRequiredDocs = async (vaspId, docs) => {
    try {
      await adminAPI.updateVasp(vaspId, docs);
      loadVasps();
    } catch (error) {
      console.error('Failed to update required documents:', error);
      throw error;
    }
  };
  
  const loadUpdateRequests = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUpdateRequests(updateRequestStatusFilter);
      setUpdateRequests(data);
    } catch (error) {
      console.error('Failed to load update requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleProcessUpdateRequest = async (id, action) => {
    try {
      const adminNotes = selectedUpdateRequest?.adminNotes || '';
      await adminAPI.processUpdateRequest(id, action, adminNotes);
      setSelectedUpdateRequest(null);
      loadUpdateRequests();
      if (action === 'APPROVED') {
        loadVasps(); // Refresh VASPs if approved
      }
    } catch (error) {
      console.error('Failed to process update request:', error);
      alert('Failed to process update request');
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  if (showForm) {
    return (
      <VaspForm
        vasp={editingVasp}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">VASP Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage Virtual Asset Service Providers and review submissions
        </p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('vasps')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vasps'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Active VASPs
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {vasps.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Submissions
              {submissions.filter(s => s.status === 'PENDING').length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2.5 rounded-full text-xs">
                  {submissions.filter(s => s.status === 'PENDING').length} pending
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'updates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Requests
              {updateRequests.filter(u => u.status === 'PENDING').length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2.5 rounded-full text-xs">
                  {updateRequests.filter(u => u.status === 'PENDING').length} pending
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === 'vasps' ? (
        <>
          {/* VASPs Tab Content */}
          <div className="flex justify-between items-center">
            <div className="bg-white shadow rounded-lg p-4 flex-1 mr-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, jurisdiction, or email..."
                  className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleCreateVasp}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add VASP
            </button>
          </div>
      
      {/* VASPs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jurisdiction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required Docs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vasps.map((vasp) => (
                  <tr key={vasp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vasp.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vasp.legal_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vasp.jurisdiction}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vasp.compliance_email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex flex-wrap gap-1 flex-1">
                          {vasp.service_types && vasp.service_types.length > 0 ? (
                            vasp.service_types.slice(0, 3).map((type) => {
                              const config = SERVICE_TYPE_DEFINITIONS[type];
                              if (!config) return null;
                              return (
                                <span
                                  key={type}
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getServiceTypeColorClasses(config.color)}`}
                                  title={config.shortDescription}
                                >
                                  {config.label}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-gray-400 italic">No types assigned</span>
                          )}
                          {vasp.service_types && vasp.service_types.length > 3 && (
                            <span className="text-xs text-gray-500">+{vasp.service_types.length - 3} more</span>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingServiceTypes(vasp)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Edit service types"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-xs">
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span className={`font-medium ${
                              vasp.records_required_document === 'Letterhead' ? 'text-green-600' :
                              vasp.records_required_document === 'Subpoena' ? 'text-yellow-600' :
                              vasp.records_required_document === 'Search Warrant' ? 'text-orange-600' :
                              vasp.records_required_document === 'MLAT' ? 'text-red-600' :
                              'text-gray-500'
                            }`}>
                              {vasp.records_required_document || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Shield className="w-3 h-3 text-orange-500" />
                            <span className={`font-medium ${
                              vasp.freeze_required_document === 'Letterhead' ? 'text-green-600' :
                              vasp.freeze_required_document === 'Subpoena' ? 'text-yellow-600' :
                              vasp.freeze_required_document === 'Search Warrant' ? 'text-orange-600' :
                              vasp.freeze_required_document === 'MLAT' ? 'text-red-600' :
                              'text-gray-500'
                            }`}>
                              {vasp.freeze_required_document || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingRequiredDocs(vasp)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit required documents"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {vasp.preferred_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vasp.isActive ? (
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-sm text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditVasp(vasp)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVasp(vasp.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      ) : activeTab === 'submissions' ? (
        <>
          {/* Submissions Tab Content */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setSubmissionStatusFilter('PENDING')}
                className={`px-4 py-2 rounded-md ${
                  submissionStatusFilter === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setSubmissionStatusFilter('APPROVED')}
                className={`px-4 py-2 rounded-md ${
                  submissionStatusFilter === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setSubmissionStatusFilter('REJECTED')}
                className={`px-4 py-2 rounded-md ${
                  submissionStatusFilter === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
          
          {/* Submissions Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No {submissionStatusFilter.toLowerCase()} submissions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        VASP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jurisdiction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.vaspName || 'No name provided'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.legalName || submission.complianceEmail || 'No details'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {submission.user?.firstName} {submission.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.user?.agencyName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.jurisdiction}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="flex items-center text-sm">
                            {getStatusIcon(submission.status)}
                            <span className="ml-2">{submission.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'updates' ? (
        <>
          {/* Update Requests Tab Content */}
          <div className="mb-4">
            <div className="bg-white shadow rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={updateRequestStatusFilter}
                onChange={(e) => setUpdateRequestStatusFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
          
          {/* Update Requests Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading update requests...</p>
              </div>
            ) : updateRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No update requests found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        VASP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Changes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {updateRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(request.status)}
                            <span className="ml-2 text-sm text-gray-900">
                              {request.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.vasp?.name || request.proposedChanges?.name || 'Unknown VASP'}
                          </div>
                          {(!request.vasp?.name && request.proposedChanges?.name) && (
                            <div className="text-xs text-orange-600">
                              (from update request)
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.user?.firstName} {request.user?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.user?.agencyName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span>{Object.keys(request.proposedChanges || {}).length} fields</span>
                            {request.evidenceFiles && request.evidenceFiles.length > 0 && (
                              <div className="flex items-center text-blue-600">
                                <FileImage className="w-4 h-4 mr-1" />
                                <span className="text-xs">{request.evidenceFiles.length}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedUpdateRequest(request)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
      
      {selectedSubmission && (
        <SubmissionDetail
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={handleApproveSubmission}
          onReject={handleRejectSubmission}
        />
      )}
      
      {selectedUpdateRequest && (
        <UpdateRequestDetail
          updateRequest={selectedUpdateRequest}
          onClose={() => setSelectedUpdateRequest(null)}
          onApprove={(id) => handleProcessUpdateRequest(id, 'APPROVED')}
          onReject={(id) => handleProcessUpdateRequest(id, 'REJECTED')}
        />
      )}
      
      {editingServiceTypes && (
        <ServiceTypeQuickEdit
          vasp={editingServiceTypes}
          onClose={() => setEditingServiceTypes(null)}
          onSave={handleSaveServiceTypes}
        />
      )}
      
      {editingRequiredDocs && (
        <RequiredDocsQuickEdit
          vasp={editingRequiredDocs}
          onClose={() => setEditingRequiredDocs(null)}
          onSave={handleSaveRequiredDocs}
        />
      )}
    </div>
  );
};

export default VaspManagement;