import React, { useEffect, useState } from 'react';
import { 
  Users, FileText, CheckCircle2, AlertCircle, 
  TrendingUp, DollarSign, Calendar, ArrowUpRight, 
  Clock, CheckCircle, XCircle, Search, Filter, 
  MoreVertical, UserPlus, FilePlus, Bell, ArrowDownRight,
  Target, Activity, History, ShieldCheck, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { cn } from '../../utils/cn';
import dashboardService from '../../services/dashboardService';
import { initiateSocketConnection } from '../../socket/socketClient';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0
  }).format(value || 0);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Consolidated Dashboard State
  const [overview, setOverview] = useState({
    totalBorrowers: 0,
    totalActiveLoans: 0,
    totalDisbursed: 0,
    duePaymentsToday: 0,
    borrowerGrowthPercentage: 0,
    loanGrowthPercentage: 0,
    disbursementGrowthPercentage: 0,
    duePaymentChangePercentage: 0
  });

  const [performanceData, setPerformanceData] = useState([]);
  const [operationalStatus, setOperationalStatus] = useState({
    newApplications: 0,
    underReview: 0,
    approvedLoans: 0,
    activeLoans: 0
  });

  const [recentApplications, setRecentApplications] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    bureauConnectivity: 'Offline',
    paymentGateway: 'Offline',
    notificationEngine: 'Offline'
  });

  // Main Hydration Pipeline
  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [
        overviewRes,
        perfRes,
        opsRes,
        appsRes,
        paymentsRes,
        alertsRes,
        healthRes
      ] = await Promise.allSettled([
        dashboardService.getDashboardOverview(),
        dashboardService.getFinancialPerformance(),
        dashboardService.getOperationalStatus(),
        dashboardService.getRecentApplications(),
        dashboardService.getRecentPayments(),
        dashboardService.getSystemAlerts(),
        dashboardService.getSystemHealth()
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (perfRes.status === 'fulfilled') setPerformanceData(perfRes.value.data);
      if (opsRes.status === 'fulfilled') setOperationalStatus(opsRes.value.data);
      if (appsRes.status === 'fulfilled') setRecentApplications(appsRes.value.data);
      if (paymentsRes.status === 'fulfilled') setRecentPayments(paymentsRes.value.data);
      if (alertsRes.status === 'fulfilled') setSystemAlerts(alertsRes.value.data);
      if (healthRes.status === 'fulfilled') setSystemHealth(healthRes.value.data);

    } catch (err) {
      toast.error('Failed to synchronize analytical layers');
    } finally {
      setLoading(false);
    }
  };

  // 1. Bootstrap HTTP fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Setup Realtime Socket listeners
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = initiateSocketConnection(token);
    if (!socket) return;

    const handleLiveUpdate = () => {
      // Silently fetch aggregates so UI stays fluid
      fetchDashboardData(true);
    };

    socket.on('dashboard:update', handleLiveUpdate);
    socket.on('loan:new', handleLiveUpdate);
    socket.on('payment:received', handleLiveUpdate);
    socket.on('payment:verified', handleLiveUpdate);
    socket.on('loan:approved', handleLiveUpdate);
    socket.on('overdue:generated', handleLiveUpdate);

    return () => {
      socket.off('dashboard:update', handleLiveUpdate);
      socket.off('loan:new', handleLiveUpdate);
      socket.off('payment:received', handleLiveUpdate);
      socket.off('payment:verified', handleLiveUpdate);
      socket.off('loan:approved', handleLiveUpdate);
      socket.off('overdue:generated', handleLiveUpdate);
    };
  }, []);

  // Render Pulse Loader for Initial Boot
  if (loading) {
    return (
      <div className="space-y-8 pb-10 animate-pulse">
        <div className="h-44 bg-white rounded-[2rem] border border-slate-100 shadow-soft" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(n => <div key={n} className="h-32 bg-white rounded-3xl shadow-soft border border-slate-100" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 h-[400px] bg-white rounded-[2rem] shadow-soft" />
          <div className="h-[400px] bg-white rounded-[2rem] shadow-soft" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. WELCOME SECTION */}
      <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back, Admin</h1>
              <button 
                onClick={() => fetchDashboardData()}
                className="p-2 text-slate-300 hover:text-primary transition-colors rounded-lg hover:bg-slate-50"
                title="Refresh Statistics"
              >
                <RefreshCcw size={16} />
              </button>
            </div>
            <p className="text-slate-500 font-medium mt-2 max-w-xl leading-relaxed">
              System status is nominal. You have <span className="text-primary font-bold">{operationalStatus.newApplications} new applications</span> waiting inside the queue and <span className="text-accent font-bold">{formatCurrency(overview.duePaymentsToday)}</span> outstanding repayments today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <QuickAction icon={UserPlus} label="Add Borrower" color="bg-primary text-white" onClick={() => navigate('/admin/borrowers')} />
             <QuickAction icon={FilePlus} label="Review Applications" color="bg-accent text-primary" onClick={() => navigate('/admin/applications')} />
             <QuickAction icon={Calendar} label="View Due Today" color="bg-slate-100 text-slate-600" onClick={() => navigate('/admin/due-payments')} />
          </div>
        </div>
      </section>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Borrowers" 
          value={overview.totalBorrowers.toLocaleString()} 
          icon={Users} 
          trend={overview.borrowerGrowthPercentage >= 0 ? "up" : "down"} 
          trendValue={Math.abs(overview.borrowerGrowthPercentage).toFixed(1)} 
          color="navy" 
        />
        <StatCard 
          title="Total Active Loans" 
          value={overview.totalActiveLoans.toLocaleString()} 
          icon={Activity} 
          trend={overview.loanGrowthPercentage >= 0 ? "up" : "down"} 
          trendValue={Math.abs(overview.loanGrowthPercentage).toFixed(1)} 
          color="blue" 
        />
        <StatCard 
          title="Total Disbursed" 
          value={formatCurrency(overview.totalDisbursed)} 
          icon={DollarSign} 
          trend={overview.disbursementGrowthPercentage >= 0 ? "up" : "down"} 
          trendValue={Math.abs(overview.disbursementGrowthPercentage).toFixed(1)} 
          color="emerald" 
        />
        <StatCard 
          title="Due Payments Today" 
          value={formatCurrency(overview.duePaymentsToday)} 
          icon={Calendar} 
          trend={overview.duePaymentChangePercentage >= 0 ? "up" : "down"} 
          trendValue={Math.abs(overview.duePaymentChangePercentage).toFixed(1)} 
          color="amber" 
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT COLUMN: CHARTS & TABLES */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* REVENUE & DISBURSEMENT CHART */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Financial Performance</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Collections vs Disbursements</p>
              </div>
              <div className="flex items-center gap-4">
                <LegendItem color="#2E3A74" label="Collections" />
                <LegendItem color="#49B6FF" label="Disbursed" />
              </div>
            </div>
            <div className="h-[300px] w-full">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E3A74" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2E3A74" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDis" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#49B6FF" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#49B6FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} 
                      tickFormatter={(val) => `R${val >= 1000 ? (val/1000) + 'k' : val}`} 
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), '']}
                      contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="collections" stroke="#2E3A74" strokeWidth={3} fillOpacity={1} fill="url(#colorCol)" />
                    <Area type="monotone" dataKey="disbursed" stroke="#49B6FF" strokeWidth={3} fillOpacity={1} fill="url(#colorDis)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                  Accumulating yearly metrics...
                </div>
              )}
            </div>
          </div>

          {/* RECENT APPLICATIONS TABLE */}
          <TableContainer title="Recent Loan Applications">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Type</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentApplications.length > 0 ? (
                  recentApplications.map((app, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs uppercase">
                            {app.borrowerName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{app.borrowerName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{app.applicationId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-bold text-slate-600 uppercase">{app.loanType}</td>
                      <td className="py-4 text-sm font-black text-slate-900">{formatCurrency(app.amount)}</td>
                      <td className="py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => navigate('/admin/applications')}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-bold text-sm">
                      No loan applications submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableContainer>

          {/* RECENT PAYMENTS TABLE */}
          <TableContainer title="Recent Payments Received">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                         <p className="text-sm font-bold text-slate-900">{payment.borrowerName}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{payment.paymentMethod}</p>
                      </td>
                      <td className="py-4 text-sm font-black text-slate-900">{formatCurrency(payment.amount)}</td>
                      <td className="py-4 text-xs font-bold text-slate-500">
                        {new Date(payment.paymentDate).toLocaleDateString('en-ZA', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 text-right">
                         <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 font-bold text-sm">
                      No payments recorded in ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableContainer>

        </div>

        {/* RIGHT COLUMN: STATUS & NOTIFICATIONS */}
        <div className="space-y-8">
           {/* LOAN STATUS SUMMARY */}
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft">
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Operational Status</h3>
              <div className="space-y-3">
                 <StatusSummaryItem label="New Applications" count={operationalStatus.newApplications} color="bg-blue-50 text-blue-600" />
                 <StatusSummaryItem label="Under Review" count={operationalStatus.underReview} color="bg-amber-50 text-amber-600" />
                 <StatusSummaryItem label="Approved Loans" count={operationalStatus.approvedLoans} color="bg-emerald-50 text-emerald-600" />
                 <StatusSummaryItem label="Active Loans" count={operationalStatus.activeLoans} color="bg-primary text-white" />
              </div>
           </div>

           {/* NOTIFICATIONS PANEL */}
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">System Alerts</h3>
                <Bell size={18} className="text-slate-300" />
              </div>
              <div className="space-y-6">
                 {systemAlerts.length > 0 ? (
                   systemAlerts.map((alert) => {
                     let Icon = FilePlus;
                     let warn = false;
                     const type = alert.alertType?.toLowerCase();
                     if (type?.includes('overdue') || type?.includes('reject') || type?.includes('due') || alert.priority === 'high') {
                       Icon = AlertCircle;
                       warn = true;
                     } else if (type?.includes('verified') || type?.includes('payment')) {
                       Icon = CheckCircle;
                     }
                     return (
                       <NotificationItem 
                          key={alert.id}
                          icon={Icon} 
                          title={alert.title} 
                          desc={alert.message} 
                          time={new Date(alert.createdAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                          isWarning={warn}
                       />
                     );
                   })
                 ) : (
                   <div className="text-slate-400 text-xs font-bold italic py-4">
                     All systems quiet. No live alerts.
                   </div>
                 )}
              </div>
              <button 
                onClick={() => navigate('/admin/notifications')}
                className="w-full mt-8 py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
              >
                View All Alerts
              </button>
           </div>

           {/* SYSTEM HEALTH CARD */}
           <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      System Health <ShieldCheck size={14} className="text-emerald-400" />
                    </h3>
                 </div>
                 <div className="space-y-4">
                    <HealthItem label="Bureau Connectivity" status={systemHealth.bureauConnectivity || 'Live'} />
                    <HealthItem label="Payment Gateway" status={systemHealth.paymentGateway || 'Operational'} />
                    <HealthItem label="Notification Engine" status={systemHealth.notificationEngine || 'Active'} />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const QuickAction = ({ icon: Icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className={cn("px-5 py-3 rounded-2xl flex items-center gap-3 font-bold text-xs transition-all active:scale-95 shadow-sm whitespace-nowrap", color)}
  >
    <Icon size={16} />
    {label}
  </button>
);

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

const TableContainer = ({ title, children }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden">
    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">{title}</h3>
    <div className="overflow-x-auto">
      {children}
    </div>
  </div>
);

const StatusSummaryItem = ({ label, count, color }) => (
  <div className={cn("flex items-center justify-between p-4 rounded-2xl border border-slate-50 shadow-sm", color.split(' ')[0])}>
     <span className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</span>
     <span className={cn("text-sm font-black px-3 py-1 rounded-lg", color)}>{count}</span>
  </div>
);

const NotificationItem = ({ icon: Icon, title, desc, time, isWarning }) => (
  <div className="flex gap-4 group">
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 flex-shrink-0", isWarning ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-primary")}>
       <Icon size={18} />
    </div>
    <div className="space-y-1 min-w-0 flex-1">
       <p className="text-xs font-black text-slate-900 truncate">{title}</p>
       <p className="text-[11px] font-medium text-slate-500 leading-relaxed truncate" title={desc}>{desc}</p>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{time}</p>
    </div>
  </div>
);

const HealthItem = ({ label, status }) => {
  const isGood = ['live', 'operational', 'active'].includes(status.toLowerCase());
  return (
    <div className="flex justify-between items-center text-[10px] font-bold">
       <span className="text-slate-400 uppercase tracking-widest">{label}</span>
       <span className={cn("uppercase tracking-widest", isGood ? "text-emerald-400" : "text-rose-500")}>{status}</span>
    </div>
  );
};

export default AdminDashboard;
