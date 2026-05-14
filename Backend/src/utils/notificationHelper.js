const Notification = require('../models/Notification');
const { getIO } = require('../socket/socketServer');

/**
 * Create a new notification and broadcast in real-time
 * @param {Object} data - Notification data
 * @param {String} data.receiverId - ID of the user receiving the notification
 * @param {String} data.receiverRole - Role of the user receiving the notification
 * @param {String} data.senderId - ID of the user sending the notification (optional)
 * @param {String} data.senderRole - Role of the user sending the notification (optional)
 * @param {String} data.notificationType - Type of notification
 * @param {String} data.title - Title of the notification
 * @param {String} data.message - Message of the notification
 * @param {String} data.relatedId - ID of the related entity (Loan, Payment, etc.)
 * @param {String} data.relatedModel - Model name of the related entity
 * @param {String} data.priority - Priority (normal, important, urgent)
 */
const createNotification = async (data) => {
  try {
    const notification = await Notification.create({
      ...data,
      isRead: false,
      isDeleted: false
    });

    // Emit to specific user if receiverId is provided
    try {
      const io = getIO();
      if (data.receiverId) {
        const roomId = data.receiverId.toString();
        console.log(`[Notification] Emitting notification:new to room: ${roomId}`);
        // Emit to a room named after the receiverId
        io.to(roomId).emit('notification:new', notification);
        
        // Also emit unread count update
        const unreadCount = await Notification.countDocuments({
          receiverId: data.receiverId,
          isRead: false,
          isDeleted: false
        });
        console.log(`[Notification] Emitting unread:updated to room: ${roomId}, count: ${unreadCount}`);
        io.to(roomId).emit('unread:updated', { unreadCount });
      } else {
        // Fallback: broadcast to all (if no receiverId specified, though usually should have one)
        io.emit('notification:new', notification);
      }
    } catch (socketErr) {
      console.error('Socket emit failed inside createNotification:', socketErr.message);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification model:', error);
    return null;
  }
};

module.exports = { createNotification };
