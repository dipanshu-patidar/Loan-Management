import api from './api';

const paymentService = {
  getAllPayments: async (params) => {
    return await api.get('/admin/payments', { params });
  },

  getPaymentDetails: async (id) => {
    return await api.get(`/admin/payments/${id}`);
  },

  verifyPayment: async (id) => {
    return await api.put(`/admin/payments/${id}/verify`);
  },

  rejectPayment: async (id, data) => {
    return await api.put(`/admin/payments/${id}/reject`, data);
  },

  getPendingPayments: async () => {
    return await api.get('/admin/payments/pending');
  },

  getVerifiedPayments: async () => {
    return await api.get('/admin/payments/verified');
  },

  getRejectedPayments: async () => {
    return await api.get('/admin/payments/rejected');
  },

  getPaymentStats: async () => {
    return await api.get('/admin/payments/stats');
  },

  getExportData: async () => {
    return await api.get('/admin/payments/export');
  },

  downloadReceipt: async (id) => {
    return await api.get(`/admin/payments/${id}/receipt`);
  }
};

export default paymentService;
