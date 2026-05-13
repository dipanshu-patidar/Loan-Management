import api from './api';

const duePaymentService = {
  getAllDuePayments: async (params) => {
    return await api.get('/admin/due-payments', { params });
  },

  getDuePaymentStats: async () => {
    return await api.get('/admin/due-payments/stats');
  },

  getDuePaymentDetails: async (id) => {
    return await api.get(`/admin/due-payments/${id}`);
  },

  sendReminder: async (id) => {
    return await api.post(`/admin/due-payments/${id}/send-reminder`);
  },

  sendBulkReminders: async (filter) => {
    return await api.post('/admin/due-payments/bulk-reminders', { filter });
  },

  updateNotes: async (id, notes) => {
    return await api.put(`/admin/due-payments/${id}/notes`, { notes });
  },

  exportDuePayments: async () => {
    return await api.get('/admin/due-payments/export');
  }
};

export default duePaymentService;
