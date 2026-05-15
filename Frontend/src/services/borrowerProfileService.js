import api from './api';

const borrowerProfileService = {
  /**
   * Get current borrower profile from JWT
   */
  getBorrowerProfile: async () => {
    const response = await api.get('/borrower/profile');
    return response.data;
  },

  /**
   * Update textual profile information
   */
  updateBorrowerProfile: async (profileData) => {
    const response = await api.put('/borrower/profile/update', profileData);
    return response.data;
  },

  /**
   * Upload new profile photo
   */
  uploadBorrowerProfilePhoto: async (formData) => {
    const response = await api.put('/borrower/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Change account password
   */
  changeBorrowerPassword: async (passwordData) => {
    const response = await api.put('/borrower/profile/change-password', passwordData);
    return response.data;
  }
};

export default borrowerProfileService;
