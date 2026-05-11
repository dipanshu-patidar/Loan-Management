// Due Payments Module
import React, { useState } from 'react';
import { 
  BellRing, ClipboardCheck, Eye, Search, Filter, 
  MoreVertical, Download, Clock, AlertTriangle, 
  DollarSign, Activity, Users, ArrowRight, X, 
  Mail, MessageSquare, Phone, Calendar, CheckCircle2,
  Trash2, UserCheck, ShieldCheck, History, Wallet,
  CreditCard, Smartphone, FileText
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
const initialDues = [
  { 
    id: 'DUE-7701', borrower: 'Sipho Nkosi', phone: '+27 82 444 5555', loanId: 'P47-001', 
    emi: 4500, dueDate: '2024-05-08', lateDays: 0, totalDue: 4500, 
    reminder: 'Pending Reminder', status: 'Due Today' 
  },
  { 
    id: 'DUE-7702', borrower: 'Amara Okafor', phone: '+27 71 333 4444', loanId: 'P47-005', 
    emi: 12500, dueDate: '2024-05-01', lateDays: 7, totalDue: 12750, 
    reminder: 'Reminder Sent', status: 'Overdue' 
  },
  { 
    id: 'DUE-7703', borrower: 'Kgotso Motaung', phone: '+27 61 999 8888', loanId: 'P47-022', 
    emi: 7400, dueDate: '2024-04-15', lateDays: 23, totalDue: 8600, 
    reminder: 'Reminder Sent', status: 'Overdue' 
  },
  { 
    id: 'DUE-7704', borrower: 'Lindiwe Zulu', phone: '+27 72 111 2222', loanId: 'P47-018', 
    emi: 1100, dueDate: '2024-05-08', lateDays: 0, totalDue: 1100, 
    reminder: 'Pending Reminder', status: 'Due Today' 
  },
  { 
    id: 'DUE-7705', borrower: 'David van Wyk', phone: '+27 83 222 3333', loanId: 'P47-012', 
    emi: 2200, dueDate: '2024-05-08', lateDays: 0, totalDue: 2200, 
    reminder: 'Pending Reminder', status: 'Due Today' 
  },
];

const DuePayments = () => {
  const [dues] = useState(initialDues);
  const [activeModal, setActiveModal] = useState(null); // 'reminder', 'followup', 'bulk', 'export', 'delete'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedDue, setSelectedDue] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  const openModal = (type, due = null) => {
    setSelectedDue(due);
    setActiveModal(type);
    setOpenMenuId(null);
  };

  const openDrawer = (type, due) => {
    setSelectedDue(due);
    setActiveDrawer(type);
    setOpenMenuId(null);
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const tabs = [
    { id: 'All', label: 'All Dues', count: initialDues.length },
    { id: 'Today', label: 'Due Today', count: initialDues.filter(d => d.status === 'Due Today').length },
    { id: 'Overdue', label: 'Overdue', count: initialDues.filter(d => d.status === 'Overdue').length },
  ];

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Due Payments</h1>
          <p className="text-slate-500 font-medium mt-1">Track unpaid EMIs, overdue payments, and send borrower reminders.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export Due
           </Button>
           <Button onClick={() => openModal('bulk')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20 bg-primary">
             <BellRing size={18} /> Bulk Reminders
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Due Today" value="48" icon={Clock} color="blue" />
        <StatCard title="Overdue Payments" value="124" icon={AlertTriangle} color="rose" />
        <StatCard title="Total Due Amount" value="R 420K" icon={DollarSign} color="navy" />
        <StatCard title="Late EMI Accounts" value="86" icon={Users} color="navy" />
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
              <option>Due Status</option>
              <option>Due Today</option>
              <option>Overdue</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Overdue Days</option>
              <option>1-7 Days</option>
              <option>8-14 Days</option>
              <option>15+ Days</option>
           </select>
        </div>
      </section>

      {/* 5. DUE PAYMENTS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">EMI Amount</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Due Date</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Late Days</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Due</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Reminder</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {dues.map((due) => (
                    <tr key={due.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                {due.borrower.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{due.borrower}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{due.phone} • {due.loanId}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                          R {due.emi.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center text-xs font-bold text-slate-500 uppercase">
                          {due.dueDate}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={due.lateDays === 0 ? 'On Time' : due.lateDays <= 7 ? '1-7 Days Late' : '8+ Days Late'} />
                       </td>
                       <td className="px-6 py-5 text-right font-black text-primary text-sm">
                          R {due.totalDue.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={due.reminder} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={due.status} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', due)} tooltip="View Borrower" />
                             <TableAction icon={BellRing} color="text-primary hover:bg-primary/5" onClick={() => openModal('reminder', due)} tooltip="Send Reminder" />
                             <TableAction icon={ClipboardCheck} color="text-emerald-500 hover:bg-emerald-50" onClick={() => openModal('followup', due)} tooltip="Mark Follow-Up" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === due.id ? null : due.id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === due.id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === due.id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={Mail} 
                                            label="Email Statement" 
                                            onClick={() => openModal('reminder', due)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={Trash2} 
                                            label="Delete Task" 
                                            color="text-rose-600 hover:bg-rose-50"
                                            onClick={() => openModal('delete', due)} 
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

      {/* REMINDER MODAL */}
      <Modal isOpen={activeModal === 'reminder'} onClose={closeModal} title="Send Payment Reminder" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black">{selectedDue?.borrower.charAt(0)}</div>
               <div>
                  <p className="text-sm font-black text-slate-900">{selectedDue?.borrower}</p>
                  <p className="text-xs font-black text-primary">R {selectedDue?.totalDue.toLocaleString()} Due</p>
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choose Channel</p>
               <div className="grid grid-cols-1 gap-3">
                  <ChannelButton icon={Mail} label="Email Reminder" active />
               </div>
            </div>

            <Input label="Reminder Message" isTextArea defaultValue={`Dear ${selectedDue?.borrower}, your loan repayment of R ${selectedDue?.totalDue.toLocaleString()} is due today. Please ensure funds are available.`} />
            
            <Button onClick={closeModal} className="w-full py-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
               <BellRing size={18} /> Send Reminder
            </Button>
         </div>
      </Modal>

      {/* FOLLOW-UP MODAL */}
      <Modal isOpen={activeModal === 'followup'} onClose={closeModal} title="Mark Follow-Up" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <Input label="Follow-Up Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
               <Input label="Promise Date" type="date" />
            </div>
            <Input label="Follow-Up Notes" isTextArea placeholder="Enter details of the conversation..." />
            <Button onClick={closeModal} className="w-full py-4 shadow-lg shadow-primary/20">Save Follow-Up</Button>
         </div>
      </Modal>

      {/* BULK REMINDER MODAL */}
      <Modal isOpen={activeModal === 'bulk'} onClose={closeModal} title="Bulk Reminders" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Send automated reminders to all borrowers in selected categories.</p>
            <div className="space-y-3">
               <BulkOption label="Due Today Borrowers" count="48" icon={Clock} color="bg-blue-500" />
               <BulkOption label="Overdue Borrowers" count="124" icon={AlertTriangle} color="bg-rose-500" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-[2] shadow-lg shadow-primary/20">Send All Reminders</Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Due Payments" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose format for the due payments list export.</p>
            <div className="grid grid-cols-3 gap-3">
               <ExportCard label="PDF" icon={FileText} />
               <ExportCard label="CSV" icon={CreditCard} />
               <ExportCard label="Excel" icon={Activity} />
            </div>
            <Button className="w-full py-4 shadow-lg shadow-primary/20">Generate Report</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Task" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Discard Record?</h4>
               <p className="text-sm text-slate-500 mt-2">You are removing this due payment task. This will not affect the loan balance.</p>
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
         title="Borrower Due Summary"
         width="max-w-2xl"
      >
         {selectedDue && (
            <div className="space-y-10">
               {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                     {selectedDue.borrower.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-white tracking-tight">{selectedDue.borrower}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Loan ID: {selectedDue.loanId}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedDue.status} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xl font-black text-accent ml-2">Total Due: R {selectedDue.totalDue.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               {/* Due Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Wallet size={14} className="text-primary" /> Due Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryCard title="Current EMI Due" value={`R ${selectedDue.emi.toLocaleString()}`} color="text-slate-900" />
                     <SummaryCard title="Overdue Amount" value={`R ${(selectedDue.totalDue - selectedDue.emi).toLocaleString()}`} color="text-rose-500" />
                     <SummaryCard title="Paid EMIs" value="8 / 12" color="text-emerald-600" />
                     <SummaryCard title="Pending EMIs" value="4" color="text-blue-500" />
                  </div>
               </div>

               {/* Loan Association */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Activity size={14} className="text-accent" /> Active Loan Details
                  </h4>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                     <ReviewRow label="Loan Type" value="Personal Loan" />
                     <ReviewRow label="Approved Amount" value="R 50,000" />
                     <ReviewRow label="Remaining Balance" value="R 24,500" />
                     <ReviewRow label="Interest Rate" value="12%" />
                  </div>
               </div>

               {/* Recent Payments */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-slate-400" /> Recent EMI History
                  </h4>
                  <div className="space-y-4">
                     <PaymentItem date="15 Apr 2024" amount={`R ${selectedDue.emi.toLocaleString()}`} status="Paid" />
                     <PaymentItem date="15 Mar 2024" amount={`R ${selectedDue.emi.toLocaleString()}`} status="Paid" />
                     <PaymentItem date="15 Feb 2024" amount={`R ${selectedDue.emi.toLocaleString()}`} status="Late Paid" />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="ghost" className="flex-1" onClick={() => openModal('followup', selectedDue)}>Follow-Up Log</Button>
                  <Button onClick={() => openModal('reminder', selectedDue)} className="flex-1 shadow-lg shadow-primary/20">Send Reminder</Button>
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

const ChannelButton = ({ icon: Icon, label, active }) => (
   <button className={cn(
      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group",
      active ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 border-slate-100 hover:border-primary/20"
   )}>
      <Icon size={20} className={cn("mb-2", active ? "text-white" : "group-hover:text-primary")} />
      <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-white" : "group-hover:text-primary")}>{label}</span>
   </button>
);

const BulkOption = ({ label, count, icon: Icon, color }) => (
   <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-primary transition-all">
      <div className="flex items-center gap-4">
         <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", color)}>
            <Icon size={24} />
         </div>
         <div>
            <p className="text-sm font-black text-slate-900">{label}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {count} Borrowers</p>
         </div>
      </div>
      <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-primary">
         <div className="w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
   </div>
);

const ExportCard = ({ label, icon: Icon }) => (
  <button className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
     <Icon size={24} className="text-slate-400 group-hover:text-primary mb-3" />
     <span className="text-[10px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">{label}</span>
  </button>
);

export default DuePayments;
