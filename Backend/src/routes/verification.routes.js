/**
 * Datanamix Verification Routing System
 * Secures routing bounds and validates payloads prior to launching checks.
 */

const express = require('express');
const router = express.Router();

const {
  verifyIdentityController,
  verifyFaceLivenessController,
  verifyBankController,
  verifyCreditController,
  verifyPhoneController,
  verifyAMLController
} = require('../controllers/verification.controller');

const { protectVerification } = require('../middleware/auth.middleware');
const { requireConsent, validateProfileData } = require('../middleware/verification.middleware');

// Apply protection to all integration routes
router.use(protectVerification);

/**
 * @route   POST /api/verification/identity
 * @desc    Validate borrower's DHA ID number & match photo
 * @access  Private
 */
router.post(
  '/identity',
  validateProfileData(['borrowerId', 'idNumber', 'fullName']),
  verifyIdentityController
);

/**
 * @route   POST /api/verification/face-liveness
 * @desc    Validate biometric liveness session (FaceTec 3D)
 * @access  Private
 */
router.post(
  '/face-liveness',
  validateProfileData(['borrowerId', 'faceScan', 'sessionId']),
  verifyFaceLivenessController
);

/**
 * @route   POST /api/verification/bank
 * @desc    Account Holder Verification Advanced (AHV) checks
 * @access  Private
 */
router.post(
  '/bank',
  validateProfileData(['borrowerId', 'bankName', 'accountNumber', 'idNumber', 'accountHolderName']),
  verifyBankController
);

/**
 * @route   POST /api/verification/credit
 * @desc    Pull Universal Consumer Credit Bureau Report
 * @access  Private
 */
router.post(
  '/credit',
  requireConsent, // Mandate explicit consent check on DB
  validateProfileData(['borrowerId', 'idNumber', 'fullName', 'consentAccepted']),
  verifyCreditController
);

/**
 * @route   POST /api/verification/phone
 * @desc    Carrier Identity phone matching checks
 * @access  Private
 */
router.post(
  '/phone',
  validateProfileData(['borrowerId', 'phoneNumber', 'idNumber', 'fullName']),
  verifyPhoneController
);

/**
 * @route   POST /api/verification/aml
 * @desc    PEP, Sanctions lists, and Crime data compliance lookup
 * @access  Private
 */
router.post(
  '/aml',
  validateProfileData(['borrowerId', 'idNumber', 'fullName']),
  verifyAMLController
);

module.exports = router;
