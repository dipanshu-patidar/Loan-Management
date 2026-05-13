import api from './api';

const agentService = {
  createAgent: async (formData) => {
    // FormData is required for multipart/form-data (image upload)
    const response = await api.post('/admin/agents/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAllAgents: async () => {
    const response = await api.get('/admin/agents');
    return response.data;
  },

  getAgentById: async (id) => {
    const response = await api.get(`/admin/agents/${id}`);
    return response.data;
  },

  updateAgent: async (id, formData) => {
    const response = await api.put(`/admin/agents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAgent: async (id) => {
    const response = await api.delete(`/admin/agents/${id}`);
    return response.data;
  },

  getAgentClients: async (id) => {
    const response = await api.get(`/admin/agents/${id}/clients`);
    return response.data;
  },

  updateAgentCommission: async (id, commissionData) => {
    const response = await api.put(`/admin/agents/${id}/commission`, commissionData);
    return response.data;
  },

  suspendAgent: async (id) => {
    const response = await api.put(`/admin/agents/${id}/suspend`);
    return response.data;
  },

  activateAgent: async (id) => {
    const response = await api.put(`/admin/agents/${id}/activate`);
    return response.data;
  },

  deactivateAgent: async (id) => {
    const response = await api.put(`/admin/agents/${id}/deactivate`);
    return response.data;
  },

  getMyProfile: async () => {
    const response = await api.get('/agent/profile');
    return response.data;
  },
};

export default agentService;
