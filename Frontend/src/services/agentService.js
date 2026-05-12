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
};

export default agentService;
