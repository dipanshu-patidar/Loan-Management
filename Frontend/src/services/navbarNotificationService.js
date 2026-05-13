import api from './api';

const navbarNotificationService = {
  /**
   * Get the latest 10 notifications for dropdown
   */
  getLatest: async () => {
    const response = await api.get('/admin/navbar-notifications');
    return response.data;
  },

  /**
   * Get total count of unread notifications for indicator badge
   */
  getUnreadCount: async () => {
    const response = await api.get('/admin/navbar-notifications/unread-count');
    return response.data;
  },

  /**
   * Flag single dropdown notification as read
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/admin/navbar-notifications/${id}/read`);
    return response.data;
  },

  /**
   * Flag all notifications as read instantly
   */
  markAllAsRead: async () => {
    const response = await api.patch('/admin/navbar-notifications/read-all');
    return response.data;
  }
};

export default navbarNotificationService;
