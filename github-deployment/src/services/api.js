import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API Base URL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});


// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if we should show a session expired message
      const lastActivity = localStorage.getItem('lastActivity');
      const now = Date.now();
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
      
      if (lastActivity && (now - parseInt(lastActivity)) > sessionTimeout) {
        // Session expired
        localStorage.setItem('sessionExpired', 'true');
      }
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Update last activity on each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Update last activity timestamp
      localStorage.setItem('lastActivity', Date.now().toString());
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    try {
      console.log('Registration API: Attempting to register user at:', API_BASE_URL + '/auth/register');
      const response = await api.post('/auth/register', userData);
      console.log('Registration API: Success');
      return response.data;
    } catch (error) {
      // Enhanced error logging
      console.error('Registration API: Network Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        baseURL: API_BASE_URL
      });
      
      // Check if it's a network error
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Registration API: Network Error - Unable to reach server at', API_BASE_URL);
      }
      
      throw error;
    }
  },
  
  getMemberCount: async () => {
    const response = await api.get('/auth/member-count');
    return response.data;
  },
  
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },
  
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  submitAdminApplication: async (applicationData) => {
    const response = await api.post('/auth/admin-application', applicationData);
    return response.data;
  },

  getMyAdminApplication: async () => {
    const response = await api.get('/auth/admin-application');
    return response.data;
  }
};

// Profile API
export const profileAPI = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },
  
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/profile/password', { currentPassword, newPassword });
    return response.data;
  },
  
  deleteAccount: async (password, confirmText) => {
    const response = await api.delete('/profile', { 
      data: { password, confirmText }
    });
    return response.data;
  }
};

// Template API
export const templateAPI = {
  getTemplates: async () => {
    const response = await api.get('/templates');
    return response.data;
  },
  
  getTemplate: async (id) => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },
  
  createTemplate: async (templateData) => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },
  
  updateTemplate: async (id, templateData) => {
    const response = await api.put(`/templates/${id}`, templateData);
    return response.data;
  },
  
  deleteTemplate: async (id) => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },
  
  setDefaultTemplate: async (id, templateType) => {
    const response = await api.put(`/templates/${id}/default`, { templateType });
    return response.data;
  },
  
  // Smart template endpoints
  uploadTemplate: async (formData) => {
    const response = await api.post('/templates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  updateMarkerMappings: async (id, mappings) => {
    const response = await api.put(`/templates/${id}/mappings`, { mappings });
    return response.data;
  },
  
  previewTemplate: async (id, data) => {
    const response = await api.post(`/templates/${id}/preview`, data);
    return response.data;
  },
  
  getAvailableMarkers: async () => {
    const response = await api.get('/templates/markers');
    return response.data;
  },
  
  trackTemplateUsage: async (templateId) => {
    const response = await api.post(`/templates/${templateId}/usage`);
    return response.data;
  }
};

// Document API
export const documentAPI = {
  createDocument: async (documentData) => {
    // Transform frontend data to match backend expectations
    const transformedData = {
      vaspId: documentData.vasp_id || documentData.vaspId,
      vaspName: documentData.metadata?.vasp_name || documentData.vaspName || '',
      vaspJurisdiction: documentData.vasp_jurisdiction || documentData.vaspJurisdiction || '',
      vaspEmail: documentData.vasp_email || documentData.vaspEmail || '',
      vaspAddress: documentData.vasp_address || documentData.vaspAddress || '',
      templateId: documentData.template_id || documentData.templateId,
      documentType: documentData.document_type || documentData.documentType,
      caseNumber: documentData.case_info?.case_number || documentData.caseNumber || '',
      crimeDescription: documentData.case_info?.crime_description || documentData.crimeDescription || '',
      statute: documentData.case_info?.statute || documentData.statute || '',
      transactions: documentData.transactions || [],
      outputFormat: documentData.outputFormat || 'pdf',
      // Pass through custom_data if present
      custom_data: documentData.custom_data
    };
    
    const response = await api.post('/documents', transformedData);
    return response.data;
  },
  
  getDocuments: async (limit = 10, offset = 0) => {
    const response = await api.get('/documents', { params: { limit, offset } });
    return response.data;
  },
  
  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  duplicateDocument: async (id) => {
    const response = await api.post(`/documents/${id}/duplicate`);
    return response.data;
  },
  
  importTransactions: async (file, documentId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (documentId) {
      formData.append('documentId', documentId);
    }
    
    const response = await api.post('/documents/import-transactions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  createSimpleDocument: async (documentData) => {
    const response = await api.post('/documents/simple', documentData);
    return response.data;
  },
  
  createSimpleBatch: async (formData) => {
    const response = await api.post('/documents/simple-batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  createCustomBatch: async (formData) => {
    const response = await api.post('/documents/custom-batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getTotalDocumentCount: async () => {
    const response = await api.get('/documents/total-count');
    return response.data;
  },
  
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
  
  downloadEncryptedPackage: async (documentId) => {
    const response = await api.get(`/encrypted-documents/download/${documentId}`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  decryptPackage: async (formData) => {
    const response = await api.post('/encrypted-documents/decrypt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    });
    return response.data;
  },
  
  migrateToUserEncryption: async () => {
    const response = await api.post('/encrypted-documents/migrate');
    return response.data;
  }
};

// VASP API
export const vaspAPI = {
  getVASPs: async () => {
    const response = await api.get('/vasps');
    return response.data;
  },
  
  getVASP: async (id) => {
    const response = await api.get(`/vasps/${id}`);
    return response.data;
  },
  
  submitUpdateRequest: async (updateData) => {
    // Check if updateData is FormData (for file uploads)
    const isFormData = updateData instanceof FormData;
    const response = await api.post('/vasps/update-request', updateData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  }
};

// Comments API
export const commentAPI = {
  getVaspComments: async (vaspId) => {
    const response = await api.get(`/comments/vasp/${vaspId}`);
    return response.data;
  },
  
  createComment: async (vaspId, content, isUpdate = false) => {
    const response = await api.post(`/comments/vasp/${vaspId}`, { content, isUpdate });
    return response.data;
  },
  
  updateComment: async (commentId, content) => {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },
  
  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
  
  voteComment: async (commentId, value) => {
    const response = await api.post(`/comments/${commentId}/vote`, { value });
    return response.data;
  }
};

// Admin API
export const adminAPI = {
  // Dashboard
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  // VASP Management
  getVasps: async (params = {}) => {
    const response = await api.get('/admin/vasps', { params });
    return response.data;
  },
  
  createVasp: async (vaspData) => {
    const response = await api.post('/admin/vasps', vaspData);
    return response.data;
  },
  
  updateVasp: async (id, vaspData) => {
    const response = await api.put(`/admin/vasps/${id}`, vaspData);
    return response.data;
  },
  
  deleteVasp: async (id) => {
    const response = await api.delete(`/admin/vasps/${id}`);
    return response.data;
  },
  
  // User Management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  approveUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/approve`);
    return response.data;
  },
  
  verifyUserEmail: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/verify-email`);
    return response.data;
  },
  
  rejectUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}/reject`);
    return response.data;
  },
  
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
  
  getUserFeedback: async (userId) => {
    const response = await api.get(`/admin/users/${userId}/feedback`);
    return response.data;
  },
  
  // Submissions
  getSubmissions: async (status = 'PENDING') => {
    const response = await api.get('/admin/submissions', { params: { status } });
    return response.data;
  },
  
  approveSubmission: async (submissionId) => {
    const response = await api.post(`/admin/submissions/${submissionId}/approve`);
    return response.data;
  },
  
  rejectSubmission: async (submissionId, reason) => {
    const response = await api.post(`/admin/submissions/${submissionId}/reject`, { reason });
    return response.data;
  },
  
  // Update requests
  getUpdateRequests: async (status = 'PENDING') => {
    const response = await api.get(`/admin/update-requests?status=${status}`);
    return response.data;
  },
  
  processUpdateRequest: async (id, action, adminNotes) => {
    const response = await api.put(`/admin/update-requests/${id}`, { action, adminNotes });
    return response.data;
  },
  
  getUpdateNotifications: async () => {
    const response = await api.get('/admin/update-notifications');
    return response.data;
  },
  
  processUpdateNotification: async (notificationId) => {
    const response = await api.put(`/admin/update-notifications/${notificationId}/process`);
    return response.data;
  }
};

// Submission API (for regular users)
export const submissionAPI = {
  createSubmission: async (vaspData) => {
    const response = await api.post('/submissions', vaspData);
    return response.data;
  },
  
  getMySubmissions: async () => {
    const response = await api.get('/submissions/my');
    return response.data;
  },
  
  getSubmission: async (id) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },
  
  updateSubmission: async (id, vaspData) => {
    const response = await api.put(`/submissions/${id}`, vaspData);
    return response.data;
  },
  
  deleteSubmission: async (id) => {
    const response = await api.delete(`/submissions/${id}`);
    return response.data;
  }
};

// User API
export const userAPI = {
  getLeaderboard: async () => {
    const response = await api.get('/contributors/leaderboard');
    return response.data;
  }
};

// Contributor API
export const contributorAPI = {
  getLeaderboard: async () => {
    const response = await api.get('/contributors/leaderboard');
    return response.data;
  },
  
  getUserScore: async () => {
    const response = await api.get('/contributors/my-score');
    return response.data;
  },
  
  checkMilestone: async () => {
    const response = await api.get('/contributors/check-milestone');
    return response.data;
  },
  
  submitMilestoneFeedback: async (feedbackData) => {
    const response = await api.post('/contributors/milestone-feedback', feedbackData);
    return response.data;
  },
  
  acknowledgeMilestone: async (milestone) => {
    const response = await api.post('/contributors/acknowledge-milestone', { milestone });
    return response.data;
  },
  
  checkLeaderboardAchievement: async () => {
    const response = await api.get('/contributors/check-leaderboard-achievement');
    return response.data;
  },
  
  acknowledgeLeaderboardAchievement: async () => {
    const response = await api.post('/contributors/acknowledge-leaderboard-achievement');
    return response.data;
  }
};

export default api;