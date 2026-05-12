const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema(
  {
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Borrower',
      required: true,
    },
    requestedAmount: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in months
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'under_review', 'approved', 'rejected', 'on_hold'],
      default: 'new',
    },
    uploadedDocuments: [
      {
        name: String,
        url: String,
        fileId: String,
      },
    ],
    assignedReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    affordabilityData: {
      type: Object, // Stores parsed financial data or calculations
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
