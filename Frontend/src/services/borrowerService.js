import api from './api';

const borrowerService = {
  createBorrower: async (formData) => {
    const response = await api.post('/admin/borrowers/create', formData);
    return response.data;
  },

  getAllBorrowers: async (params = {}) => {
    const response = await api.get('/admin/borrowers', { params });
    return response.data;
  },

  getBorrowerById: async (id) => {
    const response = await api.get(`/admin/borrowers/${id}`);
    return response.data;
  },

  updateBorrower: async (id, formData) => {
    const response = await api.put(`/admin/borrowers/${id}`, formData);
    return response.data;
  },

  deleteBorrower: async (id) => {
    const response = await api.delete(`/admin/borrowers/${id}`);
    return response.data;
  },

  freezeBorrower: async (id, data) => {
    const response = await api.patch(`/admin/borrowers/${id}/freeze`, data);
    return response.data;
  },

  blacklistBorrower: async (id, data) => {
    const response = await api.patch(`/admin/borrowers/${id}/blacklist`, data);
    return response.data;
  },
};

export default borrowerService;
