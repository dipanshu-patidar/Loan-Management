import apiClient from './apiClient';

const agentCommunicationService = {
  getConversations: (filter) => {
    return apiClient.get(`/agent/communications${filter ? `?filter=${filter}` : ''}`);
  },

  getConversation: (id) => {
    return apiClient.get(`/agent/communications/${id}`);
  },

  sendMessage: (data) => {
    return apiClient.post('/agent/communications/send', data);
  },

  createReminder: (data) => {
    return apiClient.post('/agent/communications/reminder', data);
  },

  markAsRead: (conversationId) => {
    return apiClient.put(`/agent/communications/read/${conversationId}`);
  },

  searchConversations: (query) => {
    return apiClient.get(`/agent/communications/search?search=${query}`);
  }
};

export default agentCommunicationService;
