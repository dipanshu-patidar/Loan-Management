import React, { useState } from 'react';
import { 
  CreditCard, BadgeCheck, Download, Eye, Search, 
  Filter, MoreVertical, XCircle, Clock, CheckCircle2,
  DollarSign, Activity, FileText, Smartphone, Banknote,
  Receipt, History, UserCheck, ShieldCheck, Mail,
  Printer, ArrowRight, X, Phone, Calendar, DownloadCloud,
  FileUp, Wallet, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

// --- Mock Data ---
const initialPayments = [
  { 
    id: 'TRX-8801', borrower: 'Lerato Molefe', phone: '+27 71 333 4444', loanId: 'P47-005', 
    amount: 4500, date: '2024-05-08', method: 'Bank Transfer', receipt: 'Uploaded', verification: 'Verified' 
  },
  { 
    id: 'TRX-8802', borrower: 'Sipho Nkosi', phone: '+27 82 444 5555', loanId: 'P47-001', 
    amount: 2200, date: '2024-05-08', method: 'EFT', receipt: 'Uploaded', verification: 'Pending' 
  },
  { 
    id: 'TRX-8803', borrower: 'David van Wyk', phone: '+27 83 222 3333', loanId: 'P47-012', 
    amount: 1500, date: '2024-05-07', method: 'Cash Deposit', receipt: 'Missing', verification: 'Rejected' 
  },
  { 
    id: 'TRX-8804', borrower: 'Amara Okafor', phone: '+27 72 111 2222', loanId: 'P47-009', 
    amount: 7500, date: '2024-05-07', method: 'Mobile Payment', receipt: 'Uploaded', verification: 'Verified' 
  },
  { 
    id: 'TRX-8805', borrower: 'Kgotso Motaung', phone: '+27 61 999 8888', loanId: 'P47-022', 
    amount: 3800, date: '2024-05-06', method: 'Bank Transfer', receipt: 'Uploaded', verification: 'Verified' 
  },
];

const PaymentHistory = () => {
  const [payments] = useState(initialPayments);
  const [activeModal, setActiveModal] = useState(null); // 'verify', 'receipt', 'export', 'delete'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  const openModal = (type, payment = null) => {
    setSelectedPayment(payment);
    setActiveModal(type);
    setOpenMenuId(null);
  };

  const openDrawer = (type, payment) => {
    setSelectedPayment(payment);
    setActiveDrawer(type);
    setOpenMenuId(null);
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const tabs = [
    { id: 'All', label: 'All Payments', count: initialPayments.length },
    { id: 'Pending', label: 'Pending', count: initialPayments.filter(p => p.verification === 'Pending').length },
    { id: 'Verified', label: 'Verified', count: initialPayments.filter(p => p.verification === 'Verified').length },
    { id: 'Rejected', label: 'Rejected', count: initialPayments.filter(p => p.verification === 'Rejected').length },
  ];

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment History</h1>
          <p className="text-slate-500 font-medium mt-1">Track borrower payments, receipts, and transaction verification.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export Payments
           </Button>
           <Button className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20 bg-primary">
             <ShieldCheck size={18} /> Verify Pending
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Payments" value="2,480" icon={CreditCard} color="navy" />
        <StatCard title="Verified Payments" value="2,120" icon={BadgeCheck} color="emerald" />
        <StatCard title="Pending Payments" value="42" icon={Clock} color="blue" />
        <StatCard title="Total Collections" value="R 8.4M" icon={Banknote} color="navy" />
      </section>

      {/* 3. TABS SECTION */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap relative",
              activeTab === tab.id 
                ? "border-primary text-primary bg-primary/5" 
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === tab.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </section>

      {/* 4. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search borrower by name, loan ID or transaction ID..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Payment Method</option>
              <option>Bank Transfer</option>
              <option>Cash Deposit</option>
              <option>EFT</option>
              <option>Mobile Payment</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Status</option>
              <option>Verified</option>
              <option>Pending</option>
              <option>Rejected</option>
           </select>
        </div>
      </section>

      {/* 5. PAYMENTS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan & ID</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount Paid</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Method</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Receipt</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {payments.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                {p.borrower.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{p.borrower}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{p.phone}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-900">{p.loanId}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{p.id}</p>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                          R {p.amount.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center text-xs font-bold text-slate-500 uppercase">
                          {p.date}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={p.method} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={p.receipt} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={p.verification} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', p)} tooltip="View Payment" />
                             <TableAction icon={BadgeCheck} color="text-emerald-500 hover:bg-emerald-50" onClick={() => openModal('verify', p)} tooltip="Verify Payment" />
                             <TableAction icon={Download} color="text-primary hover:bg-primary/5" onClick={() => openModal('receipt', p)} tooltip="Download Receipt" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === p.id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === p.id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={XCircle} 
                                            label="Reject Payment" 
                                            color="text-rose-600 hover:bg-rose-50"
                                            onClick={() => openModal('verify', p)} 
                                         />
                                         <DropdownItem 
                                            icon={Mail} 
                                            label="Email Receipt" 
                                            onClick={() => openModal('receipt', p)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={XCircle} 
                                            label="Delete Entry" 
                                            color="text-rose-600 hover:bg-rose-50"
                                            onClick={() => openModal('delete', p)} 
                                         />
                                      </motion.div>
                                   )}
                                </AnimatePresence>
                             </div>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </section>

      {/* --- MODALS & DRAWERS --- */}

      {/* VERIFICATION MODAL */}
      <Modal isOpen={activeModal === 'verify'} onClose={closeModal} title="Verify Payment" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-primary/5 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/10">
               <ShieldCheck size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Approve Transaction?</h4>
               <p className="text-sm text-slate-500 mt-2">Confirm that the payment of <span className="font-bold text-slate-900">R {selectedPayment?.amount.toLocaleString()}</span> has been cleared in the bank.</p>
            </div>
            
            {/* Receipt Preview Snippet */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
               <div className="aspect-[4/3] bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-6">
                  <Receipt size={32} className="mb-2 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-center">Receipt Preview Not Available</p>
               </div>
               <div className="text-left space-y-1">
                  <ReviewRow label="Borrower" value={selectedPayment?.borrower} />
                  <ReviewRow label="Ref ID" value={selectedPayment?.id} />
               </div>
            </div>

            <Input label="Verification Notes" isTextArea placeholder="Add internal notes (optional)..." />
            
            <div className="flex gap-3 pt-2">
               <Button variant="danger" onClick={closeModal} className="flex-1">Reject</Button>
               <Button onClick={closeModal} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none">Verify Payment</Button>
            </div>
         </div>
      </Modal>

      {/* RECEIPT MODAL */}
      <Modal isOpen={activeModal === 'receipt'} onClose={closeModal} title="Payment Receipt" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Download or share the official payment receipt for this transaction.</p>
            <div className="grid grid-cols-1 gap-3">
               <ReceiptOption label="Download PDF Receipt" icon={DownloadCloud} />
               <ReceiptOption label="Email to Borrower" icon={Mail} />
               <ReceiptOption label="Print Receipt" icon={Printer} />
            </div>
            <Button variant="ghost" onClick={closeModal} className="w-full">Close</Button>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Payment History" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose format for the transaction history export.</p>
            <div className="grid grid-cols-3 gap-3">
               <ExportCard label="PDF" icon={FileText} />
               <ExportCard label="CSV" icon={CreditCard} />
               <ExportCard label="Excel" icon={Activity} />
            </div>
            <Button className="w-full py-4 shadow-lg shadow-primary/20">Generate Report</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Payment Record" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Delete Transaction?</h4>
               <p className="text-sm text-slate-500 mt-2">You are deleting the record for <span className="font-bold text-slate-900">{selectedPayment?.id}</span>. This will affect collection totals.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
               <Checkbox label="I understand this is irreversible" />
               <Checkbox label="Transaction was created in error" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 shadow-lg shadow-rose-200">Confirm Delete</Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Transaction Details"
         width="max-w-2xl"
      >
         {selectedPayment && (
            <div className="space-y-10">
               {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                     {selectedPayment.borrower.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-white tracking-tight">{selectedPayment.borrower}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction: {selectedPayment.id}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedPayment.verification} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xl font-black text-accent ml-2">Amount: R {selectedPayment.amount.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               {/* Payment Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Wallet size={14} className="text-primary" /> Payment Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryCard title="Paid Amount" value={`R ${selectedPayment.amount.toLocaleString()}`} color="text-emerald-600" />
                     <SummaryCard title="Payment Method" value={selectedPayment.method} color="text-primary" />
                     <SummaryCard title="Remaining Balance" value="R 24,500" color="text-slate-900" />
                     <SummaryCard title="Collection Status" value="On Track" color="text-blue-500" />
                  </div>
               </div>

               {/* Receipt Preview */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Receipt size={14} className="text-accent" /> Digital Receipt
                  </h4>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                     <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group cursor-pointer hover:border-primary transition-all">
                        <FileUp size={32} className="mb-2 opacity-50 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-black uppercase tracking-widest">View Uploaded Receipt</p>
                     </div>
                     <div className="grid grid-cols-2 gap-8 pt-2">
                        <ReviewRow label="Upload Timestamp" value={`${selectedPayment.date} 14:20`} />
                        <ReviewRow label="Reference ID" value={selectedPayment.id} />
                     </div>
                  </div>
               </div>

               {/* Loan Association */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-slate-400" /> Associated Loan
                  </h4>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                     <ReviewRow label="Loan Account" value={selectedPayment.loanId} />
                     <ReviewRow label="Borrower Name" value={selectedPayment.borrower} />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="ghost" className="flex-1" onClick={() => openModal('receipt', selectedPayment)}>View Receipt</Button>
                  <Button onClick={() => openModal('verify', selectedPayment)} className="flex-1 shadow-lg shadow-primary/20">Verify Transaction</Button>
               </div>
            </div>
         )}
      </Drawer>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const TableAction = ({ icon: Icon, color, onClick, tooltip }) => (
  <button 
     onClick={onClick}
     className={cn("p-2 rounded-xl transition-all", color)}
     title={tooltip}
  >
     <Icon size={18} />
  </button>
);

const DropdownItem = ({ icon: Icon, label, onClick, color }) => (
   <button 
      onClick={(e) => {
         e.stopPropagation();
         onClick();
      }}
      className={cn(
         "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
         color || "text-slate-600 hover:bg-slate-50 hover:text-primary"
      )}
   >
      <Icon size={16} />
      {label}
   </button>
);

const ReviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-1">
     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-black text-slate-900">{value}</span>
  </div>
);

const SummaryCard = ({ title, value, color }) => (
   <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center group hover:border-primary transition-all">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className={cn("text-lg font-black", color)}>{value}</p>
   </div>
);

const ReceiptOption = ({ label, icon: Icon }) => (
   <button className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-primary hover:bg-primary/5 transition-all">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
            <Icon size={18} />
         </div>
         <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{label}</span>
      </div>
      <ArrowRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
   </button>
);

const ExportCard = ({ label, icon: Icon }) => (
  <button className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
     <Icon size={24} className="text-slate-400 group-hover:text-primary mb-3" />
     <span className="text-[10px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">{label}</span>
  </button>
);

const Checkbox = ({ label }) => (
  <label className="flex items-center gap-3 group cursor-pointer">
    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center transition-all group-hover:border-primary">
      <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </label>
);


export default PaymentHistory;
