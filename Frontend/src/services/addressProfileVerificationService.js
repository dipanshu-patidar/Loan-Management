import api from './api';

/**
 * Run Address Plus Profile IDV bureau verification (Step 1.5).
 * Requires biometric KYC (Step 1) to be already completed.
 *
 * @param {Object} params
 * @param {string}  params.applicationId       - Loan application _id (optional pre-submission)
 * @param {string}  params.idNumber            - SA ID number
 * @param {string}  params.surname             - Borrower surname
 * @param {string}  [params.passportNumber]
 * @param {string}  [params.phoneNumber]       - For mismatch comparison
 * @param {string}  [params.emailAddress]      - For mismatch comparison
 * @param {string}  [params.residentialAddress]- For mismatch comparison
 * @param {string}  [params.employerName]      - For mismatch comparison
 */
const verifyAddressProfile = async (params) => {
  const response = await api.post('/verification/address-plus-profile-idv', params);
  return response.data;
};

/**
 * Admin override of failed / warned bureau verification.
 *
 * @param {string} applicationId
 * @param {string} overrideReason - Required
 */
const overrideBureauVerification = async (applicationId, overrideReason) => {
  const response = await api.put(`/verification/bureau-override/${applicationId}`, {
    overrideReason,
  });
  return response.data;
};

const addressProfileVerificationService = {
  verifyAddressProfile,
  overrideBureauVerification,
};

export default addressProfileVerificationService;
