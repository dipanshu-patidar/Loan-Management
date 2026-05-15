const ActiveLoan = require('../../models/ActiveLoan');
const RepaymentSchedule = require('../../models/RepaymentSchedule');
const LoanActivity = require('../../models/LoanActivity');
const Borrower = require('../../models/Borrower');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/responseHandler');

/**
 * @desc    Get all active loans for the logged-in borrower
 * @route   GET /api/borrower/my-loans
 * @access  Private/Borrower
 */
exports.getMyLoans = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Try to find the borrower document
  const borrower = await Borrower.findOne({ userId });
  
  // Define search ID (Profile ID if exists, otherwise User ID)
  const profileId = borrower ? borrower._id : null;

  // 2. Fetch active loans for this borrower
  // We search for loans where borrowerId matches either the profile _id OR the userId
  // (Handling data inconsistency where some loans are linked to User ID)
  const activeLoans = await ActiveLoan.find({ 
    $or: [
      { borrowerId: profileId },
      { borrowerId: userId }
    ],
    isDeleted: false 
  }).sort({ createdAt: -1 });

  // 3. Calculate summary metrics
  let totalRemainingBalance = 0;
  let totalPenalties = 0;
  let nextEmi = null;

  const formattedLoans = await Promise.all(activeLoans.map(async (loan) => {
    totalRemainingBalance += loan.remainingBalance;
    totalPenalties += loan.penaltyAmount;

    // Check if migration is needed for this loan
    let scheduleCount = await RepaymentSchedule.countDocuments({ loanId: loan._id });
    if (scheduleCount === 0 && loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
      const migrationData = loan.repaymentSchedule.map(emi => ({
        loanId: loan._id,
        borrowerId: loan.borrowerId,
        emiNumber: emi.installmentNumber,
        dueDate: emi.dueDate,
        amount: emi.emiAmount,
        status: emi.paymentStatus === 'Paid' ? 'Paid' : (emi.paymentStatus === 'Overdue' ? 'Overdue' : 'Pending'),
        paidAt: emi.paidDate || null,
        penaltyAmount: emi.lateFee || 0
      }));
      await RepaymentSchedule.insertMany(migrationData);
    }

    // Find next unpaid EMI
    const nextUnpaidEmi = await RepaymentSchedule.findOne({
      loanId: loan._id,
      status: { $in: ['Pending', 'Overdue'] }
    }).sort({ dueDate: 1 });

    if (nextUnpaidEmi && (!nextEmi || nextUnpaidEmi.dueDate < nextEmi.dueDate)) {
      nextEmi = nextUnpaidEmi;
    }

    const totalPaid = loan.approvedAmount - loan.remainingBalance;
    const progress = loan.approvedAmount > 0 
      ? Math.round((totalPaid / loan.approvedAmount) * 100) 
      : 0;

    return {
      _id: loan._id,
      loanCode: loan.loanCode,
      loanType: loan.loanType,
      approvedAmount: loan.approvedAmount,
      remainingBalance: loan.remainingBalance,
      interestRate: loan.interestRate,
      loanDurationMonths: loan.loanDurationMonths,
      nextDueDate: loan.nextDueDate,
      loanStatus: loan.loanStatus,
      progress
    };
  }));

  // 4. Fetch recent activities
  const activities = await LoanActivity.find({ 
    $or: [
      { borrowerId: profileId },
      { borrowerId: userId }
    ]
  }).sort({ createdAt: -1 }).limit(10);

  sendSuccess(res, 'My loans retrieved successfully', {
    activeLoans: formattedLoans,
    remainingBalance: totalRemainingBalance,
    nextEmi,
    totalPenalties,
    activities
  });
});

/**
 * @desc    Get EMI schedule for a specific loan
 * @route   GET /api/borrower/emi-schedule/:loanId
 * @access  Private/Borrower
 */
exports.getEmiSchedule = asyncHandler(async (req, res) => {
  const { loanId } = req.params;
  const userId = req.user._id;

  // 1. Try to find borrower profile
  const borrower = await Borrower.findOne({ userId });
  const profileId = borrower ? borrower._id : null;

  // 2. Verify ownership (check both profileId and userId)
  const loan = await ActiveLoan.findOne({ 
    _id: loanId, 
    $or: [
      { borrowerId: profileId },
      { borrowerId: userId }
    ],
    isDeleted: false 
  });

  if (!loan) {
    return sendError(res, 'Loan not found or access denied', 404);
  }

  // 2. Fetch schedule
  const schedule = await RepaymentSchedule.find({ loanId }).sort({ emiNumber: 1 });

  // 3. Calculate summary for modal
  const totalRepayment = schedule.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = schedule.filter(s => s.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  
  sendSuccess(res, 'EMI schedule retrieved successfully', {
    loan: {
      loanCode: loan.loanCode,
      loanType: loan.loanType,
      approvedAmount: loan.approvedAmount,
      remainingBalance: loan.remainingBalance,
      totalRepayment,
      totalPaid
    },
    schedule
  });
});

/**
 * @desc    Download loan statement
 * @route   POST /api/borrower/download-loan-statement
 * @access  Private/Borrower
 */
exports.downloadStatement = asyncHandler(async (req, res) => {
  const { loanId, format } = req.body;
  const userId = req.user._id;

  // 1. Try to find borrower profile
  const borrower = await Borrower.findOne({ userId });
  const profileId = borrower ? borrower._id : null;

  // 2. Verify ownership
  const loan = await ActiveLoan.findOne({ 
    _id: loanId, 
    $or: [
      { borrowerId: profileId },
      { borrowerId: userId }
    ]
  });

  if (!loan) {
    return sendError(res, 'Loan not found', 404);
  }

  // In a real implementation, generate PDF/CSV/Excel
  // For now, return success with a mock URL or message
  sendSuccess(res, `Loan statement (${format}) generation started. It will be available shortly.`);
});
