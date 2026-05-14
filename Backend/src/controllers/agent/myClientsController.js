const Borrower = require('../../models/Borrower');
const ActiveLoan = require('../../models/ActiveLoan');
const DuePayment = require('../../models/DuePayment');
const AgentClientActivity = require('../../models/AgentClientActivity');
const Notification = require('../../models/Notification');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/responseHandler');

/**
 * @desc    Get agent client dashboard analytics
 * @route   GET /api/agent/my-clients/dashboard
 * @access  Private/Agent
 */
exports.getClientDashboard = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  // 1. Assigned Borrowers Count
  const assignedBorrowersCount = await Borrower.countDocuments({ assignedAgent: agentId });

  // 2. Active Loans for assigned borrowers
  const assignedBorrowerIds = await Borrower.find({ assignedAgent: agentId }).distinct('_id');
  const activeLoansCount = await ActiveLoan.countDocuments({
    borrowerId: { $in: assignedBorrowerIds },
    loanStatus: 'Active'
  });

  // 3. Due Payments (Upcoming EMI)
  const duePaymentsCount = await DuePayment.countDocuments({
    borrowerId: { $in: assignedBorrowerIds },
    dueStatus: 'Due Today'
  });

  // 4. Overdue Borrowers
  const overdueBorrowersCount = await ActiveLoan.countDocuments({
    borrowerId: { $in: assignedBorrowerIds },
    loanStatus: 'Overdue'
  });

  sendSuccess(res, 'Agent client dashboard data retrieved', {
    assignedBorrowers: assignedBorrowersCount,
    activeLoans: activeLoansCount,
    duePayments: duePaymentsCount,
    overdueBorrowers: overdueBorrowersCount
  });
});

/**
 * @desc    Get all assigned clients with filters and pagination
 * @route   GET /api/agent/my-clients
 * @access  Private/Agent
 */
exports.getClients = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const { page = 1, limit = 10, search = '', loanStatus = '', dueStatus = '' } = req.query;

  const query = { assignedAgent: agentId };

  // Search logic
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { borrowerCode: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const borrowers = await Borrower.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Borrower.countDocuments(query);

  const enrichedClients = await Promise.all(borrowers.map(async (borrower) => {
    // Get latest active loan for this borrower
    const loan = await ActiveLoan.findOne({ 
      borrowerId: borrower._id,
      isDeleted: false 
    }).sort({ createdAt: -1 });

    // Get latest due payment
    const duePayment = await DuePayment.findOne({
      borrowerId: borrower._id,
      dueStatus: { $ne: 'Paid' }
    }).sort({ dueDate: 1 });

    return {
      borrowerId: borrower._id,
      borrowerName: borrower.fullName,
      borrowerPhoto: borrower.profilePhoto,
      borrowerCode: borrower.borrowerCode,
      phone: borrower.phoneNumber,
      loanId: loan ? loan.loanCode : 'N/A',
      loanType: loan ? loan.loanType : 'N/A',
      loanAmount: loan ? loan.approvedAmount : 0,
      emiStatus: duePayment ? duePayment.dueStatus : 'N/A',
      dueAmount: duePayment ? duePayment.totalDueAmount : 0,
      dueDate: duePayment ? duePayment.dueDate : null,
      loanStatus: loan ? loan.loanStatus : 'N/A',
      overdueDays: loan ? loan.overdueDays : 0
    };
  }));

  // Filtering by loanStatus or dueStatus after enrichment (since these fields are in related models)
  // Note: For better performance, these should be handled via aggregation if dataset is large
  let filteredClients = enrichedClients;
  if (loanStatus && loanStatus !== 'All Statuses') {
    filteredClients = filteredClients.filter(c => c.loanStatus === loanStatus);
  }
  if (dueStatus && dueStatus !== 'Due Payments') {
    filteredClients = filteredClients.filter(c => c.emiStatus === dueStatus);
  }

  sendSuccess(res, 'Agent clients retrieved', {
    clients: filteredClients,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single borrower details for drawer
 * @route   GET /api/agent/my-clients/:borrowerId
 * @access  Private/Agent
 */
exports.getBorrowerDetails = asyncHandler(async (req, res) => {
  const { borrowerId } = req.params;
  const agentId = req.user._id;

  const borrower = await Borrower.findOne({ _id: borrowerId, assignedAgent: agentId });
  if (!borrower) {
    return sendError(res, 'Borrower not found or not assigned to you', 404);
  }

  const activeLoan = await ActiveLoan.findOne({ 
    borrowerId: borrower._id,
    loanStatus: { $ne: 'Closed' } 
  }).sort({ createdAt: -1 });

  const duePayment = await DuePayment.findOne({
    borrowerId: borrower._id,
    dueStatus: { $ne: 'Paid' }
  }).sort({ dueDate: 1 });

  // Summary logic
  const loans = await ActiveLoan.find({ borrowerId: borrower._id });
  const totalLoanAmount = loans.reduce((acc, curr) => acc + curr.approvedAmount, 0);
  const totalRemaining = loans.reduce((acc, curr) => acc + curr.remainingBalance, 0);
  const totalPaid = totalLoanAmount - totalRemaining;
  const totalOverdue = loans.reduce((acc, curr) => acc + curr.penaltyAmount, 0);

  // Recent activities
  const activities = await AgentClientActivity.find({ borrowerId })
    .sort({ createdAt: -1 })
    .limit(10);

  sendSuccess(res, 'Borrower details retrieved', {
    profile: {
      fullName: borrower.fullName,
      phone: borrower.phoneNumber,
      email: borrower.email,
      address: borrower.physicalAddress,
      borrowerStatus: borrower.accountStatus,
      borrowerCode: borrower.borrowerCode
    },
    loan: activeLoan ? {
      loanCode: activeLoan.loanCode,
      loanType: activeLoan.loanType,
      loanAmount: activeLoan.approvedAmount,
      remainingBalance: activeLoan.remainingBalance,
      emiAmount: activeLoan.emiAmount,
      dueAmount: duePayment ? duePayment.totalDueAmount : 0,
      overdueAmount: activeLoan.penaltyAmount,
      overdueDays: activeLoan.overdueDays,
      repaymentProgress: activeLoan.approvedAmount > 0 
        ? ((activeLoan.approvedAmount - activeLoan.remainingBalance) / activeLoan.approvedAmount * 100).toFixed(1)
        : 0,
      nextDueDate: activeLoan.nextDueDate
    } : null,
    summary: {
      totalLoanAmount,
      totalPaid,
      remainingBalance: totalRemaining,
      overdueAmount: totalOverdue
    },
    activities: activities.map(a => ({
      id: a._id,
      type: a.type,
      title: a.type === 'FollowUp' ? `Follow-up: ${a.category}` : a.category,
      desc: a.notes,
      time: a.createdAt,
      color: a.type === 'FollowUp' ? 'blue' : 'emerald'
    }))
  });
});

/**
 * @desc    Save assistance record
 * @route   POST /api/agent/my-clients/assistance
 * @access  Private/Agent
 */
exports.saveAssistance = asyncHandler(async (req, res) => {
  const { borrowerId, supportType, supportNotes, communicationMessage } = req.body;
  const agentId = req.user._id;

  const activity = await AgentClientActivity.create({
    borrowerId,
    agentId,
    type: 'Assistance',
    category: supportType,
    notes: supportNotes,
    communicationMessage
  });

  // Notify borrower (mock logic, usually goes to Notifications collection)
  await Notification.create({
    receiverId: borrowerId,
    receiverRole: 'borrower',
    senderId: agentId,
    senderRole: 'agent',
    notificationType: 'AssistanceProvided',
    title: 'Support Assistance',
    message: `Your agent has recorded an assistance note: ${supportType}`,
    relatedId: activity._id,
    relatedModel: 'AgentClientActivity'
  });

  sendSuccess(res, 'Assistance record saved successfully', activity);
});

/**
 * @desc    Save payment follow-up
 * @route   POST /api/agent/my-clients/follow-up
 * @access  Private/Agent
 */
exports.saveFollowUp = asyncHandler(async (req, res) => {
  const { borrowerId, followUpType, followUpNotes, nextFollowUpDate } = req.body;
  const agentId = req.user._id;

  const activity = await AgentClientActivity.create({
    borrowerId,
    agentId,
    type: 'FollowUp',
    category: followUpType,
    notes: followUpNotes,
    nextFollowUpDate
  });

  sendSuccess(res, 'Follow-up record saved successfully', activity);
});

/**
 * @desc    Get recent activities for all assigned clients
 * @route   GET /api/agent/my-clients/activities
 * @access  Private/Agent
 */
exports.getRecentActivities = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  const activities = await AgentClientActivity.find({ agentId })
    .populate('borrowerId', 'fullName')
    .sort({ createdAt: -1 })
    .limit(20);

  sendSuccess(res, 'Recent activities retrieved', activities);
});
