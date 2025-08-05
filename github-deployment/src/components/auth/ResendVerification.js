import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '../../services/api';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '', 'sending', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      const response = await authAPI.resendVerification(email);
      setStatus('success');
      setMessage(response.message || 'Verification email sent. Please check your inbox.');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to send verification email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Resend Verification Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a new verification link.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {message && (
            <div className={`rounded-md p-4 ${
              status === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : status === 'error'
                ? 'bg-red-50 border border-red-200'
                : ''
            }`}>
              <div className="flex">
                {status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                ) : null}
                <div className="ml-3">
                  <p className={`text-sm ${
                    status === 'success' 
                      ? 'text-green-800' 
                      : status === 'error'
                      ? 'text-red-800'
                      : ''
                  }`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-white group-hover:text-blue-100" />
              </span>
              {status === 'sending' ? 'Sending...' : 'Send Verification Email'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResendVerification;