import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Info, HelpCircle, Building } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import VaspSelfRegistration from '../public/VaspSelfRegistration';

const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showDemoInfo, setShowDemoInfo] = useState(true);
  const [showVaspRegistration, setShowVaspRegistration] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [showVerificationLink, setShowVerificationLink] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setShowVerificationLink(false);
    
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    } else {
      setLoginError(result.error);
      if (result.requiresEmailVerification) {
        setShowVerificationLink(true);
      }
    }
  };

  const useDemoAccount = () => {
    setFormData({
      email: 'demo@theblockaudit.com',
      password: 'Crypto'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <a href="https://www.theblockaudit.com" target="_blank" rel="noopener noreferrer">
            <img
              src="/images/logo.png"
              alt="VASP Legal Assistant Logo"
              className="mx-auto h-12 w-auto"
            />
          </a>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          VASP Records Process Assistant
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access the application
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {showDemoInfo && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">Demo Account Available</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>You can use our demo account to explore the application:</p>
                    <div className="mt-2 font-mono text-xs bg-blue-100 p-2 rounded">
                      Email: demo@theblockaudit.com<br />
                      Password: Crypto
                    </div>
                    <button
                      type="button"
                      onClick={useDemoAccount}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Use demo account →
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowDemoInfo(false)}
                  className="ml-3 text-blue-400 hover:text-blue-500"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {(error || loginError) && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error || loginError}</p>
                  {showVerificationLink && (
                    <div className="mt-2">
                      <Link
                        to="/resend-verification"
                        className="text-sm font-medium text-red-600 hover:text-red-500"
                      >
                        Resend verification email →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1 relative">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Need an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/register')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create new account
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-center">
                <Link
                  to="/faq"
                  className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Need help? View FAQ
                </Link>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">For VASPs</span>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowVaspRegistration(true)}
                  className="inline-flex items-center px-4 py-2 border border-green-600 rounded-md text-sm font-medium text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Building className="h-5 w-5 mr-2" />
                  VASP Self-Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* VASP Self-Registration Modal */}
      <VaspSelfRegistration 
        isOpen={showVaspRegistration} 
        onClose={() => setShowVaspRegistration(false)} 
      />
    </div>
  );
};

export default LoginForm;