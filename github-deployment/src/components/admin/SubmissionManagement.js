import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { adminAPI } from '../../services/api';

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
            <div>
              <label className="block text-sm font-medium text-gray-700">Processing Time</label>
              <p className="mt-1 text-sm text-gray-900">{submission.processing_time}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Method</label>
              <p className="mt-1 text-sm text-gray-900">{submission.preferred_method}</p>
            </div>
          </div>
          
          {submission.service_address && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Service Address</label>
              <p className="mt-1 text-sm text-gray-900">{submission.service_address}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Information Types</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {submission.info_types.map((type, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {type}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={submission.accepts_us_service}
                disabled
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Accepts US Service</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={submission.has_own_portal}
                disabled
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Has Own Portal</span>
            </label>
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

const SubmissionManagement = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  
  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);
  
  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getSubmissions(statusFilter);
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (submissionId) => {
    try {
      await adminAPI.approveSubmission(submissionId);
      setSelectedSubmission(null);
      loadSubmissions();
      alert('Submission approved and VASP created successfully!');
    } catch (error) {
      console.error('Failed to approve submission:', error);
      alert('Failed to approve submission');
    }
  };
  
  const handleReject = async (submissionId, reason) => {
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
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">VASP Submissions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review and approve user-submitted VASPs
        </p>
      </div>
      
      {/* Status Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-md ${
              statusFilter === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-4 py-2 rounded-md ${
              statusFilter === 'APPROVED'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-4 py-2 rounded-md ${
              statusFilter === 'REJECTED'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>
      
      {/* Submissions List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No {statusFilter.toLowerCase()} submissions found
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
                        {submission.user.firstName} {submission.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.user.agencyName}
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
      
      {selectedSubmission && (
        <SubmissionDetail
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default SubmissionManagement;