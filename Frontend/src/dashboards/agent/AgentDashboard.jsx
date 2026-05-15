import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Wallet, Clock, 
  ArrowRight, Phone, MessageSquare, Eye, 
  Search, Bell, Filter, Calendar, 
  CheckCircle2, AlertCircle, ChevronRight,
  TrendingDown, Briefcase, UserPlus,
  Loader2, ShieldAlert, EyeOff, MoreVertical, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import agentDashboardService from '../../services/agentDashboardService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import { initiateSocketConnection, disconnectSocket } from '../../socket/socketClient';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [followupNote, setFollowupNote] = useState('');
  const [submittingFollowup, setSubmittingFollowup] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    const token = localStorage.getItem('token');
    const socket = initiateSocketConnection(token);

    socket.on('emi-reminder', (data) => {
      toast.success(data.message, { icon: '⏰' });
      fetchDashboardData();
    });

    socket.on('recovery-alert', (data) => {
      toast.error(data.message, { icon: '🚨' });
      fetchDashboardData();
    });

    socket.on('emi-paid', () => {
      fetchDashboardData();
    });

    socket.on('dashboard-update', () => {
      fetchDashboardData();
    });

    return () => {
      socket.off('emi-reminder');
      socket.off('recovery-alert');
      socket.off('emi-paid');
      socket.off('dashboard-update');
      disconnectSocket();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await agentDashboardService.getDashboardSummary();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Unable to synchronize dashboard data');
    } finally {
      // Simulate slight delay for smooth transition
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleSendReminder = async (borrowerId, loanId, type) => {
    try {
      const res = await agentDashboardService.sendReminder({ borrowerId, loanId, reminderType: type });
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Failed to dispatch reminder');
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!followupNote.trim()) return toast.error('Please enter follow-up notes');
    
    try {
      setSubmittingFollowup(true);
      await agentDashboardService.createFollowupLog({
        borrowerId: selectedBorrower.borrowerId,
        loanId: selectedBorrower.loanId,
        note: followupNote
      });
      toast.success('Follow-up activity recorded');
      setFollowupNote('');
      setIsFollowUpOpen(false);
      fetchDashboardData(); // Refresh activities
    } catch (error) {
      toast.error('Failed to save log');
    } finally {
      setSubmittingFollowup(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const data = dashboardData || {};

  return (
    <div className="space-y-6 pb-10">
      {/* 1. WELCOME SECTION */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
              You have <span className="text-primary font-bold">{data.todayFollowUps || 0} active follow-ups</span> today. 
              Target Achievement is at <span className="text-emerald-500 font-bold">{data.targetAchievement || 0}%</span>.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={() => navigate('/agent/clients')} className="font-bold flex items-center gap-2 px-6 shadow-lg shadow-primary/20">
                <Users size={18} /> My Clients
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setIsFollowUpOpen(true)} 
                className="font-bold flex items-center gap-2 border-slate-200 bg-white"
              >
                <Clock size={18} /> Follow Up
              </Button>
              <Button variant="secondary" onClick={() => navigate('/agent/earnings')} className="font-bold flex items-center gap-2 border-slate-200 bg-white">
                <Wallet size={18} /> View Commissions
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-8 lg:pr-8">
             <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio Value</p>
               <p className="text-2xl font-black text-slate-900">R{data.portfolioValue?.toLocaleString() || '0'}</p>
             </div>
             <div className="w-px h-12 bg-slate-100 hidden sm:block" />
             <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Achievement</p>
               <p className="text-2xl font-black text-emerald-500 text-shadow-glow">{data.targetAchievement || 0}%</p>
             </div>
          </div>
        </div>
      </section>

      {/* 📈 ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Assigned Clients" value={data.assignedClientsCount || 0} icon={Users} color="navy" trend="Active Base" />
        <StatCard title="Active Loans" value={data.activeLoansCount || 0} icon={Briefcase} color="blue" trend="In Portfolio" />
        <StatCard title="Monthly Commission" value={`R${data.monthlyCommission?.toLocaleString() || '0'}`} icon={TrendingUp} color="emerald" trend="Current Month" />
        <StatCard title="Pending Follow-Ups" value={data.pendingFollowUps || 0} icon={Clock} color="rose" trend="Overdue Items" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 📋 ASSIGNED CLIENTS TABLE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Assigned Portfolio</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time borrower status</p>
              </div>
              <Button variant="secondary" className="font-bold text-[10px] uppercase tracking-widest border-slate-200" onClick={() => navigate('/agent/clients')}>
                View All <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5 border-b border-slate-100">Borrower</th>
                    <th className="px-8 py-5 border-b border-slate-100">Loan Amount</th>
                    <th className="px-8 py-5 border-b border-slate-100">Next Due</th>
                    <th className="px-8 py-5 border-b border-slate-100">Status</th>
                    <th className="px-8 py-5 border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.assignedClientsTable?.map((client, i) => (
                    <motion.tr 
                      key={client.loanId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase">
                            {client.borrowerName?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 truncate max-w-[120px]">{client.borrowerName}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{client.borrowerCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-slate-900">R{client.loanAmount?.toLocaleString()}</td>
                      <td className="px-8 py-5 text-[11px] font-bold text-slate-600">
                        {client.dueDate ? format(new Date(client.dueDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge status={client.loanStatus} />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => navigate('/agent/clients')} className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"><Eye size={16} /></button>
                           <button 
                            onClick={() => {
                              setSelectedBorrower(client);
                              setIsFollowUpOpen(true);
                            }} 
                            className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                           >
                            <MessageSquare size={16} />
                           </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {(!data.assignedClientsTable || data.assignedClientsTable.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No borrowers assigned yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 💰 COMMISSION SUMMARY */}
          <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black tracking-tight uppercase">Earnings Metrics</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time commission status</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-sm shadow-xl shadow-black/20">
                  <TrendingUp size={24} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <EarningsItem label="Total Lifetime" value={`R${data.commissionSummary?.totalEarned?.toLocaleString() || '0'}`} />
                <EarningsItem label="Pending Payout" value={`R${data.commissionSummary?.pendingCommission?.toLocaleString() || '0'}`} isHighlight />
                <EarningsItem label="Paid To Date" value={`R${data.commissionSummary?.paidCommission?.toLocaleString() || '0'}`} />
                <EarningsItem label="Current Month" value={`R${data.commissionSummary?.thisMonth?.toLocaleString() || '0'}`} />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-8">
          {/* 📌 RECENT ACTIVITIES */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Operations Log</h3>
              <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><MoreVertical size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
              {data.recentActivities?.map(activity => (
                <div key={activity._id} className="flex gap-5 relative group">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center relative z-10 shadow-sm border border-white shrink-0 transition-transform group-hover:scale-110 bg-blue-50 text-blue-500"
                  )}>
                    <Bell size={16} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-slate-900 leading-tight">{activity.title}</h4>
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed truncate max-w-[150px]">{activity.message}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(activity.createdAt), 'hh:mm a')}</p>
                  </div>
                </div>
              ))}
              {(!data.recentActivities || data.recentActivities.length === 0) && (
                <p className="text-center text-[10px] font-bold text-slate-300 uppercase py-4">No recent activities</p>
              )}
            </div>
          </section>

          {/* 🔔 PRIORITY ALERTS */}
          <section className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 space-y-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell size={20} className="text-primary" /> Urgent Portfolio Alerts
            </h3>
            <div className="space-y-4">
               {data.priorityAlerts?.map(alert => (
                 <NotificationItem key={alert._id} type="warning" title={alert.title} desc={alert.message} />
               ))}
               {(!data.priorityAlerts || data.priorityAlerts.length === 0) && (
                 <p className="text-center text-[10px] font-bold text-slate-400 uppercase py-4">All items clear</p>
               )}
            </div>
          </section>
        </div>
      </div>

      {/* 👤 FOLLOW-UP DRAWER */}
      <AnimatePresence>
        {isFollowUpOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFollowUpOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Portfolio Follow-Up</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Communicate with borrowers</p>
                </div>
                <button onClick={() => setIsFollowUpOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {selectedBorrower ? (
                  <div className="space-y-8">
                    <div className="p-6 rounded-[2rem] border-2 border-primary/5 bg-primary/5 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center font-black text-xl">
                          {selectedBorrower.borrowerName?.[0]}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900">{selectedBorrower.borrowerName}</h4>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{selectedBorrower.borrowerCode}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loan Amount</p>
                          <p className="text-sm font-black text-slate-900">R{selectedBorrower.loanAmount?.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                          <StatusBadge status={selectedBorrower.loanStatus} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Quick Actions</h5>
                      <div className="grid grid-cols-3 gap-3">
                        <ReminderBtn icon={MessageSquare} label="SMS" onClick={() => handleSendReminder(selectedBorrower.borrowerId, selectedBorrower.loanId, 'SMS')} />
                        <ReminderBtn icon={Phone} label="WhatsApp" onClick={() => handleSendReminder(selectedBorrower.borrowerId, selectedBorrower.loanId, 'WhatsApp')} />
                        <ReminderBtn icon={Bell} label="Email" onClick={() => handleSendReminder(selectedBorrower.borrowerId, selectedBorrower.loanId, 'Email')} />
                      </div>
                    </div>

                    <form onSubmit={handleAddFollowup} className="space-y-4 pt-6 border-t border-slate-50">
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Log Interaction</h5>
                      <textarea 
                        value={followupNote}
                        onChange={(e) => setFollowupNote(e.target.value)}
                        placeholder="Enter borrower response or follow-up details..."
                        className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 min-h-[120px] resize-none"
                      />
                      <Button type="submit" disabled={submittingFollowup} className="w-full py-4 font-black uppercase text-[10px] tracking-widest">
                        {submittingFollowup ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Interaction Log"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <Users size={40} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Select a borrower from the table to initiate follow-up actions
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const EarningsItem = ({ label, value, isHighlight }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <p className={cn(
      "text-2xl font-black tracking-tight",
      isHighlight ? "text-primary text-shadow-glow" : "text-white"
    )}>{value}</p>
  </div>
);

const NotificationItem = ({ type, title, desc }) => (
  <div className="p-5 bg-white rounded-2xl shadow-sm border border-primary/5 flex gap-4 group hover:border-primary/20 transition-all cursor-default">
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-colors",
      type === 'warning' ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
    )}>
      <AlertCircle size={20} />
    </div>
    <div className="min-w-0">
      <h4 className="text-[11px] font-black text-slate-900 leading-tight truncate">{title}</h4>
      <p className="text-[10px] font-medium text-slate-500 mt-1 leading-relaxed line-clamp-2">{desc}</p>
    </div>
  </div>
);

const ReminderBtn = ({ icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/10 group"
  >
    <Icon size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default AgentDashboard;
