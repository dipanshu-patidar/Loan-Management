import api from './api';

const notificationService = {
  /**
   * Get all notifications with pagination, search and type/status filters
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },

  /**
   * Get overall unread count and categorical analytics breakdown
   */
  getUnreadCount: async () => {
    const response = await api.get('/admin/notifications/unread-count');
    return response.data;
  },

  /**
   * Retrieve full relational data for a single alert (drawer detail)
   */
  getNotificationById: async (id) => {
    const response = await api.get(`/admin/notifications/${id}`);
    return response.data;
  },

  /**
   * Flag a single alert as read
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/admin/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Flag all unread admin alerts as read instantly
   */
  markAllAsRead: async () => {
    const response = await api.patch('/admin/notifications/read-all');
    return response.data;
  },

  /**
   * Soft delete single alert
   */
  deleteNotification: async (id) => {
    const response = await api.delete(`/admin/notifications/${id}`);
    return response.data;
  },

  /**
   * Archive/soft delete all notifications registry
   */
  clearAllNotifications: async () => {
    const response = await api.delete('/admin/notifications/clear-all');
    return response.data;
  }
};

export default notificationService;
