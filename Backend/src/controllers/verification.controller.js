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
