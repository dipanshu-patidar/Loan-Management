import React, { useState } from 'react';
import { 
  Wallet, CalendarDays, BadgeCheck, Trash2, Eye, 
  Search, Download, MoreVertical, Clock, CheckCircle2,
  AlertTriangle, DollarSign, ArrowRight, X, Calendar,
  Activity, ArrowUpRight, ArrowDownRight, History,
  ShieldCheck, Phone, Mail, UserCheck, CreditCard, FileUp
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
const initialLoans = [
  { 
    id: 'LN-2041', borrower: 'Sipho Nkosi', loanId: 'P47-001', type: 'Personal Loan', 
    amount: 50000, emi: 4500, balance: 32000, nextDue: '2024-05-15', 
    overdue: 'On Time', penalties: 0, status: 'Active' 
  },
  { 
    id: 'LN-2042', borrower: 'Amara Okafor', loanId: 'P47-005', type: 'Business Loan', 
    amount: 150000, emi: 12500, balance: 142000, nextDue: '2024-05-10', 
    overdue: '1-7 Days Late', penalties: 250, status: 'Overdue' 
  },
  { 
    id: 'LN-2043', borrower: 'David van Wyk', loanId: 'P47-012', type: 'SME Loan', 
    amount: 25000, emi: 2200, balance: 0, nextDue: '-', 
    overdue: 'On Time', penalties: 0, status: 'Completed' 
  },
  { 
    id: 'LN-2044', borrower: 'Lindiwe Zulu', loanId: 'P47-018', type: 'Personal Loan', 
    amount: 12000, emi: 1100, balance: 8400, nextDue: '2024-05-18', 
    overdue: 'On Time', penalties: 0, status: 'Active' 
  },
  { 
    id: 'LN-2045', borrower: 'Kgotso Motaung', loanId: 'P47-022', type: 'Vehicle Loan', 
    amount: 85000, emi: 7400, balance: 42000, nextDue: '2024-05-05', 
    overdue: '8+ Days Late', penalties: 1200, status: 'Overdue' 
  },
];

const ActiveLoans = () => {
  const [loans] = useState(initialLoans);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Active', 'Overdue', 'Completed'
  const [activeModal, setActiveModal] = useState(null); // 'schedule', 'complete', 'export', 'delete', 'penalty'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const openModal = (type, loan = null) => {
    setSelectedLoan(loan);
    setActiveModal(type);
    setOpenMenuId(null);
  };

  const openDrawer = (type, loan) => {
    setSelectedLoan(loan);
    setActiveDrawer(type);
    setOpenMenuId(null);
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const tabs = [
    { id: 'All', label: 'All Loans', count: initialLoans.length },
    { id: 'Active', label: 'Active', count: initialLoans.filter(l => l.status === 'Active').length },
    { id: 'Overdue', label: 'Overdue', count: initialLoans.filter(l => l.status === 'Overdue').length },
    { id: 'Completed', label: 'Completed', count: initialLoans.filter(l => l.status === 'Completed').length },
  ];

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Loans</h1>
          <p className="text-slate-500 font-medium mt-1">Manage approved running loans, repayment schedules, and overdue payments.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20 bg-primary">
             <Calendar size={18} /> View Due Payments
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Active Loans" value="1,890" icon={Wallet} color="navy" />
        <StatCard title="Outstanding Balance" value="R 4.2M" icon={DollarSign} color="blue" />
        <StatCard title="Overdue Loans" value="42" icon={AlertTriangle} color="rose" />
        <StatCard title="Completed This Month" value="86" icon={BadgeCheck} color="emerald" />
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
              placeholder="Search borrower by name or loan ID..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Loan Status</option>
              <option>Active</option>
              <option>Overdue</option>
              <option>Completed</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Overdue Loans</option>
              <option>On Time</option>
              <option>Late</option>
           </select>
        </div>
      </section>

      {/* 5. ACTIVE LOANS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Loan Amount</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">EMI Amount</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Next Due</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Overdue</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Penalties</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loans.map((loan) => (
                    <tr key={loan.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                {loan.borrower.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{loan.borrower}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{loan.loanId} • {loan.type}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                          R {loan.amount.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-right font-black text-primary text-sm">
                          R {loan.emi.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                          R {loan.balance.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <p className="text-xs font-bold text-slate-600">{loan.nextDue}</p>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={loan.overdue} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={loan.penalties > 0 ? 'Late Fee Applied' : 'No Penalty'} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={loan.status} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', loan)} tooltip="View Loan" />
                             <TableAction icon={CalendarDays} color="text-primary hover:bg-primary/5" onClick={() => openModal('schedule', loan)} tooltip="Repayment Schedule" />
                             <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', loan)} tooltip="Delete Loan" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === loan.id ? null : loan.id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === loan.id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === loan.id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={BadgeCheck} 
                                            label="Mark Completed" 
                                            color="text-emerald-600 hover:bg-emerald-50"
                                            onClick={() => openModal('complete', loan)} 
                                         />
                                         <DropdownItem 
                                            icon={AlertTriangle} 
                                            label="Add Penalty" 
                                            onClick={() => openModal('penalty', loan)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={Download} 
                                            label="Export Statement" 
                                            onClick={() => openModal('export', loan)} 
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

      {/* REPAYMENT SCHEDULE MODAL */}
      <Modal isOpen={activeModal === 'schedule'} onClose={closeModal} title="Repayment Schedule" maxWidth="max-w-2xl">
         <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">{selectedLoan?.borrower.charAt(0)}</div>
                  <div>
                     <p className="text-sm font-black text-slate-900">{selectedLoan?.borrower}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedLoan?.loanId} • R {selectedLoan?.amount.toLocaleString()}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xs font-black text-slate-900">EMI Amount</p>
                  <p className="text-lg font-black text-primary">R {selectedLoan?.emi.toLocaleString()}</p>
               </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                     <tr className="text-left">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">#</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Due Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {[1, 2, 3, 4, 5, 6].map(i => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-900">{i}</td>
                           <td className="px-6 py-4 text-xs font-bold text-slate-500">15 {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i-1]} 2024</td>
                           <td className="px-6 py-4 font-black text-slate-900">R {selectedLoan?.emi.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">
                              <StatusBadge status={i < 4 ? 'Paid' : i === 4 ? 'Overdue' : 'Pending'} />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <Button onClick={closeModal} className="w-full py-4 shadow-lg shadow-primary/20">Close Schedule</Button>
         </div>
      </Modal>

      {/* PENALTY MODAL */}
      <Modal isOpen={activeModal === 'penalty'} onClose={closeModal} title="Add Loan Penalty" maxWidth="max-w-xl">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">Apply a late payment penalty to the borrower's active loan.</p>
            
            {/* Loan Summary Card */}
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-4">
               <ReviewRow label="Borrower" value={selectedLoan?.borrower} />
               <ReviewRow label="Loan ID" value={selectedLoan?.loanId} />
               <ReviewRow label="EMI Amount" value={`R ${selectedLoan?.emi.toLocaleString()}`} />
               <ReviewRow label="Days Overdue" value={selectedLoan?.status === 'Overdue' ? '12 Days' : '0 Days'} />
               <ReviewRow label="Balance" value={`R ${selectedLoan?.balance.toLocaleString()}`} />
            </div>

            {/* Penalty Form */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Penalty Type</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold">
                     <option>Late Payment Fee</option>
                     <option>Overdue Penalty</option>
                     <option>Manual Adjustment</option>
                  </select>
               </div>
               <Input label="Penalty Amount" placeholder="R 0.00" />
               <Input label="Penalty Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notify Borrower</span>
                  <div className="w-10 h-5 bg-primary rounded-full p-1 cursor-pointer flex justify-end">
                     <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
               </div>
            </div>
            <Input label="Reason" isTextArea placeholder="Brief explanation for this penalty..." />

            {/* Penalty Preview */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
               <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Current Balance</span>
                  <span className="text-slate-900">R {selectedLoan?.balance.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Penalty Charge</span>
                  <span className="text-primary">+ R 250.00</span>
               </div>
               <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Updated Balance</span>
                  <span className="text-lg font-black text-primary">R {(selectedLoan?.balance || 0 + 250).toLocaleString()}</span>
               </div>
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-700">
               <AlertTriangle size={20} />
               <p className="text-[11px] font-bold uppercase">Penalty charges will increase the borrower's remaining loan balance.</p>
            </div>

            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 bg-primary shadow-lg shadow-primary/20">Apply Penalty</Button>
            </div>
         </div>
      </Modal>

      {/* COMPLETION MODAL */}
      <Modal isOpen={activeModal === 'complete'} onClose={closeModal} title="Mark Loan Completed" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
               <BadgeCheck size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Final Settlement?</h4>
               <p className="text-sm text-slate-500 mt-2">You are confirming full repayment for <span className="font-bold text-slate-900">{selectedLoan?.borrower}</span>. This will close the loan account.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 text-left">
               <ReviewRow label="Final Balance" value={`R ${selectedLoan?.balance.toLocaleString()}`} />
               <ReviewRow label="Settlement Date" value="Today" />
               <ReviewRow label="Completion Status" value="Debt Free" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none">Mark Completed</Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Active Loans" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose format for the active loan portfolio export.</p>
            <div className="grid grid-cols-3 gap-3">
               <ExportCard label="PDF" icon={FileUp} />
               <ExportCard label="CSV" icon={CreditCard} />
               <ExportCard label="Excel" icon={Activity} />
            </div>
            <Button className="w-full py-4 shadow-lg shadow-primary/20">Download Report</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Loan Record" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Remove Loan Record?</h4>
               <p className="text-sm text-slate-500 mt-2">You are deleting <span className="font-bold text-slate-900">{selectedLoan?.loanId}</span>. This is for administrative cleanup only.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
               <Checkbox label="I understand this will remove historical EMI data" />
               <Checkbox label="This record is no longer needed for auditing" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 shadow-lg shadow-rose-200">Permanently Delete</Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Loan Details"
         width="max-w-2xl"
      >
         {selectedLoan && (
            <div className="space-y-10">
               {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                     {selectedLoan.borrower.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-white tracking-tight">{selectedLoan.borrower}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {selectedLoan.loanId} • {selectedLoan.type}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedLoan.status} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xl font-black text-accent ml-2">Balance: R {selectedLoan.balance.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               {/* Loan Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Activity size={14} className="text-primary" /> Loan Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryCard title="Total Paid" value={`R ${(selectedLoan.amount - selectedLoan.balance).toLocaleString()}`} color="text-emerald-600" />
                     <SummaryCard title="Remaining" value={`R ${selectedLoan.balance.toLocaleString()}`} color="text-rose-500" />
                     <SummaryCard title="Overdue Amount" value={selectedLoan.status === 'Overdue' ? `R ${selectedLoan.emi.toLocaleString()}` : 'R 0'} color="text-amber-500" />
                     <SummaryCard title="Total Penalties" value={`R ${selectedLoan.penalties.toLocaleString()}`} color="text-rose-600" />
                  </div>
               </div>

               {/* Repayment Progress */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <CheckCircle2 size={14} className="text-accent" /> Repayment Progress
                  </h4>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Collection Target</span>
                        <span className="text-lg font-black text-primary">64%</span>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[64%] shadow-inner" />
                     </div>
                     <div className="grid grid-cols-2 gap-8 pt-2">
                        <ReviewRow label="Installments Paid" value="8 / 12" />
                        <ReviewRow label="Next EMI Date" value={selectedLoan.nextDue} />
                     </div>
                  </div>
               </div>

               {/* Recent Payments */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-slate-400" /> Recent Repayments
                  </h4>
                  <div className="space-y-4">
                     <PaymentItem date="15 Apr 2024" amount={`R ${selectedLoan.emi.toLocaleString()}`} status="Paid" />
                     <PaymentItem date="15 Mar 2024" amount={`R ${selectedLoan.emi.toLocaleString()}`} status="Paid" />
                     <PaymentItem date="15 Feb 2024" amount={`R ${selectedLoan.emi.toLocaleString()}`} status="Late Paid" />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="ghost" className="flex-1" onClick={() => openModal('schedule', selectedLoan)}>Full Schedule</Button>
                  <Button onClick={() => openModal('complete', selectedLoan)} className="flex-1 shadow-lg shadow-primary/20">Settle Loan</Button>
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

const PaymentItem = ({ date, amount, status }) => (
   <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-primary transition-all">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><CreditCard size={18} /></div>
         <div>
            <p className="text-sm font-black text-slate-900">{amount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
         </div>
      </div>
      <StatusBadge status={status} className="text-[10px]" />
   </div>
);

const Checkbox = ({ label }) => (
  <label className="flex items-center gap-3 group cursor-pointer">
    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center transition-all group-hover:border-primary">
      <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </label>
);

const ExportCard = ({ label, icon: Icon }) => (
  <button className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
     <Icon size={24} className="text-slate-400 group-hover:text-primary mb-3" />
     <span className="text-[10px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">{label}</span>
  </button>
);


export default ActiveLoans;
