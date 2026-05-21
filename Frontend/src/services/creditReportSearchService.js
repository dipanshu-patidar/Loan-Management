import api from './api';

/**
 * Run the Datanamix Consumer Credit Search (Step 2).
 * Returns EnquiryID + EnquiryResultID needed for the subsequent Result API call.
 * Requires biometric KYC to be Verified and bureau verification not Rejected.
 *
 * @param {Object} params
 * @param {string}  params.applicationId    - Loan application _id (optional pre-submission)
 * @param {string}  params.idNumber         - SA ID number
 * @param {string}  [params.passportNumber] - Passport number (optional)
 */
const runConsumerCreditSearch = async (params) => {
  const response = await api.post('/verification/consumer-credit-search', params);
  return response.data;
};

/**
 * Admin override of a failed or warning credit assessment.
 *
 * @param {string} applicationId
 * @param {string} overrideReason - Required
 */
const overrideCreditAssessment = async (applicationId, overrideReason) => {
  const response = await api.put(
    `/verification/credit-search-override/${applicationId}`,
    { overrideReason }
  );
  return response.data;
};

const creditReportSearchService = {
  runConsumerCreditSearch,
  overrideCreditAssessment,
};

export default creditReportSearchService;
