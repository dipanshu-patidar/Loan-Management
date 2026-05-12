const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/responseHandler');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// @desc    Test Borrower route
// @route   GET /api/borrower/test
// @access  Private/Borrower
router.get('/test', protect, authorize('borrower'), (req, res) => {
  sendSuccess(res, 'Borrower route is working');
});

module.exports = router;
