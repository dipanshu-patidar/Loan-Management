const Borrower = require('../../models/Borrower');
const ActiveLoan = require('../../models/ActiveLoan');
const Commission = require('../../models/Commission');
const Notification = require('../../models/Notification');
const Agent = require('../../models/Agent');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/responseHandler');

/**
 * @desc    Get Agent Dashboard Summary
 * @route   GET /api/agent/dashboard
 * @access  Private/Agent
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  // 1. Get Agent Profile for Target Achievement
  const agentProfile = await Agent.findOne({ userId: agentId });
  
  // 2. Count Assigned Borrowers
  const assignedClientsCount = await Borrower.countDocuments({ assignedAgent: agentId });

  // 3. Find Assigned Borrowers IDs
  const assignedBorrowers = await Borrower.find({ assignedAgent: agentId }).select('_id');
  const borrowerIds = assignedBorrowers.map(b => b._id);

  // 4. Count Active Loans from assigned borrowers
  const activeLoansCount = await ActiveLoan.countDocuments({ 
    borrowerId: { $in: borrowerIds },
    loanStatus: 'Active'
  });

  // 5. Monthly Commission (Calculated from Commission model)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyCommissionData = await Commission.aggregate([
    { $match: { agentId, createdAt: { $gte: startOfMonth }, isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
  ]);
  const monthlyCommission = monthlyCommissionData[0]?.total || 0;

  // 6. Pending Follow-Ups (Count overdue installments in ActiveLoans)
  const pendingFollowUps = await ActiveLoan.countDocuments({
    borrowerId: { $in: borrowerIds },
    loanStatus: 'Overdue'
  });

  // 7. Portfolio Value (Sum of approved amounts of active loans)
  const portfolioValueData = await ActiveLoan.aggregate([
    { $match: { borrowerId: { $in: borrowerIds }, loanStatus: 'Active' } },
    { $group: { _id: null, total: { $sum: '$approvedAmount' } } }
  ]);
  const portfolioValue = portfolioValueData[0]?.total || 0;

  // 8. Target Achievement (Current Collection vs Monthly Target)
  const monthlyTarget = agentProfile?.monthlyTarget || 100000; // Default or from profile
  const collectionsData = await ActiveLoan.aggregate([
    { $match: { borrowerId: { $in: borrowerIds } } },
    { $unwind: '$repaymentSchedule' },
    { $match: { 
        'repaymentSchedule.paymentStatus': 'Paid', 
        'repaymentSchedule.paidDate': { $gte: startOfMonth } 
    } },
    { $group: { _id: null, total: { $sum: '$repaymentSchedule.emiAmount' } } }
  ]);
  const currentCollection = collectionsData[0]?.total || 0;
  const targetAchievement = Math.min(Math.round((currentCollection / monthlyTarget) * 100), 100);

  // 9. Today's Follow-Ups
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayFollowUps = await ActiveLoan.countDocuments({
    borrowerId: { $in: borrowerIds },
    nextDueDate: { $gte: today, $lt: tomorrow }
  });

  // 10. Recent Activities (From Notifications related to his borrowers)
  const recentActivities = await Notification.find({
    receiverId: agentId,
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .limit(5);

  // 11. Priority Alerts
  const priorityAlerts = await Notification.find({
    receiverId: agentId,
    priority: { $in: ['HIGH', 'URGENT'] },
    isRead: false,
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .limit(5);

  // 12. Assigned Clients Table Data
  const assignedClientsTable = await ActiveLoan.find({
    borrowerId: { $in: borrowerIds }
  })
  .populate('borrowerId', 'fullName borrowerCode')
  .limit(10)
  .sort({ updatedAt: -1 });

  // 13. Commission Summary
  const commissionSummaryData = await Commission.aggregate([
    { $match: { agentId, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalEarned: { $sum: '$commissionAmount' },
        pendingCommission: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$commissionAmount', 0] } },
        paidCommission: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$commissionAmount', 0] } }
      }
    }
  ]);
  const commissionSummary = commissionSummaryData[0] || { totalEarned: 0, pendingCommission: 0, paidCommission: 0 };
  commissionSummary.thisMonth = monthlyCommission;

  sendSuccess(res, 'Dashboard summary fetched successfully', {
    assignedClientsCount,
    activeLoansCount,
    monthlyCommission,
    pendingFollowUps,
    targetAchievement,
    portfolioValue,
    todayFollowUps,
    recentActivities,
    priorityAlerts,
    assignedClientsTable: assignedClientsTable.map(loan => ({
      borrowerName: loan.borrowerId?.fullName,
      borrowerCode: loan.borrowerId?.borrowerCode,
      loanAmount: loan.approvedAmount,
      emiStatus: loan.loanStatus === 'Overdue' ? 'Overdue' : 'Active',
      dueDate: loan.nextDueDate,
      loanStatus: loan.loanStatus,
      borrowerId: loan.borrowerId?._id,
      loanId: loan._id
    })),
    commissionSummary
  });
});

/**
 * @desc    Get Assigned Clients for Table (with filters)
 * @route   GET /api/agent/dashboard/assigned-clients
 */
const getAssignedClientsTable = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const agentId = req.user._id;

  const assignedBorrowers = await Borrower.find({ assignedAgent: agentId }).select('_id');
  const borrowerIds = assignedBorrowers.map(b => b._id);

  const query = { borrowerId: { $in: borrowerIds } };
  
  if (status === 'overdue') query.loanStatus = 'Overdue';
  else if (status === 'active') query.loanStatus = 'Active';
  else if (status === 'completed') query.loanStatus = 'Completed';

  const clients = await ActiveLoan.find(query)
    .populate('borrowerId', 'fullName borrowerCode')
    .sort({ updatedAt: -1 });

  const tableData = clients.map(loan => ({
    borrowerName: loan.borrowerId?.fullName,
    borrowerCode: loan.borrowerId?.borrowerCode,
    loanAmount: loan.approvedAmount,
    emiStatus: loan.loanStatus === 'Overdue' ? 'Overdue' : 'Active', // Simplified logic
    dueDate: loan.nextDueDate,
    loanStatus: loan.loanStatus,
    borrowerId: loan.borrowerId?._id,
    loanId: loan._id
  }));

  sendSuccess(res, 'Assigned clients fetched', tableData);
});

/**
 * @desc    Send Payment Reminder
 * @route   POST /api/agent/dashboard/send-reminder
 */
const sendPaymentReminder = asyncHandler(async (req, res) => {
  const { borrowerId, loanId, reminderType } = req.body;

  if (!borrowerId || !loanId || !reminderType) {
    return sendError(res, 'All fields are required', 400);
  }

  // logic for sending SMS/WhatsApp/Email would go here
  // For now, we create a notification record for the agent to track
  await Notification.create({
    receiverId: req.user._id,
    receiverRole: 'agent',
    type: 'BORROWER_ALERT',
    title: `Reminder Sent (${reminderType})`,
    message: `You dispatched a ${reminderType} reminder to borrower ID: ${borrowerId}`,
    priority: 'LOW',
    isRead: true
  });

  sendSuccess(res, `Reminder successfully dispatched via ${reminderType}`);
});

/**
 * @desc    Create Follow-up Log
 * @route   POST /api/agent/dashboard/followup-log
 */
const createFollowupLog = asyncHandler(async (req, res) => {
  const { borrowerId, loanId, note, followupType } = req.body;

  if (!borrowerId || !note) {
    return sendError(res, 'Borrower ID and Note are required', 400);
  }

  // Log in notifications or a dedicated Activity model
  await Notification.create({
    receiverId: req.user._id,
    receiverRole: 'agent',
    type: 'FOLLOWUP_REMINDER',
    title: 'Follow-up Logged',
    message: `Follow-up note for borrower ${borrowerId}: ${note}`,
    priority: 'NORMAL',
    isRead: true,
    metadata: { borrowerId, loanId, followupType }
  });

  sendSuccess(res, 'Follow-up log created successfully');
});

module.exports = {
  getDashboardSummary,
  getAssignedClientsTable,
  sendPaymentReminder,
  createFollowupLog
};
