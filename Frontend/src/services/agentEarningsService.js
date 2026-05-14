import apiClient from './apiClient';

const agentEarningsService = {
  /**
   * Get agent earnings dashboard data
   * @returns {Promise}
   */
  getEarningsDashboard: async () => {
    try {
      const response = await apiClient.get('/agent/earnings/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all commission entries with filters
   * @param {Object} params - Query params (page, limit, search, status, startDate, endDate)
   * @returns {Promise}
   */
  getEarningsTable: async (params) => {
    try {
      const response = await apiClient.get('/agent/earnings', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get detailed commission info
   * @param {string} commissionId 
   * @returns {Promise}
   */
  getEarningDetails: async (commissionId) => {
    try {
      const response = await apiClient.get(`/agent/earnings/${commissionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Export earnings
   * @param {Object} data 
   * @returns {Promise}
   */
  exportEarnings: async (data) => {
    try {
      const response = await apiClient.post('/agent/earnings/export', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Download monthly statement
   * @param {Object} data 
   * @returns {Promise}
   */
  downloadStatement: async (data) => {
    try {
      const response = await apiClient.post('/agent/earnings/statement', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent payouts
   * @returns {Promise}
   */
  getRecentPayouts: async () => {
    try {
      const response = await apiClient.get('/agent/earnings/recent-payouts');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default agentEarningsService;
