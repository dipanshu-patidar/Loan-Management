import apiClient from './apiClient';

/**
 * Get the profile information for the logged-in staff
 */
export const getStaffProfile = async () => {
  try {
    const response = await apiClient.get('/staff/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update personal profile information for staff
 */
export const updateStaffProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/staff/profile/update', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Change staff account password
 */
export const changeStaffPassword = async (passwordData) => {
  try {
    const response = await apiClient.put('/staff/profile/change-password', passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Upload and update staff profile photo
 */
export const uploadStaffProfilePhoto = async (formData) => {
  try {
    const response = await apiClient.put('/staff/profile/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const staffProfileService = {
  getStaffProfile,
  updateStaffProfile,
  changeStaffPassword,
  uploadStaffProfilePhoto
};

export default staffProfileService;
