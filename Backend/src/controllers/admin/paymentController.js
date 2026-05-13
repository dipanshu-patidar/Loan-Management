const asyncHandler = require('express-async-handler');
const Payment = require('../../models/Payment');
const ActiveLoan = require('../../models/ActiveLoan');
const { sendSuccess, sendError } = require('../../utils/responseHandler');

/**
 * @desc    Get all payments
 * @route   GET /api/admin/payments
 * @access  Private/Admin
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status, method, type } = req.query;

  const query = { isDeleted: false };

  if (search) {
    query.$or = [
      { borrowerName: { $regex: search, $options: 'i' } },
      { loanCode: { $regex: search, $options: 'i' } },
      { transactionId: { $regex: search, $options: 'i' } },
      { borrowerPhone: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) query.paymentStatus = status;
  if (method) query.paymentMethod = method;
  if (type) query.paymentType = type;

  const skip = (page - 1) * limit;

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Payment.countDocuments(query);

  sendSuccess(res, 'Payments fetched successfully', {
    payments,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/payments/stats
 * @access  Private/Admin
 */
const getPaymentStats = asyncHandler(async (req, res) => {
  const totalPayments = await Payment.countDocuments({ isDeleted: false });
  const verifiedPayments = await Payment.countDocuments({ paymentStatus: 'Verified', isDeleted: false });
  const pendingPayments = await Payment.countDocuments({ paymentStatus: 'Pending', isDeleted: false });

  const aggregate = await Payment.aggregate([
    { $match: { isDeleted: false, paymentStatus: 'Verified' } },
    { $group: { _id: null, totalCollections: { $sum: '$paymentAmount' } } }
  ]);
  const totalCollections = aggregate.length > 0 ? aggregate[0].totalCollections : 0;

  sendSuccess(res, 'Payment stats fetched successfully', {
    totalPayments,
    verifiedPayments,
    pendingPayments,
    totalCollections
  });
});

/**
 * @desc    Get single payment
 * @route   GET /api/admin/payments/:id
 * @access  Private/Admin
 */
const getPaymentDetails = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, isDeleted: false });
  if (!payment) return sendError(res, 'Payment not found', 404);
  sendSuccess(res, 'Payment details fetched successfully', { payment });
});

/**
 * @desc    Verify payment
 * @route   PUT /api/admin/payments/:id/verify
 * @access  Private/Admin
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, isDeleted: false });
  if (!payment) return sendError(res, 'Payment not found', 404);

  if (payment.paymentStatus === 'Verified') {
    return sendError(res, 'Payment is already verified', 400);
  }

  const activeLoan = await ActiveLoan.findById(payment.loanId);
  if (!activeLoan) return sendError(res, 'Associated loan not found', 404);

  // Update payment status
  payment.paymentStatus = 'Verified';
  payment.verifiedBy = req.user._id;
  payment.verifiedDate = new Date();
  
  // Update Loan Balance
  activeLoan.remainingBalance = Math.max(0, activeLoan.remainingBalance - payment.paymentAmount);
  payment.remainingBalanceAfterPayment = activeLoan.remainingBalance;

  // Update EMI Schedule
  let remainingAmountToApply = payment.paymentAmount;
  
  for (let i = 0; i < activeLoan.repaymentSchedule.length; i++) {
    const emi = activeLoan.repaymentSchedule[i];
    if (emi.paymentStatus !== 'Paid') {
      if (remainingAmountToApply >= emi.emiAmount) {
        emi.paymentStatus = 'Paid';
        emi.paidDate = new Date();
        remainingAmountToApply -= emi.emiAmount;
      } else {
        break;
      }
    }
  }

  // Find next pending EMI to set next due date
  const nextEmi = activeLoan.repaymentSchedule.find(s => s.paymentStatus === 'Pending' || s.paymentStatus === 'Overdue');
  if (nextEmi) {
    activeLoan.nextDueDate = nextEmi.dueDate;
  } else {
    activeLoan.nextDueDate = null;
  }

  // Mark loan as completed if fully paid
  if (activeLoan.remainingBalance === 0) {
    activeLoan.loanStatus = 'Completed';
  }

  await activeLoan.save();
  await payment.save();

  sendSuccess(res, 'Payment verified successfully', { payment, activeLoan });
});

/**
 * @desc    Reject payment
 * @route   PUT /api/admin/payments/:id/reject
 * @access  Private/Admin
 */
const rejectPayment = asyncHandler(async (req, res) => {
  const { rejectionReason, notes } = req.body;
  
  const payment = await Payment.findOne({ _id: req.params.id, isDeleted: false });
  if (!payment) return sendError(res, 'Payment not found', 404);

  if (payment.paymentStatus === 'Verified') {
    return sendError(res, 'Cannot reject an already verified payment', 400);
  }

  payment.paymentStatus = 'Rejected';
  payment.rejectionReason = rejectionReason;
  payment.notes = notes;
  
  await payment.save();

  sendSuccess(res, 'Payment rejected successfully', { payment });
});

/**
 * @desc    Get specific statuses
 * @route   GET /api/admin/payments/pending (or verified/rejected)
 * @access  Private/Admin
 */
const getPendingPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ paymentStatus: 'Pending', isDeleted: false }).sort({ createdAt: -1 });
  sendSuccess(res, 'Pending payments fetched successfully', { payments });
});

const getVerifiedPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ paymentStatus: 'Verified', isDeleted: false }).sort({ createdAt: -1 });
  sendSuccess(res, 'Verified payments fetched successfully', { payments });
});

const getRejectedPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ paymentStatus: 'Rejected', isDeleted: false }).sort({ createdAt: -1 });
  sendSuccess(res, 'Rejected payments fetched successfully', { payments });
});

/**
 * @desc    Get export data
 * @route   GET /api/admin/payments/export
 * @access  Private/Admin
 */
const exportPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ isDeleted: false }).lean();
  sendSuccess(res, 'Export data ready', { payments });
});

/**
 * @desc    Download receipt details (For frontend to open link or get receiptImage)
 * @route   GET /api/admin/payments/:id/receipt
 * @access  Private/Admin
 */
const downloadReceipt = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, isDeleted: false });
  if (!payment || (!payment.receiptImage && !payment.receiptFile)) {
    return sendError(res, 'Receipt not found', 404);
  }
  
  sendSuccess(res, 'Receipt fetched successfully', { receiptUrl: payment.receiptFile || payment.receiptImage });
});

module.exports = {
  getAllPayments,
  getPaymentStats,
  getPaymentDetails,
  verifyPayment,
  rejectPayment,
  getPendingPayments,
  getVerifiedPayments,
  getRejectedPayments,
  exportPayments,
  downloadReceipt
};
