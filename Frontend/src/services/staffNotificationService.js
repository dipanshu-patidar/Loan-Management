import apiClient from './apiClient';

const staffNotificationService = {
  /**
   * @desc Get staff notifications with filters and pagination
   * @param {Object} params - page, limit, isRead, type
   */
  getNotifications: async (params) => {
    const response = await apiClient.get('/staff/notifications', { params });
    return response.data;
  },

  /**
   * @desc Get unread notifications count
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/staff/notifications/unread-count');
    return response.data;
  },

  /**
   * @desc Mark single notification as read
   * @param {string} id - Notification ID
   */
  markNotificationRead: async (id) => {
    const response = await apiClient.put(`/staff/notifications/${id}/read`);
    return response.data;
  },

  /**
   * @desc Mark all notifications as read
   */
  markAllNotificationsRead: async () => {
    const response = await apiClient.put('/staff/notifications/read-all');
    return response.data;
  },

  /**
   * @desc Delete single notification
   * @param {string} id - Notification ID
   */
  deleteNotification: async (id) => {
    const response = await apiClient.delete(`/staff/notifications/${id}`);
    return response.data;
  },

  /**
   * @desc Clear all notifications
   */
  clearAllNotifications: async () => {
    const response = await apiClient.delete('/staff/notifications/clear-all');
    return response.data;
  }
};

export default staffNotificationService;
