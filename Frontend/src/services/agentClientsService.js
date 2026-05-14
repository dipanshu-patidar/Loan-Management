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
   * Save follow-up record
   * @param {Object} data 
   * @returns {Promise}
   */
  saveFollowUp: async (data) => {
    try {
      const response = await apiClient.post('/agent/my-clients/follow-up', data);
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
