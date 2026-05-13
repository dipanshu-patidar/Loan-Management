const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true,
    },
    // Borrower Details
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Borrower',
      required: true,
    },
    borrowerName: {
      type: String,
      required: true,
    },
    borrowerPhoto: String,
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    physicalAddress: String,
    employmentStatus: {
      type: String,
      enum: ['Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired'],
    },

    // Loan Details
    requestedAmount: {
      type: Number,
      required: true,
    },
    loanDuration: {
      type: Number, // in months
      required: true,
    },
    estimatedEMI: Number,
    interestRate: Number,
    processingFee: Number,
    loanPurpose: String,

    // Employment Details
    employmentDetails: {
      employerName: String,
      monthlyIncome: Number,
      workAddress: String,
      yearsOfService: Number,
    },

    // Banking Details
    bankingDetails: {
      bankName: String,
      accountNumber: String,
      accountHolder: String,
      branchCode: String,
    },

    // Documents
    documents: {
      idProof: String,
      payslip: String,
      bankStatement: String,
      proofOfAddress: String,
    },
    
    // Detailed Document Verifications
    documentVerification: {
      idProofStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Reupload Requested'], default: 'Pending' },
      idProofNotes: String,
      payslipStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Reupload Requested'], default: 'Pending' },
      payslipNotes: String,
      bankStatementStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Reupload Requested'], default: 'Pending' },
      bankStatementNotes: String,
      proofOfAddressStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Reupload Requested'], default: 'Pending' },
      proofOfAddressNotes: String,
    },

    uploadedDocsStatus: {
      type: String,
      enum: ['Pending', 'Complete', 'Missing'],
      default: 'Pending'
    },

    // Affordability and Review Stages
    reviewStatus: {
      type: String,
      enum: ['Pending Review', 'Reviewed', 'Recommendation Submitted', 'Rejected Recommendation'],
      default: 'Pending Review'
    },
    affordabilityStatus: {
      type: String,
      enum: ['Eligible', 'Moderate', 'Risky', 'Pending'],
      default: 'Pending'
    },

    // Commentary and Feedback Lines
    internalReviewNotes: String,
    recommendationNotes: String,
    adminComments: String,
    rejectionReason: String,

    // Staff Review Section
    staffReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
      },
      staffName: String,
      verificationNotes: String,
      recommendation: {
        type: String,
        enum: ['Recommended', 'Needs Review', 'High Risk', 'Rejected'],
      },
      riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
      },
      verificationDate: Date,
    },

    // Admin Decision Section
    adminDecision: {
      decision: {
        type: String,
        enum: ['Approved', 'Rejected', 'Hold'],
      },
      adminNotes: String,
      approvedAmount: Number,
      finalDuration: Number,
      interestOverride: Number,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedDate: Date,
      rejectionReason: String,
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectedDate: Date,
      holdReason: String,
      holdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      holdDate: Date,
    },

    status: {
      type: String,
      enum: ['New', 'Under Review', 'Recommended', 'Hold', 'Approved', 'Rejected', 'Pending Review', 'Pending Verification', 'Reviewed'],
      default: 'New',
    },
    
    statusHistory: [
      {
        status: String,
        changedBy: String,
        date: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate Application ID before saving
loanApplicationSchema.pre('validate', async function (next) {
  if (this.isNew && !this.applicationId) {
    const lastApplication = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
    let nextId = 1001;
    if (lastApplication && lastApplication.applicationId) {
      const lastIdMatch = lastApplication.applicationId.match(/LAPP-(\d+)/);
      if (lastIdMatch) {
        nextId = parseInt(lastIdMatch[1]) + 1;
      }
    }
    this.applicationId = `LAPP-${nextId}`;
  }
  next();
});

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
