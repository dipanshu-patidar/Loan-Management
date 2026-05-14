import api from './api';

const agentNotificationService = {
  /**
   * Get all notifications with analytics and filters
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/agent/notifications', { params });
    return response.data;
  },

  /**
   * Get single notification details
   */
  getNotificationById: async (id) => {
    const response = await api.get(`/agent/notifications/${id}`);
    return response.data;
  },

  /**
   * Mark as read
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/agent/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all as read
   */
  markAllAsRead: async () => {
    const response = await api.patch('/agent/notifications/read-all');
    return response.data;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (id) => {
    const response = await api.delete(`/agent/notifications/${id}`);
    return response.data;
  },

  /**
   * Clear all notifications
   */
  clearAllNotifications: async () => {
    const response = await api.delete('/agent/notifications/clear-all');
    return response.data;
  },

  /**
   * Send follow-up reminder
   */
  sendReminder: async (data) => {
    const response = await api.post('/agent/notifications/send-reminder', data);
    return response.data;
  },

  /**
   * Save follow-up note
   */
  saveFollowUp: async (data) => {
    const response = await api.post('/agent/notifications/follow-up', data);
    return response.data;
  }
};

export default agentNotificationService;
