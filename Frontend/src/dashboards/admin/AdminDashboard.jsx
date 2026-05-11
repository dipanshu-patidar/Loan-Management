import React from 'react';
import { 
  Users, FileText, CheckCircle2, AlertCircle, 
  TrendingUp, DollarSign, Calendar, ArrowUpRight, 
  Clock, CheckCircle, XCircle, Search, Filter, 
  MoreVertical, UserPlus, FilePlus, Bell, ArrowDownRight,
  Target, Activity, History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { cn } from '../../utils/cn';

// --- Mock Data ---
const performanceData = [
  { name: 'Jan', collections: 45000, disbursements: 32000 },
  { name: 'Feb', collections: 52000, disbursements: 41000 },
  { name: 'Mar', collections: 48000, disbursements: 55000 },
  { name: 'Apr', collections: 61000, disbursements: 48000 },
  { name: 'May', collections: 55000, disbursements: 42000 },
  { name: 'Jun', collections: 67000, disbursements: 58000 },
];

const recentApplications = [
  { id: 'APP-1021', borrower: 'Sipho Nkosi', type: 'Personal', amount: 'R 12,500', status: 'Approved', date: 'Oct 12, 2023' },
  { id: 'APP-1022', borrower: 'Amara Okafor', type: 'Business', amount: 'R 45,000', status: 'Under Review', date: 'Oct 11, 2023' },
  { id: 'APP-1023', borrower: 'David van Wyk', type: 'Auto', amount: 'R 18,200', status: 'New', date: 'Oct 10, 2023' },
  { id: 'APP-1024', borrower: 'Lindiwe Zulu', type: 'Personal', amount: 'R 5,000', status: 'Rejected', date: 'Oct 09, 2023' },
];

const recentPayments = [
  { borrower: 'Kgotso Motaung', amount: 'R 1,200', date: 'Today, 10:45 AM', method: 'EFT', status: 'Verified' },
  { borrower: 'Sarah Jenkins', amount: 'R 850', date: 'Today, 09:30 AM', method: 'Debit Order', status: 'Pending' },
  { borrower: 'John Sithole', amount: 'R 2,400', date: 'Yesterday', method: 'Cash', status: 'Verified' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-10">
      {/* 1. WELCOME SECTION */}
      <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back, Admin</h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              System is performing optimally. You have <span className="text-primary font-bold">4 new applications</span> awaiting review and <span className="text-accent font-bold">12 payments</span> scheduled for today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <QuickAction icon={UserPlus} label="Add Borrower" color="bg-primary text-white" onClick={() => navigate('/admin/borrowers')} />
             <QuickAction icon={FilePlus} label="New Application" color="bg-accent text-primary" onClick={() => navigate('/admin/applications')} />
             <QuickAction icon={Calendar} label="View Due Payments" color="bg-slate-100 text-slate-600" onClick={() => navigate('/admin/due-payments')} />
          </div>
        </div>
      </section>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Borrowers" value="2,450" icon={Users} trend="up" trendValue="12.5" color="navy" />
        <StatCard title="Total Active Loans" value="1,120" icon={Activity} trend="up" trendValue="8.2" color="blue" />
        <StatCard title="Total Disbursed" value="R 4.2M" icon={DollarSign} trend="up" trendValue="15.1" color="emerald" />
        <StatCard title="Due Payments Today" value="R 84,200" icon={Calendar} trend="down" trendValue="2.4" color="amber" />
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
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="collections" stroke="#2E3A74" strokeWidth={3} fillOpacity={1} fill="url(#colorCol)" />
                  <Area type="monotone" dataKey="disbursements" stroke="#49B6FF" strokeWidth={3} fillOpacity={1} fill="url(#colorDis)" />
                </AreaChart>
              </ResponsiveContainer>
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
                {recentApplications.map((app) => (
                  <tr key={app.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs uppercase">
                          {app.borrower.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{app.borrower}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{app.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-600 uppercase">{app.type}</td>
                    <td className="py-4 text-sm font-black text-slate-900">{app.amount}</td>
                    <td className="py-4">
                      <StatusBadge status={app.status.toLowerCase().replace(' ', '')} />
                    </td>
                    <td className="py-4 text-right">
                      <button className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all">Review</button>
                    </td>
                  </tr>
                ))}
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
                {recentPayments.map((payment, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                       <p className="text-sm font-bold text-slate-900">{payment.borrower}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">{payment.method}</p>
                    </td>
                    <td className="py-4 text-sm font-black text-slate-900">{payment.amount}</td>
                    <td className="py-4 text-xs font-bold text-slate-500">{payment.date}</td>
                    <td className="py-4 text-right">
                       <StatusBadge status={payment.status.toLowerCase()} />
                    </td>
                  </tr>
                ))}
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
                 <StatusSummaryItem label="New Applications" count="4" color="bg-blue-50 text-blue-600" />
                 <StatusSummaryItem label="Under Review" count="12" color="bg-amber-50 text-amber-600" />
                 <StatusSummaryItem label="Approved Loans" count="154" color="bg-emerald-50 text-emerald-600" />
                 <StatusSummaryItem label="Active Loans" count="1,120" color="bg-primary text-white" />
              </div>
           </div>

           {/* NOTIFICATIONS PANEL */}
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">System Alerts</h3>
                <Bell size={18} className="text-slate-300" />
              </div>
              <div className="space-y-6">
                 <NotificationItem 
                    icon={FilePlus} 
                    title="New Application" 
                    desc="Sipho Nkosi submitted a personal loan request." 
                    time="12 mins ago" 
                 />
                 <NotificationItem 
                    icon={AlertCircle} 
                    title="Due Payment" 
                    desc="5 payments are overdue as of today." 
                    time="2 hours ago" 
                    isWarning
                 />
                 <NotificationItem 
                    icon={CheckCircle} 
                    title="Payment Verified" 
                    desc="R 2,400 received from John Sithole." 
                    time="4 hours ago" 
                 />
              </div>
              <button className="w-full mt-8 py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-2xl hover:bg-slate-100 transition-all">View All Alerts</button>
           </div>

           {/* SYSTEM HEALTH CARD */}
           <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-widest">System Health</h3>
                 </div>
                 <div className="space-y-4">
                    <HealthItem label="Bureau Connectivity" status="Live" />
                    <HealthItem label="Payment Gateway" status="Operational" />
                    <HealthItem label="Notification Engine" status="Active" />
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
    className={cn("px-5 py-3 rounded-2xl flex items-center gap-3 font-bold text-xs transition-all active:scale-95 shadow-sm", color)}
  >
    <Icon size={16} />
    {label}
  </button>
);

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
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
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110", isWarning ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-primary")}>
       <Icon size={18} />
    </div>
    <div className="space-y-1">
       <p className="text-xs font-black text-slate-900">{title}</p>
       <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{desc}</p>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{time}</p>
    </div>
  </div>
);

const HealthItem = ({ label, status }) => (
  <div className="flex justify-between items-center text-[10px] font-bold">
     <span className="text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-emerald-400 uppercase tracking-widest">{status}</span>
  </div>
);

export default AdminDashboard;
