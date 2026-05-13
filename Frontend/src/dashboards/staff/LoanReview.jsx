import React, { useState } from 'react';
import { 
  Clock, FileText, User, Search, Filter, 
  Eye, FileCheck, ChevronRight, Download,
  Calendar, DollarSign, RefreshCw, ArrowRight,
  CheckCircle2, AlertCircle, X, ShieldCheck,
  Building2, PieChart, MapPin, Phone, MessageSquare,
  ThumbsUp, ThumbsDown, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import Modal from '../../ui/Modal';

const LoanReview = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isRequestDocsModalOpen, setIsRequestDocsModalOpen] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isInactive = currentUser.operationalStatus === 'Inactive';

  const reviews = [
    { 
      id: 'APP-001', 
      borrower: 'Alice Johnson', 
      phone: '+27 71 888 4444',
      type: 'Personal Loan', 
      amount: 'R5,000', 
      reviewStatus: 'Pending Review', 
      affordabilityStatus: 'Eligible',
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
      reviewStatus: 'Reviewed', 
      affordabilityStatus: 'Moderate',
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
      reviewStatus: 'Recommendation Submitted', 
      affordabilityStatus: 'Risky',
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loan Review</h1>
          <p className="text-slate-500 font-medium mt-1">Review borrower applications, assess affordability, and submit loan recommendations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white">
            <RefreshCw size={18} /> Refresh Reviews
          </Button>
          <Button className="flex items-center gap-2 font-bold shadow-lg shadow-primary/20">
            <Filter size={18} /> Filter Applications
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Applications Under Review" value="10" icon={Clock} color="navy" />
        <StatCard title="Recommendations Submitted" value="06" icon={Send} color="blue" />
        <StatCard title="Pending Decisions" value="04" icon={AlertCircle} color="accent" />
        <StatCard title="Reviews Completed Today" value="12" icon={CheckCircle2} color="green" />
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
          <option>All Review Statuses</option>
          <option>Pending Review</option>
          <option>Reviewed</option>
          <option>Recommendation Submitted</option>
        </select>
        <select className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]">
          <option>All Loan Types</option>
          <option>Personal Loan</option>
          <option>Emergency Loan</option>
          <option>Business Loan</option>
        </select>
      </div>

      {/* 5. LOAN REVIEW TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                <th className="px-8 py-6 border-b border-slate-100">Loan Type</th>
                <th className="px-8 py-6 border-b border-slate-100">Amount</th>
                <th className="px-8 py-6 border-b border-slate-100">Affordability</th>
                <th className="px-8 py-6 border-b border-slate-100">Review Status</th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reviews.map((app, i) => (
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
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{app.type}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-900">{app.amount}</p>
                  </td>
                  <td className="px-8 py-5">
                    <AffordabilityBadge status={app.affordabilityStatus} />
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={app.reviewStatus} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenDrawer(app)}
                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                        title="Quick View"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => navigate(`/staff/loan-review/${app.id}`)}
                        className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                        title="Verify Eligibility"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👤 REVIEW DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Review Details</h3>
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
                    <DrawerItem icon={Building2} label="Employment" value={selectedApp?.employment} />
                  </div>
                </section>

                {/* LOAN INFO */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <DollarSign size={14} className="text-primary" /> Loan Request
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DrawerItem icon={DollarSign} label="Amount" value={selectedApp?.amount} />
                    <DrawerItem icon={Clock} label="Duration" value="12 Months" />
                  </div>
                </section>

                {/* AFFORDABILITY SUMMARY */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <PieChart size={14} className="text-primary" /> Affordability Review
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <MiniCard label="Income" value={selectedApp?.income} color="emerald" />
                    <MiniCard label="Expenses" value={selectedApp?.expenses} color="rose" />
                    <MiniCard label="Estimated EMI" value="R485.50" color="navy" />
                    <MiniCard label="Eligibility" value={selectedApp?.affordabilityStatus} color="accent" />
                  </div>
                </section>

                {/* DOCUMENTS SECTION */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <FileText size={14} className="text-primary" /> Documents Decision
                  </h4>
                  <div className="space-y-3">
                    <ReviewDocCard name="ID Document" status="Verified" />
                    <ReviewDocCard name="Recent Payslip" status="Verified" />
                    <ReviewDocCard name="Bank Statement" status="Pending" />
                  </div>
                </section>

                {/* REVIEW NOTES */}
                <section className="space-y-4 pb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" /> Review Notes
                  </h4>
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Staff Recommendation</p>
                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">"Borrower shows strong income stability. Recommend approval based on verified documents."</p>
                    </div>
                    <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Internal Note</p>
                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">"Previous loan history with other lender was positive."</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <Button 
                  className={cn(
                    "w-full font-black uppercase tracking-widest text-[10px] py-4",
                    isInactive ? "bg-slate-300 cursor-not-allowed opacity-70" : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                  )} 
                  onClick={() => !isInactive && setIsApprovalModalOpen(true)}
                  title={isInactive ? "Your account is inactive" : "Approve Recommendation"}
                >
                  Approve Recommendation
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="secondary" 
                    className={cn(
                      "font-black uppercase tracking-widest text-[8px] py-4",
                      isInactive ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-rose-100 text-rose-500"
                    )}
                    onClick={() => !isInactive && setIsRejectionModalOpen(true)}
                    title={isInactive ? "Your account is inactive" : "Reject"}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="secondary" 
                    className={cn(
                      "font-black uppercase tracking-widest text-[8px] py-4",
                      isInactive ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-slate-200"
                    )}
                    onClick={() => !isInactive && setIsRequestDocsModalOpen(true)}
                    title={isInactive ? "Your account is inactive" : "Request Docs"}
                  >
                    Request Docs
                  </Button>
                </div>
                <Button variant="ghost" className="w-full font-black uppercase tracking-widest text-[8px] py-3 text-slate-400 hover:text-primary" onClick={() => navigate(`/staff/loan-review/${selectedApp?.id}`)}>
                  Open Full Review Page
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ APPROVAL MODAL */}
      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title="Approve Recommendation" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Borrower</p>
              <p className="text-sm font-black text-slate-900">{selectedApp?.borrower}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                <p className="text-sm font-black text-slate-900">{selectedApp?.amount}</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Affordability</p>
                <p className="text-sm font-black text-emerald-600">{selectedApp?.affordabilityStatus}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendation Notes</label>
            <textarea placeholder="Enter final recommendation notes for Admin approval..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none" />
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsApprovalModalOpen(false)}>Cancel</Button>
            <Button className="flex-1 font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600" onClick={() => setIsApprovalModalOpen(false)}>Submit Recommendation</Button>
          </div>
        </div>
      </Modal>

      {/* ❌ REJECTION MODAL */}
      <Modal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} title="Reject Recommendation" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Reason</label>
              <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10">
                <option>Low Affordability Score</option>
                <option>Insufficient Document Proof</option>
                <option>Negative External Credit History</option>
                <option>Employment Instability</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Notes</label>
              <textarea placeholder="Provide detailed reasoning for rejection..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none" />
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
            <Button className="flex-1 font-bold shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600" onClick={() => setIsRejectionModalOpen(false)}>Submit Rejection</Button>
          </div>
        </div>
      </Modal>

      {/* 📄 REQUEST DOCS MODAL */}
      <Modal isOpen={isRequestDocsModalOpen} onClose={() => setIsRequestDocsModalOpen(false)} title="Request Documents" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</label>
              <input type="text" placeholder="e.g. Updated Bank Statement" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message to Borrower</label>
              <textarea placeholder="Explain what is missing..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none" />
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsRequestDocsModalOpen(false)}>Cancel</Button>
            <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => setIsRequestDocsModalOpen(false)}>Send Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ReviewStep = ({ icon: Icon, label, status }) => (
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

const ReviewArrow = () => <div className="hidden md:block text-slate-100"><ArrowRight size={20} /></div>;

const AffordabilityBadge = ({ status }) => (
  <div className={cn(
    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
    status === 'Eligible' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
    status === 'Moderate' ? "bg-amber-50 text-amber-600 border-amber-100" :
    "bg-rose-50 text-rose-600 border-rose-100"
  )}>
    <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Eligible' ? "bg-emerald-500" : status === 'Moderate' ? "bg-amber-500" : "bg-rose-500")} />
    {status}
  </div>
);

const DrawerItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors"><Icon size={16} /></div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs font-black text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

const MiniCard = ({ label, value, color }) => (
  <div className={cn(
    "p-4 rounded-xl border flex flex-col gap-1 transition-all hover:scale-105",
    color === 'emerald' ? "bg-emerald-50 border-emerald-100" :
    color === 'rose' ? "bg-rose-50 border-rose-100" :
    color === 'navy' ? "bg-slate-900 border-slate-800 text-white" :
    "bg-primary/5 border-primary/10"
  )}>
    <p className={cn("text-[7px] font-black uppercase tracking-widest", color === 'navy' ? "text-slate-500" : "text-slate-400")}>{label}</p>
    <p className={cn("text-xs font-black", color === 'navy' ? "text-white" : "text-slate-900")}>{value}</p>
  </div>
);

const ReviewDocCard = ({ name, status }) => (
  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm"><FileText size={14} /></div>
      <div>
        <p className="text-[10px] font-black text-slate-900 truncate max-w-[120px]">{name}</p>
        <div className="flex items-center gap-1 mt-0.5"><div className={cn("w-1 h-1 rounded-full", status === 'Verified' ? "bg-emerald-500" : "bg-amber-500")} /><p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{status}</p></div>
      </div>
    </div>
    <button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><Eye size={12} /></button>
  </div>
);

export default LoanReview;
