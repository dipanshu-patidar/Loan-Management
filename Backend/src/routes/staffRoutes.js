const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/responseHandler');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// @desc    Test Staff route
// @route   GET /api/staff/test
// @access  Private/Staff
router.get('/test', protect, authorize('staff'), (req, res) => {
  sendSuccess(res, 'Staff route is working');
});

module.exports = router;
