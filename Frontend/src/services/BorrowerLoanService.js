import api from './api';

const API_URL = '/borrower/apply-loan';

const getLoanEstimate = async (amount, duration) => {
  const response = await api.get(`${API_URL}/estimate?amount=${amount}&duration=${duration}`);
  return response.data;
};

const uploadDocumentOnly = async (formData, onUploadProgress) => {
  const response = await api.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
  return response.data;
};

const submitFullApplication = async (allData) => {
  const response = await api.post(`${API_URL}/submit-full`, allData);
  return response.data;
};

const getApplicationStatus = async (applicationId) => {
  const response = await api.get(`${API_URL}/status/${applicationId}`);
  return response.data;
};

const BorrowerLoanService = {
  getLoanEstimate,
  uploadDocumentOnly,
  submitFullApplication,
  getApplicationStatus
};

export default BorrowerLoanService;
