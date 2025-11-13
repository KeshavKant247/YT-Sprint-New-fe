import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yt-sprint-new-be.vercel.app';

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Fetch all data
  getData: async () => {
    const response = await api.get('/api/data');
    return response.data;
  },

  // Get filter options
  getFilters: async () => {
    const response = await api.get('/api/filters');
    return response.data;
  },

  // Get categories and subcategories
  getCategories: async () => {
    const response = await api.get('/api/categories');
    return response.data;
  },

  // Get exam details
  getExams: async () => {
    const response = await api.get('/api/exams');
    return response.data;
  },

  // Add new row
  addRow: async (data) => {
    const response = await api.post('/api/add', data);
    return response.data;
  },

  // Update row
  updateRow: async (rowId, data) => {
    const response = await api.put(`/api/update/${rowId}`, data);
    return response.data;
  },

  // Delete row
  deleteRow: async (rowId) => {
    const response = await api.delete(`/api/delete/${rowId}`);
    return response.data;
  },

  // Raise ticket
  raiseTicket: async (ticketData) => {
    try {
      const response = await api.post('/api/ticket', ticketData);
      return response.data;
    } catch (error) {
      // Re-throw the error with additional context
      if (error.code === 'ERR_NETWORK') {
        error.message = 'Network Error';
      }
      throw error;
    }
  },

  // Domain-based Login (Email only, no password)
  loginWithEmail: async (email) => {
    const response = await api.post('/api/auth/login', { email });
    return response.data;
  },

  // MongoDB Atlas Login (Legacy - with username/password)
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  // Signup new user
  signup: async (username, email, password, confirmPassword) => {
    const response = await api.post('/api/auth/signup', { 
      username, 
      email, 
      password, 
      confirm_password: confirmPassword 
    });
    return response.data;
  },

  // Google OAuth Authentication (legacy - not used)
  googleLogin: async (credential) => {
    const response = await api.post('/api/auth/google-login', { credential });
    return response.data;
  },

  // Get allowed domains
  getAllowedDomains: async () => {
    const response = await api.get('/api/auth/allowed-domains');
    return response.data;
  },

  // Verify token
  verifyToken: async (token) => {
    const response = await api.get('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Get current user info
  getCurrentUser: async (token) => {
    const response = await api.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export default apiService;
