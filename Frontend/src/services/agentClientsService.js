import apiClient from './apiClient';

const agentClientsService = {
  /**
   * Get agent client dashboard analytics
   * @returns {Promise}
   */
  getClientDashboard: async () => {
    try {
      const response = await apiClient.get('/agent/my-clients/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all assigned clients with filters
   * @param {Object} params - Query params (page, limit, search, loanStatus, dueStatus)
   * @returns {Promise}
   */
  getClients: async (params) => {
    try {
      const response = await apiClient.get('/agent/my-clients', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get detailed borrower info
   * @param {string} borrowerId 
   * @returns {Promise}
   */
  getBorrowerDetails: async (borrowerId) => {
    try {
      const response = await apiClient.get(`/agent/my-clients/${borrowerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Save assistance record
   * @param {Object} data 
   * @returns {Promise}
   */
  saveAssistance: async (data) => {
    try {
      const response = await apiClient.post('/agent/my-clients/assistance', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Save follow-up record (New Operational Flow)
   * @param {Object} data - { loanId, type, note, recoveryStatus, location }
   * @returns {Promise}
   */
  saveFollowUp: async (data) => {
    try {
      const response = await apiClient.post('/agent/follow-ups', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark collection attempt (Field Visit)
   * @param {Object} data - { loanId, note, location, images }
   * @returns {Promise}
   */
  saveCollectionAttempt: async (data) => {
    try {
      const response = await apiClient.post('/agent/follow-ups/collection-attempt', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get follow-up history
   * @param {string} loanId 
   * @returns {Promise}
   */
  getFollowUpHistory: async (loanId) => {
    try {
      const response = await apiClient.get(`/agent/follow-ups/${loanId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent activities
   * @returns {Promise}
   */
  getRecentActivities: async () => {
    try {
      const response = await apiClient.get('/agent/my-clients/activities');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default agentClientsService;
