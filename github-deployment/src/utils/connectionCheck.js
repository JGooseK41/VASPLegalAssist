// Utility to check server connectivity and provide helpful diagnostics

export const checkServerConnection = async () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  try {
    // Try to fetch with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return {
        connected: true,
        message: 'Server connection successful'
      };
    } else {
      return {
        connected: false,
        message: `Server responded with status: ${response.status}`,
        status: response.status
      };
    }
  } catch (error) {
    console.error('Connection check failed:', error);
    
    // Determine the type of error
    if (error.name === 'AbortError') {
      return {
        connected: false,
        message: 'Connection timeout - server is not responding',
        error: 'TIMEOUT'
      };
    }
    
    if (error.message.includes('Failed to fetch')) {
      return {
        connected: false,
        message: 'Cannot reach server - please check if the service is running',
        error: 'UNREACHABLE'
      };
    }
    
    return {
      connected: false,
      message: error.message || 'Unknown connection error',
      error: error.code || 'UNKNOWN'
    };
  }
};

// Helper to get user-friendly error messages
export const getConnectionErrorMessage = (error) => {
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return {
      title: 'Connection Failed',
      message: 'Unable to connect to the server. This could be due to:',
      suggestions: [
        'Check your internet connection',
        'The server may be temporarily down',
        'Your firewall or network may be blocking the connection',
        'Try refreshing the page'
      ]
    };
  }
  
  if (error.code === 'ERR_TUNNEL_CONNECTION_FAILED') {
    return {
      title: 'Server Unreachable',
      message: 'Cannot establish connection to the server.',
      suggestions: [
        'The service is currently unavailable',
        'Please try again in a few moments',
        'If the problem persists, contact support'
      ]
    };
  }
  
  if (error.response?.status === 500) {
    return {
      title: 'Server Error',
      message: 'The server encountered an error processing your request.',
      suggestions: [
        'Try again in a moment',
        'If the problem persists, contact support'
      ]
    };
  }
  
  if (error.response?.status === 403) {
    return {
      title: 'Access Denied',
      message: error.response?.data?.error || 'You do not have permission to perform this action.',
      suggestions: []
    };
  }
  
  return {
    title: 'Registration Failed',
    message: error.response?.data?.error || error.message || 'An unexpected error occurred',
    suggestions: ['Please try again']
  };
};