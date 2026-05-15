import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FilePlus, Wallet, Briefcase, Clock, 
  CheckCircle2, AlertCircle, Calendar, 
  ArrowRight, Info, Eye, 
  TrendingUp, Bell, RefreshCw, X,
  ChevronRight, ArrowUpRight, Activity,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import authService from '../../services/authService';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format, isPast, isToday } from 'date-fns';

const BorrowerDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { socket } = useSocket();
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log('Dashboard update triggered via socket');
      fetchDashboardData();
    };

    const handlePaymentVerified = (data) => {
      toast.success(data.message || 'Payment verified successfully!');
      fetchDashboardData();
    };

    const handleAlert = (data) => {
      toast(data.message, { icon: '🔔' });
      fetchDashboardData();
    };

    socket.on('dashboard-updated', handleUpdate);
    socket.on('payment-verified', handlePaymentVerified);
    socket.on('emi-due-alert', handleAlert);
    socket.on('overdue-alert', handleAlert);
    socket.on('loan-updated', handleUpdate);
    socket.on('notification-created', handleUpdate);

    return () => {
      socket.off('dashboard-updated', handleUpdate);
      socket.off('payment-verified', handlePaymentVerified);
      socket.off('emi-due-alert', handleAlert);
      socket.off('overdue-alert', handleAlert);
      socket.off('loan-updated', handleUpdate);
      socket.off('notification-created', handleUpdate);
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/borrower/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      toast.error('Failed to sync dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getAlertConfig = (emi) => {
    if (!emi) return null;
    const dueDate = new Date(emi.dueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysRemaining = emi.daysLeft;

    if (emi.status === 'Overdue' || (isPast(dueDate) && !isToday(dueDate))) {
      return {
        color: 'bg-rose-50 border-rose-100 text-rose-700',
        icon: <AlertCircle className="text-rose-500" />,
        label: 'Overdue Alert',
        message: `Your EMI of R${emi.amount.toLocaleString()} was due on ${format(dueDate, 'dd MMM yyyy')}. Please pay immediately to avoid further penalties.`,
        badge: 'bg-rose-500 text-white'
      };
    } else if (isToday(dueDate)) {
      return {
        color: 'bg-orange-50 border-orange-100 text-orange-700',
        icon: <Bell className="text-orange-500" />,
        label: 'Due Today',
        message: `Your EMI of R${emi.amount.toLocaleString()} is due TODAY. Please complete your payment.`,
        badge: 'bg-orange-500 text-white'
      };
    } else if (daysRemaining <= 2) {
      return {
        color: 'bg-amber-50 border-amber-100 text-amber-700',
        icon: <Clock className="text-amber-500" />,
        label: 'Upcoming Payment',
        message: `Your EMI of R${emi.amount.toLocaleString()} is due on ${format(dueDate, 'dd MMM yyyy')} (in ${daysRemaining} days).`,
        badge: 'bg-amber-500 text-white'
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Syncing Dashboard Data...</p>
      </div>
    );
  }

  const { 
    loanOverview, 
    nextEmi, 
    remainingBalance, 
    loanStatus, 
    repaymentProgress, 
    alerts, 
    recentActivities,
    loanSummary 
  } = dashboardData || {};

  const alertConfig = getAlertConfig(nextEmi);

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHrs = Math.floor((now - date) / (1000 * 60 * 60));
      if (diffInHrs < 1) return 'Just now';
      if (diffInHrs < 24) return `${diffInHrs} hours ago`;
      return format(date, 'dd MMM yyyy');
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 0. EMI DYNAMIC ALERT */}
      <AnimatePresence>
        {alertConfig && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className={cn("relative overflow-hidden rounded-[2rem] border p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm", alertConfig.color)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              {alertConfig.icon}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{alertConfig.label}</span>
                <span className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase", alertConfig.badge)}>Action Required</span>
              </div>
              <p className="text-sm font-black tracking-tight">{alertConfig.message}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate('/borrower/make-payment')}
                className={cn("font-black px-6 py-2 text-[10px] uppercase tracking-widest shadow-lg", 
                  alertConfig.badge.includes('rose') ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 
                  alertConfig.badge.includes('orange') ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' :
                  'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                )}
              >
                Pay Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. WELCOME SECTION */}
      <section className="relative bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-premium overflow-hidden group">
         {/* Decorative background element */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-all duration-700" />
         
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Activity size={12} /> Account Overview
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-2">Welcome Back, <span className="text-primary">{user?.fullName || 'Borrower'}</span></h1>
               <p className="text-slate-500 font-medium max-w-xl">
                 {loanOverview 
                   ? `You have an active ${loanOverview.loanType} and your next repayment is scheduled soon. Keep up the good work!`
                   : 'You don\'t have any active loans at the moment. Apply for a new loan to get started!'}
               </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
                <Button 
                  onClick={() => navigate('/borrower/apply-loan')}
                 className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
               >
                  <FilePlus size={18} /> Apply New Loan
               </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/borrower/make-payment')}
                 className="flex items-center gap-2 font-bold bg-white border-slate-200 hover:border-primary transition-all"
               >
                  <Wallet size={18} /> Make Payment
               </Button>
            </div>
         </div>
      </section>

      {/* 2. ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Loan" value={loanOverview ? `R${loanOverview.approvedAmount.toLocaleString()}` : 'R0'} icon={Briefcase} color="navy" />
        <StatCard title="Next EMI" value={nextEmi ? `R${nextEmi.amount.toLocaleString()}` : 'N/A'} icon={Calendar} color="blue" />
        <StatCard title="Remaining" value={remainingBalance ? `R${remainingBalance.amount.toLocaleString()}` : 'R0'} icon={Wallet} color="accent" />
        <StatCard title="Loan Status" value={loanStatus || 'N/A'} icon={CheckCircle2} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: ACTIVE LOAN & PROGRESS */}
        <div className="lg:col-span-8 space-y-8">
           {/* ACTIVE LOAN SUMMARY */}
           <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                       <Briefcase size={24} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-slate-900 tracking-tight">{loanOverview?.loanType || 'No Active Loan'}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{loanOverview?.loanCode || 'N/A'}</p>
                    </div>
                 </div>
                 <StatusBadge status={loanStatus} />
              </div>
              
              <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="space-y-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Approved</p>
                       <p className="text-2xl font-black text-slate-900">{loanSummary ? `R${loanSummary.approvedAmount.toLocaleString()}` : 'R0'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Rate</p>
                       <p className="text-lg font-black text-primary">{loanSummary?.interestRate}%</p>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Balance</p>
                       <p className="text-2xl font-black text-slate-900">{remainingBalance ? `R${remainingBalance.amount.toLocaleString()}` : 'R0'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next EMI Date</p>
                       <p className="text-lg font-black text-slate-700">{nextEmi ? format(new Date(nextEmi.dueDate), 'dd MMM yyyy') : 'N/A'}</p>
                    </div>
                 </div>

                 {/* REPAYMENT PROGRESS */}
                 <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-center space-y-6 shadow-inner">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Progress</span>
                       <span className="text-[11px] font-black text-primary bg-white px-2 py-0.5 rounded-lg border border-primary/10">{repaymentProgress}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${repaymentProgress}%` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                       />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       <span>Paid: R{(loanSummary ? (loanSummary.approvedAmount - loanSummary.remainingBalance) : 0).toLocaleString()}</span>
                       <span>Goal: R{loanSummary?.approvedAmount.toLocaleString() || '0'}</span>
                    </div>
                 </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
                 <button 
                   onClick={() => loanOverview && setIsDetailsDrawerOpen(true)}
                   className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:gap-3 transition-all disabled:opacity-50"
                   disabled={!loanOverview}
                 >
                    View Full Details <ArrowRight size={14} />
                 </button>
                 <div className="flex items-center gap-3">
                     <Button 
                       variant="secondary" 
                       onClick={() => navigate('/borrower/my-loans')}
                       className="bg-white border-slate-200 font-bold px-4 py-2 text-[10px]"
                     >
                       Repayment Schedule
                    </Button>
                     <Button 
                       onClick={() => navigate('/borrower/make-payment')}
                       className="font-bold px-6 py-2 text-[10px]"
                     >
                       Make Payment
                    </Button>
                 </div>
              </div>
           </section>

           {/* 💳 NEXT EMI SECTION */}
           <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium flex items-center gap-6 group hover:border-primary/20 transition-all">
                 <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Clock size={28} />
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next EMI Due</p>
                       {nextEmi && <span className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase", nextEmi.daysLeft <= 2 ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500")}>
                         {nextEmi.daysLeft} Days Left
                       </span>}
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mt-1">{nextEmi ? `R${nextEmi.amount.toLocaleString()}` : 'N/A'}</h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{nextEmi ? `Due by ${format(new Date(nextEmi.dueDate), 'dd MMM yyyy')}` : 'No pending EMI'}</p>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium flex items-center gap-6 group hover:border-primary/20 transition-all">
                 <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={28} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
                    <h4 className="text-2xl font-black text-slate-900 mt-1">{loanStatus || 'Inactive'}</h4>
                    <div className="flex items-center gap-1.5 text-emerald-500 mt-0.5">
                       <CheckCircle2 size={12} />
                       <p className="text-[11px] font-bold uppercase tracking-widest">Synced Live</p>
                    </div>
                 </div>
              </div>
           </section>
        </div>

        {/* RIGHT COLUMN: ACTIVITIES & NOTIFICATIONS */}
        <div className="lg:col-span-4 space-y-8">
           {/* 🔔 NOTIFICATIONS PANEL */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Alerts</h3>
                <div className="w-8 h-8 bg-primary/5 text-primary rounded-xl flex items-center justify-center text-[10px] font-black">
                   {alerts?.length || 0}
                </div>
              </div>
              <div className="space-y-4">
                 {alerts && alerts.length > 0 ? alerts.map(alert => (
                    <div key={alert._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 hover:border-primary/20 transition-all group">
                       <div className={cn(
                         "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform",
                         alert.priority === 'High' ? "bg-rose-50 text-rose-500" : "bg-white text-primary"
                       )}>
                          {alert.alertType === 'OVERDUE' ? <AlertCircle size={14} /> : <Bell size={14} />}
                       </div>
                       <div className="flex-1">
                          <p className="text-[11px] font-black text-slate-900 leading-tight">{alert.title}</p>
                          <p className="text-[10px] font-medium text-slate-500 mt-1">{alert.message}</p>
                       </div>
                    </div>
                 )) : (
                    <p className="text-[10px] font-bold text-slate-400 text-center py-4 italic">No new alerts</p>
                 )}
              </div>
           </section>

           {/* 📌 RECENT ACTIVITIES SECTION */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
                <button 
                  onClick={fetchDashboardData}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                 {recentActivities && recentActivities.length > 0 ? recentActivities.map(activity => (
                    <div key={activity._id} className="flex gap-4 relative z-10 group">
                       <div className={cn(
                         "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm border-2 transition-transform group-hover:scale-110",
                         activity.type === 'Payment' ? "bg-emerald-500 border-emerald-500 text-white" :
                         activity.type === 'Penalty' ? "bg-rose-500 border-rose-500 text-white" :
                         "bg-primary border-primary text-white"
                       )}>
                         {activity.type === 'Payment' ? <Wallet size={10} /> : <Activity size={10} />}
                       </div>
                       <div className="min-w-0">
                          <h5 className="text-[11px] font-black text-slate-900 leading-none">{activity.title}</h5>
                          <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">{activity.message}</p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{formatTime(activity.createdAt)}</p>
                       </div>
                    </div>
                 )) : (
                    <p className="text-[10px] font-bold text-slate-400 text-center py-4 italic">No recent activities</p>
                 )}
              </div>
              <Button 
                variant="secondary" 
                className="w-full font-bold text-[10px] uppercase tracking-widest border-slate-100"
                onClick={() => navigate('/borrower/payment-history')}
              >
                View Full History
              </Button>
           </section>
        </div>
      </div>

      {/* 👤 LOAN DETAILS DRAWER */}
      <AnimatePresence>
        {isDetailsDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Loan Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contract No: {loanOverview?.loanCode}</p>
                </div>
                <button onClick={() => setIsDetailsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" /> Loan Summary
                   </h4>
                   <div className="grid grid-cols-1 gap-5">
                      <DetailRow label="Principal Amount" value={`R${loanSummary?.approvedAmount.toLocaleString()}`} />
                      <DetailRow label="Interest Rate" value={`${loanSummary?.interestRate}%`} />
                      <DetailRow label="Loan Tenure" value={`${loanSummary?.loanDuration} Months`} />
                      <DetailRow label="Monthly EMI" value={`R${loanSummary?.emiAmount.toLocaleString()}`} />
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Clock size={14} className="text-primary" /> Repayment Status
                   </h4>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                         <span className="text-sm font-black text-slate-900">{repaymentProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                         <div className="h-full bg-primary rounded-full" style={{ width: `${repaymentProgress}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paid So Far</p>
                            <p className="text-lg font-black text-emerald-500">R{(loanSummary ? (loanSummary.approvedAmount - loanSummary.remainingBalance) : 0).toLocaleString()}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                            <p className="text-lg font-black text-rose-500">R{loanSummary?.remainingBalance.toLocaleString() || '0'}</p>
                         </div>
                      </div>
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <ArrowUpRight size={14} className="text-primary" /> Penalties & Fees
                   </h4>
                   <div className="p-5 border border-rose-100 bg-rose-50/30 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-50">
                         <AlertCircle size={20} />
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900">No Active Penalties</p>
                         <p className="text-[10px] font-bold text-slate-400">Maintain timely payments to avoid 5% late fees.</p>
                      </div>
                   </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3 shrink-0">
                 <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20">
                    Download Loan Agreement
                 </Button>
                 <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200 bg-white" onClick={() => setIsDetailsDrawerOpen(false)}>
                    Close Details
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between group">
    <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">{label}</p>
    <p className="text-sm font-black text-slate-900">{value}</p>
  </div>
);

export default BorrowerDashboard;
