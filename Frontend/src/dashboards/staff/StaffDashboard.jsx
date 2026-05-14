import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Clock, FileCheck, ShieldCheck, 
  MessageSquare, Search, Bell, Calendar, 
  ChevronRight, ArrowUpRight, CheckCircle2, 
  AlertCircle, User, FileText, Activity,
  Filter, Plus, Check, Eye, X, Download,
  DollarSign, MapPin, Building2, Briefcase, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import staffDashboardService from '../../services/staffDashboardService';
import { toast } from 'react-hot-toast';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../../socket/socketClient';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedVerify, setSelectedVerify] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [socket, setSocket] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await staffDashboardService.getDashboardData();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Socket Integration
    const token = localStorage.getItem('token');
    if (token) {
      const sock = initiateSocketConnection(token);
      setSocket(sock);

      // Listen for updates
      sock.on('dashboard:updated', () => fetchDashboardData(true));
      sock.on('review:assigned', () => {
        fetchDashboardData(true);
        toast.success('New loan review assigned to you!');
      });
      sock.on('verification:assigned', () => {
        fetchDashboardData(true);
        toast.success('New payment verification assigned!');
      });
      sock.on('alert:new', () => fetchDashboardData(true));
      sock.on('payment:uploaded', () => fetchDashboardData(true));
      
      // Personal room updates
      sock.on(`notification:new`, () => fetchDashboardData(true));
    }

    return () => {
      if (socket) {
        socket.off('dashboard:updated');
        socket.off('review:assigned');
        socket.off('verification:assigned');
        socket.off('alert:new');
        socket.off('payment:uploaded');
        socket.off(`notification:new`);
      }
      disconnectSocket();
    };
  }, []);

  const handleViewApp = (app) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  const handleVerifyClick = (verify) => {
    setSelectedVerify(verify);
    setIsVerifyModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return formatDate(dateString);
  };

  if (loading && !dashboardData) {
    return (
      <div className="space-y-8 pb-10">
        <div className="h-48 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white rounded-[2.5rem] animate-pulse" />
          <div className="h-96 bg-white rounded-[2.5rem] animate-pulse" />
        </div>
      </div>
    );
  }

  const { analytics, workflowQueue, verificationsQueue, priorityAlerts, recentActivities, quickActionCounts } = dashboardData || {};

  return (
    <div className="space-y-8 pb-10">
      {/* 1. WELCOME SECTION */}
      <section className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-premium">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back, <span className="text-primary">{user?.fullName?.split(' ')[0] || 'Staff'}</span></h1>
            <p className="text-slate-500 font-medium">
              You have <span className="text-primary font-bold">{quickActionCounts?.reviewQueue || 0} applications</span> and <span className="text-emerald-500 font-bold">{quickActionCounts?.verificationQueue || 0} verifications</span> pending.
            </p>
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
            <button 
              onClick={() => fetchDashboardData(true)}
              className="p-3 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
            >
              <RefreshCw size={20} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pending Applications" value={analytics?.pendingApplications || 0} icon={Clock} color="navy" />
        <StatCard title="Pending Verifications" value={analytics?.pendingVerifications || 0} icon={ShieldCheck} color="blue" />
        <StatCard title="Reviewed Today" value={analytics?.reviewedToday || 0} icon={FileCheck} color="emerald" />
        <StatCard title="Recent Activities" value={analytics?.recentActivities || 0} icon={Activity} color="navy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden min-h-[500px]">
            <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Workflow Queue</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Operational Priority</p>
              </div>
              <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl w-full sm:w-auto">
                <button onClick={() => setActiveTab('applications')} className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'applications' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}>Applications</button>
                <button onClick={() => setActiveTab('verifications')} className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'verifications' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}>Verifications</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <th className="px-8 py-5">Borrower</th>
                    <th className="px-8 py-5">{activeTab === 'applications' ? 'Loan Info' : 'Details'}</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="wait">
                    {activeTab === 'applications' ? (
                      workflowQueue?.length > 0 ? (
                        workflowQueue.map((app, i) => (
                          <motion.tr key={app.applicationId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase border border-primary/10">
                                  {app.borrowerName?.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-900">{app.borrowerName}</span>
                                  <span className="text-[10px] font-bold text-slate-400">{app.borrowerPhone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-700">R {app.loanAmount?.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.loanType}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5"><StatusBadge status={app.currentStatus} /></td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleViewApp(app)} title="Quick View" className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Eye size={18} /></button>
                                <button onClick={() => navigate(`/staff/loan-review/${app.applicationId}`)} className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 hover:scale-105 transition-all">Review</button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr className="h-64"><td colSpan="4" className="text-center p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">No pending applications found</td></tr>
                      )
                    ) : (
                      verificationsQueue?.length > 0 ? (
                        verificationsQueue.map((ver, i) => (
                          <motion.tr key={ver.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs uppercase border border-emerald-100">
                                  {ver.borrowerName?.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-900">{ver.borrowerName}</span>
                                  <span className="text-[10px] font-bold text-slate-400">R {ver.amount?.toLocaleString()}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-700">{ver.type}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ver.transactionId}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5"><StatusBadge status={ver.status} /></td>
                            <td className="px-8 py-5 text-right">
                              <button onClick={() => handleVerifyClick(ver)} className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/10 hover:scale-105 transition-all">Verify</button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr className="h-64"><td colSpan="4" className="text-center p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">No pending verifications found</td></tr>
                      )
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
           {/* PRIORITY ALERTS */}
           <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden min-h-[300px]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
             <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center justify-between relative z-10">
               Priority Alerts 
               <div className="relative">
                 <Bell size={16} className="text-primary animate-ring" />
                 {priorityAlerts?.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />}
               </div>
             </h3>
             
             <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto no-scrollbar">
               {priorityAlerts?.length > 0 ? (
                 priorityAlerts.map(alert => (
                   <div key={alert.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer group">
                     <div className="flex items-start justify-between mb-2 gap-2">
                       <h4 className={cn(
                         "text-[10px] font-black uppercase tracking-widest transition-colors",
                         alert.priority === 'urgent' ? "text-rose-400" : 
                         alert.priority === 'important' ? "text-amber-400" : "text-primary"
                       )}>
                         {alert.title}
                       </h4>
                       <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">{formatTimeAgo(alert.createdAt)}</span>
                     </div>
                     <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2">{alert.message}</p>
                   </div>
                 ))
               ) : (
                 <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                   <ShieldCheck size={32} className="text-slate-500 mb-3" />
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">No Priority Alerts</p>
                 </div>
               )}
             </div>
           </section>

           {/* RECENT ACTIVITY */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Activity size={16} className="text-primary" />
               Recent Activity
             </h3>
             <div className="space-y-6">
               {recentActivities?.length > 0 ? (
                 recentActivities.map((activity, i) => (
                   <div key={i} className="flex gap-4 relative">
                     {i !== recentActivities.length - 1 && <div className="absolute left-4 top-10 bottom-0 w-[1px] bg-slate-100" />}
                     <div className={cn(
                       "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                       activity.type === 'application' ? "bg-primary/5 border-primary/10 text-primary" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                     )}>
                       {activity.type === 'application' ? <FileText size={14} /> : <ShieldCheck size={14} />}
                     </div>
                     <div className="min-w-0">
                       <p className="text-xs font-black text-slate-900 leading-none mb-1">{activity.title}</p>
                       <p className="text-[10px] text-slate-500 font-medium truncate mb-1">{activity.description}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{formatTimeAgo(activity.time)}</p>
                     </div>
                   </div>
                 ))
               ) : (
                 <p className="text-[10px] font-black text-slate-400 text-center py-6 uppercase tracking-widest">No recent operational activity</p>
               )}
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedApp?.loanId}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Borrower Information</h4>
                  <PreviewItem icon={User} label="Full Name" value={selectedApp?.borrowerName} />
                  <PreviewItem icon={MapPin} label="Phone Number" value={selectedApp?.borrowerPhone} />
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Loan Details</h4>
                  <PreviewItem icon={Briefcase} label="Loan Type" value={selectedApp?.loanType} />
                  <PreviewItem icon={DollarSign} label="Requested Amount" value={`R ${selectedApp?.loanAmount?.toLocaleString()}`} />
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Current Progress</p>
                    <p className="text-sm font-black text-slate-900">Assigned on {formatDate(selectedApp?.assignedDate)}</p>
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsDrawerOpen(false)}>Close Drawer</Button>
                <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => navigate(`/staff/loan-review/${selectedApp?.applicationId}`)}>Review Application</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VERIFICATION MODAL */}
      <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} title="Verify Operational Task" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</p>
              <p className="text-sm font-black text-slate-900">{selectedVerify?.borrowerName}</p>
            </div>
            <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Type</p>
              <p className="text-sm font-black text-slate-900">{selectedVerify?.type}</p>
            </div>
          </div>
          {selectedVerify?.amount && (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Amount Reported</p>
                <p className="text-xl font-black text-emerald-900">R {selectedVerify?.amount?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Transaction Reference</p>
                <p className="text-sm font-black text-emerald-900">{selectedVerify?.transactionId}</p>
              </div>
            </div>
          )}
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
            <Activity size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary/80 font-bold leading-relaxed uppercase">
              Please ensure you have cross-referenced the transaction ID in the bank statement before confirming this payment.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-rose-100 text-rose-500 hover:bg-rose-50" onClick={() => navigate('/staff/payment-verification')}>Go to Verification Module</Button>
            <Button className="flex-1 font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600" onClick={() => navigate('/staff/payment-verification')}>Process Verification</Button>
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
