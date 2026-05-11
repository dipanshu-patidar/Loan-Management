import React from 'react';
import DashboardLayout from './DashboardLayout';
import { BORROWER_MENU } from '../constants/menuItems';

const BorrowerLayout = () => {
  return <DashboardLayout menuItems={BORROWER_MENU} role="borrower" />;
};

export default BorrowerLayout;
