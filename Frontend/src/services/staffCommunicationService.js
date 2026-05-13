import api from './apiClient';

const staffCommunicationService = {
  /**
   * Fetch all conversational streams assigned to the staff user
   * @param {Object} params { search, conversationType, unreadOnly }
   */
  getConversations: async (params) => {
    const response = await api.get('/staff/communications', { params });
    return response.data;
  },

  /**
   * Fetch message stream for a selected thread
   * @param {String} conversationId 
   */
  getConversationMessages: async (conversationId) => {
    const response = await api.get(`/staff/communications/${conversationId}`);
    return response.data;
  },

  /**
   * Establish a new conversation thread
   * @param {Object} payload { targetUserId, targetRole, initialMessage }
   */
  createConversation: async (payload) => {
    const response = await api.post('/staff/communications/create', payload);
    return response.data;
  },

  /**
   * Dispatch a direct text or attached-media message
   * @param {String} conversationId 
   * @param {Object} payload { message, attachment }
   */
  sendMessage: async (conversationId, payload) => {
    const response = await api.post(`/staff/communications/${conversationId}/send`, payload);
    return response.data;
  },

  /**
   * Clear unread badge counts on thread opening
   * @param {String} conversationId 
   */
  markConversationRead: async (conversationId) => {
    const response = await api.put(`/staff/communications/${conversationId}/read`);
    return response.data;
  },

  /**
   * Redact an already-authored message from DB visibility
   * @param {String} messageId 
   */
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/staff/communications/message/${messageId}`);
    return response.data;
  },

  /**
   * Retrieve system peer users directory for bootstrapping chats
   */
  getOnlineUsers: async () => {
    const response = await api.get('/staff/communications/online-users');
    return response.data;
  }
};

export default staffCommunicationService;
