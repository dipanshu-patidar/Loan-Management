import React from 'react';
import DashboardLayout from './DashboardLayout';
import { AGENT_MENU } from '../constants/menuItems';

const AgentLayout = () => {
  return <DashboardLayout menuItems={AGENT_MENU} role="agent" />;
};

export default AgentLayout;
