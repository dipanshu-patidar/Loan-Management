const mongoose = require('mongoose');
const LoanApplication = require('../../models/LoanApplication');
const Borrower = require('../../models/Borrower');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { getIO } = require('../../socket/socketServer');
const { createNotification } = require('../../utils/notificationHelper');

/**
 * @desc    Get Staff Loan Request Stats Summary
 * @route   GET /api/staff/loan-requests/overview
 */
const getLoanRequestOverview = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const newRequests = await LoanApplication.countDocuments({ status: 'New' });
  const pendingReviews = await LoanApplication.countDocuments({ 
    status: { $in: ['Pending Review', 'Under Review'] } 
  });
  const pendingDocVerification = await LoanApplication.countDocuments({ 
    uploadedDocsStatus: 'Pending' 
  });
  const reviewedToday = await LoanApplication.countDocuments({
    status: 'Reviewed',
    'staffReview.reviewedBy': req.user._id,
    'staffReview.verificationDate': { $gte: startOfToday, $lte: endOfToday }
  });

  sendSuccess(res, 'Overview loaded successfully', {
    newRequests,
    pendingReviews,
    pendingDocVerification,
    reviewedToday
  });
});

/**
 * @desc    Get Paginated & Filtered Loan Request Queue
 * @route   GET /api/staff/loan-requests
 */
const getLoanRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  // Search filters: Borrower Name, Phone, Application ID
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { borrowerName: searchRegex },
      { phoneNumber: searchRegex },
      { applicationId: searchRegex }
    ];
  }

  // Field-level filters
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.loanType) {
    query.loanPurpose = req.query.loanType;
  }

  const total = await LoanApplication.countDocuments(query);
  const apps = await LoanApplication.find(query)
    .populate('borrowerId', 'profilePhoto')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const formatted = apps.map(app => ({
    _id: app._id,
    applicationId: app.applicationId,
    borrowerId: app.borrowerId?._id || null,
    borrowerName: app.borrowerName,
    borrowerPhone: app.phoneNumber,
    borrowerPhoto: app.borrowerId?.profilePhoto || 'no-photo.jpg',
    loanType: app.loanPurpose || 'General',
    requestedAmount: app.requestedAmount,
    uploadedDocsStatus: app.uploadedDocsStatus || 'Pending',
    reviewStatus: app.status,
    submittedDate: app.createdAt
  }));

  sendSuccess(res, 'Queue fetched successfully', {
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
 * @desc    Get Full Details of Single Loan Application
 * @route   GET /api/staff/loan-requests/:id
 */
const getLoanRequestById = asyncHandler(async (req, res) => {
  const app = await LoanApplication.findById(req.params.id)
    .populate('borrowerId');

  if (!app) {
    return sendError(res, 'Loan application not found', 404);
  }

  // Format deep breakdown response
  const result = {
    _id: app._id,
    applicationId: app.applicationId,
    status: app.status,
    uploadedDocsStatus: app.uploadedDocsStatus,
    documentVerification: app.documentVerification || {},
    
    borrower: {
      fullName: app.borrowerId?.fullName || app.borrowerName,
      email: app.borrowerId?.email || app.email,
      phone: app.borrowerId?.phoneNumber || app.phoneNumber,
      gender: app.borrowerId?.gender || 'N/A',
      dob: app.borrowerId?.dateOfBirth || null,
      address: app.borrowerId?.physicalAddress || app.physicalAddress,
      profilePhoto: app.borrowerId?.profilePhoto || 'no-photo.jpg'
    },

    employment: {
      employerName: app.employmentDetails?.employerName || 'N/A',
      occupation: app.employmentDetails?.employerName || 'N/A', // schema fallback
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
      monthlyExpenses: 0, // schema baseline extension placeholder
      affordabilityStatus: 'High' // automatic threshold flag placeholder
    },

    documents: {
      idDocument: app.documents?.idProof || null,
      payslip: app.documents?.payslip || null,
      bankStatement: app.documents?.bankStatement || null,
      proofOfAddress: app.documents?.proofOfAddress || null
    },

    staffNotes: {
      reviewNotes: app.staffReview?.verificationNotes || '',
      verificationNotes: app.staffReview?.verificationNotes || ''
    }
  };

  sendSuccess(res, 'Application details hydrated', result);
});

/**
 * @desc    Verify granular uploaded documents
 * @route   PUT /api/staff/loan-requests/:id/verify-documents
 */
const verifyDocuments = asyncHandler(async (req, res) => {
  const { documentType, verificationStatus, verificationNotes } = req.body;

  if (!documentType || !verificationStatus) {
    return sendError(res, 'Document type and verification status are required', 400);
  }

  const app = await LoanApplication.findById(req.params.id);
  if (!app) {
    return sendError(res, 'Application not found', 404);
  }

  // Initialize document container if missing
  if (!app.documentVerification) {
    app.documentVerification = {
      idProofStatus: 'Pending',
      payslipStatus: 'Pending',
      bankStatementStatus: 'Pending',
      proofOfAddressStatus: 'Pending'
    };
  }

  // Map standard readable types to internal fields
  const typeMap = {
    'ID Document': 'idProof',
    'Payslip': 'payslip',
    'Bank Statement': 'bankStatement',
    'Proof of Address': 'proofOfAddress'
  };

  const mappedPrefix = typeMap[documentType];
  if (!mappedPrefix) {
    return sendError(res, 'Unsupported document type', 400);
  }

  // Set individual fields
  app.documentVerification[`${mappedPrefix}Status`] = verificationStatus;
  if (verificationNotes !== undefined) {
    app.documentVerification[`${mappedPrefix}Notes`] = verificationNotes;
  }

  // Automatically push application workflow state to "Pending Verification"
  if (app.status === 'New') {
    app.status = 'Pending Verification';
  }

  // Calculate aggregated upload status
  const v = app.documentVerification;
  const allApproved = 
    v.idProofStatus === 'Approved' && 
    v.payslipStatus === 'Approved' && 
    v.bankStatementStatus === 'Approved' && 
    v.proofOfAddressStatus === 'Approved';

  if (allApproved) {
    app.uploadedDocsStatus = 'Complete';
  } else {
    app.uploadedDocsStatus = 'Pending';
  }

  await app.save();

  // Emit realtime broadcasts
  try {
    const io = getIO();
    io.emit('loan-request:updated', { applicationId: app.applicationId, status: app.status });
    io.emit('document:verified', { applicationId: app.applicationId, type: documentType, status: verificationStatus });
    io.emit('dashboard:update', { trigger: 'verification' });
  } catch (err) {}

  sendSuccess(res, 'Document assessment committed successfully', app);
});

/**
 * @desc    Submit Staff credit review and recommendations
 * @route   PUT /api/staff/loan-requests/:id/review
 */
const submitReview = asyncHandler(async (req, res) => {
  const { recommendation, reviewNotes } = req.body;

  if (!recommendation) {
    return sendError(res, 'Recommendation selection is mandatory', 400);
  }

  const app = await LoanApplication.findById(req.params.id);
  if (!app) {
    return sendError(res, 'Application not found', 404);
  }

  // Apply Staff review payloads
  app.staffReview = {
    reviewedBy: req.user._id,
    staffName: req.user.fullName,
    verificationNotes: reviewNotes || '',
    recommendation: recommendation,
    verificationDate: new Date()
  };

  // Update application status to Reviewed
  app.status = 'Reviewed';
  await app.save();

  // Create Global Admin Notifications
  try {
    await createNotification({
      title: 'Loan Application Reviewed',
      message: `Staff member ${req.user.fullName} submitted an assessment for application ${app.applicationId}. Status recommendation: ${recommendation}`,
      notificationType: 'Loan Application Recommendation',
      priority: 'Normal',
      borrowerId: app.borrowerId
    });
  } catch (notifErr) {}

  // Emit Socket messages
  try {
    const io = getIO();
    io.emit('review:submitted', { applicationId: app.applicationId, recommendation });
    io.emit('loan-request:updated', { applicationId: app.applicationId, status: 'Reviewed' });
    io.emit('dashboard:update', { trigger: 'review_submission' });
  } catch (err) {}

  sendSuccess(res, 'Staff credit assessment submitted', app);
});

/**
 * @desc    Fetch historical review queue processed by Logged-In Staff
 * @route   GET /api/staff/loan-requests/review-history
 */
const getReviewHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {
    'staffReview.reviewedBy': req.user._id,
    status: 'Reviewed'
  };

  const total = await LoanApplication.countDocuments(query);
  const apps = await LoanApplication.find(query)
    .populate('borrowerId')
    .sort({ 'staffReview.verificationDate': -1 })
    .skip(skip)
    .limit(limit);

  const formatted = apps.map(app => ({
    _id: app._id,
    applicationId: app.applicationId,
    borrowerName: app.borrowerName,
    loanType: app.loanPurpose || 'General',
    requestedAmount: app.requestedAmount,
    recommendation: app.staffReview?.recommendation,
    processedDate: app.staffReview?.verificationDate
  }));

  sendSuccess(res, 'Review history hydrated', {
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
  getLoanRequestOverview,
  getLoanRequests,
  getLoanRequestById,
  verifyDocuments,
  submitReview,
  getReviewHistory
};
