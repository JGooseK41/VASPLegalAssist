import React from 'react';
import { Loader2 } from 'lucide-react';

// Spinner component for inline loading
export const Spinner = ({ size = 'default', className = '' }) => {
  const sizes = {
    small: 'h-4 w-4',
    default: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  return (
    <Loader2 className={`animate-spin ${sizes[size]} ${className}`} />
  );
};

// Full page loading state
export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="large" className="mx-auto text-blue-600 mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </>
  );
};

// Table skeleton loader
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(columns)].map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Button with loading state
export const LoadingButton = ({ 
  loading, 
  disabled, 
  children, 
  loadingText = 'Processing...', 
  className = '',
  ...props 
}) => {
  return (
    <button
      disabled={loading || disabled}
      className={`relative ${className} ${loading ? 'cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded">
          <Spinner size="small" className="mr-2" />
          <span>{loadingText}</span>
        </div>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
};

// Progress bar for long operations
export const ProgressBar = ({ progress, message = '' }) => {
  return (
    <div className="w-full">
      {message && (
        <p className="text-sm text-gray-600 mb-2">{message}</p>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
    </div>
  );
};

// Encryption loading state
export const EncryptionLoader = () => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
      <div className="animate-pulse">
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-blue-900">Initializing encryption...</p>
        <p className="text-xs text-blue-700">This ensures your data remains secure</p>
      </div>
    </div>
  );
};

// Document generation loading state
export const DocumentGenerationLoader = ({ stage = 'preparing' }) => {
  const stages = {
    preparing: 'Preparing your document...',
    processing: 'Processing template markers...',
    encrypting: 'Encrypting sensitive data...',
    generating: 'Generating final document...',
    finalizing: 'Almost done...'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full">
        <div className="text-center">
          <Spinner size="large" className="mx-auto text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Document</h3>
          <p className="text-sm text-gray-600">{stages[stage]}</p>
          <div className="mt-4">
            <div className="flex justify-center space-x-1">
              {Object.keys(stages).map((key, index) => (
                <div
                  key={key}
                  className={`h-2 w-2 rounded-full ${
                    Object.keys(stages).indexOf(stage) >= index
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};