import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState(''); // For development only

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetUrl('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`,
        { email }
      );
      
      setSuccess(true);
      
      // In development, show the reset URL
      if (response.data.resetUrl) {
        setResetUrl(response.data.resetUrl);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            src="/images/logo.png"
            alt="VASP Legal Assistant Logo"
            className="mx-auto h-12 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Check your email</h3>
              <p className="mt-2 text-sm text-gray-600">
                If an account exists with {email}, you will receive password reset instructions.
              </p>
              
              {/* Development only - show reset URL */}
              {resetUrl && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium">Development Mode</p>
                  <p className="mt-1 text-xs text-yellow-700">Reset URL:</p>
                  <a 
                    href={resetUrl} 
                    className="text-xs text-blue-600 hover:text-blue-500 break-all"
                    onClick={(e) => {
                      e.preventDefault();
                      const token = new URL(resetUrl).searchParams.get('token');
                      navigate(`/reset-password?token=${token}`);
                    }}
                  >
                    {resetUrl}
                  </a>
                </div>
              )}
              
              <button
                onClick={() => navigate('/login')}
                className="mt-6 text-sm text-blue-600 hover:text-blue-500"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send reset instructions'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to login
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/faq"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Need help? View FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;