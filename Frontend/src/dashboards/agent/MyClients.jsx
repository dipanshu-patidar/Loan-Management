import React, { useState } from 'react';
import { 
  Users, Briefcase, Clock, AlertCircle, 
  Search, Filter, RefreshCw, Eye, 
  ChevronRight, ArrowDownRight, ArrowRight,
  CheckCircle2, MessageSquare, Bell, 
  DollarSign, PieChart, Activity, User,
  Phone, X, MapPin, Building2, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';

const MyClients = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [isAssistModalOpen, setIsAssistModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const borrowers = [
    { 
      id: 'BRW-001', 
      name: 'Michael Chen', 
      phone: '+27 71 222 3333',
      loanAmount: 'R12,500', 
      emiStatus: 'Paid', 
      dueAmount: 'R0',
      dueDate: '2026-05-15', 
      status: 'Active',
      loanType: 'Personal Loan',
      paidAmount: 'R4,500',
      balance: 'R8,000'
    },
    { 
      id: 'BRW-002', 
      name: 'Sarah Williams', 
      phone: '+27 82 444 5555',
      loanAmount: 'R8,000', 
      emiStatus: 'Pending', 
      dueAmount: 'R1,200',
      dueDate: '2026-05-10', 
      status: 'Active',
      loanType: 'Emergency Loan',
      paidAmount: 'R2,000',
      balance: 'R6,000'
    },
    { 
      id: 'BRW-003', 
      name: 'David Gumede', 
      phone: '+27 61 777 8888',
      loanAmount: 'R5,000', 
      emiStatus: 'Overdue', 
      dueAmount: 'R850',
      dueDate: '2026-05-01', 
      status: 'Overdue',
      loanType: 'Personal Loan',
      paidAmount: 'R1,500',
      balance: 'R3,500'
    },
    { 
      id: 'BRW-004', 
      name: 'Linda Mbeki', 
      phone: '+27 73 999 0000',
      loanAmount: 'R20,000', 
      emiStatus: 'Pending', 
      dueAmount: 'R2,500',
      dueDate: '2026-05-12', 
      status: 'Active',
      loanType: 'Business Loan',
      paidAmount: 'R0',
      balance: 'R20,000'
    },
  ];

  const handleOpenDrawer = (borrower) => {
    setSelectedBorrower(borrower);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Clients</h1>
          <p className="text-slate-500 font-medium mt-1">Manage assigned borrowers, track loan status, and handle payment follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white">
            <RefreshCw size={18} /> Refresh Clients
          </Button>
          <Button className="flex items-center gap-2 font-bold shadow-lg shadow-primary/20">
            <Filter size={18} /> Filter Borrowers
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Assigned Borrowers" value="42" icon={Users} color="navy" />
        <StatCard title="Active Loans" value="38" icon={Briefcase} color="blue" />
        <StatCard title="Due Payments" value="12" icon={Clock} color="accent" />
        <StatCard title="Overdue Borrowers" value="05" icon={AlertCircle} color="rose" />
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
        <select className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]">
          <option>All Statuses</option>
          <option>Active</option>
          <option>Overdue</option>
          <option>Completed</option>
        </select>
        <select className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]">
          <option>Due Payments</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
        </select>
      </div>

      {/* 5. CLIENTS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
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
              {borrowers.map((borrower, i) => (
                <motion.tr 
                  key={borrower.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase">
                        {borrower.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">{borrower.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{borrower.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">{borrower.loanAmount}</p>
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{borrower.loanType}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <EMIStatusBadge status={borrower.emiStatus} />
                  </td>
                  <td className="px-8 py-5">
                    <p className={cn("text-sm font-black", borrower.dueAmount !== 'R0' ? "text-rose-500" : "text-slate-400")}>
                      {borrower.dueAmount}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">{borrower.dueDate}</td>
                  <td className="px-8 py-5">
                    <StatusBadge status={borrower.status} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleOpenDrawer(borrower)}
                      className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedBorrower?.id}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* BORROWER INFO */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <User size={14} className="text-primary" /> Contact Information
                  </h4>
                  <div className="grid grid-cols-1 gap-5">
                    <DrawerItem icon={User} label="Full Name" value={selectedBorrower?.name} />
                    <DrawerItem icon={Phone} label="Phone Number" value={selectedBorrower?.phone} />
                    <DrawerItem icon={MapPin} label="Address" value="Sandton, Johannesburg" />
                  </div>
                </section>

                {/* REPAYMENT SUMMARY */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <PieChart size={14} className="text-primary" /> Repayment Progress
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <SummaryCard label="Loan Amount" value={selectedBorrower?.loanAmount} color="navy" />
                    <SummaryCard label="Amount Paid" value={selectedBorrower?.paidAmount} color="emerald" />
                    <SummaryCard label="Remaining" value={selectedBorrower?.balance} color="accent" />
                    <SummaryCard label="Overdue" value={selectedBorrower?.dueAmount} color="rose" />
                  </div>
                </section>

                {/* RECENT ACTIVITY */}
                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                     <Activity size={14} className="text-primary" /> Recent Activity
                   </h4>
                   <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                      <ActivityTimeline icon={DollarSign} title="Payment Received" desc="R1,200 paid via EFT." time="2 days ago" color="emerald" />
                      <ActivityTimeline icon={Clock} title="Payment Follow-up" desc="Reminder sent via Chat." time="5 days ago" color="blue" />
                      <ActivityTimeline icon={CheckCircle2} title="EMI Completed" desc="April EMI successfully cleared." time="1 month ago" color="emerald" />
                   </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => setIsAssistModalOpen(true)}>
                   Assist Borrower
                </Button>
                <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200" onClick={() => setIsFollowUpModalOpen(true)}>
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
                 <p className="text-lg font-black text-slate-900">{selectedBorrower?.name}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Amount</p>
                 <p className="text-lg font-black text-rose-500">{selectedBorrower?.dueAmount}</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Category</label>
                 <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all">
                    <option>Loan Inquiry</option>
                    <option>Payment Assistance</option>
                    <option>EMI Clarification</option>
                    <option>Document Help</option>
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Notes</label>
                 <textarea placeholder="Enter details about the borrower's request..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
              </div>
           </div>

           <div className="flex gap-4 pt-4 border-t border-slate-50">
              <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsAssistModalOpen(false)}>Cancel</Button>
              <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => setIsAssistModalOpen(false)}>Save Assistance</Button>
           </div>
        </div>
      </Modal>

      {/* 💰 PAYMENT FOLLOW-UP MODAL */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Payment Follow-Up" maxWidth="max-w-xl">
        <div className="space-y-8">
           <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Overdue Follow-Up</p>
                 <p className="text-lg font-black text-rose-900">{selectedBorrower?.name}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Overdue Days</p>
                 <p className="text-lg font-black text-rose-900">8 Days</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-Up Action</label>
                 <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all">
                       <MessageSquare size={16} /> Send Chat
                    </button>
                    <button className="flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-500 hover:text-white transition-all">
                       <Bell size={16} /> Remind
                    </button>
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-Up Notes</label>
                 <textarea placeholder="What was the outcome of this follow-up?" className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[100px] focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
              </div>
           </div>

           <div className="flex gap-4 pt-4 border-t border-slate-50">
              <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</Button>
              <Button className="flex-1 font-bold shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600 border-none" onClick={() => setIsFollowUpModalOpen(false)}>Save Follow-Up</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const WorkflowStep = ({ icon: Icon, label, status }) => (
  <div className="flex flex-col items-center gap-3 relative">
    <div className={cn(
      "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm",
      status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
      status === 'active' ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" :
      "bg-white border-slate-100 text-slate-300"
    )}>
      <Icon size={20} />
    </div>
    <span className={cn(
      "text-[9px] font-black uppercase tracking-widest text-center max-w-[80px]",
      status === 'active' ? "text-primary" : "text-slate-400"
    )}>{label}</span>
  </div>
);

const WorkflowArrow = () => <div className="hidden md:block text-slate-100"><ArrowRight size={20} /></div>;

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
      <p className="text-sm font-black text-slate-900 truncate">{value}</p>
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
