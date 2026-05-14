import api from './api';

const activeLoanService = {
  getAllActiveLoans: async (params) => {
    return await api.get('/admin/active-loans', { params });
  },

  getLoanDetails: async (id) => {
    return await api.get(`/admin/active-loans/${id}`);
  },

  getOverdueLoans: async () => {
    return await api.get('/admin/active-loans/overdue');
  },

  getCompletedLoans: async () => {
    return await api.get('/admin/active-loans/completed');
  },

  getDashboardStats: async () => {
    return await api.get('/admin/active-loans/stats');
  },

  getExportData: async () => {
    return await api.get('/admin/active-loans/export');
  },

  getDuePayments: async () => {
    return await api.get('/admin/active-loans/due-payments');
  },

  updateLoanStatus: async (id, status) => {
    return await api.put(`/admin/active-loans/${id}/status`, { status });
  },

  addAdminNotes: async (id, notes) => {
    return await api.put(`/admin/active-loans/${id}/notes`, { notes });
  },

  softDeleteLoan: async (id) => {
    return await api.delete(`/admin/active-loans/${id}`);
  },

  assignAgent: async (data) => {
    return await api.post('/admin/active-loans/assign-agent', data);
  }
};

export default activeLoanService;
