import React, { useState } from 'react';
import { 
  LayoutDashboard, Clock, FileCheck, ShieldCheck, 
  MessageSquare, Search, Bell, Calendar, 
  ChevronRight, ArrowUpRight, CheckCircle2, 
  AlertCircle, User, FileText, Activity,
  Filter, Plus, Check, Eye, X, Download,
  DollarSign, MapPin, Building2, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedVerify, setSelectedVerify] = useState(null);

  const pendingApplications = [
    { id: 'APP-001', borrower: 'Alice Johnson', type: 'Personal Loan', amount: 'R5,000', status: 'New', date: '2026-05-08', employment: 'Senior Engineer at TechCorp', income: 'R45,000' },
    { id: 'APP-002', borrower: 'Bob Smith', type: 'Emergency Loan', amount: 'R2,500', status: 'Under Review', date: '2026-05-08', employment: 'Manager at Retail Inc', income: 'R28,000' },
    { id: 'APP-003', borrower: 'Charlie Davis', type: 'Business Loan', amount: 'R15,000', status: 'Pending Verification', date: '2026-05-07', employment: 'Owner at Davis Logistics', income: 'R65,000' },
  ];

  const pendingVerifications = [
    { id: 'VER-001', borrower: 'Edward Norton', type: 'ID Verification', status: 'Pending', date: '2026-05-09', amount: 'N/A', transactionId: 'N/A' },
    { id: 'VER-002', borrower: 'Fiona Gallagher', type: 'Payment Verification', status: 'Reviewing', date: '2026-05-09', amount: 'R1,200', transactionId: 'TXN-99882' },
  ];

  const handleViewApp = (app) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  const handleVerifyClick = (verify) => {
    setSelectedVerify(verify);
    setIsVerifyModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. WELCOME SECTION */}
      <section className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-premium">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back, <span className="text-primary">Staff</span></h1>
            <p className="text-slate-500 font-medium">Manage operational workflows and verification queues.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate('/staff/loan-requests')}
              className="flex items-center gap-2 font-bold px-6 py-3 rounded-2xl shadow-lg shadow-primary/20"
            >
              <FileCheck size={18} /> Review Applications
            </Button>
            <Button 
              onClick={() => navigate('/staff/payment-verification')}
              variant="secondary" 
              className="flex items-center gap-2 font-bold px-6 py-3 rounded-2xl border-slate-200 bg-white"
            >
              <ShieldCheck size={18} /> Verify Payments
            </Button>
          </div>
        </div>
      </section>

      {/* 2. ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pending Applications" value="24" icon={Clock} color="navy" trend="+5 new" trendIsPositive={false} />
        <StatCard title="Pending Verifications" value="18" icon={ShieldCheck} color="blue" trend="4 overdue" trendIsPositive={false} />
        <StatCard title="Reviewed Today" value="12" icon={FileCheck} color="green" trend="+20%" trendIsPositive={true} />
        <StatCard title="Recent Activities" value="86" icon={Activity} color="accent" trend="+12/hr" trendIsPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Workflow Queue</h3>
              <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl">
                <button onClick={() => setActiveTab('applications')} className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", activeTab === 'applications' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}>Applications</button>
                <button onClick={() => setActiveTab('verifications')} className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", activeTab === 'verifications' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}>Verifications</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <th className="px-8 py-5">Borrower</th>
                    <th className="px-8 py-5">{activeTab === 'applications' ? 'Loan Info' : 'Type'}</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="wait">
                    {activeTab === 'applications' ? (
                      pendingApplications.map((app, i) => (
                        <motion.tr key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">{app.borrower.charAt(0)}</div>
                              <span className="text-sm font-bold text-slate-700">{app.borrower}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-500">{app.amount} • {app.type}</td>
                          <td className="px-8 py-5"><StatusBadge status={app.status} /></td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleViewApp(app)} className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-sm"><Eye size={16} /></button>
                              <button onClick={() => navigate(`/staff/loan-review/${app.id}`)} className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/10 hover:scale-105 transition-all">Review</button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      pendingVerifications.map((ver, i) => (
                        <motion.tr key={ver.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">{ver.borrower.charAt(0)}</div>
                              <span className="text-sm font-bold text-slate-700">{ver.borrower}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-500">{ver.type}</td>
                          <td className="px-8 py-5"><StatusBadge status={ver.status} /></td>
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => handleVerifyClick(ver)} className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/10 hover:scale-105 transition-all">Verify</button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
             <h3 className="text-sm font-black text-white uppercase tracking-[0.15em] mb-8 flex items-center justify-between relative z-10">Priority Alerts <Bell size={16} className="text-primary animate-ring" /></h3>
             <div className="space-y-4 relative z-10">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer group">
                 <div className="flex items-start justify-between mb-2">
                   <h4 className="text-xs font-black text-white group-hover:text-primary transition-colors">Overdue Verification</h4>
                   <span className="text-[9px] font-black text-slate-500 uppercase">2h ago</span>
                 </div>
                 <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Bob Smith's document check is overdue by 2 hours.</p>
               </div>
             </div>
           </section>
        </div>
      </div>

      {/* APPLICATION PREVIEW DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Application Preview</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedApp?.id}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Borrower Information</h4>
                  <PreviewItem icon={User} label="Full Name" value={selectedApp?.borrower} />
                  <PreviewItem icon={Building2} label="Employment" value={selectedApp?.employment} />
                  <PreviewItem icon={DollarSign} label="Monthly Income" value={selectedApp?.income} />
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Loan Details</h4>
                  <PreviewItem icon={Briefcase} label="Loan Type" value={selectedApp?.type} />
                  <PreviewItem icon={DollarSign} label="Requested Amount" value={selectedApp?.amount} />
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Affordability Status</p>
                    <p className="text-sm font-black text-slate-900">High Confidence</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Uploaded Documents</h4>
                  <div className="space-y-2">
                    <DocItem name="Identity Document.pdf" />
                    <DocItem name="Payslip_May_2026.pdf" />
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsDrawerOpen(false)}>Close Drawer</Button>
                <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => navigate(`/staff/loan-review/${selectedApp?.id}`)}>Review Application</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VERIFICATION MODAL */}
      <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} title="Verify Operational Task" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</p>
              <p className="text-sm font-black text-slate-900">{selectedVerify?.borrower}</p>
            </div>
            <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Type</p>
              <p className="text-sm font-black text-slate-900">{selectedVerify?.type}</p>
            </div>
          </div>
          {selectedVerify?.type === 'Payment Verification' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Amount Reported</p>
                <p className="text-lg font-black text-emerald-900">{selectedVerify?.amount}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">TXN ID</p>
                <p className="text-sm font-black text-emerald-900">{selectedVerify?.transactionId}</p>
              </div>
            </div>
          )}
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-rose-100 text-rose-500 hover:bg-rose-50" onClick={() => setIsVerifyModalOpen(false)}>Reject Task</Button>
            <Button className="flex-1 font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600" onClick={() => setIsVerifyModalOpen(false)}>Confirm Verification</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const PreviewItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><Icon size={18} /></div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

const DocItem = ({ name }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-3">
      <FileText size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
      <span className="text-xs font-bold text-slate-600 truncate">{name}</span>
    </div>
    <button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><Download size={14} /></button>
  </div>
);

export default StaffDashboard;
