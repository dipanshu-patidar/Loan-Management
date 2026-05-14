import React, { useState } from 'react';
import { 
  History, Download, Eye, FileText, 
  CheckCircle2, Clock, AlertCircle, 
  ArrowRight, Filter, Search, Calendar,
  Wallet, TrendingUp, X,
  Printer, Share2, ShieldCheck, Activity,
  ChevronRight, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';

const PaymentHistory = () => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isReceiptDrawerOpen, setIsReceiptDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const transactions = [
    { id: 'TXN-99821', loanId: 'L-74291', emi: 14, amount: 'R825.50', date: '2026-04-14', method: 'Bank Transfer', status: 'Verified' },
    { id: 'TXN-99712', loanId: 'L-74291', emi: 13, amount: 'R975.50', date: '2026-03-15', method: 'EFT', status: 'Verified' },
    { id: 'TXN-99605', loanId: 'L-74291', emi: 12, amount: 'R825.50', date: '2026-02-15', method: 'Mobile Payment', status: 'Verified' },
    { id: 'TXN-99550', loanId: 'L-74291', emi: 11, amount: 'R825.50', date: '2026-01-15', method: 'Cash Deposit', status: 'Completed' },
    { id: 'TXN-88391', loanId: 'L-74291', emi: 15, amount: 'R825.50', date: '2026-05-09', method: 'Bank Transfer', status: 'Pending Verification' },
  ];

  const handleViewReceipt = (txn) => {
    setSelectedTransaction(txn);
    setIsReceiptDrawerOpen(true);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment History</h1>
          <p className="text-slate-500 font-medium mt-1">View EMI payments, receipts, and repayment transaction records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button 
            variant="secondary" 
            onClick={() => setIsStatementModalOpen(true)}
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-6 border-slate-200 bg-white"
          >
            <FileText size={16} /> Download Statement
          </Button>
          <Button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-8 shadow-lg shadow-primary/20"
          >
            <Share2 size={16} /> Export History
          </Button>
        </div>
      </header>

      {/* 2. SIMPLE PAYMENT FLOW */}
      <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium">
         <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto gap-8 md:gap-4">
            <WorkflowStep label="EMI Paid" status="completed" icon={Wallet} />
            <WorkflowArrow active />
            <WorkflowStep label="Proof Verified" status="completed" icon={ShieldCheck} />
            <WorkflowArrow active />
            <WorkflowStep label="Confirmed" status="active" icon={CheckCircle2} />
            <WorkflowArrow />
            <WorkflowStep label="Receipt Generated" status="pending" icon={Printer} />
         </div>
      </section>

      {/* 3. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Paid EMIs" value="14" icon={History} color="navy" />
        <StatCard title="Total Paid Amount" value="R11,557" icon={Wallet} color="blue" />
        <StatCard title="Pending Verification" value="01" icon={Clock} color="accent" />
        <StatCard title="Last Payment Date" value="14 Apr 2026" icon={Calendar} color="green" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: HISTORY TABLE */}
        <div className="lg:col-span-8 space-y-8">
           <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">Transaction History</h3>
                 <div className="flex items-center gap-3">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                       <input type="text" placeholder="Search transactions..." className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-primary/20 w-48" />
                    </div>
                    <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all"><Filter size={16} /></button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                       <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          <th className="px-8 py-5">TXN ID</th>
                          <th className="px-8 py-5">Loan / EMI</th>
                          <th className="px-8 py-5">Amount</th>
                          <th className="px-8 py-5">Date</th>
                          <th className="px-8 py-5">Method</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {transactions.map((txn, i) => (
                          <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                             <td className="px-8 py-5 text-[10px] font-black text-slate-900">{txn.id}</td>
                             <td className="px-8 py-5">
                                <div className="space-y-0.5">
                                   <p className="text-[11px] font-black text-slate-900">{txn.loanId}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">EMI #{txn.emi}</p>
                                </div>
                             </td>
                             <td className="px-8 py-5 text-xs font-black text-slate-900">{txn.amount}</td>
                             <td className="px-8 py-5 text-xs font-bold text-slate-500">{txn.date}</td>
                             <td className="px-8 py-5">
                                <MethodBadge method={txn.method} />
                             </td>
                             <td className="px-8 py-5">
                                <span className={cn(
                                   "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                   txn.status === 'Verified' || txn.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                   txn.status === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                   "bg-amber-50 text-amber-600 border-amber-100"
                                )}>
                                   {txn.status}
                                </span>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                   <button 
                                    onClick={() => handleViewReceipt(txn)}
                                    className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-sm"
                                   >
                                      <Eye size={16} />
                                   </button>
                                   <button className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-sm">
                                      <Download size={16} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </section>
        </div>

        {/* RIGHT COLUMN: SUMMARY & ACTIVITY */}
        <div className="lg:col-span-4 space-y-10">
           {/* REPAYMENT SUMMARY SECTION */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <h3 className="text-md font-black text-slate-900 tracking-tight flex items-center gap-2">
                 <PieChart size={18} className="text-primary" /> Payment Summary
              </h3>
              <div className="space-y-4 relative z-10">
                 <SummaryCard label="Total Amount Paid" value="R11,557" color="text-emerald-500" />
                 <SummaryCard label="Completed EMIs" value="14 / 24" color="text-primary" />
                 <SummaryCard label="Outstanding Balance" value="R8,450" color="text-slate-900" />
                 <SummaryCard label="Penalties Paid" value="R150" color="text-rose-500" />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative z-10">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repayment Health</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Excellent</span>
                 </div>
                 <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                    <div className="h-full bg-emerald-500 w-[58%]" />
                 </div>
              </div>
           </section>

           {/* RECENT ACTIVITIES TIMELINE */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
              <h3 className="text-md font-black text-slate-900 tracking-tight flex items-center gap-2">
                 <Activity size={18} className="text-primary" /> Recent Activities
              </h3>
              <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                 <ActivityItem icon={CheckCircle2} title="Payment Verified" desc="TXN-99821 has been verified" time="2 hours ago" color="text-emerald-500" />
                 <ActivityItem icon={Clock} title="Proof Submitted" desc="Pending verification for TXN-88391" time="5 hours ago" color="text-amber-500" />
                 <ActivityItem icon={Printer} title="Receipt Generated" desc="Receipt for EMI #14 is ready" time="1 day ago" color="text-primary" />
                 <ActivityItem icon={Wallet} title="EMI Paid" desc="EMI #14 submitted for review" time="1 day ago" color="text-blue-500" />
              </div>
           </section>
        </div>
      </div>

      {/* MODALS & DRAWERS */}
      <AnimatePresence>
         {/* RECEIPT DRAWER */}
         {isReceiptDrawerOpen && (
            <>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReceiptDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Receipt</h3>
                     <button onClick={() => setIsReceiptDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                     <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary mx-auto shadow-sm border border-slate-100">
                           <ShieldCheck size={32} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Verified</p>
                           <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedTransaction?.amount}</h2>
                        </div>
                        <StatusBadge status={selectedTransaction?.status} />
                     </div>

                     <div className="space-y-6">
                        <ReceiptRow label="Borrower" value="John Doe" />
                        <ReceiptRow label="Transaction ID" value={selectedTransaction?.id} />
                        <ReceiptRow label="Loan Account" value={selectedTransaction?.loanId} />
                        <ReceiptRow label="EMI Number" value={`#${selectedTransaction?.emi}`} />
                        <ReceiptRow label="Payment Date" value={selectedTransaction?.date} />
                        <ReceiptRow label="Method" value={selectedTransaction?.method} />
                     </div>

                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploaded Proof</p>
                        <div className="aspect-video bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 group cursor-pointer hover:border-primary transition-all">
                           <Eye size={24} className="group-hover:scale-110 transition-transform" />
                           <p className="text-[9px] font-bold uppercase tracking-widest mt-2">Click to view proof</p>
                        </div>
                     </div>
                  </div>
                  <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                     <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20">
                        <Printer size={16} className="mr-2 inline" /> Print Receipt
                     </Button>
                     <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200">
                        <Download size={16} className="mr-2 inline" /> Download PDF
                     </Button>
                  </div>
               </motion.div>
            </>
         )}

         {/* EXPORT MODAL */}
         {isExportModalOpen && (
            <Modal isOpen onClose={() => setIsExportModalOpen(false)} title="Export Payment History">
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                        <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                        <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
                     <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none">
                        <option>All Statuses</option>
                        <option>Verified</option>
                        <option>Pending</option>
                     </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     <button className="py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest">PDF</button>
                     <button className="py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all">Excel</button>
                     <button className="py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all">CSV</button>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setIsExportModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => setIsExportModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Export Now</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* STATEMENT MODAL */}
         {isStatementModalOpen && (
            <Modal isOpen onClose={() => setIsStatementModalOpen(false)} title="Repayment Statement Summary">
               <div className="space-y-8">
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Repayment Amount</p>
                           <h2 className="text-3xl font-black tracking-tight mt-1">R19,812.00</h2>
                        </div>
                        <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest">Statement Active</div>
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">EMIs Paid</p>
                           <p className="text-lg font-black">14 / 24</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Outstanding</p>
                           <p className="text-lg font-black text-accent">R8,450.00</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                        <span>Penalties Paid</span>
                        <span className="text-rose-500">R150.00</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                        <span>Interest Paid</span>
                        <span className="text-primary">R2,812.00</span>
                     </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setIsStatementModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => setIsStatementModalOpen(false)} className="flex-1 font-black uppercase text-[10px] shadow-lg shadow-primary/20">Download PDF</Button>
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
            color === 'green' ? "bg-emerald-50 text-emerald-600" :
            "bg-primary/5 text-primary"
         )}>
            <Icon size={20} />
         </div>
         <ChevronRight size={16} className="text-slate-200 group-hover:text-primary transition-all" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
   </div>
);

const SummaryCard = ({ label, value, color }) => (
   <div className="flex items-center justify-between group">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
      <span className={cn("text-sm font-black", color)}>{value}</span>
   </div>
);

const ActivityItem = ({ icon: Icon, title, desc, time, color }) => (
   <div className="relative pl-10 space-y-1">
      <div className={cn(
         "absolute left-0 top-0 w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm z-10",
         color
      )}>
         <Icon size={14} />
      </div>
      <p className="text-xs font-black text-slate-900">{title}</p>
      <p className="text-[11px] font-medium text-slate-500">{desc}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1">{time}</p>
   </div>
);

const MethodBadge = ({ method }) => {
   const icons = {
      'Bank Transfer': Landmark,
      'EFT': CreditCard,
      'Mobile Payment': Activity,
      'Cash Deposit': Wallet
   };
   const Icon = icons[method] || Landmark;
   return (
      <div className="flex items-center gap-2">
         <div className="p-1 bg-slate-50 rounded text-slate-400"><Icon size={10} /></div>
         <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{method}</span>
      </div>
   );
};

const ReceiptRow = ({ label, value }) => (
   <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
   </div>
);

// PieChart and other missing icons
import { PieChart, Landmark } from 'lucide-react';

export default PaymentHistory;
