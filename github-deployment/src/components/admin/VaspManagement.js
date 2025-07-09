import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Eye, FileText, Globe } from 'lucide-react';
import { adminAPI } from '../../services/api';
import VaspForm from './VaspForm';

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
              <p className="mt-1 text-sm text-gray-900">{submission.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Legal Name</label>
              <p className="mt-1 text-sm text-gray-900">{submission.legal_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jurisdiction</label>
              <p className="mt-1 text-sm text-gray-900">{submission.jurisdiction}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Compliance Email</label>
              <p className="mt-1 text-sm text-gray-900">{submission.compliance_email}</p>
            </div>
          </div>
          
          {submission.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <p className="mt-1 text-sm text-gray-900">{submission.notes}</p>
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

const VaspManagement = () => {
  const [activeTab, setActiveTab] = useState('vasps');
  const [vasps, setVasps] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingVasp, setEditingVasp] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('PENDING');
  
  useEffect(() => {
    if (activeTab === 'vasps') {
      loadVasps();
    } else {
      loadSubmissions();
    }
  }, [currentPage, searchQuery, activeTab, submissionStatusFilter]);
  
  const loadVasps = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getVasps({
        page: currentPage,
        limit: 10,
        search: searchQuery
      });
      setVasps(data.vasps);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load VASPs:', error);
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
      ) : (
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
                              {submission.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.legal_name}
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
      )}
      
      {selectedSubmission && (
        <SubmissionDetail
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={handleApproveSubmission}
          onReject={handleRejectSubmission}
        />
      )}
    </div>
  );
};

export default VaspManagement;