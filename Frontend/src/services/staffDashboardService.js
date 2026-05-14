import apiClient from './apiClient';

const staffDashboardService = {
  /**
   * Get all dynamic dashboard data
   * @returns {Promise}
   */
  getDashboardData: async () => {
    try {
      const response = await apiClient.get('/staff/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get workflow queue specifically
   * @returns {Promise}
   */
  getWorkflowQueue: async () => {
    try {
      const response = await apiClient.get('/staff/dashboard');
      return {
        success: true,
        data: response.data.data.workflowQueue
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get priority alerts specifically
   * @returns {Promise}
   */
  getPriorityAlerts: async () => {
    try {
      const response = await apiClient.get('/staff/dashboard');
      return {
        success: true,
        data: response.data.data.priorityAlerts
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent activities specifically
   * @returns {Promise}
   */
  getRecentActivities: async () => {
    try {
      const response = await apiClient.get('/staff/dashboard');
      return {
        success: true,
        data: response.data.data.recentActivities
      };
    } catch (error) {
      throw error;
    }
  }
};

export default staffDashboardService;
