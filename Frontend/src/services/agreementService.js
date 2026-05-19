import api from './api';

const agreementService = {
  /**
   * @desc Generate digital agreement for approved loan
   * @param {string} loanApplicationId - ID of the loan application
   */
  generateAgreement: async (loanApplicationId) => {
    const response = await api.post('/agreement/generate', { loanApplicationId });
    return response.data;
  },

  /**
   * @desc Send OTP email to borrower
   * @param {string} loanApplicationId - ID of the loan application
   */
  sendOtp: async (loanApplicationId) => {
    const response = await api.post('/agreement/send-otp', { loanApplicationId });
    return response.data;
  },

  /**
   * @desc Resend OTP email to borrower
   * @param {string} loanApplicationId - ID of the loan application
   */
  resendOtp: async (loanApplicationId) => {
    const response = await api.post('/agreement/resend-otp', { loanApplicationId });
    return response.data;
  },

  /**
   * @desc Verify OTP code and digitally sign agreement
   * @param {string} loanApplicationId - ID of the loan application
   * @param {string} otpCode - 6 digit verification code
   */
  verifyOtp: async (loanApplicationId, otpCode) => {
    const response = await api.post('/agreement/verify-otp', { loanApplicationId, otpCode });
    return response.data;
  },

  /**
   * @desc Fetch digital agreement status and OTP history
   * @param {string} loanId - ID of the loan application
   */
  getAgreementStatus: async (loanId) => {
    const response = await api.get(`/agreement/status/${loanId}`);
    return response.data;
  },

  /**
   * @desc Fetch raw document text of the digital agreement
   * @param {string} loanId - ID of the loan application
   */
  getAgreementDocument: async (loanId) => {
    const response = await api.get(`/agreement/document/${loanId}`, { responseType: 'text' });
    return response.data;
  },

  /**
   * @desc Mark the loan application as ready for disbursement
   * @param {string} loanApplicationId - ID of the loan application
   */
  markReadyForDisbursement: async (loanApplicationId) => {
    const response = await api.post('/agreement/ready-disbursement', { loanApplicationId });
    return response.data;
  }
};

export default agreementService;
