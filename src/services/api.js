import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
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
  }
};

// Document API
export const documentAPI = {
  createDocument: async (documentData) => {
    const response = await api.post('/documents', documentData);
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

export default api;