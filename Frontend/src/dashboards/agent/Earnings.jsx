import React, { useState } from 'react';
import { 
  TrendingUp, Wallet, DollarSign, Clock, 
  Download, FileText, Filter, Eye, 
  ChevronRight, ArrowRight, CheckCircle2, 
  Calendar, PieChart, BarChart3, Search,
  X, Briefcase, User, Info, FileSpreadsheet,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area
} from 'recharts';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';

const Earnings = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const earningsData = [
    { month: 'Jan', paid: 4500, unpaid: 1200 },
    { month: 'Feb', paid: 5200, unpaid: 800 },
    { month: 'Mar', paid: 4800, unpaid: 1500 },
    { month: 'Apr', paid: 6100, unpaid: 2000 },
    { month: 'May', paid: 5400, unpaid: 1200 },
  ];

  const commissions = [
    { 
      id: 'COM-001', 
      borrower: 'Michael Chen', 
      loanAmount: 'R12,500', 
      percent: '5%', 
      earned: 'R625',
      status: 'Paid',
      date: '2026-05-02',
      loanType: 'Personal Loan'
    },
    { 
      id: 'COM-002', 
      borrower: 'Sarah Williams', 
      loanAmount: 'R8,000', 
      percent: '3%', 
      earned: 'R240',
      status: 'Pending',
      date: '2026-05-08',
      loanType: 'Emergency Loan'
    },
    { 
      id: 'COM-003', 
      borrower: 'David Gumede', 
      loanAmount: 'R5,000', 
      percent: '4%', 
      earned: 'R200',
      status: 'Processing',
      date: '2026-05-05',
      loanType: 'Personal Loan'
    },
    { 
      id: 'COM-004', 
      borrower: 'Linda Mbeki', 
      loanAmount: 'R20,000', 
      percent: '5%', 
      earned: 'R1,000',
      status: 'Paid',
      date: '2026-04-28',
      loanType: 'Business Loan'
    },
  ];

  const recentPayouts = [
    { id: 1, title: 'Commission Paid', desc: 'R1,200 for Michael Chen loan.', time: '2 days ago', status: 'completed' },
    { id: 2, title: 'New Commission Generated', desc: 'R240 for Sarah Williams.', time: '5 hours ago', status: 'pending' },
    { id: 3, title: 'Payout Processing', desc: 'R850 for monthly payout.', time: 'Yesterday', status: 'active' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-slate-500 font-medium mt-1">Track commissions, monthly earnings, and payout history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white" onClick={() => setIsDownloadModalOpen(true)}>
            <Download size={18} /> Download Statement
          </Button>
          <Button className="flex items-center gap-2 font-bold shadow-lg shadow-primary/20" onClick={() => setIsExportModalOpen(true)}>
            <FileText size={18} /> Export Earnings
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Monthly Commission" value="R8,450" icon={TrendingUp} color="blue" />
        <StatCard title="Total Earnings" value="R52,400" icon={Wallet} color="navy" />
        <StatCard title="Paid Commission" value="R51,200" icon={CheckCircle2} color="emerald" />
        <StatCard title="Unpaid Commission" value="R1,200" icon={Clock} color="rose" />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* 📈 MONTHLY EARNINGS CHART */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Earnings Overview</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Paid vs Unpaid Performance</p>
              </div>
              <div className="flex items-center gap-4">
                <LegendItem color="#2E3A74" label="Paid" />
                <LegendItem color="#49B6FF" label="Unpaid" />
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                  />
                  <Bar dataKey="paid" fill="#2E3A74" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="unpaid" fill="#49B6FF" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 📋 COMMISSION TABLE */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-900 tracking-tight">Commission Breakdown</h3>
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search borrower..." className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/10 w-48" />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                    <th className="px-8 py-6 border-b border-slate-100">Loan Info</th>
                    <th className="px-8 py-6 border-b border-slate-100 text-center">Comm %</th>
                    <th className="px-8 py-6 border-b border-slate-100">Earned</th>
                    <th className="px-8 py-6 border-b border-slate-100">Status</th>
                    <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {commissions.map((comm, i) => (
                    <motion.tr 
                      key={comm.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase">
                            {comm.borrower.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{comm.borrower}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{comm.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900">{comm.loanAmount}</p>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{comm.loanType}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-black border border-primary/10">
                           {comm.percent}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-slate-900">{comm.earned}</td>
                      <td className="px-8 py-5">
                        <StatusBadge status={comm.status} />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => { setSelectedEarning(comm); setIsDrawerOpen(true); }}
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
        </div>

        <div className="space-y-8">
           {/* 📈 EARNINGS SUMMARY SECTION */}
           <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10 space-y-6">
                <div>
                   <h4 className="text-lg font-black tracking-tight">Earning Metrics</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live performance tracking</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   <MetricItem label="Active Commissions" value="18" icon={Briefcase} />
                   <MetricItem label="This Month" value="R8,450" icon={TrendingUp} isHighlight />
                   <MetricItem label="Pending Payouts" value="R1,200" icon={Clock} />
                   <MetricItem label="Completed Payouts" value="R51,200" icon={CheckCircle2} />
                </div>
             </div>
           </section>

           {/* 📌 RECENT PAYOUTS SECTION */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
             <div className="flex items-center justify-between">
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Payouts</h3>
               <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><BarChart3 size={18} className="text-slate-400" /></button>
             </div>
             <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-50">
                {recentPayouts.map(payout => (
                   <div key={payout.id} className="flex gap-4 relative group">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center relative z-10 border-2 border-white shadow-sm transition-transform group-hover:scale-110",
                        payout.status === 'completed' ? "bg-emerald-50 text-emerald-500" :
                        payout.status === 'active' ? "bg-blue-50 text-blue-500" :
                        "bg-amber-50 text-amber-500"
                      )}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </div>
                      <div className="min-w-0">
                         <h5 className="text-[11px] font-black text-slate-900 leading-none">{payout.title}</h5>
                         <p className="text-[10px] font-medium text-slate-500 mt-1">{payout.desc}</p>
                         <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{payout.time}</p>
                      </div>
                   </div>
                ))}
             </div>
             <Button variant="secondary" className="w-full font-bold text-[10px] uppercase tracking-widest border-slate-100" onClick={() => setIsDownloadModalOpen(true)}>
               Download All History
             </Button>
           </section>
        </div>
      </div>

      {/* 👤 EARNINGS DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Commission Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedEarning?.id}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <User size={14} className="text-primary" /> Borrower Information
                   </h4>
                   <div className="grid grid-cols-1 gap-5">
                      <DrawerItem icon={User} label="Borrower Name" value={selectedEarning?.borrower} />
                      <DrawerItem icon={Briefcase} label="Loan Type" value={selectedEarning?.loanType} />
                      <DrawerItem icon={DollarSign} label="Loan Amount" value={selectedEarning?.loanAmount} />
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" /> Commission Calculation
                   </h4>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-8">
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                         <p className="text-xl font-black text-slate-900">{selectedEarning?.percent}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Earned Amount</p>
                         <p className="text-xl font-black text-emerald-500">{selectedEarning?.earned}</p>
                      </div>
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Info size={14} className="text-primary" /> Payout Status
                   </h4>
                   <div className="grid grid-cols-1 gap-5">
                      <DrawerItem icon={PieChart} label="Current Status" value={selectedEarning?.status} />
                      <DrawerItem icon={Calendar} label="Payment Date" value={selectedEarning?.date} />
                   </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                 <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => setIsDownloadModalOpen(true)}>
                    Download Voucher
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 📄 EXPORT MODAL */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Export Earnings" maxWidth="max-w-xl">
         <div className="space-y-8">
            <div className="grid grid-cols-3 gap-3">
               <ExportOption icon={FileText} label="PDF Report" color="rose" />
               <ExportOption icon={FileSpreadsheet} label="CSV Data" color="emerald" />
               <ExportOption icon={PieChart} label="Excel Sheet" color="blue" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label>
                  <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600">
                     <option>Last 30 Days</option>
                     <option>This Quarter</option>
                     <option>Last 6 Months</option>
                     <option>Custom Range</option>
                  </select>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
                  <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600">
                     <option>All Statuses</option>
                     <option>Paid Only</option>
                     <option>Unpaid Only</option>
                  </select>
               </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
               <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => setIsExportModalOpen(false)}>Start Export</Button>
            </div>
         </div>
      </Modal>

      {/* 📊 DOWNLOAD STATEMENT MODAL */}
      <Modal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} title="Download Statement" maxWidth="max-w-xl">
         <div className="space-y-8">
            <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex items-center gap-6">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                  <FileText size={32} />
               </div>
               <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">Monthly Statement</h4>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">Download your detailed commission breakdown for tax and record keeping.</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Month</label>
                  <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600">
                     <option>May 2026</option>
                     <option>April 2026</option>
                     <option>March 2026</option>
                  </select>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Format</label>
                  <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600">
                     <option>PDF Document</option>
                     <option>Excel Worksheet</option>
                  </select>
               </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
               <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsDownloadModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => setIsDownloadModalOpen(false)}>Download Now</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const FlowStep = ({ icon: Icon, label, status }) => (
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
      "text-[9px] font-black uppercase tracking-widest text-center max-w-[100px]",
      status === 'active' ? "text-primary" : "text-slate-400"
    )}>{label}</span>
  </div>
);

const FlowArrow = () => <div className="hidden md:block text-slate-100"><ArrowRight size={20} /></div>;

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const MetricItem = ({ label, value, icon: Icon, isHighlight }) => (
  <div className="flex items-center justify-between group cursor-default">
    <div className="flex items-center gap-4">
       <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-all">
          <Icon size={16} />
       </div>
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className={cn("text-lg font-black tracking-tight", isHighlight ? "text-primary shadow-glow" : "text-white")}>{value}</p>
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

const ExportOption = ({ icon: Icon, label, color }) => (
   <button className="flex flex-col items-center gap-3 p-6 rounded-[2rem] border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all group">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
        color === 'rose' ? "bg-rose-50 text-rose-500" :
        color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
        "bg-blue-50 text-blue-500"
      )}>
         <Icon size={24} />
      </div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900">{label}</span>
   </button>
);

export default Earnings;
