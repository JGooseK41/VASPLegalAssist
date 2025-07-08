/**
 * Utility functions for handling URLs in the application
 */

// Export the API base URL for consistent usage
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Constructs a full backend URL from a relative or absolute path
 * @param {string} path - The path that might be relative or absolute
 * @returns {string} - The full URL
 */
export const getFullBackendUrl = (path) => {
  // If the path is already a full URL, return it as is
  if (path && path.startsWith('http')) {
    return path;
  }

  // Get the API base URL from environment or default
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Remove '/api' from the end to get the backend base URL
  const backendBaseUrl = apiUrl.replace(/\/api$/, '');
  
  // Ensure proper path joining
  if (!path) {
    return backendBaseUrl;
  }
  
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${backendBaseUrl}${cleanPath}`;
};

/**
 * Downloads a file from a URL
 * @param {string} url - The URL to download from (can be relative or absolute)
 * @param {string} filename - The filename to save as
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = getFullBackendUrl(url);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};