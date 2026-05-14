import api from './api';

const agentDashboardService = {
  getDashboardSummary: () => api.get('/agent/dashboard'),
  getAssignedClients: (status) => api.get(`/agent/dashboard/assigned-clients?status=${status || ''}`),
  sendReminder: (data) => api.post('/agent/dashboard/send-reminder', data),
  createFollowupLog: (data) => api.post('/agent/dashboard/followup-log', data),
};

export default agentDashboardService;
