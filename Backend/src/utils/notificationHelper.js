const Notification = require('../models/Notification');
const { getIO } = require('../socket/socketServer');

/**
 * Create a new system/administrative notification and broadcast in real-time
 */
const createNotification = async (payload) => {
  try {
    const notification = await Notification.create({
      ...payload,
      status: 'Unread',
      isRead: false,
      isDeleted: false
    });

    // Populate relations if available for immediate state updates on UI
    const populated = await Notification.findById(notification._id)
      .populate('borrowerId', 'fullName email profilePicture')
      .populate('applicationId', 'applicationId loanAmount status')
      .populate('paymentId', 'transactionId amount status paymentMethod');

    // Emit to sockets
    try {
      const io = getIO();
      io.emit('notification:new', populated);
    } catch (socketErr) {
      console.error('Socket emit failed inside createNotification:', socketErr.message);
    }

    return populated;
  } catch (error) {
    console.error('Error creating notification model:', error);
    return null;
  }
};

module.exports = { createNotification };
