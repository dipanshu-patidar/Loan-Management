const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  notificationType: {
    type: String,
    enum: [
      'New Application',
      'Overdue Alert',
      'Payment Notification',
      'Approval Alert',
      'Loan Approved',
      'Loan Rejected',
      'EMI Reminder',
      'Borrower Registered',
      'Staff Alert',
      'Agent Alert',
      'System Alert'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['Normal', 'Important', 'Urgent'],
    default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Read', 'Unread'],
    default: 'Unread'
  },
  
  // Entity relations for quick lookup/populated drawers
  borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrower' },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActiveLoan' }, // Can adapt depending on schema
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  senderRole: { type: String },
  receiverRole: { type: String, default: 'admin' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  quickActionType: { type: String }, // for front-end redirection logic helpers
  
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Add indexes for performance
notificationSchema.index({ receiverRole: 1, isDeleted: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
