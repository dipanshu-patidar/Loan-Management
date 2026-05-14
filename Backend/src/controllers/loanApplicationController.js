const asyncHandler = require('express-async-handler');
const LoanApplication = require('../models/LoanApplication');
const ActiveLoan = require('../models/ActiveLoan');
const Notification = require('../models/Notification');
const Borrower = require('../models/Borrower');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { createNotification } = require('../utils/notificationHelper');

/**
 * @desc    Get all loan applications with pagination, search, and filters
 * @route   GET /api/admin/loan-applications
 * @access  Private/Admin
 */
const getAllApplications = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    status, 
    staffReviewer, 
    minAmount, 
    maxAmount,
    startDate,
    endDate
  } = req.query;

  const query = {};

  // Search by borrower name, application ID, email, phone
  if (search) {
    query.$or = [
      { borrowerName: { $regex: search, $options: 'i' } },
      { applicationId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by staff reviewer
  if (staffReviewer) {
    query['staffReview.staffName'] = { $regex: staffReviewer, $options: 'i' };
  }

  // Filter by requested amount range
  if (minAmount || maxAmount) {
    query.requestedAmount = {};
    if (minAmount) query.requestedAmount.$gte = Number(minAmount);
    if (maxAmount) query.requestedAmount.$lte = Number(maxAmount);
  }

  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const applications = await LoanApplication.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await LoanApplication.countDocuments(query);

  const responseData = applications.map(app => ({
    _id: app._id,
    applicationId: app.applicationId,
    borrowerName: app.borrowerName,
    requestedAmount: app.requestedAmount,
    loanDuration: app.loanDuration,
    estimatedEMI: app.estimatedEMI,
    staffReviewer: app.staffReview?.staffName || 'Not Assigned',
    status: app.status,
    submittedDate: app.createdAt,
  }));

  sendSuccess(res, 'Loan applications fetched successfully', {
    applications: responseData,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    }
  });
});

/**
 * @desc    Get loan application stats (counts by status)
 * @route   GET /api/admin/loan-applications/stats
 * @access  Private/Admin
 */
const getApplicationStats = asyncHandler(async (req, res) => {
  const stats = await LoanApplication.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await LoanApplication.countDocuments();

  const formattedStats = {
    All: total,
    New: 0,
    'Under Review': 0,
    Recommended: 0,
    Hold: 0,
    Approved: 0,
    Rejected: 0
  };

  stats.forEach(stat => {
    if (formattedStats[stat._id] !== undefined) {
      formattedStats[stat._id] = stat.count;
    }
  });

  sendSuccess(res, 'Loan application stats fetched successfully', formattedStats);
});

/**
 * @desc    Get single application details
 * @route   GET /api/admin/loan-applications/:id
 * @access  Private/Admin
 */
const getApplicationDetails = asyncHandler(async (req, res) => {
  const application = await LoanApplication.findById(req.params.id);

  if (!application) {
    return sendError(res, 'Loan application not found', 404);
  }

  sendSuccess(res, 'Loan application details fetched successfully', application);
});

/**
 * @desc    Approve loan application and create active loan
 * @route   PUT /api/admin/loan-applications/:id/approve
 * @access  Private/Admin
 */
const approveApplication = asyncHandler(async (req, res) => {
  const { 
    adminNotes, 
    approvedAmount, 
    finalDuration, 
    interestOverride 
  } = req.body;

  const application = await LoanApplication.findById(req.params.id);

  if (!application) {
    return sendError(res, 'Loan application not found', 404);
  }

  if (application.status === 'Approved') {
    return sendError(res, 'Application is already approved', 400);
  }

  if (application.status === 'Rejected') {
    return sendError(res, 'Rejected applications cannot be approved', 400);
  }

  // Update application status
  application.status = 'Approved';
  application.adminDecision = {
    decision: 'Approved',
    adminNotes,
    approvedAmount: approvedAmount || application.requestedAmount,
    finalDuration: finalDuration || application.loanDuration,
    interestOverride: interestOverride || application.interestRate,
    approvedBy: req.user._id,
    approvedDate: new Date(),
  };

  application.statusHistory.push({
    status: 'Approved',
    changedBy: req.user.name || 'Admin',
    notes: adminNotes || 'Loan application approved by admin',
  });

  await application.save();

  // Create Active Loan
  const loanAmount = approvedAmount || application.requestedAmount;
  const duration = finalDuration || application.loanDuration;
  const rate = interestOverride || application.interestRate || 10; // Default 10% if not set

  // Simple EMI Schedule Generation
  const monthlyRate = rate / 12 / 100;
  const emiAmount = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
    (Math.pow(1 + monthlyRate, duration) - 1)
  );

  // Notify Borrower & Create Admin Realtime Log
  const borrower = await Borrower.findById(application.borrowerId);
  if (borrower) {
    try {
      const { createNotification } = require('../utils/notificationHelper');
      await createNotification({
        title: 'Approval Alert',
        message: `Loan application ${application.applicationId} for amount R ${loanAmount} has been APPROVED.`,
        notificationType: 'Approval Alert',
        priority: 'Important',
        borrowerId: borrower._id,
        applicationId: application._id
      });
    } catch (err) {}
  }

  const emiSchedule = [];
  let remainingBal = loanAmount;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() + 1); // First EMI next month

  for (let i = 1; i <= duration; i++) {
    const interest = Math.round(remainingBal * monthlyRate);
    const principalAmount = emiAmount - interest;
    remainingBal -= principalAmount;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));

    emiSchedule.push({
      installmentNumber: i,
      dueDate,
      emiAmount,
      principalAmount,
      interestAmount: interest,
      paymentStatus: 'Pending',
    });
  }

  const activeLoan = await ActiveLoan.create({
    borrowerId: application.borrowerId,
    borrowerName: application.borrowerName || (borrower && borrower.fullName) || 'Unknown',
    borrowerPhoto: borrower?.profilePhoto || null,
    borrowerEmail: application.email || borrower?.email,
    borrowerPhone: application.phoneNumber || borrower?.phoneNumber,
    loanApplicationId: application._id,
    loanType: application.loanType || 'Personal Loan',
    approvedAmount: loanAmount,
    interestRate: rate,
    loanDurationMonths: duration,
    emiAmount,
    totalPayableAmount: emiAmount * duration,
    remainingBalance: emiAmount * duration, // starting balance is total payable
    nextDueDate: emiSchedule[0].dueDate,
    repaymentSchedule: emiSchedule,
    approvedBy: req.user._id,
  });

  sendSuccess(res, 'Loan application approved and active loan created', { application, activeLoan });
});

/**
 * @desc    Reject loan application
 * @route   PUT /api/admin/loan-applications/:id/reject
 * @access  Private/Admin
 */
const rejectApplication = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const application = await LoanApplication.findById(req.params.id);

  if (!application) {
    return sendError(res, 'Loan application not found', 404);
  }

  application.status = 'Rejected';
  application.adminDecision = {
    decision: 'Rejected',
    rejectionReason,
    rejectedBy: req.user._id,
    rejectedDate: new Date(),
  };

  application.statusHistory.push({
    status: 'Rejected',
    changedBy: req.user.name || 'Admin',
    notes: rejectionReason || 'Loan application rejected by admin',
  });

  await application.save();

  // Notify Borrower & Create Admin Realtime Log
  const borrower = await Borrower.findById(application.borrowerId);
  if (borrower) {
    try {
      const { createNotification } = require('../utils/notificationHelper');
      await createNotification({
        title: 'Approval Alert',
        message: `Loan application ${application.applicationId} has been REJECTED. Reason: ${rejectionReason || 'Policy mismatch'}`,
        notificationType: 'Approval Alert',
        priority: 'Important',
        borrowerId: borrower._id,
        applicationId: application._id
      });
    } catch (err) {}
  }

  sendSuccess(res, 'Loan application rejected', application);
});

/**
 * @desc    Put loan application on hold
 * @route   PUT /api/admin/loan-applications/:id/hold
 * @access  Private/Admin
 */
const holdApplication = asyncHandler(async (req, res) => {
  const { holdReason } = req.body;

  const application = await LoanApplication.findById(req.params.id);

  if (!application) {
    return sendError(res, 'Loan application not found', 404);
  }

  application.status = 'Hold';
  application.adminDecision = {
    decision: 'Hold',
    holdReason,
    holdBy: req.user._id,
    holdDate: new Date(),
  };

  application.statusHistory.push({
    status: 'Hold',
    changedBy: req.user.name || 'Admin',
    notes: holdReason || 'Loan application put on hold by admin',
  });

  await application.save();

  // Notify Borrower & Create Admin Realtime Log
  const borrower = await Borrower.findById(application.borrowerId);
  if (borrower) {
    try {
      const { createNotification } = require('../utils/notificationHelper');
      await createNotification({
        title: 'Application Alert',
        message: `Loan application ${application.applicationId} has been placed ON HOLD.`,
        notificationType: 'System Alert',
        priority: 'Normal',
        borrowerId: borrower._id,
        applicationId: application._id
      });
    } catch (err) {}
  }

  sendSuccess(res, 'Loan application put on hold', application);
});

/**
 * @desc    Update staff review / recommendation
 * @route   PUT /api/admin/loan-applications/:id/review
 * @access  Private/Admin
 */
const updateStaffReview = asyncHandler(async (req, res) => {
  const { 
    verificationNotes, 
    recommendation, 
    riskLevel 
  } = req.body;

  const application = await LoanApplication.findById(req.params.id);

  if (!application) {
    return sendError(res, 'Loan application not found', 404);
  }

  application.staffReview = {
    reviewedBy: req.user._id,
    staffName: req.user.name || 'Admin',
    verificationNotes,
    recommendation,
    riskLevel,
    verificationDate: new Date(),
  };

  // If staff recommends, update status to Recommended
  if (recommendation === 'Recommended') {
    application.status = 'Recommended';
  } else if (recommendation === 'Rejected') {
    application.status = 'Rejected';
  } else {
    application.status = 'Under Review';
  }

  application.statusHistory.push({
    status: application.status,
    changedBy: req.user.name || 'Admin',
    notes: `Staff review: ${recommendation}. ${verificationNotes || ''}`,
  });

  await application.save();

  sendSuccess(res, 'Staff review updated successfully', application);
});

/**
 * @desc    Assign staff to loan application
 * @route   PUT /api/admin/loan-applications/:id/assign
 * @access  Private/Admin
 */
const assignApplication = asyncHandler(async (req, res) => {
  const { staffId } = req.body;

  if (!staffId) {
    return sendError(res, 'Staff ID is required', 400);
  }

  const application = await LoanApplication.findById(req.params.id);
  if (!application) {
    return sendError(res, 'Loan application not found', 404);
  }

  const staffUser = await User.findById(staffId);
  if (!staffUser || staffUser.role !== 'staff') {
    return sendError(res, 'Valid staff user not found', 404);
  }

  // Update application with assigned staff
  application.staffReview = {
    ...application.staffReview,
    reviewedBy: staffId,
    staffName: staffUser.fullName,
    verificationDate: null // Reset verification date if newly assigned
  };
  
  if (application.status === 'New') {
    application.status = 'Under Review';
  }

  await application.save();

  // Create notification for staff
  await createNotification({
    receiverId: staffId,
    receiverRole: 'staff',
    senderId: req.user._id,
    senderRole: 'admin',
    notificationType: 'NewLoanRequest',
    title: 'New Loan Request Assigned',
    message: `A new borrower application ${application.applicationId} for ${application.borrowerName} has been assigned to you for review.`,
    relatedId: application._id,
    relatedModel: 'LoanApplication',
    priority: 'important'
  });

  sendSuccess(res, 'Application assigned to staff successfully', application);
});

module.exports = {
  getApplicationStats,
  getAllApplications,
  getApplicationDetails,
  approveApplication,
  rejectApplication,
  holdApplication,
  updateStaffReview,
  assignApplication
};
