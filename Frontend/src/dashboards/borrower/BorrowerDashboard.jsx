import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FilePlus, Wallet, Briefcase, Clock, 
  CheckCircle2, AlertCircle, Calendar, 
  ArrowRight, Info, Eye, DollarSign, 
  TrendingUp, Bell, RefreshCw, X,
  ChevronRight, ArrowUpRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';

const BorrowerDashboard = () => {
  const navigate = useNavigate();
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  const activeLoan = {
    id: 'LN-2024-0082',
    type: 'Personal Loan',
    approvedAmount: 'R15,000',
    remainingBalance: 'R8,420',
    nextEmiDate: 'May 15, 2026',
    progress: 56,
    status: 'Active',
    tenure: '12 Months',
    interestRate: '12.5%'
  };

  const recentActivities = [
    { id: 1, type: 'Payment', title: 'EMI Repayment', desc: 'Payment of R1,250 verified.', time: '2 hours ago', status: 'verified' },
    { id: 2, type: 'Alert', title: 'System Reminder', desc: 'Next EMI due in 6 days.', time: '5 hours ago', status: 'reminder' },
    { id: 3, type: 'Update', title: 'Loan Approved', desc: 'Your top-up request was approved.', time: 'Yesterday', status: 'success' },
  ];

  const notifications = [
    { id: 1, msg: 'Your payment verification is complete.', type: 'update' },
    { id: 2, msg: 'Upload your latest bank statement.', type: 'document' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* 1. WELCOME SECTION */}
      <section className="relative bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-premium overflow-hidden group">
         {/* Decorative background element */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-all duration-700" />
         
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Activity size={12} /> Account Overview
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-2">Welcome Back, <span className="text-primary">John Doe</span></h1>
               <p className="text-slate-500 font-medium max-w-xl">You have one active loan and your next repayment is scheduled for next week. Keep up the good work!</p>
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
        <StatCard title="Active Loan" value="R15,000" icon={Briefcase} color="navy" />
        <StatCard title="Next EMI" value="R1,250" icon={Calendar} color="blue" />
        <StatCard title="Remaining" value="R8,420" icon={Wallet} color="accent" />
        <StatCard title="Loan Status" value="Active" icon={CheckCircle2} color="emerald" />
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
                       <h3 className="text-lg font-black text-slate-900 tracking-tight">{activeLoan.type}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{activeLoan.id}</p>
                    </div>
                 </div>
                 <StatusBadge status={activeLoan.status} />
              </div>
              
              <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="space-y-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Approved</p>
                       <p className="text-2xl font-black text-slate-900">{activeLoan.approvedAmount}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Rate</p>
                       <p className="text-lg font-black text-primary">{activeLoan.interestRate}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Balance</p>
                       <p className="text-2xl font-black text-slate-900">{activeLoan.remainingBalance}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next EMI Date</p>
                       <p className="text-lg font-black text-slate-700">{activeLoan.nextEmiDate}</p>
                    </div>
                 </div>

                 {/* REPAYMENT PROGRESS */}
                 <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-center space-y-6 shadow-inner">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Progress</span>
                       <span className="text-[11px] font-black text-primary bg-white px-2 py-0.5 rounded-lg border border-primary/10">{activeLoan.progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${activeLoan.progress}%` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                       />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       <span>Paid: R6,580</span>
                       <span>Goal: R15,000</span>
                    </div>
                 </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
                 <button 
                   onClick={() => setIsDetailsDrawerOpen(true)}
                   className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:gap-3 transition-all"
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
                       <span className="px-2 py-0.5 bg-amber-50 text-amber-500 rounded-md text-[8px] font-black uppercase">6 Days Left</span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mt-1">R1,250</h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">Due by May 15, 2026</p>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium flex items-center gap-6 group hover:border-primary/20 transition-all">
                 <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={28} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Repayment</p>
                    <h4 className="text-2xl font-black text-slate-900 mt-1">R1,250</h4>
                    <div className="flex items-center gap-1.5 text-emerald-500 mt-0.5">
                       <CheckCircle2 size={12} />
                       <p className="text-[11px] font-bold uppercase tracking-widest">Verified</p>
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
                  {notifications.length}
               </div>
             </div>
             <div className="space-y-4">
                {notifications.map(notif => (
                   <div key={notif.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 hover:border-primary/20 transition-all group">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                         <Bell size={14} />
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed flex-1">{notif.msg}</p>
                   </div>
                ))}
             </div>
           </section>

           {/* 📌 RECENT ACTIVITIES SECTION */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
             <div className="flex items-center justify-between">
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
               <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><RefreshCw size={18} /></button>
             </div>
             <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {recentActivities.map(activity => (
                   <div key={activity.id} className="flex gap-4 relative z-10 group">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm border-2 transition-transform group-hover:scale-110",
                        activity.status === 'verified' ? "bg-emerald-500 border-emerald-500 text-white" :
                        activity.status === 'reminder' ? "bg-amber-500 border-amber-500 text-white" :
                        "bg-primary border-primary text-white"
                      )}>
                        {activity.type === 'Payment' ? <DollarSign size={10} /> : <Info size={10} />}
                      </div>
                      <div className="min-w-0">
                         <h5 className="text-[11px] font-black text-slate-900 leading-none">{activity.title}</h5>
                         <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">{activity.desc}</p>
                         <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{activity.time}</p>
                      </div>
                   </div>
                ))}
             </div>
             <Button variant="secondary" className="w-full font-bold text-[10px] uppercase tracking-widest border-slate-100">
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contract No: {activeLoan.id}</p>
                </div>
                <button onClick={() => setIsDetailsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" /> Loan Summary
                   </h4>
                   <div className="grid grid-cols-1 gap-5">
                      <DetailRow label="Principal Amount" value={activeLoan.approvedAmount} />
                      <DetailRow label="Interest Rate" value={activeLoan.interestRate} />
                      <DetailRow label="Loan Tenure" value={activeLoan.tenure} />
                      <DetailRow label="Total Repayable" value="R16,500" />
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Clock size={14} className="text-primary" /> Repayment Status
                   </h4>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase">Paid installments</span>
                         <span className="text-sm font-black text-slate-900">07 / 12</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                         <div className="h-full w-[56%] bg-primary rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Paid So Far</p>
                            <p className="text-lg font-black text-emerald-500">R6,580</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Pending</p>
                            <p className="text-lg font-black text-rose-500">R8,420</p>
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
