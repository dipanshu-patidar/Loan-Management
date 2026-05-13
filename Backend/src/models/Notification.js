const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverRole: {
    type: String,
    enum: ['admin', 'staff', 'agent', 'borrower'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderRole: {
    type: String,
    enum: ['admin', 'staff', 'agent', 'borrower', 'system']
  },
  notificationType: {
    type: String,
    enum: [
      'NewLoanRequest',
      'ReviewAssigned',
      'PaymentVerification',
      'PaymentRejected',
      'NewMessage',
      'BorrowerReply',
      'AdminMessage',
      'OverdueAlert',
      'LoanApproved',
      'LoanRejected'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  relatedModel: {
    type: String,
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  }
}, { 
  timestamps: true 
});

// Indexes for performance
notificationSchema.index({ receiverId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
