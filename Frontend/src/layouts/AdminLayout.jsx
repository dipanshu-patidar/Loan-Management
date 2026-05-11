import React from 'react';
import DashboardLayout from './DashboardLayout';
import { ADMIN_MENU } from '../constants/menuItems';

const AdminLayout = () => {
  return <DashboardLayout menuItems={ADMIN_MENU} role="admin" />;
};

export default AdminLayout;
