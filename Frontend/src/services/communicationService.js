import api from './api';

const communicationService = {
  getAllConversations: async (filter = 'all') => {
    return await api.get('/admin/communications', { params: { filter } });
  },

  getSingleConversation: async (id) => {
    return await api.get(`/admin/communications/${id}`);
  },

  sendMessage: async (messageData) => {
    return await api.post('/admin/communications/send', messageData);
  },

  broadcastMessage: async (broadcastData) => {
    return await api.post('/admin/communications/broadcast', broadcastData);
  },

  markAsRead: async (conversationId) => {
    return await api.put(`/admin/communications/read/${conversationId}`);
  },

  searchConversations: async (query) => {
    return await api.get('/admin/communications/search', { params: { query } });
  },

  getUnreadCounts: async () => {
    return await api.get('/admin/communications/unread');
  },

  deleteMessage: async (messageId) => {
    return await api.delete(`/admin/communications/message/${messageId}`);
  }
};

export default communicationService;
