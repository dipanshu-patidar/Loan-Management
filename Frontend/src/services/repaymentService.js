import api from './api';

const repaymentService = {
  getLoanSchedule: async (loanId) => {
    return await api.get(`/repayments/loan/${loanId}`);
  },

  getUpcomingEMIs: async () => {
    return await api.get('/repayments/upcoming');
  },

  updateRepayment: async (id, data) => {
    return await api.put(`/repayments/${id}`, data);
  },

  waivePenalty: async (id) => {
    return await api.post(`/repayments/${id}/waive-penalty`);
  },

  markDispute: async (id, reason) => {
    return await api.post(`/repayments/${id}/dispute`, { reason });
  }
};

export default repaymentService;
