const Notification = require('../../models/Notification');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { getIO } = require('../../socket/socketServer');

/**
 * @desc    Get latest 10 notifications for Navbar
 * @route   GET /api/admin/navbar-notifications
 * @access  Private/Admin
 */
const getNavbarNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ 
    receiverRole: 'admin',
    isDeleted: false 
  })
  .populate('borrowerId', 'fullName email')
  .sort({ createdAt: -1 })
  .limit(10);

  sendSuccess(res, 'Latest 10 navbar notifications fetched successfully', { notifications });
});

/**
 * @desc    Get Navbar overall unread count
 * @route   GET /api/admin/navbar-notifications/unread-count
 * @access  Private/Admin
 */
const getNavbarUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ 
    receiverRole: 'admin',
    isDeleted: false,
    status: 'Unread'
  });

  sendSuccess(res, 'Unread count fetched successfully', { unreadCount });
});

/**
 * @desc    Mark single navbar notification as read
 * @route   PATCH /api/admin/navbar-notifications/:id/read
 * @access  Private/Admin
 */
const markNavbarNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { status: 'Read', isRead: true },
    { new: true }
  ).populate('borrowerId');

  if (!notification) {
    return sendError(res, 'Notification not found', 404);
  }

  // Emit Socket updates
  try {
    const io = getIO();
    io.emit('notification:read', { id: notification._id, status: 'Read' });
    io.emit('notification:update', { id: notification._id, field: 'status', value: 'Read' });
  } catch (err) {}

  sendSuccess(res, 'Navbar notification marked as read', notification);
});

/**
 * @desc    Mark all navbar notifications as read
 * @route   PATCH /api/admin/navbar-notifications/read-all
 * @access  Private/Admin
 */
const markAllNavbarNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { receiverRole: 'admin', isDeleted: false, status: 'Unread' },
    { status: 'Read', isRead: true }
  );

  // Emit Socket updates
  try {
    const io = getIO();
    io.emit('notification:read', { scope: 'all' });
    io.emit('notification:update', { scope: 'all', field: 'status', value: 'Read' });
  } catch (err) {}

  sendSuccess(res, 'All navbar notifications marked as read successfully');
});

module.exports = {
  getNavbarNotifications,
  getNavbarUnreadCount,
  markNavbarNotificationAsRead,
  markAllNavbarNotificationsAsRead
};
