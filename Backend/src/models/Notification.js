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
    type: String 
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
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of the related entity (Loan, Payment, Message, etc.)
  relatedModel: { type: String }, // Model name of the related entity
  isRead: { type: Boolean, default: false },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Add indexes for performance
notificationSchema.index({ receiverId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
