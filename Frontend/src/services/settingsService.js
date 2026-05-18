import api from './api';

const settingsService = {
  getSettings: async () => {
    return await api.get('/admin/settings');
  },

  updateGeneralSettings: async (generalData) => {
    return await api.put('/admin/settings/general', generalData);
  },

  updateEligibilityRules: async (eligibilityData) => {
    return await api.put('/admin/settings/eligibility', eligibilityData);
  },

  updateDocumentRules: async (documentData) => {
    return await api.put('/admin/settings/document-rules', documentData);
  },

  updateBulkSettings: async (bulkData) => {
    return await api.put('/admin/settings/bulk', bulkData);
  },

  resetSettings: async () => {
    return await api.post('/admin/settings/reset');
  },

  calculateLivePreview: async (tempSettings) => {
    return await api.post('/admin/settings/live-preview', tempSettings);
  }
};

export default settingsService;
