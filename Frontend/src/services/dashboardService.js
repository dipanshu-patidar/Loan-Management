import api from './api';

const dashboardService = {
  /**
   * GET /api/admin/dashboard/overview
   */
  getDashboardOverview: async () => {
    const response = await api.get('/admin/dashboard/overview');
    return response.data;
  },

  /**
   * GET /api/admin/dashboard/financial-performance
   */
  getFinancialPerformance: async () => {
    const response = await api.get('/admin/dashboard/financial-performance');
    return response.data;
  },

  /**
   * GET /api/admin/dashboard/operational-status
   */
  getOperationalStatus: async () => {
    const response = await api.get('/admin/dashboard/operational-status');
    return response.data;
  },

  /**
   * GET /api/admin/dashboard/recent-applications
   */
  getRecentApplications: async () => {
    const response = await api.get('/admin/dashboard/recent-applications');
    return response.data;
  },

  /**
   * GET /api/admin/dashboard/system-alerts
   */
  getSystemAlerts: async () => {
    const response = await api.get('/admin/dashboard/system-alerts');
    return response.data;
  },

  /**
   * GET /api/admin/dashboard/recent-payments
   */
  getRecentPayments: async () => {
    const response = await api.get('/admin/dashboard/recent-payments');
    return response.data;
  },

  /**
   * GET /api/admin/dashboard/system-health
   */
  getSystemHealth: async () => {
    const response = await api.get('/admin/dashboard/system-health');
    return response.data;
  },

  /**
   * GET /api/admin/dashboard/realtime
   */
  getRealtimeSnapshot: async () => {
    const response = await api.get('/admin/dashboard/realtime');
    return response.data;
  }
};

export default dashboardService;
