const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/responseHandler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (
    authHeader &&
    authHeader.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return sendError(res, 'Not authorized: No token provided', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
        return sendError(res, 'User not found', 404);
    }

    next();
  } catch (err) {
    return sendError(res, 'Not authorized: Invalid or expired token', 401);
  }
});

module.exports = { protect };
