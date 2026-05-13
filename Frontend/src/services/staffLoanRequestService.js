import api from './api';

const staffLoanRequestService = {
  /**
   * GET /api/staff/loan-requests/overview
   */
  getLoanRequestOverview: async () => {
    const response = await api.get('/staff/loan-requests/overview');
    return response.data;
  },

  /**
   * GET /api/staff/loan-requests
   */
  getLoanRequests: async (params = {}) => {
    const response = await api.get('/staff/loan-requests', { params });
    return response.data;
  },

  /**
   * GET /api/staff/loan-requests/:id
   */
  getLoanRequestById: async (id) => {
    const response = await api.get(`/staff/loan-requests/${id}`);
    return response.data;
  },

  /**
   * PUT /api/staff/loan-requests/:id/verify-documents
   */
  verifyDocuments: async (id, payload) => {
    const response = await api.put(`/staff/loan-requests/${id}/verify-documents`, payload);
    return response.data;
  },

  /**
   * PUT /api/staff/loan-requests/:id/review
   */
  submitReview: async (id, payload) => {
    const response = await api.put(`/staff/loan-requests/${id}/review`, payload);
    return response.data;
  },

  /**
   * GET /api/staff/loan-requests/review-history
   */
  getReviewHistory: async (params = {}) => {
    const response = await api.get('/staff/loan-requests/review-history', { params });
    return response.data;
  }
};

export default staffLoanRequestService;
