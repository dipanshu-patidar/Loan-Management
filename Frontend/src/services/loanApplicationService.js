import api from './api';

const loanApplicationService = {
  /**
   * @desc Get all loan applications with filters
   * @param {Object} params - Query parameters (page, limit, search, status, etc.)
   */
  getAllApplications: async (params) => {
    const response = await api.get('/admin/loan-applications', { params });
    return response.data;
  },

  /**
   * @desc Get loan application stats (counts by status)
   */
  getApplicationStats: async () => {
    const response = await api.get('/admin/loan-applications/stats');
    return response.data;
  },

  /**
   * @desc Get single loan application details
   * @param {string} id - Application ID
   */
  getApplicationDetails: async (id) => {
    const response = await api.get(`/admin/loan-applications/${id}`);
    return response.data;
  },

  /**
   * @desc Approve loan application
   * @param {string} id - Application ID
   * @param {Object} data - Approval details (approvedAmount, finalDuration, adminNotes)
   */
  approveApplication: async (id, data) => {
    const response = await api.put(`/admin/loan-applications/${id}/approve`, data);
    return response.data;
  },

  /**
   * @desc Reject loan application
   * @param {string} id - Application ID
   * @param {Object} data - Rejection details (rejectionReason)
   */
  rejectApplication: async (id, data) => {
    const response = await api.put(`/admin/loan-applications/${id}/reject`, data);
    return response.data;
  },

  /**
   * @desc Put loan application on hold
   * @param {string} id - Application ID
   * @param {Object} data - Hold details (holdReason)
   */
  holdApplication: async (id, data) => {
    const response = await api.put(`/admin/loan-applications/${id}/hold`, data);
    return response.data;
  },

  /**
   * @desc Update staff review
   * @param {string} id - Application ID
   * @param {Object} data - Review details (verificationNotes, recommendation, riskLevel)
   */
  updateStaffReview: async (id, data) => {
    const response = await api.put(`/admin/loan-applications/${id}/review`, data);
    return response.data;
  }
};

export default loanApplicationService;
