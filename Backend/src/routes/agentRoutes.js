const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/responseHandler');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// @desc    Test Agent route
// @route   GET /api/agent/test
// @access  Private/Agent
router.get('/test', protect, authorize('agent'), (req, res) => {
  sendSuccess(res, 'Agent route is working');
});

module.exports = router;
