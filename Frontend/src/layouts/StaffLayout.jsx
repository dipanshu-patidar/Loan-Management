import React from 'react';
import DashboardLayout from './DashboardLayout';
import { STAFF_MENU } from '../constants/menuItems';

const StaffLayout = () => {
  return <DashboardLayout menuItems={STAFF_MENU} role="staff" />;
};

export default StaffLayout;
