const mongoose = require('mongoose');

const borrowerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employmentStatus: {
      type: String,
      default: 'Not Specified',
    },
    monthlyIncome: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: 'Not Specified',
    },
    idNumber: {
      type: String,
      default: '',
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      branchCode: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Borrower', borrowerSchema);
