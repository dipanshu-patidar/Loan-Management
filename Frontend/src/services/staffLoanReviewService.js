import apiClient from './apiClient';

/**
 * staffLoanReviewService connects the staff assessments frontend dashboard 
 * directly to authenticated Mongo review controllers.
 */
const staffLoanReviewService = {
  /**
   * 1. Hydrates review workspace telemetry cards
   */
  getLoanReviewOverview: async () => {
    const response = await apiClient.get('/staff/loan-review/overview');
    return response.data;
  },

  /**
   * 2. Queries application database with dynamic paging & parameters
   */
  getLoanReviews: async (params = {}) => {
    const response = await apiClient.get('/staff/loan-review', { params });
    return response.data;
  },

  /**
   * 3. Hydrates detailed record for a given dossier
   */
  getLoanReviewById: async (id) => {
    const response = await apiClient.get(`/staff/loan-review/${id}`);
    return response.data;
  },

  /**
   * 4. Commits staff endorsement recommendation directly to admin queues
   */
  recommendApproval: async (id, data) => {
    const response = await apiClient.put(`/staff/loan-review/${id}/recommend-approval`, data);
    return response.data;
  },

  /**
   * 5. Marks specific dossier recommendation for official administrative rejection
   */
  recommendRejection: async (id, data) => {
    const response = await apiClient.put(`/staff/loan-review/${id}/recommend-rejection`, data);
    return response.data;
  },

  /**
   * 6. Issues real-time corrective notification request and sets missing status flag
   */
  requestDocuments: async (id, data) => {
    const response = await apiClient.put(`/staff/loan-review/${id}/request-documents`, data);
    return response.data;
  },

  /**
   * 7. Hydrates historical archive of evaluated dossiers by logged staff
   */
  getReviewHistory: async (params = {}) => {
    const response = await apiClient.get('/staff/loan-review/history', { params });
    return response.data;
  }
};

export default staffLoanReviewService;
