import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Wallet, Clock, 
  ArrowRight, Phone, MessageSquare, Eye, 
  Search, Bell, Filter, Calendar, 
  CheckCircle2, AlertCircle, ChevronRight,
  TrendingDown, DollarSign, Briefcase, UserPlus,
  Loader2, ShieldAlert, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import agentService from '../../services/agentService';
import { toast } from 'react-hot-toast';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await agentService.getMyProfile();
      setAgentProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load dashboard profile');
    } finally {
      setLoading(false);
    }
  };

  const isInactive = agentProfile?.accountStatus === 'Inactive';

  const assignedClients = [
    { id: 'BR-101', name: 'Michael Chen', amount: 'R12,500', emiStatus: 'Paid', dueDate: '2026-05-15', status: 'Active', phone: '+27 71 222 3333' },
    { id: 'BR-102', name: 'Sarah Williams', amount: 'R8,000', emiStatus: 'Pending', dueDate: '2026-05-10', status: 'Active', phone: '+27 82 444 5555' },
    { id: 'BR-103', name: 'David Gumede', amount: 'R5,000', emiStatus: 'Overdue', dueDate: '2026-05-01', status: 'Overdue', phone: '+27 61 777 8888' },
    { id: 'BR-104', name: 'Linda Mbeki', amount: 'R20,000', emiStatus: 'N/A', dueDate: 'N/A', status: 'Pending', phone: '+27 73 999 0000' },
  ];

  const recentActivities = [
    { id: 1, type: 'new_client', title: 'New Client Assigned', desc: 'Michael Chen assigned to your portfolio.', time: '2 hours ago', icon: UserPlus, color: 'blue' },
    { id: 2, type: 'payment', title: 'EMI Payment Received', desc: 'Sarah Williams paid R1,200.', time: '5 hours ago', icon: DollarSign, color: 'emerald' },
    { id: 3, type: 'alert', title: 'Overdue EMI Alert', desc: 'David Gumede is 8 days overdue.', time: 'Yesterday', icon: AlertCircle, color: 'rose' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ⚠️ INACTIVE WARNING BANNER */}
      <AnimatePresence>
        {isInactive && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-5 flex items-center gap-4 text-amber-800 shadow-sm"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200 shadow-inner">
              <ShieldAlert size={24} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black tracking-tight uppercase">Operational Restrictions Active</p>
              <p className="text-xs font-bold opacity-70 mt-0.5">Your account is currently inactive. Features like adding borrowers and processing collections are disabled.</p>
            </div>
            <Button variant="secondary" className="bg-white border-amber-200 text-amber-800 font-bold text-[10px] px-4 py-2">Contact Support</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. WELCOME SECTION */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome Back, {agentProfile?.fullName.split(' ')[0] || 'Agent'}
            </h1>
            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
              {isInactive ? (
                <span className="text-amber-600 font-bold">Your account is currently restricted. Some actions are disabled.</span>
              ) : (
                <>You have <span className="text-primary font-bold">4 active follow-ups</span> today. Your performance is <span className="text-emerald-500 font-bold">up 12%</span> this month.</>
              )}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={() => navigate('/agent/clients')} className="font-bold flex items-center gap-2 px-6 shadow-lg shadow-primary/20">
                <Users size={18} /> View Clients
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => !isInactive && setIsFollowUpOpen(true)} 
                disabled={isInactive}
                className={cn(
                  "font-bold flex items-center gap-2 border-slate-200 bg-white",
                  isInactive && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                <Clock size={18} /> {isInactive ? "Follow-Up Restricted" : "Follow Up Payments"}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/agent/earnings')} className="font-bold flex items-center gap-2 border-slate-200 bg-white">
                <Wallet size={18} /> View Earnings
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-8 lg:pr-8">
             <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio Value</p>
               <p className="text-2xl font-black text-slate-900">R{agentProfile?.totalCollections?.toLocaleString() || '0'}</p>
             </div>
             <div className="w-px h-12 bg-slate-100 hidden sm:block" />
             <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Achievement</p>
               <p className="text-2xl font-black text-emerald-500 text-shadow-glow">84%</p>
             </div>
          </div>
        </div>
      </section>

      {/* 📈 ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Assigned Clients" value={agentProfile?.assignedBorrowers?.length || 0} icon={Users} color="navy" trend="+3 New" />
        <StatCard title="Active Loans" value="38" icon={Briefcase} color="blue" trend="92% Active" />
        <StatCard title="Monthly Commission" value={`R${agentProfile?.totalCommissionEarned?.toLocaleString() || '0'}`} icon={TrendingUp} color="emerald" trend="R1.2k Pending" />
        <StatCard title="Pending Follow-Ups" value="04" icon={Clock} color="rose" trend="High Priority" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 📋 ASSIGNED CLIENTS SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Assigned Clients</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage your borrower portfolio</p>
              </div>
              <Button variant="secondary" className="font-bold text-[10px] uppercase tracking-widest border-slate-200" onClick={() => navigate('/agent/clients')}>
                View All Clients <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5 border-b border-slate-100">Borrower</th>
                    <th className="px-8 py-5 border-b border-slate-100">Loan Amount</th>
                    <th className="px-8 py-5 border-b border-slate-100">EMI Status</th>
                    <th className="px-8 py-5 border-b border-slate-100">Status</th>
                    <th className="px-8 py-5 border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assignedClients.map((client, i) => (
                    <motion.tr 
                      key={client.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 truncate max-w-[120px]">{client.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{client.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-900">{client.amount}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                          Due: {client.dueDate}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <div className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
                          client.emiStatus === 'Paid' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          client.emiStatus === 'Overdue' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                          "bg-amber-50 text-amber-600 border border-amber-100"
                        )}>
                          <div className={cn("w-1 h-1 rounded-full", client.emiStatus === 'Paid' ? "bg-emerald-500" : client.emiStatus === 'Overdue' ? "bg-rose-500" : "bg-amber-500")} />
                          {client.emiStatus}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"><Eye size={16} /></button>
                           <button className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100" disabled={isInactive}><MessageSquare size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 💰 COMMISSION SUMMARY SECTION */}
          <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black tracking-tight">Commission Summary</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Your earnings performance</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-sm shadow-xl shadow-black/20">
                  <TrendingUp size={24} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <EarningsItem label="Total Earned" value={`R${agentProfile?.totalCommissionEarned?.toLocaleString() || '0'}`} />
                <EarningsItem label="Pending" value="R0" isHighlight />
                <EarningsItem label="Paid" value={`R${agentProfile?.totalCommissionEarned?.toLocaleString() || '0'}`} />
                <EarningsItem label="This Month" value="R0" />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR — ACTIVITIES & NOTIFICATIONS */}
        <div className="space-y-8">
          {/* 📌 RECENT ACTIVITIES */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
              <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><MoreVertical size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex gap-5 relative group">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center relative z-10 shadow-sm border border-white shrink-0 transition-transform group-hover:scale-110",
                    activity.color === 'blue' ? "bg-blue-50 text-blue-500" :
                    activity.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                    "bg-rose-50 text-rose-500"
                  )}>
                    <activity.icon size={16} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-slate-900 leading-tight">{activity.title}</h4>
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{activity.desc}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="secondary" 
              className="w-full font-bold text-[10px] uppercase tracking-widest border-slate-100"
              onClick={() => navigate('/agent/notifications')}
            >
              View Activity Log
            </Button>
          </section>

          {/* 🔔 NOTIFICATIONS PANEL */}
          <section className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 space-y-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell size={20} className="text-primary" /> Priority Alerts
            </h3>
            <div className="space-y-4">
               <NotificationItem type="warning" title="EMI Overdue" desc="Michael Chen is 2 days late on R1,200 payment." />
               <NotificationItem type="info" title="New Assignment" desc="You have 3 new borrowers to contact." />
            </div>
          </section>
        </div>
      </div>

      {/* 👤 FOLLOW-UP DRAWER */}
      <AnimatePresence>
        {isFollowUpOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFollowUpOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Follow-Up Queue</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contact your overdue borrowers</p>
                </div>
                <button onClick={() => setIsFollowUpOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {assignedClients.filter(c => c.status === 'Overdue').map(client => (
                  <div key={client.id} className="p-6 rounded-[2rem] border-2 border-rose-50 bg-rose-50/10 space-y-6 hover:border-rose-100 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{client.name}</h4>
                          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">R1,200 Overdue</p>
                        </div>
                      </div>
                      <StatusBadge status="Overdue" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                        <MessageSquare size={14} /> Chat Now
                      </button>
                      <button className="flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                        <Bell size={14} /> Send Reminder
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <Button variant="secondary" className="w-full font-bold border-slate-200" onClick={() => setIsFollowUpOpen(false)}>
                  Close Queue
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const EarningsItem = ({ label, value, isHighlight }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <p className={cn(
      "text-2xl font-black tracking-tight",
      isHighlight ? "text-primary text-shadow-glow" : "text-white"
    )}>{value}</p>
  </div>
);

const NotificationItem = ({ type, title, desc }) => (
  <div className="p-5 bg-white rounded-2xl shadow-sm border border-primary/5 flex gap-4 group hover:border-primary/20 transition-all cursor-default">
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-colors",
      type === 'warning' ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
    )}>
      <AlertCircle size={20} />
    </div>
    <div className="min-w-0">
      <h4 className="text-[11px] font-black text-slate-900 leading-tight">{title}</h4>
      <p className="text-[10px] font-medium text-slate-500 mt-1 leading-relaxed">{desc}</p>
    </div>
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

const X = ({ size, className }) => <AlertCircle size={size} className={className} />;
const MoreVertical = ({ size, className }) => <AlertCircle size={size} className={className} />;

export default AgentDashboard;
