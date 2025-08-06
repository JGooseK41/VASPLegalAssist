import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Shield, User, AlertCircle, Crown, MessageCircle, Eye, Mail, MailCheck } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { isMasterAdmin } from '../../utils/auth';

// User Feedback Modal
const UserFeedbackModal = ({ user, isOpen, onClose }) => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen && user) {
      loadFeedback();
    }
  }, [isOpen, user]);
  
  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUserFeedback(user.id);
      setFeedback(data);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Contributor Feedback
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {user.firstName} {user.lastName} - {user.agencyName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : feedback.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No feedback submitted yet
            </p>
          ) : (
            <div className="space-y-6">
              {feedback.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.milestone === 1 ? 'bg-green-100 text-green-800' :
                        item.milestone === 100 ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.milestone} Point{item.milestone !== 1 ? 's' : ''} Milestone
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Discovery Source:</p>
                      <p className="text-sm text-gray-900">{item.discoverySource}</p>
                    </div>
                    
                    {item.suggestions && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Suggestions:</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.suggestions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchQuery, filterRole, filterApproved]);
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 50,
        search: searchQuery
      };
      
      if (filterRole) params.role = filterRole;
      if (filterApproved) params.isApproved = filterApproved;
      
      console.log('UserManagement: Loading users with params:', params);
      const data = await adminAPI.getUsers(params);
      console.log('UserManagement: Received data:', data);
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load users:', error);
      console.error('Error response:', error.response);
      // Show empty state if error
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApproveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this user?')) return;
    
    try {
      await adminAPI.approveUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Failed to approve user');
    }
  };
  
  const handleRejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject and remove this user?')) return;
    
    try {
      await adminAPI.rejectUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert('Failed to reject user');
    }
  };
  
  const handleVerifyEmail = async (userId) => {
    if (!window.confirm('Are you sure you want to manually verify this user\'s email?')) return;
    
    try {
      await adminAPI.verifyUserEmail(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to verify user email:', error);
      alert('Failed to verify user email');
    }
  };
  
  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      await adminAPI.updateUserRole(userId, newRole);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage user accounts and permissions
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or agency..."
                className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="MASTER_ADMIN">Master Admin</option>
            </select>
          </div>
          
          <div>
            <select
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
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
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{user.agencyName}</div>
                        <div className="text-sm text-gray-500">Badge #{user.badgeNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'MASTER_ADMIN'
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'MASTER_ADMIN' && <Crown className="w-3 h-3 mr-1" />}
                        {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role === 'USER' && <User className="w-3 h-3 mr-1" />}
                        {user.role === 'MASTER_ADMIN' ? 'Master Admin' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isApproved ? (
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="flex items-center text-sm text-yellow-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isEmailVerified ? (
                        <span className="flex items-center text-sm text-green-600">
                          <MailCheck className="w-4 h-4 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center text-sm text-red-600">
                          <Mail className="w-4 h-4 mr-1" />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{user._count.documents} documents</div>
                      <div>{user._count.comments} comments</div>
                      {user._count.contributorFeedback > 0 && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowFeedbackModal(true);
                          }}
                          className="flex items-center text-blue-600 hover:text-blue-800 mt-1"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          <span className="text-xs">{user._count.contributorFeedback} feedback</span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {!user.isEmailVerified && (
                          <button
                            onClick={() => handleVerifyEmail(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Manually verify email"
                          >
                            <MailCheck className="w-4 h-4" />
                          </button>
                        )}
                        {!user.isApproved && (
                          <>
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve User"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject User"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {user.isApproved && isMasterAdmin() && user.role !== 'MASTER_ADMIN' && (
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            title="Change user role"
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        )}
                        {user.isApproved && !isMasterAdmin() && (
                          <span className="text-xs text-gray-500">
                            {user.role === 'MASTER_ADMIN' ? '-' : 'Role locked'}
                          </span>
                        )}
                      </div>
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
      
      <UserFeedbackModal
        user={selectedUser}
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default UserManagement;