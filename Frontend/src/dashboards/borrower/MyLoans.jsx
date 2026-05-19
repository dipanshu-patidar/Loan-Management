import React, { useState } from 'react';
import {
  Briefcase, Clock, AlertCircle,
  ChevronRight, ArrowRight, Download, Eye,
  Calendar, FileText, CheckCircle2, History,
  Wallet, TrendingUp, Info, Activity,
  X, Filter, PieChart, ShieldCheck, Loader2,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';
import { initiateSocketConnection, disconnectSocket } from '../../socket/socketClient';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../services/api';
import agreementService from '../../services/agreementService';
import AgreementPreviewModal from '../../components/AgreementPreviewModal';

const MyLoans = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [isEmiDrawerOpen, setIsEmiDrawerOpen] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  
  const [dashboardData, setDashboardData] = useState(null);
  const [emiSchedule, setEmiSchedule] = useState([]);
  const [isAgreementPreviewOpen, setIsAgreementPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  // Digital Signature OTP States
  const [selectedApp, setSelectedApp] = useState(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  React.useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown(c => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleOpenSigningModal = (app) => {
    setSelectedApp(app);
    setIsSigningModalOpen(true);
    setOtpSent(false);
    setOtpCode('');
  };

  const handleSendOtp = async () => {
    if (!selectedApp) return;
    try {
      setIsSendingOtp(true);
      await agreementService.sendOtp(selectedApp._id);
      setOtpSent(true);
      setOtpCooldown(60);
      toast.success('Secure OTP email has been sent to ' + selectedApp.emailAddress);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedApp || !otpCode) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }
    try {
      setIsVerifyingOtp(true);
      await agreementService.verifyOtp(selectedApp._id, otpCode);
      toast.success('Loan agreement successfully digitally signed!');
      setIsSigningModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleDownloadAgreement = (app) => {
    setSelectedApp(app);
    setIsAgreementPreviewOpen(true);
    toast.success('Opening high-fidelity document preview for PDF download...');
  };

  React.useEffect(() => {
    fetchDashboardData();

    // Initialize Socket.IO
    const token = localStorage.getItem('token');
    const socket = initiateSocketConnection(token);

    socket.on('emi-reminder', (data) => {
      toast.success(data.message, { icon: '⏰', duration: 5000 });
      fetchDashboardData();
    });

    socket.on('emi-overdue', (data) => {
      toast.error(data.message, { icon: '🚨', duration: 6000 });
      fetchDashboardData();
    });

    socket.on('emi-paid', (data) => {
      toast.success('EMI Payment Confirmed!', { icon: '✅' });
      fetchDashboardData();
    });

    socket.on('borrower-review-status-updated', () => {
      toast.success('Your loan application review has been completed.', { icon: '📋' });
      fetchDashboardData();
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/borrower/my-loans');
      if (response.data.success) {
        setDashboardData(response.data.data);
        setActivities(response.data.data.activities || []);
        
        // If there is an active loan, fetch its schedule
        if (response.data.data.activeLoans.length > 0) {
          const loanId = response.data.data.activeLoans[0]._id;
          const scheduleRes = await api.get(`/borrower/emi-schedule/${loanId}`);
          if (scheduleRes.data.success) {
            setEmiSchedule(scheduleRes.data.data.schedule);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Unable to load loan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async () => {
    if (!dashboardData?.activeLoans?.[0]) return;
    try {
      toast.loading('Preparing statement...', { id: 'download' });
      const response = await api.post('/borrower/download-loan-statement', {
        loanId: dashboardData.activeLoans[0]._id,
        format: exportFormat.toLowerCase()
      });
      toast.success(response.data.message, { id: 'download' });
      setIsExportModalOpen(false);
    } catch (error) {
      toast.error('Download failed', { id: 'download' });
    }
  };

  const handleEmiClick = (emi) => {
    setSelectedEmi(emi);
    setIsEmiDrawerOpen(true);
  };

  const data = dashboardData || {};
  const activeLoan = data.activeLoans?.[0];
  const loanApplications = data.loanApplications || [];

  return (
    <div className="space-y-10 pb-20">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Loans</h1>
          <p className="text-slate-500 font-medium mt-1">Track active loans, repayment schedules, balances, and penalties.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button 
            variant="secondary" 
            onClick={() => setIsScheduleModalOpen(true)}
            disabled={!activeLoan}
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-6 border-slate-200 bg-white"
          >
            <Calendar size={16} /> View EMI Schedule
          </Button>
          <Button 
            onClick={() => setIsExportModalOpen(true)}
            disabled={!activeLoan}
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-8 shadow-lg shadow-primary/20"
          >
            <Download size={16} /> Download Statement
          </Button>
        </div>
      </header>

      {/* 2. SIMPLE LOAN FLOW */}
      <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium">
         <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto gap-8 md:gap-4">
            <WorkflowStep label="Approved" status="completed" icon={ShieldCheck} />
            <WorkflowArrow active />
            <WorkflowStep label="Active" status={activeLoan ? "active" : "pending"} icon={Activity} />
            <WorkflowArrow active={!!activeLoan} />
            <WorkflowStep label="EMI Payments" status={activeLoan ? (emiSchedule.some(s => s.status === 'Paid') ? "completed" : "active") : "pending"} icon={Wallet} />
            <WorkflowArrow active={activeLoan?.loanStatus === 'Completed'} />
            <WorkflowStep label="Completed" status={activeLoan?.loanStatus === 'Completed' ? "completed" : "pending"} icon={CheckCircle2} />
         </div>
      </section>

      {/* 2.5 AGREEMENT ACTION ALERT (If any application is pending signature or signed) */}
      {loanApplications.some(app => ['Agreement Pending', 'Agreement Signed', 'Ready for Disbursement', 'AGREEMENT_PENDING', 'AGREEMENT_SIGNED', 'READY_FOR_DISBURSEMENT', 'AGREEMENT_PENDING_VERIFICATION', 'OTP_VERIFIED'].includes(app.status)) && (
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shrink-0">
                <FileText size={24} />
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-500 text-slate-950">
                  Action Required
                </span>
                <h3 className="text-lg font-black text-white tracking-tight pt-1">Digital Loan Agreement Pending</h3>
                <p className="text-xs text-white/60 font-medium">Please review, verify via secure email OTP, and digitally sign your loan agreement.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loanApplications.filter(app => ['Agreement Pending', 'AGREEMENT_PENDING', 'AGREEMENT_PENDING_VERIFICATION'].includes(app.status)).map(app => (
                <Button
                  key={app._id}
                  onClick={() => handleOpenSigningModal(app)}
                  className="px-6 py-3.5 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2 border-none font-black text-[10px] uppercase tracking-widest"
                >
                  <ShieldCheck size={16} /> Sign Agreement Now
                </Button>
              ))}
              {loanApplications.filter(app => ['Agreement Signed', 'AGREEMENT_SIGNED', 'Ready for Disbursement', 'READY_FOR_DISBURSEMENT', 'OTP_VERIFIED'].includes(app.status)).map(app => (
                <Button
                  key={app._id}
                  onClick={() => handleDownloadAgreement(app)}
                  className="px-6 py-3.5 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center gap-2 border-none font-black text-[10px] uppercase tracking-widest"
                >
                  <Download size={16} /> Download Signed Agreement
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Loans" value={loading ? "..." : (data.activeLoans?.length || 0)} icon={Briefcase} color="navy" />
        <StatCard title="Remaining Balance" value={loading ? "..." : `R${(data.remainingBalance || 0).toLocaleString()}`} icon={Wallet} color="blue" />
        <StatCard title="Next EMI" value={loading ? "..." : (data.nextEmi ? `R${data.nextEmi.amount?.toLocaleString()}` : "R0")} icon={Calendar} color="accent" />
        <StatCard title="Total Penalties" value={loading ? "..." : `R${(data.totalPenalties || 0).toLocaleString()}`} icon={AlertCircle} color="rose" />
      </section>

      {/* 4. LOAN APPLICATIONS SECTION */}
      {(loading || loanApplications.length > 0) && (
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">My Loan Applications</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Submitted &amp; Pending Review</p>
              </div>
            </div>
            {!loading && (
              <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl">
                {loanApplications.length} {loanApplications.length === 1 ? 'Application' : 'Applications'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-16 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                    <th className="px-8 py-5">Application ID</th>
                    <th className="px-8 py-5">Requested Amount</th>
                    <th className="px-8 py-5">Duration</th>
                    <th className="px-8 py-5">Est. EMI</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Review Progress</th>
                    <th className="px-8 py-5">Submitted</th>
                    <th className="px-8 py-5 text-right">Agreement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loanApplications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="text-xs font-black text-primary">{app.applicationId}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-slate-900">R{Number(app.requestedAmount).toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-500">{app.requestedDuration} Months</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-black text-slate-700">
                          {app.estimatedMonthlyEMI ? `R${Math.round(app.estimatedMonthlyEMI).toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <ApplicationStatusBadge status={app.status} />
                      </td>
                      <td className="px-8 py-5">
                        <BorrowerReviewStatus reviewStatus={app.reviewStatus} reviewInfo={app.reviewInfo} />
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[11px] font-bold text-slate-400">
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {['Agreement Pending', 'AGREEMENT_PENDING', 'AGREEMENT_PENDING_VERIFICATION'].includes(app.status) ? (
                          <button
                            onClick={() => handleOpenSigningModal(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                          >
                            <ShieldCheck size={12} /> Sign
                          </button>
                        ) : ['Agreement Signed', 'AGREEMENT_SIGNED', 'Ready for Disbursement', 'READY_FOR_DISBURSEMENT', 'OTP_VERIFIED'].includes(app.status) ? (
                          <button
                            onClick={() => handleDownloadAgreement(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                          >
                            <Download size={12} /> Get Copy
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* REVIEW FEEDBACK CARDS — shown when any application has been reviewed */}
      {!loading && loanApplications.some(a => a.reviewInfo) && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList size={16} />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Review Feedback</h3>
          </div>
          <div className="space-y-3">
            {loanApplications.filter(a => a.reviewInfo).map(app => {
              const { outcome, title, message, reviewerDisplay, reviewedAt } = app.reviewInfo;
              const style = {
                success: {
                  card:  'bg-emerald-50 border-emerald-200',
                  icon:  'bg-emerald-500 text-white',
                  badge: 'bg-emerald-100 text-emerald-700',
                  title: 'text-emerald-800',
                  meta:  'text-emerald-600',
                  body:  'text-emerald-900',
                  Icon:  CheckCircle2,
                },
                error: {
                  card:  'bg-red-50 border-red-200',
                  icon:  'bg-red-500 text-white',
                  badge: 'bg-red-100 text-red-700',
                  title: 'text-red-800',
                  meta:  'text-red-500',
                  body:  'text-red-900',
                  Icon:  AlertCircle,
                },
                warning: {
                  card:  'bg-amber-50 border-amber-200',
                  icon:  'bg-amber-500 text-white',
                  badge: 'bg-amber-100 text-amber-700',
                  title: 'text-amber-800',
                  meta:  'text-amber-600',
                  body:  'text-amber-900',
                  Icon:  AlertCircle,
                },
              }[outcome] || {
                card:  'bg-blue-50 border-blue-200',
                icon:  'bg-blue-500 text-white',
                badge: 'bg-blue-100 text-blue-700',
                title: 'text-blue-800',
                meta:  'text-blue-600',
                body:  'text-blue-900',
                Icon:  ClipboardList,
              };

              return (
                <div key={app._id} className={cn('p-5 rounded-[2rem] border shadow-sm flex flex-col sm:flex-row sm:items-start gap-4', style.card)}>
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', style.icon)}>
                    <style.Icon size={20} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-primary">{app.applicationId}</span>
                      <span className={cn('px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest', style.badge)}>
                        {title}
                      </span>
                    </div>
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest', style.meta)}>
                      {reviewerDisplay} •{' '}
                      {new Date(reviewedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className={cn('text-sm font-medium leading-relaxed pt-0.5', style.body)}>
                      {message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: LOAN DETAILS & SCHEDULE */}
        <div className="lg:col-span-8 space-y-10">
           
           {loading ? (
             <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
             </div>
           ) : !activeLoan ? (
             <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                   <Briefcase size={40} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Loans Found</p>
                <p className="text-xs text-slate-400">Apply for a loan to get started.</p>
             </div>
           ) : (
             <>
               {/* ACTIVE LOAN SUMMARY */}
               <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                           <Briefcase size={24} />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-slate-900 tracking-tight">{activeLoan.loanType}</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeLoan.loanCode}</p>
                        </div>
                     </div>
                     <StatusBadge status={activeLoan.loanStatus} />
                  </div>
                  <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                     <InfoItem label="Approved Amount" value={`R${activeLoan.approvedAmount?.toLocaleString()}`} />
                     <InfoItem label="Remaining" value={`R${activeLoan.remainingBalance?.toLocaleString()}`} highlighted />
                     <InfoItem label="Interest Rate" value={`${activeLoan.interestRate}%`} />
                     <InfoItem label="Duration" value={`${activeLoan.loanDurationMonths} Months`} />
                     <div className="md:col-span-2">
                        {data.nextEmi ? (
                          <InfoItem 
                            label="Next EMI Date" 
                            value={format(new Date(data.nextEmi.dueDate), 'dd MMM yyyy')} 
                            subValue={`${Math.max(0, Math.ceil((new Date(data.nextEmi.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))} Days Remaining`} 
                          />
                        ) : (
                          <InfoItem label="Next EMI Date" value="None" />
                        )}
                     </div>
                     <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between items-end">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Progress</p>
                           <p className="text-sm font-black text-primary">{activeLoan.progress}%</p>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${activeLoan.progress}%` }}
                            className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(46,58,116,0.3)]"
                           />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
                           {emiSchedule.filter(s => s.status === 'Paid').length} of {emiSchedule.length} EMIs Paid
                        </p>
                     </div>
                  </div>
               </section>

               {/* EMI SCHEDULE TABLE */}
               <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                  <div className="p-8 border-b border-slate-50">
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">EMI Payment Schedule</h3>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                           <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                              <th className="px-8 py-5">#</th>
                              <th className="px-8 py-5">Due Date</th>
                              <th className="px-8 py-5">Amount</th>
                              <th className="px-8 py-5">Status</th>
                              <th className="px-8 py-5">Penalty</th>
                              <th className="px-8 py-5 text-right">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {emiSchedule.map((emi, i) => (
                              <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                 <td className="px-8 py-5 text-xs font-black text-slate-900">{emi.emiNumber}</td>
                                 <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(emi.dueDate).toLocaleDateString()}</td>
                                 <td className="px-8 py-5 text-xs font-black text-slate-900">R{emi.amount?.toLocaleString()}</td>
                                 <td className="px-8 py-5">
                                    <StatusBadge status={emi.status} />
                                 </td>
                                 <td className="px-8 py-5">
                                    <span className={cn(
                                       "text-[9px] font-black uppercase tracking-widest",
                                       emi.penaltyAmount > 0 ? "text-rose-500" : "text-slate-400"
                                    )}>
                                       {emi.penaltyAmount > 0 ? `R${emi.penaltyAmount} Applied` : 'No Penalty'}
                                    </span>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <button 
                                     onClick={() => handleEmiClick(emi)}
                                     className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                                    >
                                       <Eye size={16} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </section>
             </>
           )}
        </div>

        {/* RIGHT COLUMN: PENALTIES & ACTIVITY */}
        <div className="lg:col-span-4 space-y-10">
           
           {/* PENALTIES SUMMARY */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              <h3 className="text-md font-black text-slate-900 tracking-tight flex items-center gap-2 relative z-10">
                 <AlertCircle size={18} className="text-rose-500" /> Penalty Summary
              </h3>
              {data.totalPenalties > 0 ? (
                <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 space-y-4 relative z-10">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Total Late Fees</span>
                      <span className="text-sm font-black text-rose-600">R {data.totalPenalties?.toLocaleString()}</span>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500">Notice:</p>
                      <p className="text-[9px] font-medium text-slate-400 leading-relaxed italic">Penalties are applied to overdue installments. Please clear your dues to avoid further charges.</p>
                   </div>
                </div>
              ) : (
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-700 relative z-10">
                   <ShieldCheck size={20} />
                   <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No active penalties. Great job!</p>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-400 relative z-10">
                 <Info size={14} className="shrink-0" />
                 <p className="text-[10px] font-medium leading-relaxed italic">Timely payments maintain your financial score.</p>
              </div>
           </section>

           {/* RECENT ACTIVITIES */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
              <h3 className="text-md font-black text-slate-900 tracking-tight flex items-center gap-2">
                 <History size={18} className="text-primary" /> Loan Activities
              </h3>
              <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                 {activities.length > 0 ? activities.map((act) => (
                    <div key={act._id} className="relative pl-10 space-y-1">
                       <div className={cn(
                          "absolute left-0 top-0 w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm z-10",
                          act.type === 'Payment' ? 'text-emerald-500' : act.type === 'Penalty' ? 'text-rose-500' : 'text-primary'
                       )}>
                          {act.type === 'Payment' ? <CheckCircle2 size={14} /> : act.type === 'Penalty' ? <AlertCircle size={14} /> : <Activity size={14} />}
                       </div>
                       <p className="text-xs font-black text-slate-900">{act.title}</p>
                       <p className="text-[11px] font-medium text-slate-500">{act.message}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1">{format(new Date(act.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                 )) : (
                    <p className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activities yet</p>
                 )}
              </div>
           </section>

           {/* SUPPORT TIP */}
           <div className="p-6 bg-primary rounded-3xl text-white space-y-4 shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              <h4 className="text-sm font-black tracking-tight relative z-10">Need Assistance?</h4>
              <p className="text-xs font-medium text-white/70 leading-relaxed relative z-10">If you have any questions regarding your EMI schedule or penalties, please contact our support team.</p>
              <button className="relative z-10 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                 Contact Support
              </button>
           </div>
        </div>
      </div>

      {/* MODALS & DRAWERS */}
      <AnimatePresence>
         {/* EMI DETAILS DRAWER */}
         {isEmiDrawerOpen && (
            <>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEmiDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">EMI Details</h3>
                     <button onClick={() => setIsEmiDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10">
                     <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">EMI Number {selectedEmi?.emiNumber}</p>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">R {selectedEmi?.amount?.toLocaleString()}</h2>
                        <div className="flex items-center justify-center gap-2 mt-4">
                           <StatusBadge status={selectedEmi?.status} />
                        </div>
                     </div>
                     <div className="space-y-6">
                        <DrawerRow label="Due Date" value={format(new Date(selectedEmi?.dueDate), 'dd MMMM yyyy')} />
                        <DrawerRow label="Status" value={selectedEmi?.status} />
                        <DrawerRow label="Penalty Applied" value={selectedEmi?.penaltyAmount > 0 ? `R ${selectedEmi.penaltyAmount}` : "None"} color={selectedEmi?.penaltyAmount > 0 ? 'text-rose-500' : ''} />
                        <DrawerRow label="Last Payment" value={selectedEmi?.paidAt ? format(new Date(selectedEmi.paidAt), 'dd MMM yyyy') : "N/A"} />
                     </div>
                     <div className="pt-8 space-y-3">
                        <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => toast.error('Payment gateway coming soon')}>Make Payment</Button>
                        {selectedEmi?.status === 'Paid' && (
                           <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200">Download Receipt</Button>
                        )}
                     </div>
                  </div>
               </motion.div>
            </>
         )}

         {/* EMI SCHEDULE MODAL */}
         {isScheduleModalOpen && (
            <Modal isOpen onClose={() => setIsScheduleModalOpen(false)} title="Complete Repayment Schedule">
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Repayment</p>
                        <p className="text-sm font-black text-slate-900">R19,812.00</p>
                     </div>
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Interest</p>
                        <p className="text-sm font-black text-slate-900">R4,812.00</p>
                     </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                           <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-4 py-4">#</th>
                              <th className="px-4 py-4">Due Date</th>
                              <th className="px-4 py-4">EMI Amount</th>
                              <th className="px-4 py-4">Penalty</th>
                              <th className="px-4 py-4 text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {emiSchedule.map(emi => (
                              <tr key={emi._id}>
                                 <td className="px-4 py-4 text-[11px] font-bold text-slate-900">{emi.emiNumber}</td>
                                 <td className="px-4 py-4 text-[11px] font-medium text-slate-500">{format(new Date(emi.dueDate), 'dd-MM-yyyy')}</td>
                                 <td className="px-4 py-4 text-[11px] font-black text-slate-900">R {emi.amount?.toLocaleString()}</td>
                                 <td className="px-4 py-4 text-[11px] font-bold text-rose-500">{emi.penaltyAmount > 0 ? `R ${emi.penaltyAmount}` : '-'}</td>
                                 <td className="px-4 py-4 text-right">
                                    <span className={cn(
                                       "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                       emi.status === 'Paid' ? "bg-emerald-50 text-emerald-600" :
                                       emi.status === 'Overdue' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
                                    )}>
                                       {emi.status}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <Button className="w-full font-black uppercase text-[10px] py-4" onClick={() => setIsScheduleModalOpen(false)}>Close Schedule</Button>
               </div>
            </Modal>
         )}

         {/* EXPORT MODAL */}
         {isExportModalOpen && (
            <Modal isOpen onClose={() => setIsExportModalOpen(false)} title="Download Loan Statement">
               <div className="space-y-6">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Loan Account</label>
                     <div className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-900">
                        {activeLoan.loanType} ({activeLoan.loanCode})
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Export Format</label>
                     <div className="grid grid-cols-3 gap-3">
                        {['PDF', 'Excel', 'CSV'].map(f => (
                           <button 
                            key={f}
                            onClick={() => setExportFormat(f)}
                            className={cn(
                              "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                              exportFormat === f ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-slate-100 text-slate-400 hover:border-primary/20"
                            )}
                           >
                              {f}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setIsExportModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button className="flex-1 font-black uppercase text-[10px]" onClick={handleDownloadStatement}>Download Now</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* DIGITAL AGREEMENT SIGNING MODAL */}
         {isSigningModalOpen && selectedApp && (
           <Modal isOpen onClose={() => setIsSigningModalOpen(false)} title="Digital Loan Agreement signing" maxWidth="max-w-2xl">
             <div className="space-y-6 text-left">
               {/* Header Details */}
               <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                   <ShieldCheck size={22} />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature Consent</p>
                   <p className="text-sm font-bold text-slate-900">{selectedApp.fullName} — Application {selectedApp.applicationId}</p>
                 </div>
               </div>

               {/* Legal Terms Scroll Container */}
               <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] leading-relaxed text-slate-500 font-medium max-h-[160px] overflow-y-auto custom-scrollbar space-y-3">
                 <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Loan Agreement Terms &amp; Conditions</h4>
                 <p>By entering the secure One-Time Pin (OTP) sent to your registered email address, you hereby affix your digital signature and express full electronic consent to the following terms:</p>
                 <ol className="list-decimal pl-4 space-y-2">
                   <li><strong>Repayment Obligation:</strong> The Borrower agrees to repay the Principal Amount of <strong>R {Number(selectedApp.requestedAmount).toLocaleString()}</strong> in {selectedApp.requestedDuration} consecutive monthly installments of approximately <strong>R {Math.round(selectedApp.estimatedMonthlyEMI).toLocaleString()}</strong>.</li>
                   <li><strong>Interest and Fees:</strong> Interest is calculated at the rate of {selectedApp.interestRate || '12'}% per annum, subject to the credit profiles reviewed. A standard processing fee is incorporated in the repayments schedule.</li>
                   <li><strong>Late Fees:</strong> Any installment not paid by its designated due date will accumulate penalty fees as per South African Credit Act compliance.</li>
                   <li><strong>Electronic Signature Act:</strong> The Borrower acknowledges that this digital OTP signature constitutes a legally binding document equivalent to a handwritten physical signature.</li>
                 </ol>
               </div>

               {/* OTP Flow */}
               <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-5 relative overflow-hidden shadow-xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                 <div className="relative flex flex-col items-center text-center space-y-4">
                   {!otpSent ? (
                     <>
                       <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-primary">
                         <FileText size={22} />
                       </div>
                       <div className="space-y-1">
                         <p className="text-sm font-black tracking-tight">Request Signature Code</p>
                         <p className="text-[11px] text-white/50">A secure 6-digit OTP will be dispatched to <strong>{selectedApp.emailAddress}</strong>.</p>
                       </div>
                       <Button
                         onClick={handleSendOtp}
                         disabled={isSendingOtp}
                         className="px-8 py-3 bg-white text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-2 border-none rounded-xl font-black text-[10px] uppercase tracking-widest mt-2"
                       >
                         {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> : <ShieldCheck size={14} className="text-slate-900" />}
                         Send OTP Signature Code
                       </Button>
                     </>
                   ) : (
                     <>
                       <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                         <ShieldCheck size={22} />
                       </div>
                       <div className="space-y-1">
                         <p className="text-sm font-black tracking-tight">Enter Signature OTP Code</p>
                         <p className="text-[11px] text-white/50">Code sent successfully. Please check your inbox at {selectedApp.emailAddress}.</p>
                       </div>

                       {/* Large spaced OTP Input */}
                       <div className="w-full max-w-[200px] mt-2">
                         <input
                           type="text"
                           maxLength={6}
                           placeholder="••••••"
                           value={otpCode}
                           onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                           className="w-full text-center tracking-[1em] text-xl font-black bg-white/5 border border-white/10 rounded-xl py-3 focus:outline-none focus:border-white/30 text-white placeholder-white/20"
                         />
                       </div>

                       <div className="flex gap-3 w-full max-w-[320px] pt-3">
                         <Button
                           onClick={handleVerifyOtp}
                           disabled={isVerifyingOtp || otpCode.length !== 6}
                           className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 border-none rounded-xl font-black text-[10px] uppercase tracking-widest"
                         >
                           {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign Agreement'}
                         </Button>
                         
                         <Button
                           variant="secondary"
                           onClick={handleSendOtp}
                           disabled={otpCooldown > 0 || isSendingOtp}
                           className="flex-1 py-3.5 bg-white/5 text-white hover:bg-white/10 border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest"
                         >
                           {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                         </Button>
                       </div>
                     </>
                   )}
                 </div>
               </div>

               {/* Close Button */}
               <div className="flex justify-end pt-2 border-t border-slate-50">
                 <Button variant="ghost" onClick={() => setIsSigningModalOpen(false)} className="px-6 py-3 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
               </div>
             </div>
           </Modal>
         )}
      </AnimatePresence>
       {/* High-Fidelity Agreement PDF Preview & Download Modal */}
       <AgreementPreviewModal
         isOpen={isAgreementPreviewOpen}
         onClose={() => setIsAgreementPreviewOpen(false)}
         app={selectedApp}
         agreementDetails={{}}
       />
    </div>
  );
};

// --- SUB-COMPONENTS ---

const WorkflowStep = ({ label, status, icon: Icon }) => (
   <div className="flex flex-col items-center gap-3">
      <div className={cn(
         "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm",
         status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
         status === 'active' ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 animate-pulse" :
         "bg-white border-slate-200 text-slate-300"
      )}>
         <Icon size={20} />
      </div>
      <span className={cn(
         "text-[9px] font-black uppercase tracking-widest text-center",
         status === 'pending' ? "text-slate-400" : "text-slate-900"
      )}>{label}</span>
   </div>
);

const WorkflowArrow = ({ active }) => (
   <div className="hidden md:flex flex-1 h-[2px] bg-slate-100 mx-2 relative -mt-6">
      {active && (
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            className="h-full bg-emerald-500"
         />
      )}
   </div>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium group hover:border-primary transition-all cursor-default">
      <div className="flex items-center justify-between mb-4">
         <div className={cn(
            "p-3 rounded-2xl transition-all group-hover:scale-110",
            color === 'navy' ? "bg-primary/5 text-primary" :
            color === 'blue' ? "bg-blue-50 text-blue-600" :
            color === 'rose' ? "bg-rose-50 text-rose-600" :
            "bg-primary/5 text-primary"
         )}>
            <Icon size={20} />
         </div>
         <ArrowRight size={16} className="text-slate-200 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
   </div>
);

const InfoItem = ({ label, value, subValue, highlighted }) => (
   <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={cn("text-lg font-black", highlighted ? "text-primary" : "text-slate-900")}>{value}</p>
      {subValue && <p className="text-[9px] font-bold text-emerald-500">{subValue}</p>}
   </div>
);

const DrawerRow = ({ label, value, color }) => (
   <div className="flex items-center justify-between group">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
      <span className={cn("text-sm font-black text-slate-900", color)}>{value}</span>
   </div>
);

const APPLICATION_STATUS_STYLES = {
  'Submitted':           'bg-blue-50 text-blue-600',
  'New':                 'bg-blue-50 text-blue-600',
  'Pending Review':      'bg-amber-50 text-amber-600',
  'Under Review':        'bg-amber-50 text-amber-600',
  'Reviewed':            'bg-violet-50 text-violet-600',
  'Recommended':         'bg-violet-50 text-violet-600',
  'Pending Verification':'bg-orange-50 text-orange-600',
  'Approved':            'bg-emerald-50 text-emerald-600',
  'Disbursed':           'bg-emerald-50 text-emerald-600',
  'Rejected':            'bg-red-50 text-red-500',
  'Hold':                'bg-orange-50 text-orange-600',
  'Agreement Pending':   'bg-amber-50 text-amber-600',
  'Agreement Signed':    'bg-teal-50 text-teal-600',
  'Ready for Disbursement': 'bg-indigo-50 text-indigo-600',
  'AGREEMENT_PENDING':   'bg-amber-50 text-amber-600',
  'AGREEMENT_SIGNED':    'bg-teal-50 text-teal-600',
  'READY_FOR_DISBURSEMENT': 'bg-indigo-50 text-indigo-600',
  'AGREEMENT_PENDING_VERIFICATION': 'bg-amber-50 text-amber-600',
  'WAITING BORROWER OTP VERIFICATION': 'bg-amber-50 text-amber-600',
  'OTP_VERIFIED':        'bg-teal-50 text-teal-600',
};

const BORROWER_REVIEW_STATUS_MAP = {
  'Pending':                    { label: 'Awaiting Assignment',       className: 'bg-slate-50 text-slate-400' },
  'Pending Review':             { label: 'Under Review',              className: 'bg-amber-50 text-amber-600' },
  'Under Review':               { label: 'Under Review',              className: 'bg-amber-50 text-amber-600' },
  'Recommendation Submitted':   { label: 'Review Completed',          className: 'bg-emerald-50 text-emerald-600' },
  'Rejected Recommendation':    { label: 'Under Final Assessment',    className: 'bg-violet-50 text-violet-600' },
  'Pending Verification':       { label: 'Verification Required',     className: 'bg-orange-50 text-orange-600' },
};

const BorrowerReviewStatus = ({ reviewStatus, reviewInfo }) => {
  if (reviewInfo?.reviewCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
        <CheckCircle2 size={10} /> Review Completed
      </span>
    );
  }
  const cfg = BORROWER_REVIEW_STATUS_MAP[reviewStatus];
  if (!cfg) return <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">—</span>;
  return (
    <span className={cn('inline-flex px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest', cfg.className)}>
      {cfg.label}
    </span>
  );
};

const ApplicationStatusBadge = ({ status }) => {
  const displayStatus = status === 'AGREEMENT_PENDING_VERIFICATION' ? 'WAITING BORROWER OTP VERIFICATION' : status;
  return (
    <span className={cn(
      'px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest',
      APPLICATION_STATUS_STYLES[status] || APPLICATION_STATUS_STYLES[displayStatus] || 'bg-slate-50 text-slate-500'
    )}>
      {displayStatus}
    </span>
  );
};

const ExportFormatOption = ({ label, active }) => (
   <button className={cn(
      "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
      active ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-slate-100 text-slate-400 hover:border-primary/20"
   )}>
      {label}
   </button>
);

export default MyLoans;
