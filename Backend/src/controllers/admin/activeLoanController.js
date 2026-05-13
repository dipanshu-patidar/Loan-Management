const asyncHandler = require('express-async-handler');
const ActiveLoan = require('../../models/ActiveLoan');
const { sendSuccess, sendError } = require('../../utils/responseHandler');

/**
 * @desc    Get all active loans with pagination, search, and filters
 * @route   GET /api/admin/active-loans
 * @access  Private/Admin
 */
const getAllActiveLoans = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    overdueStatus
  } = req.query;

  const query = { isDeleted: false };

  // Search
  if (search) {
    query.$or = [
      { borrowerName: { $regex: search, $options: 'i' } },
      { loanCode: { $regex: search, $options: 'i' } },
      { borrowerPhone: { $regex: search, $options: 'i' } }
    ];
  }

  // Filters
  if (status) {
    query.loanStatus = status;
  }
  if (overdueStatus) {
    query.overdueStatus = overdueStatus;
  }

  const skip = (page - 1) * limit;

  const activeLoans = await ActiveLoan.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await ActiveLoan.countDocuments(query);

  sendSuccess(res, 'Active loans fetched successfully', {
    activeLoans,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/active-loans/stats
 * @access  Private/Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalActiveLoans = await ActiveLoan.countDocuments({ loanStatus: 'Active', isDeleted: false });
  const overdueLoans = await ActiveLoan.countDocuments({ loanStatus: 'Overdue', isDeleted: false });
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  const completedThisMonth = await ActiveLoan.countDocuments({ 
    loanStatus: 'Completed', 
    updatedAt: { $gte: startOfMonth },
    isDeleted: false
  });

  const aggregate = await ActiveLoan.aggregate([
    { $match: { isDeleted: false, loanStatus: { $in: ['Active', 'Overdue'] } } },
    { $group: { _id: null, totalRemaining: { $sum: '$remainingBalance' } } }
  ]);

  const outstandingBalance = aggregate.length > 0 ? aggregate[0].totalRemaining : 0;

  sendSuccess(res, 'Stats fetched successfully', {
    totalActiveLoans,
    outstandingBalance,
    overdueLoans,
    completedThisMonth
  });
});

/**
 * @desc    Get overdue loans only
 * @route   GET /api/admin/active-loans/overdue
 * @access  Private/Admin
 */
const getOverdueLoans = asyncHandler(async (req, res) => {
  const overdueLoans = await ActiveLoan.find({ loanStatus: 'Overdue', isDeleted: false });
  sendSuccess(res, 'Overdue loans fetched successfully', { activeLoans: overdueLoans });
});

/**
 * @desc    Get completed loans only
 * @route   GET /api/admin/active-loans/completed
 * @access  Private/Admin
 */
const getCompletedLoans = asyncHandler(async (req, res) => {
  const completedLoans = await ActiveLoan.find({ loanStatus: 'Completed', isDeleted: false });
  sendSuccess(res, 'Completed loans fetched successfully', { activeLoans: completedLoans });
});

/**
 * @desc    Get export ready data
 * @route   GET /api/admin/active-loans/export
 * @access  Private/Admin
 */
const exportLoanData = asyncHandler(async (req, res) => {
  const activeLoans = await ActiveLoan.find({ isDeleted: false }).lean();
  sendSuccess(res, 'Export data ready', { activeLoans });
});

/**
 * @desc    Get due payments (upcoming & overdue)
 * @route   GET /api/admin/active-loans/due-payments
 * @access  Private/Admin
 */
const getDuePayments = asyncHandler(async (req, res) => {
  const activeLoans = await ActiveLoan.find({ isDeleted: false, loanStatus: { $in: ['Active', 'Overdue'] } });
  
  let duePayments = [];
  const now = new Date();

  activeLoans.forEach(loan => {
    const pendingInstallments = loan.repaymentSchedule.filter(s => s.paymentStatus === 'Pending' || s.paymentStatus === 'Overdue');
    pendingInstallments.forEach(inst => {
      duePayments.push({
        loanId: loan._id,
        loanCode: loan.loanCode,
        borrowerName: loan.borrowerName,
        borrowerPhone: loan.borrowerPhone,
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        emiAmount: inst.emiAmount,
        paymentStatus: inst.paymentStatus,
        isOverdue: new Date(inst.dueDate) < now
      });
    });
  });

  // Sort by due date (oldest first)
  duePayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  sendSuccess(res, 'Due payments fetched successfully', { duePayments });
});

/**
 * @desc    Get single loan details
 * @route   GET /api/admin/active-loans/:id
 * @access  Private/Admin
 */
const getLoanDetails = asyncHandler(async (req, res) => {
  const activeLoan = await ActiveLoan.findOne({ _id: req.params.id, isDeleted: false });
  
  if (!activeLoan) {
    return sendError(res, 'Loan not found', 404);
  }

  sendSuccess(res, 'Loan details fetched successfully', { activeLoan });
});

/**
 * @desc    Update loan status
 * @route   PUT /api/admin/active-loans/:id/status
 * @access  Private/Admin
 */
const updateLoanStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Active', 'Overdue', 'Completed', 'Closed'];

  if (!validStatuses.includes(status)) {
    return sendError(res, 'Invalid loan status', 400);
  }

  const activeLoan = await ActiveLoan.findOne({ _id: req.params.id, isDeleted: false });

  if (!activeLoan) {
    return sendError(res, 'Loan not found', 404);
  }

  activeLoan.loanStatus = status;
  await activeLoan.save();

  sendSuccess(res, 'Loan status updated successfully', { activeLoan });
});

/**
 * @desc    Add admin notes to loan
 * @route   PUT /api/admin/active-loans/:id/notes
 * @access  Private/Admin
 */
const addAdminNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const activeLoan = await ActiveLoan.findOne({ _id: req.params.id, isDeleted: false });

  if (!activeLoan) {
    return sendError(res, 'Loan not found', 404);
  }

  activeLoan.notes = notes;
  await activeLoan.save();

  sendSuccess(res, 'Admin notes added successfully', { activeLoan });
});

/**
 * @desc    Soft delete loan
 * @route   DELETE /api/admin/active-loans/:id
 * @access  Private/Admin
 */
const softDeleteLoan = asyncHandler(async (req, res) => {
  const activeLoan = await ActiveLoan.findOne({ _id: req.params.id, isDeleted: false });

  if (!activeLoan) {
    return sendError(res, 'Loan not found', 404);
  }

  activeLoan.isDeleted = true;
  await activeLoan.save();

  sendSuccess(res, 'Loan soft deleted successfully');
});

module.exports = {
  getAllActiveLoans,
  getDashboardStats,
  getOverdueLoans,
  getCompletedLoans,
  exportLoanData,
  getDuePayments,
  getLoanDetails,
  updateLoanStatus,
  addAdminNotes,
  softDeleteLoan
};
