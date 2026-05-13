import api from './api';

const reportService = {
  getReportStats: async () => {
    return await api.get('/admin/reports/stats');
  },

  getCollectionsOverview: async () => {
    return await api.get('/admin/reports/collections-overview');
  },

  getLoanPerformance: async () => {
    return await api.get('/admin/reports/loan-performance');
  },

  getBorrowerOverview: async () => {
    return await api.get('/admin/reports/borrower-overview');
  },

  getAllReports: async (params) => {
    return await api.get('/admin/reports', { params });
  },

  getSingleReport: async (id) => {
    return await api.get(`/admin/reports/${id}`);
  },

  generateReport: async (data) => {
    return await api.post('/admin/reports/generate', data);
  },

  exportReport: async (id, data) => {
    return await api.post(`/admin/reports/${id}/export`, data);
  },

  deleteReport: async (id) => {
    return await api.delete(`/admin/reports/${id}`);
  }
};

export default reportService;
