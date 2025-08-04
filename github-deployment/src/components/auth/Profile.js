import React, { useState, useEffect } from 'react';
import { User, Mail, Save, Key, AlertCircle, CheckCircle, X, Trophy, Eye, EyeOff, ArrowLeft, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { profileAPI, authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AdminApplicationForm from '../admin/AdminApplicationForm';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    agency: '',
    agencyAddress: '',
    title: '',
    phone: '',
    leaderboardOptOut: false
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmText: '',
    acknowledgeEncryption: false
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAdminApplication, setShowAdminApplication] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);

  useEffect(() => {
    loadProfile();
    checkAdminApplication();
  }, []);

  const checkAdminApplication = async () => {
    try {
      await authAPI.getMyAdminApplication();
      setHasExistingApplication(true);
    } catch (error) {
      // No existing application
      setHasExistingApplication(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileAPI.getProfile();
      setProfileData({
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        email: data.email || '',
        agency: data.agencyName || '',
        agencyAddress: data.agencyAddress || '',
        title: data.title || '',
        phone: data.phone || '',
        leaderboardOptOut: data.leaderboardOptOut || false
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      // Split name into first and last name
      const nameParts = profileData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const updatedProfile = await profileAPI.updateProfile({
        firstName,
        lastName,
        agencyName: profileData.agency,
        agencyAddress: profileData.agencyAddress,
        title: profileData.title,
        phone: profileData.phone,
        badgeNumber: user?.badgeNumber || '',
        leaderboardOptOut: profileData.leaderboardOptOut
      });
      updateUser(updatedProfile);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      await profileAPI.changePassword(passwordData.current_password, passwordData.new_password);
      setSuccess('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      setError('Failed to change password. Please check your current password and try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (deleteData.confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" exactly as shown');
      return;
    }
    
    try {
      setError(null);
      setIsDeleting(true);
      
      await profileAPI.deleteAccount(deleteData.password, deleteData.confirmText);
      
      // Log out and redirect to home
      logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setError(err.response?.data?.error || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
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
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account information and preferences
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

        {/* Account Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900">{profileData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Member Since</span>
              <span className="text-gray-900">{formatDate(user?.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Type</span>
              <span className="text-gray-900">{user?.is_demo ? 'Demo Account' : 'Standard Account'}</span>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <form onSubmit={handleUpdateProfile} className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <Mail className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agency/Organization
              </label>
              <input
                type="text"
                value={profileData.agency}
                onChange={(e) => setProfileData({...profileData, agency: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="U.S. Department of Justice"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agency Address
              </label>
              <input
                type="text"
                value={profileData.agencyAddress}
                onChange={(e) => setProfileData({...profileData, agencyAddress: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Main St, Washington, DC 20001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={profileData.title}
                onChange={(e) => setProfileData({...profileData, title: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Special Agent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </form>

        {/* Privacy Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Trophy className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Privacy & Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="leaderboard-opt-out"
                checked={profileData.leaderboardOptOut}
                onChange={(e) => setProfileData({...profileData, leaderboardOptOut: e.target.checked})}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="leaderboard-opt-out" className="ml-3">
                <div className="text-sm font-medium text-gray-700">Opt out of leaderboard</div>
                <div className="text-xs text-gray-500 mt-1">
                  <div className="flex items-center">
                    {profileData.leaderboardOptOut ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Your contributions will be anonymous and you won't appear on the leaderboard
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Your name will be visible on the leaderboard when you earn points
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Note:</strong> You'll still earn points for your contributions, but your name won't be displayed publicly if you opt out.
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Key className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Security</h2>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Change Password
              </button>
            )}
          </div>
          
          {showPasswordForm ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-600">
              We recommend using a strong password that you don't use anywhere else
            </p>
          )}
        </div>

        {/* Admin Application - Only show for non-admin users */}
        {user?.role === 'USER' && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Volunteer as Admin</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                We're looking for law enforcement professionals who can volunteer to help maintain the platform by approving new members and managing VASP data update requests.
              </p>
              
              {hasExistingApplication ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    You have already submitted an admin application. We'll review it and get back to you soon.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdminApplication(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Apply to be an Admin
                </button>
              )}
            </div>
          </div>
        )}

        {/* Delete Account - Only show for non-demo users */}
        {user?.role !== 'DEMO' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Trash2 className="h-5 w-5 text-red-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Delete Account</h2>
              </div>
            </div>
            
            {!showDeleteConfirm ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. All your data will be permanently removed.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </button>
              </div>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Critical Warning: This action cannot be undone</h3>
                      <div className="text-sm text-red-700 mt-2 space-y-2">
                        <p className="font-semibold">When you delete your account:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>All your documents, templates, and files will be permanently deleted from our servers</li>
                          <li>Your comments, votes, and VASP submissions will be removed</li>
                          <li>Your account information will be erased completely</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">Important: Encrypted Documents Warning</h3>
                      <div className="text-sm text-amber-700 mt-2 space-y-2">
                        <p className="font-semibold">If you have encrypted documents saved locally:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>They will become <span className="font-semibold">permanently inaccessible</span> after account deletion</li>
                          <li>Your encryption keys are tied to your account and cannot be recovered</li>
                          <li>Any encrypted files on your device will be impossible to decrypt</li>
                        </ul>
                        <div className="mt-3 p-3 bg-amber-100 rounded">
                          <p className="font-semibold text-amber-900">Before deleting your account:</p>
                          <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>Decrypt all documents you want to keep</li>
                            <li>Save the decrypted versions to a secure location</li>
                            <li>Verify you have readable copies of important documents</li>
                          </ol>
                          <div className="mt-2">
                            <Link 
                              to="/documents" 
                              className="text-amber-900 underline hover:text-amber-800 text-sm font-medium"
                              target="_blank"
                            >
                              Go to Documents → View how to decrypt your files
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deleteData.password}
                    onChange={(e) => setDeleteData({...deleteData, password: e.target.value})}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteData.confirmText}
                    onChange={(e) => setDeleteData({...deleteData, confirmText: e.target.value})}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="DELETE MY ACCOUNT"
                    required
                  />
                </div>
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="acknowledge-encryption"
                    checked={deleteData.acknowledgeEncryption}
                    onChange={(e) => setDeleteData({...deleteData, acknowledgeEncryption: e.target.checked})}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="acknowledge-encryption" className="ml-3 text-sm text-gray-700">
                    I understand that all my encrypted documents stored locally will become permanently inaccessible, 
                    and I have decrypted and saved any documents I want to keep.
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteData({ password: '', confirmText: '', acknowledgeEncryption: false });
                      setError(null);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isDeleting || deleteData.confirmText !== 'DELETE MY ACCOUNT' || !deleteData.acknowledgeEncryption}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account Permanently
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Admin Application Modal */}
        {showAdminApplication && (
          <AdminApplicationForm
            onClose={() => setShowAdminApplication(false)}
            onSuccess={() => {
              setShowAdminApplication(false);
              setHasExistingApplication(true);
              setSuccess('Admin application submitted successfully!');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;