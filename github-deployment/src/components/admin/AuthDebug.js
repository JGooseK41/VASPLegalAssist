import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import axios from 'axios';

const AuthDebug = () => {
  const [authInfo, setAuthInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAuthInfo(response.data);
      
      // Also decode the JWT locally to see what's in it
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setAuthInfo(prev => ({
          ...prev,
          tokenPayload: payload,
          tokenExpiry: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiry'
        }));
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError(err.response?.data?.error || 'Failed to verify authentication');
    } finally {
      setLoading(false);
    }
  };

  const getUserFromLocalStorage = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  };

  const localUser = getUserFromLocalStorage();

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center mb-4">
        <Shield className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Authentication Status</h3>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Server-side auth info */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Server Authentication:</h4>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">User ID:</dt>
                <dd className="font-mono text-gray-900">{authInfo?.userId || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">User Role:</dt>
                <dd className="font-medium text-gray-900">{authInfo?.userRole || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Token Expiry:</dt>
                <dd className="text-gray-900">{authInfo?.tokenExpiry || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Local storage info */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Local Storage User:</h4>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Email:</dt>
                <dd className="text-gray-900">{localUser?.email || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Name:</dt>
                <dd className="text-gray-900">{localUser ? `${localUser.firstName} ${localUser.lastName}` : 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Role:</dt>
                <dd className="font-medium text-gray-900">{localUser?.role || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Token payload */}
          {authInfo?.tokenPayload && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">JWT Token Payload:</h4>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(authInfo.tokenPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* Action button */}
          <div className="border-t pt-4">
            <button
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Clear Session & Re-login
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              If your role shows incorrectly, clearing the session and logging in again will fix it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;