import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getMemberCount: async () => {
    const response = await api.get('/auth/member-count');
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
  
  rejectUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}/reject`);
    return response.data;
  },
  
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
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

// Contributor API
export const contributorAPI = {
  getLeaderboard: async () => {
    const response = await api.get('/contributors/leaderboard');
    return response.data;
  },
  
  getUserScore: async () => {
    const response = await api.get('/contributors/my-score');
    return response.data;
  }
};

export default api;