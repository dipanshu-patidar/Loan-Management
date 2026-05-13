import api from './api';

const profileService = {
  /**
   * Get current admin profile from JWT
   */
  getAdminProfile: async () => {
    const response = await api.get('/admin/profile');
    return response.data;
  },

  /**
   * Update textual profile information
   */
  updateAdminProfile: async (profileData) => {
    const response = await api.put('/admin/profile/update', profileData);
    return response.data;
  },

  /**
   * Upload new profile photo using multi-part form data
   */
  updateProfilePhoto: async (formData) => {
    const response = await api.put('/admin/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Securely change account password
   */
  changePassword: async (passwordData) => {
    const response = await api.put('/admin/profile/change-password', passwordData);
    return response.data;
  },

  /**
   * Fast-verify existing password before modifying sensitive gates
   */
  verifyCurrentPassword: async (password) => {
    const response = await api.post('/admin/profile/verify-password', { password });
    return response.data;
  },
};

export default profileService;
