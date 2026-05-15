import React, { useState } from 'react';
import { 
  Briefcase, Clock, AlertCircle, 
  ChevronRight, ArrowRight, Download, Eye, 
  Calendar, FileText, CheckCircle2, History, 
  Wallet, TrendingUp, Info, Activity,
  X, Filter, PieChart, ShieldCheck, Loader2
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

const MyLoans = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [isEmiDrawerOpen, setIsEmiDrawerOpen] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  
  const [dashboardData, setDashboardData] = useState(null);
  const [emiSchedule, setEmiSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

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

      {/* 3. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Loans" value={loading ? "..." : (data.activeLoans?.length || 0)} icon={Briefcase} color="navy" />
        <StatCard title="Remaining Balance" value={loading ? "..." : `R${(data.remainingBalance || 0).toLocaleString()}`} icon={Wallet} color="blue" />
        <StatCard title="Next EMI" value={loading ? "..." : (data.nextEmi ? `R${data.nextEmi.amount?.toLocaleString()}` : "R0")} icon={Calendar} color="accent" />
        <StatCard title="Total Penalties" value={loading ? "..." : `R${(data.totalPenalties || 0).toLocaleString()}`} icon={AlertCircle} color="rose" />
      </section>

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
      </AnimatePresence>
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

const ExportFormatOption = ({ label, active }) => (
   <button className={cn(
      "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
      active ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-slate-100 text-slate-400 hover:border-primary/20"
   )}>
      {label}
   </button>
);

export default MyLoans;
