import api from './api';

const staffService = {
  // Get all staff with filters
  getAllStaff: (params) => api.get('/admin/staff', { params }),

  // Get single staff details
  getStaffById: (id) => api.get(`/admin/staff/${id}`),

  // Create new staff (Multipart for photo)
  createStaff: (formData) => api.post('/admin/staff/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Update staff details (Multipart for photo)
  updateStaff: (id, formData) => api.put(`/admin/staff/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Update permissions only
  updatePermissions: (id, permissions) => api.put(`/admin/staff/${id}/permissions`, { permissions }),

  // Status transitions
  activateStaff: (id) => api.put(`/admin/staff/${id}/activate`),
  markInactive: (id) => api.put(`/admin/staff/${id}/inactive`),
  suspendStaff: (id) => api.put(`/admin/staff/${id}/suspend`),

  // Soft delete staff
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`)
};

export default staffService;
