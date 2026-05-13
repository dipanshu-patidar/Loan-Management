import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import { AlertCircle, X } from 'lucide-react';
import api from '../services/api';

const DashboardLayout = ({ menuItems, role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile visibility
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
  const [userStatus, setUserStatus] = useState('Active');
  const [showBanner, setShowBanner] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          const user = response.data.data;
          setUserStatus(user.operationalStatus || 'Active');
        }
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 401) {
          // Auto logout if suspended or token invalid
          localStorage.clear();
          navigate('/login');
        }
      }
    };
    fetchStatus();
  }, [navigate]);

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

        {/* Inactive Warning Banner */}
        {userStatus === 'Inactive' && showBanner && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3 text-amber-800">
              <AlertCircle size={18} className="text-amber-500" />
              <p className="text-sm font-bold">
                Your account is currently inactive. Operational actions are temporarily disabled.
              </p>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-amber-400 hover:text-amber-600">
              <X size={18} />
            </button>
          </div>
        )}

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
