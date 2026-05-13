const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Nullable if broadcast
  receiverRole: { type: String },
  messageType: { 
    type: String, 
    enum: ['text', 'operational_update', 'reminder', 'escalation', 'compliance_notice'],
    default: 'text'
  },
  messageText: { type: String, required: true },
  attachmentUrl: { type: String },
  isRead: { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
