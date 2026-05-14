const asyncHandler = require('../../utils/asyncHandler');
const Payment = require('../../models/Payment');
const ActiveLoan = require('../../models/ActiveLoan');
const Borrower = require('../../models/Borrower');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { createNotification } = require('../../utils/notificationHelper');
const upload = require('../../middlewares/uploadMiddleware');

/**
 * @desc    Submit payment proof (Borrower)
 * @route   POST /api/borrower/payments/submit
 */
const submitPayment = asyncHandler(async (req, res) => {
  const { loanId, amount, paymentMethod, transactionId, paymentDate, notes } = req.body;

  if (!loanId || !amount || !transactionId) {
    return sendError(res, 'Missing required payment fields', 400);
  }

  // Find borrower and active loan
  const borrower = await Borrower.findOne({ userId: req.user._id });
  if (!borrower) {
    return sendError(res, 'Borrower profile not found', 404);
  }

  const activeLoan = await ActiveLoan.findById(loanId);
  if (!activeLoan) {
    return sendError(res, 'Active loan not found', 404);
  }

  // Handle proof upload (if any)
  let receiptUrl = null;
  if (req.file) {
    // In a real scenario, we'd upload to ImageKit/S3
    // For now, assume it's handled or use a placeholder
    receiptUrl = req.file.path || 'proof-uploaded.jpg';
  }

  const payment = await Payment.create({
    borrowerId: borrower._id,
    borrowerName: borrower.fullName,
    borrowerPhone: borrower.phoneNumber,
    loanId: activeLoan._id,
    loanCode: activeLoan.loanCode,
    paymentAmount: Number(amount),
    paymentMethod,
    transactionId,
    paymentDate: paymentDate || new Date(),
    notes,
    paymentStatus: 'Pending',
    receiptImage: receiptUrl,
    isDeleted: false
  });

  // Trigger Notification for Staff
  try {
    // Notify the staff assigned to this borrower
    if (borrower.assignedStaff) {
      await createNotification({
        receiverId: borrower.assignedStaff,
        receiverRole: 'staff',
        senderId: req.user._id,
        senderRole: 'borrower',
        notificationType: 'PaymentVerification',
        title: 'New Payment Proof Uploaded',
        message: `Borrower ${borrower.fullName} has submitted a payment proof of R ${amount} for Loan ${activeLoan.loanCode}.`,
        relatedId: payment._id,
        relatedModel: 'Payment',
        priority: 'important'
      });
    }

    // Also notify Admin
    await createNotification({
      receiverRole: 'admin',
      senderId: req.user._id,
      senderRole: 'borrower',
      notificationType: 'PaymentVerification',
      title: 'Incoming Payment Proof',
      message: `${borrower.fullName} uploaded a payment proof for R ${amount}.`,
      relatedId: payment._id,
      relatedModel: 'Payment',
      priority: 'normal'
    });
  } catch (notifErr) {
    console.error('Failed to trigger payment notifications:', notifErr);
  }

  sendSuccess(res, 'Payment proof submitted successfully', payment);
});

module.exports = {
  submitPayment
};
