import React, { useState } from 'react';
import { 
  Clock, FileText, User, Search, Filter, 
  Eye, FileCheck, ChevronRight, Download,
  Calendar, DollarSign, RefreshCw, ArrowRight,
  CheckCircle2, AlertCircle, X, ShieldCheck,
  Building2, PieChart, MapPin, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import Modal from '../../ui/Modal';

const LoanRequests = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isVerifyDocsModalOpen, setIsVerifyDocsModalOpen] = useState(false);

  const applications = [
    { 
      id: 'APP-001', 
      borrower: 'Alice Johnson', 
      phone: '+27 71 888 4444',
      type: 'Personal Loan', 
      amount: 'R5,000', 
      status: 'New', 
      docStatus: 'Complete',
      date: '2026-05-08',
      income: 'R45,000',
      expenses: 'R15,000',
      employment: 'Senior Engineer at TechCorp'
    },
    { 
      id: 'APP-002', 
      borrower: 'Bob Smith', 
      phone: '+27 82 555 1234',
      type: 'Emergency Loan', 
      amount: 'R2,500', 
      status: 'Pending Review', 
      docStatus: 'Pending',
      date: '2026-05-08',
      income: 'R28,000',
      expenses: 'R12,000',
      employment: 'Manager at Retail Inc'
    },
    { 
      id: 'APP-003', 
      borrower: 'Charlie Davis', 
      phone: '+27 61 222 9999',
      type: 'Business Loan', 
      amount: 'R15,000', 
      status: 'Pending Verification', 
      docStatus: 'Missing',
      date: '2026-05-07',
      income: 'R65,000',
      expenses: 'R35,000',
      employment: 'Owner at Davis Logistics'
    },
  ];

  const handleOpenDrawer = (app) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loan Requests</h1>
          <p className="text-slate-500 font-medium mt-1">Review incoming borrower applications, verify documents, and process loan requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white">
            <RefreshCw size={18} /> Refresh Requests
          </Button>
          <Button className="flex items-center gap-2 font-bold shadow-lg shadow-primary/20">
            <Filter size={18} /> Filter Applications
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="New Requests" value="12" icon={Plus} color="navy" />
        <StatCard title="Pending Reviews" value="08" icon={Clock} color="blue" />
        <StatCard title="Pending Doc Verification" value="05" icon={FileText} color="accent" />
        <StatCard title="Reviewed Today" value="14" icon={CheckCircle2} color="green" />
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
          <option>New</option>
          <option>Pending Review</option>
          <option>Pending Verification</option>
        </select>
        <select className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]">
          <option>All Loan Types</option>
          <option>Personal Loan</option>
          <option>Emergency Loan</option>
          <option>Business Loan</option>
        </select>
      </div>

      {/* 5. LOAN REQUESTS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                <th className="px-8 py-6 border-b border-slate-100">Loan Info</th>
                <th className="px-8 py-6 border-b border-slate-100">Docs Status</th>
                <th className="px-8 py-6 border-b border-slate-100">Status</th>
                <th className="px-8 py-6 border-b border-slate-100">Submitted</th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {applications.map((app, i) => (
                <motion.tr 
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase">
                        {app.borrower.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">{app.borrower}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{app.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">{app.amount}</p>
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{app.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <DocStatusBadge status={app.docStatus} />
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">{app.date}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenDrawer(app)}
                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => setIsVerifyDocsModalOpen(true)}
                        className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                      >
                        <ShieldCheck size={18} />
                      </button>
                      <button 
                        onClick={() => navigate(`/staff/loan-review/${app.id}`)}
                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                      >
                        <FileCheck size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👤 APPLICATION PREVIEW DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Application Preview</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedApp?.id}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* BORROWER INFO */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <User size={14} className="text-primary" /> Borrower Information
                  </h4>
                  <div className="grid grid-cols-1 gap-5">
                    <DrawerItem icon={User} label="Full Name" value={selectedApp?.borrower} />
                    <DrawerItem icon={Phone} label="Contact" value={selectedApp?.phone} />
                    <DrawerItem icon={Building2} label="Employment" value={selectedApp?.employment} />
                    <DrawerItem icon={MapPin} label="Residential Address" value="Sandton, Johannesburg" />
                  </div>
                </section>

                {/* AFFORDABILITY SUMMARY */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <PieChart size={14} className="text-primary" /> Affordability Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <AffordabilityCard label="Monthly Income" value={selectedApp?.income} color="emerald" />
                    <AffordabilityCard label="Monthly Expenses" value={selectedApp?.expenses} color="rose" />
                    <AffordabilityCard label="Estimated EMI" value="R485.50" color="navy" />
                    <AffordabilityCard label="Status" value="High Confidence" color="accent" />
                  </div>
                </section>

                {/* DOCUMENTS SECTION */}
                <section className="space-y-6 pb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <FileText size={14} className="text-primary" /> Uploaded Documents
                  </h4>
                  <div className="space-y-3">
                    <DocumentCard name="Identity Document (ID)" status="Verified" />
                    <DocumentCard name="Recent Payslip" status="Verified" />
                    <DocumentCard name="Bank Statement (3 Months)" status="Pending" />
                    <DocumentCard name="Proof of Address" status="Verified" />
                  </div>
                </section>
                
                {/* NOTES */}
                <section className="space-y-3">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Application Notes</h4>
                   <div className="p-5 bg-slate-50 rounded-2xl text-[11px] font-medium text-slate-600 leading-relaxed italic border border-slate-100">
                     "Borrower is applying for a personal loan to cover emergency medical expenses. Employment history is stable with the current employer for over 3 years."
                   </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => navigate(`/staff/loan-review/${selectedApp?.id}`)}>
                  Review Borrower
                </Button>
                <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200" onClick={() => setIsVerifyDocsModalOpen(true)}>
                  Verify Documents
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 📄 DOCUMENT VERIFICATION MODAL */}
      <Modal 
        isOpen={isVerifyDocsModalOpen} 
        onClose={() => setIsVerifyDocsModalOpen(false)} 
        title="Document Verification"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VerificationDocItem name="ID Document" date="Uploaded: 2026-05-08" />
            <VerificationDocItem name="Recent Payslip" date="Uploaded: 2026-05-08" />
            <VerificationDocItem name="Bank Statement" date="Uploaded: 2026-05-07" isHighlight />
            <VerificationDocItem name="Proof of Address" date="Uploaded: 2026-05-08" />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Notes</label>
              <textarea 
                placeholder="Enter notes about document authenticity or missing info..."
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[100px] focus:ring-2 focus:ring-primary/10 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsVerifyDocsModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => setIsVerifyDocsModalOpen(false)}>
              Save Verification
            </Button>
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
      "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm",
      status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
      status === 'active' ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" :
      "bg-white border-slate-100 text-slate-300"
    )}>
      <Icon size={24} />
      {status === 'completed' && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white">
          <Check size={12} strokeWidth={4} />
        </div>
      )}
    </div>
    <span className={cn(
      "text-[10px] font-black uppercase tracking-widest text-center",
      status === 'active' ? "text-primary" : "text-slate-400"
    )}>{label}</span>
  </div>
);

const WorkflowArrow = () => (
  <div className="hidden md:block text-slate-100">
    <ArrowRight size={24} />
  </div>
);

const DocStatusBadge = ({ status }) => (
  <div className={cn(
    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
    status === 'Complete' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
    status === 'Missing' ? "bg-rose-50 text-rose-600 border-rose-100" :
    "bg-amber-50 text-amber-600 border-amber-100"
  )}>
    <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Complete' ? "bg-emerald-500" : status === 'Missing' ? "bg-rose-500" : "bg-amber-500")} />
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

const AffordabilityCard = ({ label, value, color }) => (
  <div className={cn(
    "p-4 rounded-2xl border flex flex-col gap-1 transition-all hover:scale-105 cursor-default",
    color === 'emerald' ? "bg-emerald-50 border-emerald-100" :
    color === 'rose' ? "bg-rose-50 border-rose-100" :
    color === 'navy' ? "bg-slate-900 border-slate-800 text-white" :
    "bg-primary/5 border-primary/10"
  )}>
    <p className={cn("text-[8px] font-black uppercase tracking-widest", color === 'navy' ? "text-slate-500" : "text-slate-400")}>{label}</p>
    <p className={cn("text-xs font-black", color === 'navy' ? "text-white" : "text-slate-900")}>{value}</p>
  </div>
);

const DocumentCard = ({ name, status }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
        <FileText size={18} />
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-900 truncate max-w-[150px]">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={cn("w-1 h-1 rounded-full", status === 'Verified' ? "bg-emerald-500" : "bg-amber-500")} />
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{status}</p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1">
      <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Eye size={14} /></button>
      <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Download size={14} /></button>
    </div>
  </div>
);

const VerificationDocItem = ({ name, date, isHighlight }) => (
  <div className={cn(
    "p-5 rounded-2xl border-2 flex flex-col gap-4 group transition-all",
    isHighlight ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5" : "bg-white border-slate-50 hover:border-slate-100"
  )}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={18} />
        </div>
        <div>
          <p className="text-xs font-black text-slate-900">{name}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
        </div>
      </div>
      <button className="p-2 text-primary hover:bg-white rounded-lg transition-all"><Eye size={16} /></button>
    </div>
    
    <div className="grid grid-cols-3 gap-2">
      <button className="py-2 bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase rounded-lg hover:bg-emerald-500 hover:text-white transition-all">Approve</button>
      <button className="py-2 bg-rose-500/10 text-rose-600 text-[8px] font-black uppercase rounded-lg hover:bg-rose-500 hover:text-white transition-all">Reject</button>
      <button className="py-2 bg-slate-100 text-slate-400 text-[8px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all">Re-upload</button>
    </div>
  </div>
);

const Plus = ({ size, className }) => <FileText size={size} className={className} />;
const Check = ({ size, strokeWidth, className }) => <CheckCircle2 size={size} strokeWidth={strokeWidth} className={className} />;

export default LoanRequests;
