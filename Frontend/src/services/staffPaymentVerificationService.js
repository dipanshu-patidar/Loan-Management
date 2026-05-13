import api from './apiClient';

const staffPaymentVerificationService = {
  /**
   * GET /api/staff/payment-verification/overview
   */
  getPaymentVerificationOverview: async () => {
    const response = await api.get('/staff/payment-verification/overview');
    return response.data;
  },

  /**
   * GET /api/staff/payment-verification
   */
  getPaymentVerifications: async (params = {}) => {
    const response = await api.get('/staff/payment-verification', { params });
    return response.data;
  },

  /**
   * GET /api/staff/payment-verification/:id
   */
  getPaymentVerificationById: async (id) => {
    const response = await api.get(`/staff/payment-verification/${id}`);
    return response.data;
  },

  /**
   * PUT /api/staff/payment-verification/:id/verify
   */
  verifyPayment: async (id, payload) => {
    const response = await api.put(`/staff/payment-verification/${id}/verify`, payload);
    return response.data;
  },

  /**
   * PUT /api/staff/payment-verification/:id/reject
   */
  rejectPayment: async (id, payload) => {
    const response = await api.put(`/staff/payment-verification/${id}/reject`, payload);
    return response.data;
  },

  /**
   * GET /api/staff/payment-verification/history
   */
  getVerificationHistory: async (params = {}) => {
    const response = await api.get('/staff/payment-verification/history', { params });
    return response.data;
  }
};

export default staffPaymentVerificationService;
