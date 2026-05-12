const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    commissionPercentage: {
      type: Number,
      default: 0,
    },
    assignedClients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Borrower',
      },
    ],
    earnings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Agent', agentSchema);
