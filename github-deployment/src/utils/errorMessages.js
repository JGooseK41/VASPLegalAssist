// Centralized error message handling with user-friendly messages and solutions

export const getErrorMessage = (error, context = '') => {
  // Check for specific error types
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    // Handle specific status codes
    switch (status) {
      case 400:
        return handleBadRequest(data, context);
      case 401:
        return {
          title: 'Authentication Required',
          message: 'Your session has expired. Please log in again.',
          solution: 'Click here to return to the login page.',
          action: () => window.location.href = '/login'
        };
      case 403:
        return handleForbidden(data, context);
      case 404:
        return {
          title: 'Not Found',
          message: 'The requested resource could not be found.',
          solution: 'Please check the URL or try refreshing the page.'
        };
      case 413:
        return {
          title: 'File Too Large',
          message: 'The file you\'re trying to upload exceeds the 5MB limit.',
          solution: 'Please reduce the file size or split it into smaller files.'
        };
      case 500:
        return handle500Error(data, context);
      default:
        return {
          title: 'Unexpected Error',
          message: data?.error || 'Something went wrong with your request.',
          solution: 'Please try again or contact support if the issue persists.'
        };
    }
  }
  
  // Handle network errors
  if (error.code === 'ECONNABORTED') {
    return {
      title: 'Request Timeout',
      message: 'The server took too long to respond.',
      solution: 'Check your internet connection and try again.'
    };
  }
  
  if (!navigator.onLine) {
    return {
      title: 'No Internet Connection',
      message: 'You appear to be offline.',
      solution: 'Please check your internet connection and try again.'
    };
  }
  
  // Context-specific errors
  if (context === 'encryption') {
    return {
      title: 'Encryption Error',
      message: 'Failed to initialize encryption. Your data may not be secure.',
      solution: 'Please refresh the page. If the problem persists, try clearing your browser cache.',
      action: () => window.location.reload()
    };
  }
  
  // Default error
  return {
    title: 'Something Went Wrong',
    message: error.message || 'An unexpected error occurred.',
    solution: 'Please try refreshing the page or contact support.'
  };
};

const handleBadRequest = (data, context) => {
  // File upload errors
  if (data?.error?.includes('file type')) {
    return {
      title: 'Invalid File Type',
      message: data.error,
      solution: 'Please upload a DOCX, HTML, or TXT file. PDF files are not supported for templates.',
      tips: [
        'Save your document as .docx in Microsoft Word',
        'Export as HTML from Google Docs',
        'Use plain text (.txt) for simple templates'
      ]
    };
  }
  
  if (data?.error?.includes('already exists')) {
    return {
      title: 'Duplicate Entry',
      message: data.error,
      solution: 'Try using a different name or check if this item already exists.'
    };
  }
  
  if (context === 'template' && data?.error?.includes('markers')) {
    return {
      title: 'Template Validation Failed',
      message: 'Your template contains invalid smart markers.',
      solution: 'Check that all markers follow the {{MARKER_NAME}} format.',
      tips: [
        'Use UPPERCASE for marker names',
        'No spaces in marker names',
        'Close all conditional tags: {{#if}}...{{/if}}'
      ]
    };
  }
  
  return {
    title: 'Invalid Request',
    message: data?.error || 'The server couldn\'t process your request.',
    solution: 'Please check your input and try again.'
  };
};

const handleForbidden = (data, context) => {
  if (data?.error?.includes('pending approval')) {
    return {
      title: 'Account Pending Approval',
      message: 'Your account is waiting for administrator approval.',
      solution: 'You\'ll receive an email once your account is approved. This usually takes 1-2 business days.',
      tips: [
        'Check your email for updates',
        'Contact your administrator if it\'s been more than 48 hours'
      ]
    };
  }
  
  if (data?.isDemo) {
    return {
      title: 'Demo Account Limitation',
      message: data.message || 'This feature is not available for demo accounts.',
      solution: 'Sign up for a full account to access all features.',
      action: () => window.location.href = '/register'
    };
  }
  
  return {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    solution: 'Contact your administrator if you believe this is an error.'
  };
};

const handle500Error = (data, context) => {
  // Template upload specific errors
  if (context === 'template-upload') {
    return {
      title: 'Template Upload Failed',
      message: 'The server couldn\'t process your template.',
      solution: 'This might be due to:',
      tips: [
        'Corrupted file - Try re-saving the document',
        'Special characters - Remove any unusual symbols',
        'File size - Ensure it\'s under 5MB',
        'Server issue - Wait a moment and try again'
      ]
    };
  }
  
  // Database errors
  if (data?.details?.includes('database') || data?.details?.includes('prisma')) {
    return {
      title: 'Database Error',
      message: 'There was a problem saving your data.',
      solution: 'This is usually temporary. Please try again in a few moments.'
    };
  }
  
  return {
    title: 'Server Error',
    message: 'The server encountered an unexpected error.',
    solution: 'Our team has been notified. Please try again later.',
    details: data?.details
  };
};

// Helper to format error for display
export const formatErrorForDisplay = (errorInfo) => {
  let html = `
    <div class="space-y-3">
      <h3 class="text-lg font-semibold text-red-800">${errorInfo.title}</h3>
      <p class="text-gray-700">${errorInfo.message}</p>
      <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p class="text-sm font-medium text-blue-800 mb-1">How to fix:</p>
        <p class="text-sm text-blue-700">${errorInfo.solution}</p>
      </div>
  `;
  
  if (errorInfo.tips && errorInfo.tips.length > 0) {
    html += `
      <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
        ${errorInfo.tips.map(tip => `<li>${tip}</li>`).join('')}
      </ul>
    `;
  }
  
  if (errorInfo.action) {
    html += `
      <button onclick="window.errorAction()" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Try Solution
      </button>
    `;
    // Store the action globally so the onclick can access it
    window.errorAction = errorInfo.action;
  }
  
  html += '</div>';
  return html;
};