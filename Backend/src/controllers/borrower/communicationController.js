const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const Notification = require('../../models/Notification');
const ActiveLoan = require('../../models/ActiveLoan');
const LoanApplication = require('../../models/LoanApplication');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { getIO } = require('../../socket/socketServer');
const imagekit = require('../../config/imagekit');

/**
 * @desc    Get all conversations for borrower
 * @route   GET /api/borrower/conversations
 */
exports.getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({
    participants: userId,
    isActive: true,
    isDeleted: false
  })
  .populate('participants', 'fullName role profilePhoto email')
  .sort({ updatedAt: -1 });

  // Format response for easier frontend handling
  const formatted = conversations.map(conv => {
    const convObj = conv.toObject();
    convObj.chatPartner = conv.participants.find(p => p._id.toString() !== userId.toString());
    return convObj;
  });

  sendSuccess(res, 'Conversations retrieved', formatted);
});

/**
 * @desc    Get messages for a specific conversation
 * @route   GET /api/borrower/conversations/:id/messages
 */
exports.getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if user is participant
  const conversation = await Conversation.findOne({ _id: id, participants: userId });
  if (!conversation) {
    return sendError(res, 'Unauthorized or conversation not found', 403);
  }

  const messages = await Message.find({ conversationId: id, isDeleted: false })
    .populate('senderId', 'fullName role profilePhoto')
    .sort({ createdAt: 1 });

  // Mark all messages as read by this user
  await Message.updateMany(
    { conversationId: id, senderId: { $ne: userId }, isRead: false },
    { $set: { isRead: true }, $addToSet: { readBy: userId } }
  );

  // Reset unread count for this user in conversation
  const unreadField = `unreadCounts.${userId}`;
  await Conversation.findByIdAndUpdate(id, { $set: { [unreadField]: 0 } });

  // Emit socket event for read status
  const io = getIO();
  io.to(id).emit('messages-read', { conversationId: id, userId });

  sendSuccess(res, 'Messages retrieved', messages);
});

/**
 * @desc    Send a message
 * @route   POST /api/borrower/messages/send
 */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, message, messageType } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  let attachment = null;
  let attachmentName = null;

  // Check if conversation exists and user is participant
  let conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) {
    return sendError(res, 'Unauthorized or conversation not found', 403);
  }

  // Handle file upload if present
  if (req.file) {
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: `chat_${Date.now()}_${req.file.originalname}`,
      folder: '/lms/chat-attachments'
    });
    attachment = uploadResponse.url;
    attachmentName = req.file.originalname;
  }

  // Create message
  const newMessage = await Message.create({
    conversationId,
    senderId: userId,
    senderRole: userRole,
    message,
    messageType: messageType || (attachment ? 'file' : 'text'),
    attachment,
    attachmentName,
    attachments: attachment ? [attachment] : []
  });

  // Update conversation last message
  const updateData = {
    lastMessage: message || (attachment ? 'Sent an attachment' : ''),
    lastMessageAt: new Date(),
    updatedAt: new Date()
  };

  // Increment unread counts for other participants
  conversation.participants.forEach(participantId => {
    if (participantId.toString() !== userId.toString()) {
      const field = `unreadCounts.${participantId}`;
      updateData[field] = (conversation.unreadCounts.get(participantId.toString()) || 0) + 1;
    }
  });

  await Conversation.findByIdAndUpdate(conversationId, { $set: updateData });

  // Populate sender info for real-time update
  const populatedMessage = await Message.findById(newMessage._id)
    .populate('senderId', 'fullName role profilePhoto');

  // Emit socket events
  const io = getIO();
  // 1. Send to the conversation room
  io.to(conversationId).emit('message-received', populatedMessage);
  
  // 2. Send notifications to other participants
  conversation.participants.forEach(async (participantId) => {
    if (participantId.toString() !== userId.toString()) {
      // Notification popup
      io.to(participantId.toString()).emit('message-notification', {
        conversationId,
        message: populatedMessage,
        senderName: req.user.fullName
      });

      // Update sidebar
      io.to(participantId.toString()).emit('conversation-updated', {
        conversationId,
        lastMessage: updateData.lastMessage,
        lastMessageAt: updateData.lastMessageAt,
        unreadCount: updateData[`unreadCounts.${participantId}`]
      });

      // Create persistence notification
      await Notification.create({
        receiverId: participantId,
        receiverRole: 'borrower', // Simplified for now, should ideally check role
        senderId: userId,
        senderRole: userRole,
        type: 'NewMessage',
        title: `New message from ${req.user.fullName}`,
        message: message || 'Sent an attachment',
        relatedConversation: conversationId
      });
      
      io.to(participantId.toString()).emit('new-notification', {
        title: `New message from ${req.user.fullName}`,
        message: message || 'Sent an attachment'
      });
    }
  });

  sendSuccess(res, 'Message sent', populatedMessage);
});

/**
 * @desc    Mark messages as read
 * @route   PATCH /api/borrower/messages/read
 */
exports.markRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.body;
  const userId = req.user._id;

  await Message.updateMany(
    { conversationId, senderId: { $ne: userId }, isRead: false },
    { $set: { isRead: true }, $addToSet: { readBy: userId } }
  );

  const unreadField = `unreadCounts.${userId}`;
  await Conversation.findByIdAndUpdate(conversationId, { $set: { [unreadField]: 0 } });

  const io = getIO();
  io.to(conversationId).emit('messages-read', { conversationId, userId });

  sendSuccess(res, 'Messages marked as read');
});

/**
 * @desc    Get borrower notifications
 * @route   GET /api/borrower/notifications
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notifications = await Notification.find({ receiverId: userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(50);

  sendSuccess(res, 'Notifications retrieved', notifications);
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/borrower/notifications/:id/read
 */
exports.markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findByIdAndUpdate(id, { 
    isRead: true,
    status: 'READ',
    readAt: new Date()
  }, { new: true });

  sendSuccess(res, 'Notification marked as read', notification);
});

/**
 * @desc    Get authorized participants for borrower
 * @route   GET /api/borrower/communications/participants
 */
exports.getParticipants = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find borrower profile to get assigned agent and staff
  const Borrower = require('../../models/Borrower');
  const borrower = await Borrower.findOne({ userId }).populate('assignedAgent assignedStaff', 'fullName role email profilePhoto');

  const participants = [];

  if (borrower) {
    if (borrower.assignedAgent) participants.push(borrower.assignedAgent);
    if (borrower.assignedStaff) participants.push(borrower.assignedStaff);
  } else {
    console.log(`No borrower profile found for user ${userId}`);
  }

  // Add all active admins for support
  const admins = await User.find({ 
    role: 'admin', 
    isActive: true, 
    isDeleted: false 
  }).select('fullName role email profilePhoto');
  
  participants.push(...admins);

  // Remove duplicates and nulls
  const uniqueParticipants = Array.from(
    new Map(
      participants
        .filter(p => p && p._id)
        .map(item => [item._id.toString(), item])
    ).values()
  );

  sendSuccess(res, 'Participants retrieved', uniqueParticipants);
});

/**
 * @desc    Start or get conversation with a participant
 * @route   POST /api/borrower/communications/conversations/start
 */
exports.startConversation = asyncHandler(async (req, res) => {
  const { participantId, loanId, applicationId } = req.body;
  const userId = req.user._id;

  // Check if conversation already exists between these two
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, participantId] },
    isActive: true,
    isDeleted: false
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, participantId],
      loanId,
      applicationId,
      isActive: true,
      unreadCounts: {
        [userId]: 0,
        [participantId]: 0
      }
    });
  }

  const populatedConv = await Conversation.findById(conversation._id).populate('participants', 'fullName role profilePhoto');
  
  const convObj = populatedConv.toObject();
  convObj.chatPartner = populatedConv.participants.find(p => p._id.toString() !== userId.toString());
  
  sendSuccess(res, 'Conversation started', convObj);
});
