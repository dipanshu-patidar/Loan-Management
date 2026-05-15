import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Briefcase, Clock, AlertCircle, 
  Search, Filter, RefreshCw, Eye, 
  ChevronRight, ArrowDownRight, ArrowRight,
  CheckCircle2, MessageSquare, Bell, 
  PieChart, Activity, User,
  Phone, X, MapPin, Building2, HelpCircle,
  Calendar, Download, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import agentClientsService from '../../services/agentClientsService';
import repaymentService from '../../services/repaymentService';
import { toast } from 'react-hot-toast';
import { initiateSocketConnection, disconnectSocket } from '../../socket/socketClient';
import axios from 'axios';

const MyClients = () => {
  // State for data
  const [dashboardData, setDashboardData] = useState(null);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [loanStatus, setLoanStatus] = useState('All Statuses');
  const [dueStatus, setDueStatus] = useState('Due Payments');

  // State for UI
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(null);
  const [borrowerDetails, setBorrowerDetails] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // State for modals
  const [isAssistModalOpen, setIsAssistModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Form states for modals
  const [assistanceForm, setAssistanceForm] = useState({ supportType: 'Loan Inquiry', supportNotes: '', communicationMessage: '' });
  const [followUpForm, setFollowUpForm] = useState({ 
    followUpType: 'CHAT', 
    recoveryStatus: 'NORMAL', 
    followUpNotes: '', 
    nextFollowUpDate: '',
    visitDate: '',
    visitLocation: ''
  });

  // Fetch Dashboard Analytics
  const fetchDashboard = async () => {
    try {
      const res = await agentClientsService.getClientDashboard();
      if (res.success) setDashboardData(res.data);
    } catch (error) {
      console.error('Dashboard Fetch Error:', error);
    }
  };

  // Fetch Clients Table
  const fetchClients = useCallback(async (silent = false) => {
    if (!silent) setTableLoading(true);
    try {
      const res = await agentClientsService.getClients({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        loanStatus: loanStatus !== 'All Statuses' ? loanStatus : '',
        dueStatus: dueStatus !== 'Due Payments' ? dueStatus : ''
      });
      if (res.success) {
        setClients(res.data.clients);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      if (!silent) setTableLoading(false);
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, loanStatus, dueStatus]);

  // Initial Load & Socket Integration
  useEffect(() => {
    fetchDashboard();
    fetchClients();

    const token = localStorage.getItem('token');
    const socket = initiateSocketConnection(token);

    socket.on('borrower:assigned', () => {
      fetchDashboard();
      fetchClients(true);
      toast.success('A new borrower has been assigned to you!');
    });

    socket.on('payment:updated', () => {
      fetchDashboard();
      fetchClients(true);
    });

    socket.on('emi:overdue', () => {
      fetchDashboard();
      fetchClients(true);
    });

    return () => {
      socket.off('borrower:assigned');
      socket.off('payment:updated');
      socket.off('emi:overdue');
      disconnectSocket();
    };
  }, [fetchClients]);

  // Handle View Borrower Details
  const handleOpenDrawer = async (id) => {
    setSelectedBorrowerId(id);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await agentClientsService.getBorrowerDetails(id);
      if (res.success) setBorrowerDetails(res.data);
    } catch (error) {
      toast.error('Failed to load borrower details');
      setIsDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenSchedule = async () => {
    const loanId = borrowerDetails?.loan?.loanId || borrowerDetails?.loan?._id;
    if (!loanId) return toast.error('Loan record not found');

    setIsScheduleModalOpen(true);
    setScheduleLoading(true);
    try {
      const res = await repaymentService.getLoanSchedule(loanId);
      if (res.data.success) {
        setRepaymentSchedule(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load repayment schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  // Handle Assistance Submit
  const handleAssistSubmit = async () => {
    if (!assistanceForm.supportNotes) return toast.error('Please enter support notes');
    setModalLoading(true);
    try {
      const res = await agentClientsService.saveAssistance({
        borrowerId: selectedBorrowerId,
        ...assistanceForm
      });
      if (res.success) {
        toast.success('Assistance record saved');
        setIsAssistModalOpen(false);
        setAssistanceForm({ supportType: 'Loan Inquiry', supportNotes: '', communicationMessage: '' });
        // Refresh details if drawer is open
        if (isDrawerOpen) handleOpenDrawer(selectedBorrowerId);
      }
    } catch (error) {
      toast.error('Failed to save assistance');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Follow-up Submit
  const handleFollowUpSubmit = async () => {
    if (!followUpForm.followUpNotes) return toast.error('Please enter follow-up notes');
    if (followUpForm.recoveryStatus === 'PROMISED' && !followUpForm.nextFollowUpDate) {
      return toast.error('Next follow-up date is required for Promised status');
    }

    setModalLoading(true);
    try {
      const loanId = borrowerDetails?.loan?.loanId || borrowerDetails?.loan?._id;
      if (!loanId) return toast.error('Loan record not found');

      const res = await agentClientsService.saveFollowUp({
        loanId: loanId,
        ...followUpForm
      });

      if (res.success) {
        toast.success('Follow-up record saved successfully');
        setIsFollowUpModalOpen(false);
        setFollowUpForm({ 
          followUpType: 'CHAT', 
          recoveryStatus: 'NORMAL', 
          followUpNotes: '', 
          nextFollowUpDate: '',
          visitDate: '',
          visitLocation: ''
        });
        
        if (isDrawerOpen) handleOpenDrawer(selectedBorrowerId);
        
        // If type is CHAT, redirect to communication
        if (followUpForm.followUpType === 'CHAT') {
          toast.loading('Opening communication thread...', { duration: 2000 });
          setTimeout(() => {
            window.location.href = '/agent/communication';
          }, 1500);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save follow-up');
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-white rounded-3xl" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-3xl" />)}
        </div>
        <div className="h-96 bg-white rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Clients</h1>
          <p className="text-slate-500 font-medium mt-1">Manage assigned borrowers, track loan status, and handle payment follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { fetchDashboard(); fetchClients(); }} variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white">
            <RefreshCw size={18} className={tableLoading ? "animate-spin" : ""} /> Refresh Clients
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Assigned Borrowers" value={dashboardData?.assignedBorrowers || 0} icon={Users} color="navy" />
        <StatCard title="Active Loans" value={dashboardData?.activeLoans || 0} icon={Briefcase} color="blue" />
        <StatCard title="Due Payments" value={dashboardData?.duePayments || 0} icon={Clock} color="accent" />
        <StatCard title="Overdue Borrowers" value={dashboardData?.overdueBorrowers || 0} icon={AlertCircle} color="rose" />
      </div>


      {/* 4. SEARCH & FILTER SECTION */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search borrower by name or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm"
          />
        </div>
        <select 
          value={loanStatus}
          onChange={(e) => setLoanStatus(e.target.value)}
          className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]"
        >
          <option>All Statuses</option>
          <option>Active</option>
          <option>Overdue</option>
          <option>Completed</option>
        </select>
        <select 
          value={dueStatus}
          onChange={(e) => setDueStatus(e.target.value)}
          className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]"
        >
          <option>Due Payments</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
        </select>
      </div>

      {/* 5. CLIENTS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                <th className="px-8 py-6 border-b border-slate-100">Loan Info</th>
                <th className="px-8 py-6 border-b border-slate-100">EMI Status</th>
                <th className="px-8 py-6 border-b border-slate-100">Due Amount</th>
                <th className="px-8 py-6 border-b border-slate-100">Due Date</th>
                <th className="px-8 py-6 border-b border-slate-100">Status</th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-8 py-6 h-16 bg-slate-50/20" />
                  </tr>
                ))
              ) : clients.length > 0 ? (
                clients.map((borrower, i) => (
                  <motion.tr 
                    key={borrower.borrowerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase border border-primary/10">
                          {borrower.borrowerName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">{borrower.borrowerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{borrower.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">{formatCurrency(borrower.loanAmount)}</p>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{borrower.loanType}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <EMIStatusBadge status={borrower.emiStatus} />
                    </td>
                    <td className="px-8 py-5">
                      <p className={cn("text-sm font-black", borrower.dueAmount > 0 ? "text-rose-500" : "text-slate-400")}>
                        {formatCurrency(borrower.dueAmount)}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">{formatDate(borrower.dueDate)}</td>
                    <td className="px-8 py-5">
                      <StatusBadge status={borrower.loanStatus} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleOpenDrawer(borrower.borrowerId)}
                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Users size={48} />
                      <p className="text-sm font-black uppercase tracking-[0.2em]">No assigned borrowers found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👤 BORROWER DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Borrower Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{borrowerDetails?.profile?.borrowerCode}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              {drawerLoading ? (
                <div className="flex-1 p-8 space-y-8 animate-pulse">
                  <div className="h-40 bg-slate-50 rounded-3xl" />
                  <div className="h-40 bg-slate-50 rounded-3xl" />
                  <div className="h-64 bg-slate-50 rounded-3xl" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  {/* BORROWER INFO */}
                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <User size={14} className="text-primary" /> Contact Information
                    </h4>
                    <div className="grid grid-cols-1 gap-5">
                      <DrawerItem icon={User} label="Full Name" value={borrowerDetails?.profile?.fullName} />
                      <DrawerItem icon={Phone} label="Phone Number" value={borrowerDetails?.profile?.phone} />
                      <DrawerItem icon={MapPin} label="Address" value={borrowerDetails?.profile?.address || 'Not Provided'} />
                    </div>
                  </section>

                  {/* REPAYMENT SUMMARY */}
                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <PieChart size={14} className="text-primary" /> Repayment Progress
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <SummaryCard label="Total Loan" value={formatCurrency(borrowerDetails?.summary?.totalLoanAmount)} color="navy" />
                      <SummaryCard label="Paid Amount" value={formatCurrency(borrowerDetails?.summary?.totalPaid)} color="emerald" />
                      <SummaryCard label="Remaining" value={formatCurrency(borrowerDetails?.summary?.remainingBalance)} color="accent" />
                      <SummaryCard label="Overdue" value={formatCurrency(borrowerDetails?.summary?.overdueAmount)} color="rose" />
                    </div>
                    {borrowerDetails?.loan && (
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-black text-slate-400 uppercase">Collection Progress</span>
                           <span className="text-xs font-black text-primary">{borrowerDetails.loan.repaymentProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${borrowerDetails.loan.repaymentProgress}%` }} className="h-full bg-primary" />
                        </div>
                      </div>
                    )}
                  </section>

                  {/* RECENT ACTIVITY */}
                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Activity size={14} className="text-primary" /> Recent Activity
                    </h4>
                    <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                      {borrowerDetails?.activities?.length > 0 ? (
                        borrowerDetails.activities.map((activity, idx) => (
                          <ActivityTimeline 
                            key={idx}
                            icon={activity.type === 'FollowUp' ? Clock : HelpCircle} 
                            title={activity.title} 
                            desc={activity.desc} 
                            time={formatDate(activity.time)} 
                            color={activity.color} 
                          />
                        ))
                      ) : (
                        <p className="text-[10px] font-bold text-slate-400 text-center py-4 uppercase">No activity recorded yet</p>
                      )}
                    </div>
                  </section>
                </div>
              )}

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <Button 
                  disabled={drawerLoading}
                  className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" 
                  onClick={() => setIsAssistModalOpen(true)}
                >
                   Assist Borrower
                </Button>
                <Button 
                  disabled={drawerLoading}
                  variant="secondary"
                  className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200"
                  onClick={handleOpenSchedule}
                >
                  Repayment Schedule
                </Button>
                <Button 
                  disabled={drawerLoading}
                  variant="secondary" 
                  className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200" 
                  onClick={() => setIsFollowUpModalOpen(true)}
                >
                  Payment Follow-Up
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🤝 ASSIST BORROWER MODAL */}
      <Modal isOpen={isAssistModalOpen} onClose={() => setIsAssistModalOpen(false)} title="Assist Borrower" maxWidth="max-w-xl">
        <div className="space-y-8">
           <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">Assisting Borrower</p>
                 <p className="text-lg font-black text-slate-900">{borrowerDetails?.profile?.fullName}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Amount</p>
                 <p className="text-lg font-black text-rose-500">{formatCurrency(borrowerDetails?.loan?.dueAmount || 0)}</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Category</label>
                 <select 
                    value={assistanceForm.supportType}
                    onChange={(e) => setAssistanceForm({...assistanceForm, supportType: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option>Loan Inquiry</option>
                    <option>Payment Assistance</option>
                    <option>EMI Clarification</option>
                    <option>Document Help</option>
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Notes</label>
                 <textarea 
                    placeholder="Enter details about the borrower's request..." 
                    value={assistanceForm.supportNotes}
                    onChange={(e) => setAssistanceForm({...assistanceForm, supportNotes: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none transition-all" 
                  />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication Message (Optional)</label>
                 <textarea 
                    placeholder="Message to send to borrower..." 
                    value={assistanceForm.communicationMessage}
                    onChange={(e) => setAssistanceForm({...assistanceForm, communicationMessage: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[80px] focus:ring-2 focus:ring-primary/10 outline-none transition-all" 
                  />
              </div>
           </div>

           <div className="flex gap-4 pt-4 border-t border-slate-50">
              <Button disabled={modalLoading} variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsAssistModalOpen(false)}>Cancel</Button>
              <Button disabled={modalLoading} className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={handleAssistSubmit}>
                {modalLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Save Assistance'}
              </Button>
           </div>
        </div>
      </Modal>

      {/* 💰 PAYMENT FOLLOW-UP MODAL */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Payment Follow-Up" maxWidth="max-w-xl">
        <div className="space-y-8">
           <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Overdue Follow-Up</p>
                 <p className="text-lg font-black text-rose-900">{borrowerDetails?.profile?.fullName}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Overdue Days</p>
                 <p className="text-lg font-black text-rose-900">{borrowerDetails?.loan?.overdueDays || 0} Days</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-Up Type</label>
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { label: 'Chat', value: 'CHAT', icon: MessageSquare, color: 'blue' },
                        { label: 'Visit', value: 'VISIT', icon: MapPin, color: 'amber' }
                     ].map(type => (
                        <button 
                           key={type.value}
                           onClick={() => setFollowUpForm({...followUpForm, followUpType: type.value})}
                           className={cn(
                              "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                              followUpForm.followUpType === type.value 
                                 ? `bg-${type.color}-500 text-white border-${type.color}-500 shadow-lg` 
                                 : `bg-${type.color}-50 text-${type.color}-600 border-${type.color}-100`
                           )}
                        >
                           <type.icon size={16} /> {type.label}
                        </button>
                     ))}
                  </div>
               </div>

               {followUpForm.followUpType === 'VISIT' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Date</label>
                        <input 
                           type="date" 
                           value={followUpForm.visitDate}
                           onChange={(e) => setFollowUpForm({...followUpForm, visitDate: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all" 
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Location</label>
                        <input 
                           type="text" 
                           placeholder="Home / Office / etc."
                           value={followUpForm.visitLocation}
                           onChange={(e) => setFollowUpForm({...followUpForm, visitLocation: e.target.value})}
                           className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all" 
                        />
                     </div>
                  </div>
               )}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recovery Status</label>
                  <div className="grid grid-cols-2 gap-3">
                     {['NORMAL', 'PROMISED', 'WARNING', 'CRITICAL'].map(status => (
                        <button 
                           key={status}
                           onClick={() => setFollowUpForm({...followUpForm, recoveryStatus: status})}
                           className={cn(
                              "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                              followUpForm.recoveryStatus === status 
                                 ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]" 
                                 : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                           )}
                        >
                           {status}
                        </button>
                     ))}
                  </div>
               </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Follow-Up Date</label>
                 <input 
                    type="date" 
                    value={followUpForm.nextFollowUpDate}
                    onChange={(e) => setFollowUpForm({...followUpForm, nextFollowUpDate: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all" 
                  />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-Up Notes</label>
                 <textarea 
                    placeholder="What was the outcome of this follow-up?" 
                    value={followUpForm.followUpNotes}
                    onChange={(e) => setFollowUpForm({...followUpForm, followUpNotes: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[100px] focus:ring-2 focus:ring-primary/10 outline-none transition-all" 
                  />
              </div>
           </div>

           <div className="flex gap-4 pt-4 border-t border-slate-50">
              <Button disabled={modalLoading} variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</Button>
              <Button disabled={modalLoading} className="flex-1 font-bold shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600 border-none" onClick={handleFollowUpSubmit}>
                {modalLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Save Follow-Up'}
              </Button>
           </div>
        </div>
      </Modal>

      {/* 📊 REPAYMENT SCHEDULE MODAL */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Repayment Schedule" maxWidth="max-w-2xl">
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</p>
              <p className="text-lg font-black">{borrowerDetails?.profile?.fullName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
              <p className="text-lg font-black text-primary">{formatCurrency(borrowerDetails?.summary?.remainingBalance || 0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4 border-b border-slate-100">EMI #</th>
                    <th className="px-6 py-4 border-b border-slate-100">Due Date</th>
                    <th className="px-6 py-4 border-b border-slate-100">Amount</th>
                    <th className="px-6 py-4 border-b border-slate-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scheduleLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="4" className="px-6 py-4 h-12 bg-slate-50/20" />
                      </tr>
                    ))
                  ) : repaymentSchedule.map((emi) => (
                    <tr key={emi._id} className="text-[11px] font-bold text-slate-600">
                      <td className="px-6 py-4">{emi.emiNumber}</td>
                      <td className="px-6 py-4">{formatDate(emi.dueDate)}</td>
                      <td className="px-6 py-4">{formatCurrency(emi.amount)}</td>
                      <td className="px-6 py-4">
                        <EMIStatusBadge status={emi.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-50">
            <Button variant="secondary" className="px-8 font-bold border-slate-200" onClick={() => setIsScheduleModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const EMIStatusBadge = ({ status }) => (
  <div className={cn(
    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
    status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
    status === 'Overdue' ? "bg-rose-50 text-rose-600 border-rose-100" :
    "bg-amber-50 text-amber-600 border-amber-100"
  )}>
    <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Paid' ? "bg-emerald-500" : status === 'Overdue' ? "bg-rose-500" : "bg-amber-500")} />
    {status}
  </div>
);

const DrawerItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900 truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const SummaryCard = ({ label, value, color }) => (
  <div className={cn(
    "p-4 rounded-2xl border flex flex-col gap-1 transition-all hover:scale-105 cursor-default",
    color === 'emerald' ? "bg-emerald-50 border-emerald-100" :
    color === 'rose' ? "bg-rose-50 border-rose-100" :
    color === 'navy' ? "bg-slate-900 border-slate-800 text-white" :
    "bg-primary/5 border-primary/10"
  )}>
    <p className={cn("text-[7px] font-black uppercase tracking-widest", color === 'navy' ? "text-slate-500" : "text-slate-400")}>{label}</p>
    <p className={cn("text-xs font-black", color === 'navy' ? "text-white" : "text-slate-900")}>{value}</p>
  </div>
);

const ActivityTimeline = ({ icon: Icon, title, desc, time, color }) => (
  <div className="flex gap-4 relative group">
    <div className={cn(
      "w-7 h-7 rounded-lg flex items-center justify-center relative z-10 border-2 border-white shadow-sm transition-transform group-hover:scale-110",
      color === 'emerald' ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"
    )}>
      <Icon size={12} />
    </div>
    <div className="min-w-0">
      <h5 className="text-[11px] font-black text-slate-900 leading-none">{title}</h5>
      <p className="text-[10px] font-medium text-slate-500 mt-1">{desc}</p>
      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{time}</p>
    </div>
  </div>
);

export default MyClients;
