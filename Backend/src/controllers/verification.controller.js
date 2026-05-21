/**
 * Verification Integration Controller
 * Orchestrates calls to the Datanamix module and commits audit histories to MongoDB.
 */

const datanamix = require('../integrations/datanamix');
const VerificationLog = require('../models/VerificationLog');
const CreditReport = require('../models/CreditReport');
const AMLCheck = require('../models/AMLCheck');
const BankVerification = require('../models/BankVerification');
const Borrower = require('../models/Borrower');
const LoanApplication = require('../models/LoanApplication');
const { callProfileIdPhotoMatch } = require('../services/datanamix/profileIdPhotoVerification.service');
const { getIO } = require('../socket/socketServer');

/**
 * Helper to log verification transactions to MongoDB VerificationLog collection
 */
const writeAuditLog = async (data) => {
  try {
    return await VerificationLog.create(data);
  } catch (err) {
    console.error('⚠️ [Audit Log Error]: Failed to write log to database:', err.message);
  }
};

/**
 * 1. Borrower ID Verification Controller (DHA Profile IDV Plus Photo)
 */
exports.verifyIdentityController = async (req, res) => {
  const { borrowerId, idNumber, fullName, dateOfBirth, selfiePhotoBase64, applicationId } = req.body;
  const initiatedBy = req.user ? req.user._id : null;

  try {
    console.log(`👤 [Identity Verification Route Handled] - ID: ${idNumber}`);

    // Call integration module
    const result = await datanamix.identity.verifyIdentity({
      idNumber,
      fullName,
      dateOfBirth,
      selfiePhotoBase64
    });

    // Write audit log
    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'IDV_PHOTO',
      status: 'SUCCESS',
      initiatedBy,
      requestPayload: { idNumber, fullName, dateOfBirth },
      responsePayload: result
    });

    return res.status(200).json({
      success: true,
      message: 'ID Verification initialized successfully in pre-integration phase.',
      data: result
    });
  } catch (error) {
    console.error('❌ [Identity Controller Error]:', error.message);
    
    // Log failure
    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'IDV_PHOTO',
      status: 'FAILED',
      initiatedBy,
      requestPayload: { idNumber, fullName, dateOfBirth },
      errorMessage: error.message
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error occurred during ID verification.'
    });
  }
};

/**
 * 2. Face Liveness Verification Controller (FaceTec Liveness 3D)
 */
exports.verifyFaceLivenessController = async (req, res) => {
  const { borrowerId, faceScan, auditTrailImage, sessionId, applicationId } = req.body;
  const initiatedBy = req.user ? req.user._id : null;

  try {
    console.log(`🎭 [Face Liveness Route Handled] - Session: ${sessionId}`);

    const result = await datanamix.identity.verifyFaceLiveness({
      faceScan,
      auditTrailImage,
      sessionId
    });

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'FACETEC_LIVENESS',
      status: 'SUCCESS',
      initiatedBy,
      requestPayload: { sessionId },
      responsePayload: result
    });

    return res.status(200).json({
      success: true,
      message: 'Face Tec Liveness validation initialized successfully.',
      data: result
    });
  } catch (error) {
    console.error('❌ [Face Liveness Controller Error]:', error.message);

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'FACETEC_LIVENESS',
      status: 'FAILED',
      initiatedBy,
      requestPayload: { sessionId },
      errorMessage: error.message
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error occurred during face liveness verification.'
    });
  }
};

/**
 * 3. Bank Account Ownership Verification Controller (Account Holder Verification Advanced)
 */
exports.verifyBankController = async (req, res) => {
  const { borrowerId, bankName, accountNumber, branchCode, idNumber, accountHolderName, accountType, applicationId } = req.body;
  const initiatedBy = req.user ? req.user._id : null;

  try {
    console.log(`🏦 [Bank AHV Route Handled] - Acc: ${accountNumber}`);

    const result = await datanamix.bank.verifyBankAccount({
      bankName,
      accountNumber,
      branchCode,
      idNumber,
      accountHolderName,
      accountType
    });

    // Persistent storage model creation
    await BankVerification.create({
      borrowerId,
      applicationId,
      bankName,
      accountNumber,
      branchCode,
      matchIndicators: result.matchIndicators,
      rawVerificationResult: result,
      verificationSuccess: false
    });

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'BANK_AHV',
      status: 'SUCCESS',
      initiatedBy,
      requestPayload: { bankName, accountNumber, branchCode, idNumber, accountHolderName },
      responsePayload: result
    });

    return res.status(200).json({
      success: true,
      message: 'Bank verification records generated in pre-integration phase.',
      data: result
    });
  } catch (error) {
    console.error('❌ [Bank Verification Controller Error]:', error.message);

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'BANK_AHV',
      status: 'FAILED',
      initiatedBy,
      requestPayload: { bankName, accountNumber, branchCode, idNumber, accountHolderName },
      errorMessage: error.message
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error occurred during bank account verification.'
    });
  }
};

/**
 * 4. Credit Bureau Checks Controller (Consumer Credit Report)
 */
exports.verifyCreditController = async (req, res) => {
  const { borrowerId, idNumber, fullName, consentAccepted, applicationId } = req.body;
  const initiatedBy = req.user ? req.user._id : null;

  try {
    console.log(`📊 [Credit Bureau Check Route Handled] - ID: ${idNumber}`);

    const result = await datanamix.credit.getConsumerCreditReport({
      idNumber,
      fullName,
      consentAccepted
    });

    // Persistent storage model creation
    await CreditReport.create({
      borrowerId,
      applicationId,
      creditScore: 0, // Placeholder during blueprint phase
      scoreBand: 'UNKNOWN',
      riskCategory: 'N/A',
      consentAccepted,
      bureauRawData: result
    });

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'CREDIT_REPORT',
      status: 'SUCCESS',
      initiatedBy,
      requestPayload: { idNumber, fullName, consentAccepted },
      responsePayload: result
    });

    return res.status(200).json({
      success: true,
      message: 'Credit Bureau lookup pre-flight verification completed.',
      data: result
    });
  } catch (error) {
    console.error('❌ [Credit Controller Error]:', error.message);

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'CREDIT_REPORT',
      status: 'FAILED',
      initiatedBy,
      requestPayload: { idNumber, fullName, consentAccepted },
      errorMessage: error.message
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error occurred during credit bureau report pulling.'
    });
  }
};

/**
 * 5. Phone Verification Controller (Carrier Identity)
 */
exports.verifyPhoneController = async (req, res) => {
  const { borrowerId, phoneNumber, idNumber, fullName, applicationId } = req.body;
  const initiatedBy = req.user ? req.user._id : null;

  try {
    console.log(`📱 [Phone Verification Route Handled] - Phone: ${phoneNumber}`);

    const result = await datanamix.phone.verifyPhoneOwnership({
      phoneNumber,
      idNumber,
      fullName
    });

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'PHONE_CARRIER',
      status: 'SUCCESS',
      initiatedBy,
      requestPayload: { phoneNumber, idNumber, fullName },
      responsePayload: result
    });

    return res.status(200).json({
      success: true,
      message: 'Carrier identity matching process prepared.',
      data: result
    });
  } catch (error) {
    console.error('❌ [Phone Controller Error]:', error.message);

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'PHONE_CARRIER',
      status: 'FAILED',
      initiatedBy,
      requestPayload: { phoneNumber, idNumber, fullName },
      errorMessage: error.message
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error occurred during phone carrier verification.'
    });
  }
};

/**
 * 6. AML & Sanctions Screening Controller (AML Sanctions + PEP + Crime Data)
 */
exports.verifyAMLController = async (req, res) => {
  const { borrowerId, idNumber, fullName, dateOfBirth, applicationId } = req.body;
  const initiatedBy = req.user ? req.user._id : null;

  try {
    console.log(`🛡️ [AML pep Screening Route Handled] - Name: ${fullName}`);

    const result = await datanamix.aml.screenAML({
      idNumber,
      fullName,
      dateOfBirth
    });

    // Persistent storage model creation
    await AMLCheck.create({
      borrowerId,
      pepStatusDetected: false,
      sanctionStatusDetected: false,
      crimeRecordDetected: false,
      riskScore: 0,
      screeningRawResponse: result,
      complianceOutcome: 'PASSED'
    });

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'AML_PEP',
      status: 'SUCCESS',
      initiatedBy,
      requestPayload: { idNumber, fullName, dateOfBirth },
      responsePayload: result
    });

    return res.status(200).json({
      success: true,
      message: 'AML watchlists verification logged.',
      data: result
    });
  } catch (error) {
    console.error('❌ [AML pep Screening Controller Error]:', error.message);

    await writeAuditLog({
      borrowerId,
      applicationId,
      verificationType: 'AML_PEP',
      status: 'FAILED',
      initiatedBy,
      requestPayload: { idNumber, fullName, dateOfBirth },
      errorMessage: error.message
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error occurred during AML sanctions screening.'
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. KYC Profile Plus ID Photo Match Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/verification/profile-id-photo-match
 * Multipart: idFrontImage (required), selfieImage (optional), idBackImage (optional)
 * Body fields: idNumber (required), applicationId (optional), borrowerId (optional)
 */
exports.verifyBorrowerKYCController = async (req, res) => {
  const initiatedBy = req.user?._id;
  const { idNumber, applicationId, borrowerId: bodyBorrowerId } = req.body;

  // borrowerId: use body value or fall back to the authenticated user's _id
  const borrowerId = bodyBorrowerId || initiatedBy;

  if (!idNumber) {
    return res.status(400).json({ success: false, message: 'idNumber is required' });
  }

  const idFrontFile = req.files?.idFrontImage?.[0] || req.file;
  if (!idFrontFile) {
    return res.status(400).json({ success: false, message: 'idFrontImage is required' });
  }

  try {
    console.log(`[KYC Controller] Starting verification — ID: ${idNumber}`);

    const result = await callProfileIdPhotoMatch({
      idNumber,
      captureImageBuffer: idFrontFile.buffer,
      clientReference: applicationId || `TEMP-${Date.now()}`,
    });

    // ── Audit log ──────────────────────────────────────────────────────────
    await writeAuditLog({
      borrowerId,
      applicationId: applicationId || undefined,
      verificationType: 'KYC_PROFILE_PHOTO',
      status: result.verificationStatus === 'Verified' ? 'SUCCESS' : 'FAILED',
      initiatedBy,
      requestPayload: { idNumber, clientReference: applicationId },
      responsePayload: {
        responseStatusCode: result.responseStatusCode,
        verificationStatus: result.verificationStatus,
        faceMatchScore: result.faceMatchScore,
        verificationReference: result.verificationReference,
      },
    });

    // ── Persist into LoanApplication if applicationId provided ─────────────
    if (applicationId) {
      await LoanApplication.findByIdAndUpdate(applicationId, {
        'kycVerification.verificationStatus': result.verificationStatus,
        'kycVerification.responseStatusCode': result.responseStatusCode,
        'kycVerification.responseMessage': result.responseMessage,
        'kycVerification.faceMatchScore': result.faceMatchScore,
        'kycVerification.verificationReference': result.verificationReference,
        'kycVerification.verificationTimestamp': new Date(),
        'kycVerification.fraudFlags': result.fraudFlags,
        'kycVerification.extractedOCRData': result.extractedOCRData,
        'kycVerification.verificationPdf': result.verificationPdf,
        'kycVerification.rawApiResponse': result.rawApiResponse,
        'kycVerification.verifiedBy': initiatedBy,
        'kycVerification.verificationSource': 'DATANAMIX',
        'kycVerification.verificationProvider': 'Profile Plus ID Photo Match',
      });
    }

    // ── Socket events ──────────────────────────────────────────────────────
    try {
      const io = getIO();
      const roomId = borrowerId?.toString();
      if (result.verificationStatus === 'Verified') {
        io.to(roomId).emit('verification-completed', {
          applicationId,
          faceMatchScore: result.faceMatchScore,
          message: 'Identity verified successfully',
        });
      } else {
        io.to(roomId).emit('verification-failed', {
          applicationId,
          responseMessage: result.responseMessage,
          message: 'Identity verification failed',
        });

        if (result.fraudFlags?.length) {
          io.to(roomId).emit('fraud-flagged', {
            applicationId,
            fraudFlags: result.fraudFlags,
          });
        }
      }
    } catch {
      // Socket not initialized — non-fatal
    }

    return res.status(200).json({
      success: true,
      message: result.verificationStatus === 'Verified'
        ? 'Identity verified successfully'
        : 'Identity verification failed',
      data: {
        verificationStatus: result.verificationStatus,
        responseStatusCode: result.responseStatusCode,
        responseMessage: result.responseMessage,
        faceMatchScore: result.faceMatchScore,
        verificationReference: result.verificationReference,
        verificationTimestamp: new Date(),
        fraudFlags: result.fraudFlags,
        extractedOCRData: result.extractedOCRData,
      },
    });
  } catch (error) {
    console.error('[KYC Controller Error]:', error.message);

    await writeAuditLog({
      borrowerId,
      applicationId: applicationId || undefined,
      verificationType: 'KYC_PROFILE_PHOTO',
      status: 'ERROR',
      initiatedBy,
      requestPayload: { idNumber },
      errorMessage: error.message,
    });

    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'KYC verification failed',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Admin KYC Override
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /api/verification/kyc-override/:applicationId
 * Admin only — manually override a failed KYC verification with mandatory reason
 */
exports.overrideKYCController = async (req, res) => {
  const { applicationId } = req.params;
  const { overrideReason } = req.body;
  const adminId = req.user?._id;

  if (!overrideReason?.trim()) {
    return res.status(400).json({ success: false, message: 'overrideReason is required for KYC override' });
  }

  try {
    const application = await LoanApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await LoanApplication.findByIdAndUpdate(applicationId, {
      'kycVerification.verificationStatus': 'Overridden',
      'kycVerification.overrideReason': overrideReason.trim(),
      'kycVerification.overrideBy': adminId,
      'kycVerification.overrideAt': new Date(),
    });

    // Audit log for override
    await writeAuditLog({
      borrowerId: application.borrowerId || adminId,
      applicationId,
      verificationType: 'KYC_OVERRIDE',
      status: 'SUCCESS',
      initiatedBy: adminId,
      requestPayload: { overrideReason, applicationId },
      responsePayload: { action: 'KYC_MANUAL_OVERRIDE', overrideBy: adminId },
    });

    // Socket — notify borrower room
    try {
      const io = getIO();
      io.to(application.borrowerId?.toString()).emit('verification-completed', {
        applicationId,
        message: 'KYC verification manually overridden by admin',
        overridden: true,
      });
    } catch {
      // Socket not initialized — non-fatal
    }

    return res.status(200).json({
      success: true,
      message: 'KYC verification successfully overridden',
      data: { applicationId, overrideReason, overrideAt: new Date() },
    });
  } catch (error) {
    console.error('[KYC Override Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Override failed' });
  }
};
