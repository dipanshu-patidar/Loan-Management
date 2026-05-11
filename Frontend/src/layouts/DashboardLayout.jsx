import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';

const DashboardLayout = ({ menuItems, role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile visibility
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-soft">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        isCollapsed={isCollapsed}
        onClose={() => setIsSidebarOpen(false)} 
        onToggleCollapse={toggleCollapse}
        menuItems={menuItems}
        role={role}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar 
          toggleSidebar={toggleSidebar} 
          role={role}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <div className="w-full space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs />
            
            {/* Page Content */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
