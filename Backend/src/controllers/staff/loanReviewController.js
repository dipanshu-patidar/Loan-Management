const mongoose = require('mongoose');
const LoanApplication = require('../../models/LoanApplication');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { getIO } = require('../../socket/socketServer');
const { createNotification } = require('../../utils/notificationHelper');

/**
 * @desc    Get Loan Review Overview Counts
 * @route   GET /api/staff/loan-review/overview
 */
const getLoanReviewOverview = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Applications assigned for staff review
  const applicationsUnderReview = await LoanApplication.countDocuments({
    reviewStatus: 'Pending Review',
    status: { $in: ['Pending Review', 'New', 'Pending Verification'] }
  });

  // 2. Already recommended to admin
  const recommendationsSubmitted = await LoanApplication.countDocuments({
    reviewStatus: 'Recommendation Submitted'
  });

  // 3. Waiting for admin final decision
  const pendingDecisions = await LoanApplication.countDocuments({
    status: 'Reviewed'
  });

  // 4. Reviews completed today by current staff session
  const reviewsCompletedToday = await LoanApplication.countDocuments({
    reviewStatus: { $in: ['Recommendation Submitted', 'Rejected Recommendation'] },
    updatedAt: { $gte: startOfToday, $lte: endOfToday }
  });

  sendSuccess(res, 'Review metrics loaded successfully', {
    applicationsUnderReview,
    recommendationsSubmitted,
    pendingDecisions,
    reviewsCompletedToday
  });
});

/**
 * @desc    Get All Loan Reviews (Paginated & Filtered)
 * @route   GET /api/staff/loan-review
 */
const getLoanReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  // Standard Search: Name, Phone, Application ID
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    query.$or = [
      { borrowerName: regex },
      { phoneNumber: regex },
      { applicationId: regex }
    ];
  }

  // Filters
  if (req.query.reviewStatus) {
    query.reviewStatus = req.query.reviewStatus;
  }
  if (req.query.loanType) {
    query.loanPurpose = req.query.loanType;
  }

  const total = await LoanApplication.countDocuments(query);
  const apps = await LoanApplication.find(query)
    .populate('borrowerId', 'profilePhoto')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  const formatted = apps.map(app => ({
    applicationId: app.applicationId,
    _id: app._id,
    borrowerId: app.borrowerId?._id || null,
    borrowerName: app.borrowerName,
    borrowerPhone: app.phoneNumber,
    borrowerPhoto: app.borrowerId?.profilePhoto || app.borrowerPhoto || 'no-photo.jpg',
    loanType: app.loanPurpose || 'General',
    requestedAmount: app.requestedAmount,
    affordabilityStatus: app.affordabilityStatus || 'Pending',
    reviewStatus: app.reviewStatus,
    submittedDate: app.createdAt
  }));

  sendSuccess(res, 'Loan reviews fetched successfully', {
    data: formatted,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get Deep Single Review Details
 * @route   GET /api/staff/loan-review/:id
 */
const getLoanReviewById = asyncHandler(async (req, res) => {
  const app = await LoanApplication.findById(req.params.id).populate('borrowerId');
  if (!app) {
    return sendError(res, 'Loan review dossier not found', 404);
  }

  const responseData = {
    _id: app._id,
    applicationId: app.applicationId,
    status: app.status,
    reviewStatus: app.reviewStatus,
    
    borrower: {
      fullName: app.borrowerId?.fullName || app.borrowerName,
      email: app.borrowerId?.email || app.email,
      phone: app.borrowerId?.phoneNumber || app.phoneNumber,
      gender: app.borrowerId?.gender || 'N/A',
      dob: app.borrowerId?.dateOfBirth || null,
      address: app.borrowerId?.physicalAddress || app.physicalAddress,
      profilePhoto: app.borrowerId?.profilePhoto || app.borrowerPhoto || 'no-photo.jpg'
    },

    employment: {
      employerName: app.employmentDetails?.employerName || 'N/A',
      occupation: app.employmentDetails?.employerName || 'N/A',
      monthlyIncome: app.employmentDetails?.monthlyIncome || 0,
      yearsOfService: app.employmentDetails?.yearsOfService || 0
    },

    loanDetails: {
      loanType: app.loanPurpose || 'General',
      requestedAmount: app.requestedAmount,
      loanDuration: app.loanDuration,
      estimatedEMI: app.estimatedEMI || 0
    },

    affordability: {
      monthlyIncome: app.employmentDetails?.monthlyIncome || 0,
      monthlyExpenses: app.employmentDetails?.monthlyExpenses || 0, // mapped baseline
      estimatedEMI: app.estimatedEMI || 0,
      affordabilityStatus: app.affordabilityStatus || 'Pending'
    },

    documents: {
      idDocument: app.documents?.idProof || null,
      payslip: app.documents?.payslip || null,
      bankStatement: app.documents?.bankStatement || null,
      proofOfAddress: app.documents?.proofOfAddress || null
    },

    notes: {
      internalReviewNotes: app.internalReviewNotes || '',
      recommendationNotes: app.recommendationNotes || '',
      adminComments: app.adminDecision?.adminNotes || app.adminComments || ''
    }
  };

  sendSuccess(res, 'Review details loaded', responseData);
});

/**
 * @desc    Recommend Approval to Admin
 * @route   PUT /api/staff/loan-review/:id/recommend-approval
 */
const recommendApproval = asyncHandler(async (req, res) => {
  const { recommendationNotes } = req.body;
  const app = await LoanApplication.findById(req.params.id);
  if (!app) {
    return sendError(res, 'Application not found', 404);
  }

  // State transition
  app.reviewStatus = 'Recommendation Submitted';
  app.status = 'Reviewed';
  app.recommendationNotes = recommendationNotes || '';
  
  // Update staff audit stamp
  app.staffReview = {
    reviewedBy: req.user._id,
    staffName: req.user.fullName,
    recommendation: 'Recommended',
    verificationDate: new Date()
  };

  await app.save();

  // System Notification to Admin
  try {
    await createNotification({
      title: 'New Loan Recommendation Submitted',
      message: `Staff member ${req.user.fullName} recommended approval for Application ${app.applicationId}.`,
      notificationType: 'Approval Alert',
      priority: 'High',
      borrowerId: app.borrowerId
    });
  } catch (err) {}

  // Socket IO Broadcasts
  try {
    const io = getIO();
    io.emit('recommendation:submitted', { applicationId: app.applicationId, status: 'Recommendation Submitted' });
    io.emit('review:updated', { applicationId: app.applicationId, trigger: 'recommended' });
    io.emit('dashboard:update', { trigger: 'review_process' });
  } catch (ioErr) {}

  sendSuccess(res, 'Approval recommendation logged to workflow', app);
});

/**
 * @desc    Recommend Rejection to Admin
 * @route   PUT /api/staff/loan-review/:id/recommend-rejection
 */
const recommendRejection = asyncHandler(async (req, res) => {
  const { rejectionReason, notes } = req.body;
  const app = await LoanApplication.findById(req.params.id);
  if (!app) {
    return sendError(res, 'Application not found', 404);
  }

  // State transition
  app.reviewStatus = 'Rejected Recommendation';
  app.status = 'Reviewed'; // Handed to admin for official veto/rejection execution
  app.rejectionReason = rejectionReason || 'General Affordability Issue';
  app.recommendationNotes = notes || '';

  // Update staff audit stamp
  app.staffReview = {
    reviewedBy: req.user._id,
    staffName: req.user.fullName,
    recommendation: 'Rejected',
    verificationDate: new Date()
  };

  await app.save();

  // System Notification to Admin
  try {
    await createNotification({
      title: 'Rejection Recommendation Raised',
      message: `Staff member ${req.user.fullName} suggested rejecting Application ${app.applicationId}. Reason: ${rejectionReason}`,
      notificationType: 'System Alert',
      priority: 'Normal',
      borrowerId: app.borrowerId
    });
  } catch (err) {}

  // Websocket emits
  try {
    const io = getIO();
    io.emit('recommendation:rejected', { applicationId: app.applicationId, reason: rejectionReason });
    io.emit('review:updated', { applicationId: app.applicationId, trigger: 'rejected_rec' });
    io.emit('dashboard:update', { trigger: 'review_process' });
  } catch (ioErr) {}

  sendSuccess(res, 'Rejection recommendation submitted successfully', app);
});

/**
 * @desc    Request additional/updated documents
 * @route   PUT /api/staff/loan-review/:id/request-documents
 */
const requestDocuments = asyncHandler(async (req, res) => {
  const { documentType, message } = req.body;
  if (!documentType) {
    return sendError(res, 'Specific document type target is required', 400);
  }

  const app = await LoanApplication.findById(req.params.id);
  if (!app) {
    return sendError(res, 'Application not found', 404);
  }

  // Map standard document identifier to nested schema trackers
  const typeMap = {
    'ID Document': 'idProof',
    'Payslip': 'payslip',
    'Bank Statement': 'bankStatement',
    'Proof of Address': 'proofOfAddress'
  };

  const mappedKey = typeMap[documentType];
  if (mappedKey && app.documentVerification) {
    app.documentVerification[`${mappedKey}Status`] = 'Reupload Requested';
    app.documentVerification[`${mappedKey}Notes`] = message || 'Requires updated file.';
  }

  app.uploadedDocsStatus = 'Missing';
  app.status = 'Pending Verification'; // Push back into verification phase
  app.reviewStatus = 'Pending Review'; 
  app.internalReviewNotes = (app.internalReviewNotes || '') + `\n[System Request]: Staff requested ${documentType}. Message: ${message}`;

  await app.save();

  // Create Real-Time notification for the BORROWER
  try {
    await createNotification({
      title: 'Action Required: Document Re-upload',
      message: `We encountered an issue with your ${documentType}. Staff message: "${message}". Please re-upload promptly to continue.`,
      notificationType: 'Shield Alert',
      priority: 'Critical',
      borrowerId: app.borrowerId,
      receiverRole: 'borrower'
    });
  } catch (err) {}

  // Socket Broadcast
  try {
    const io = getIO();
    io.emit('documents:requested', { applicationId: app.applicationId, doc: documentType });
    io.emit('review:updated', { applicationId: app.applicationId, trigger: 'docs_requested' });
  } catch (ioErr) {}

  sendSuccess(res, 'Document request dispatch committed successfully', app);
});

/**
 * @desc    Review History API
 * @route   GET /api/staff/loan-review/history
 */
const getReviewHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {
    reviewStatus: { $in: ['Recommendation Submitted', 'Rejected Recommendation'] }
  };

  const total = await LoanApplication.countDocuments(query);
  const apps = await LoanApplication.find(query)
    .populate('borrowerId')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  const formatted = apps.map(app => ({
    applicationId: app.applicationId,
    _id: app._id,
    borrowerName: app.borrowerName,
    loanType: app.loanPurpose || 'General',
    requestedAmount: app.requestedAmount,
    reviewStatus: app.reviewStatus,
    recommendationDate: app.updatedAt
  }));

  sendSuccess(res, 'History database retrieved', {
    data: formatted,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
});

module.exports = {
  getLoanReviewOverview,
  getLoanReviews,
  getLoanReviewById,
  recommendApproval,
  recommendRejection,
  requestDocuments,
  getReviewHistory
};
