import api from './api';

const agentProfileService = {
  getProfile: () => api.get('/agent/profile'),
  updateProfile: (data) => api.put('/agent/profile', data),
  uploadProfileImage: (formData) => api.patch('/agent/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data) => api.patch('/agent/profile/password', data),
  getProfileActivity: () => api.get('/agent/profile/activity')
};

export default agentProfileService;
