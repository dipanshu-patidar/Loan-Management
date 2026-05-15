// App Routes Configuration
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';
import AgentLayout from './layouts/AgentLayout';
import BorrowerLayout from './layouts/BorrowerLayout';

// Routes
import Login from './routes/Login';
import LandingPage from './routes/LandingPage';

// Dashboards
import Profile from './dashboards/admin/Profile';
import AdminDashboard from './dashboards/admin/AdminDashboard';
import Borrowers from './dashboards/admin/Borrowers';
import Agents from './dashboards/admin/Agents';
import Staff from './dashboards/admin/Staff';
import Applications from './dashboards/admin/Applications';
import ActiveLoans from './dashboards/admin/ActiveLoans';
import PaymentHistory from './dashboards/admin/PaymentHistory';
import DuePayments from './dashboards/admin/DuePayments';
import Reports from './dashboards/admin/Reports';
import Settings from './dashboards/admin/Settings';
import AdminCommunication from './dashboards/admin/AdminCommunication';
import NotificationsModule from './dashboards/admin/Notifications';
import StaffDashboard from './dashboards/staff/StaffDashboard';
import EligibilityReview from './dashboards/staff/EligibilityReview';
import LoanRequests from './dashboards/staff/LoanRequests';
import LoanReview from './dashboards/staff/LoanReview';
import LoanReviewDetail from './dashboards/staff/LoanReviewDetail';
import PaymentVerification from './dashboards/staff/PaymentVerification';
import CommunicationLogs from './dashboards/staff/CommunicationLogs';
import StaffNotifications from './dashboards/staff/Notifications';
import AgentDashboard from './dashboards/agent/AgentDashboard';
import MyClients from './dashboards/agent/MyClients';
import Earnings from './dashboards/agent/Earnings';
import AgentCommunication from './dashboards/agent/AgentCommunication';
import AgentNotifications from './dashboards/agent/AgentNotifications';
import AgentProfile from './dashboards/agent/AgentProfile';
import BorrowerDashboard from './dashboards/borrower/BorrowerDashboard';
import ApplyLoan from './dashboards/borrower/ApplyLoan';
import MyLoans from './dashboards/borrower/MyLoans';
import MakePayment from './dashboards/borrower/MakePayment';
import BorrowerPaymentHistory from './dashboards/borrower/PaymentHistory';

import BorrowerNotifications from './dashboards/borrower/BorrowerNotifications';
import BorrowerCommunication from './dashboards/borrower/BorrowerCommunication';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>

      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        containerStyle={{
          zIndex: 999999,
        }}
        toastOptions={{
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '16px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #f1f5f9',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            duration: 5000,
          },
        }}
      />
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public / Internal Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/staff/login" element={<Login />} />
        <Route path="/agent/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="borrowers" element={<Borrowers />} />
          <Route path="agents" element={<Agents />} />
          <Route path="staff" element={<Staff />} />
          <Route path="applications" element={<Applications />} />
          <Route path="active-loans" element={<ActiveLoans />} />
          <Route path="payment-history" element={<PaymentHistory />} />
          <Route path="due-payments" element={<DuePayments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="communication" element={<AdminCommunication />} />
          <Route path="notifications" element={<NotificationsModule />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<div className="card">Admin Module Placeholder</div>} />
        </Route>

        {/* Staff Routes */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="loan-requests" element={<LoanRequests />} />
          <Route path="loan-requests/:id/review" element={<EligibilityReview />} />
          <Route path="loan-review" element={<LoanReview />} />
          <Route path="loan-review/:id" element={<EligibilityReview />} />
          <Route path="payment-verification" element={<PaymentVerification />} />
          <Route path="profile" element={<Profile />} />
          <Route path="communications" element={<CommunicationLogs />} />
          <Route path="notifications" element={<StaffNotifications />} />
          <Route path="*" element={<div className="card">Staff Module Placeholder</div>} />
        </Route>

        {/* Agent Routes */}
        <Route path="/agent" element={<AgentLayout />}>
          <Route path="dashboard" element={<AgentDashboard />} />
          <Route path="clients" element={<MyClients />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="logs" element={<AgentCommunication />} />
          <Route path="notifications" element={<AgentNotifications />} />
          <Route path="profile" element={<AgentProfile />} />
          <Route path="*" element={<div className="card">Agent Module Placeholder</div>} />
        </Route>

        {/* Borrower Routes */}
        <Route path="/borrower" element={<BorrowerLayout />}>
          <Route path="dashboard" element={<BorrowerDashboard />} />
          <Route path="apply-loan" element={<ApplyLoan />} />
          <Route path="my-loans" element={<MyLoans />} />
          <Route path="make-payment" element={<MakePayment />} />
          <Route path="payment-history" element={<BorrowerPaymentHistory />} />
          <Route path="notifications" element={<BorrowerNotifications />} />
          <Route path="communication" element={<BorrowerCommunication />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<div className="card">Borrower Module Placeholder</div>} />
        </Route>
        
        {/* 404 Catch All */}
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center font-bold text-2xl">404 - Not Found</div>} />
      </Routes>
    </Router>
    </SocketProvider>
  );
}


export default App;
