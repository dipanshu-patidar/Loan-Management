import api from './api';

const authService = {
  login: async (email, password, role) => {
    const response = await api.post('/auth/login', { email, password, role });
    
    if (response.data.success && response.data.data.token) {
      const { token, user } = response.data.data;
      
      // Save in localStorage as per requirement
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    if (response.data.success && response.data.data.token) {
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem('token'),
  getRole: () => localStorage.getItem('role'),
};

export default authService;
