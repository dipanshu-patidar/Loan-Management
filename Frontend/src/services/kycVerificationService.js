import api from './api';

/**
 * Verify borrower identity via Datanamix Profile Plus ID Photo Match.
 * Sends multipart/form-data: idFrontImage (required), selfieImage + idBackImage (optional).
 *
 * @param {FormData} formData  — must contain idNumber + idFrontImage file
 * @param {Function} [onUploadProgress]
 */
const verifyProfileIdPhoto = async (formData, onUploadProgress) => {
  const response = await api.post('/verification/profile-id-photo-match', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

/**
 * Admin-only: manually override a failed KYC verification.
 * Always creates an audit log on the backend.
 *
 * @param {string} applicationId
 * @param {string} overrideReason  — required
 */
const overrideKYCVerification = async (applicationId, overrideReason) => {
  const response = await api.put(`/verification/kyc-override/${applicationId}`, {
    overrideReason,
  });
  return response.data;
};

const kycVerificationService = {
  verifyProfileIdPhoto,
  overrideKYCVerification,
};

export default kycVerificationService;
