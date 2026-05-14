import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, TrendingUp, CreditCard, Clock, 
  Search, Filter, RefreshCw, Eye, 
  Download, Calendar, ChevronRight, 
  CheckCircle2, AlertCircle, ArrowUpRight, 
  ArrowRight, PieChart, Activity, User, 
  FileText, ExternalLink, X, MapPin, Building2, Briefcase, Info, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import agentEarningsService from '../../services/agentEarningsService';
import { toast } from 'react-hot-toast';
import { initiateSocketConnection, disconnectSocket } from '../../socket/socketClient';

const Earnings = () => {
  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [recentPayouts, setRecentPayouts] = useState(null);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  
  // Detail States
  const [selectedCommissionId, setSelectedCommissionId] = useState(null);
  const [commissionDetail, setCommissionDetail] = useState(null);

  // Form States
  const [exportForm, setExportForm] = useState({ format: 'PDF', startDate: '', endDate: '', paymentStatus: 'All Statuses' });
  const [statementForm, setStatementForm] = useState({ month: new Date().toLocaleString('default', { month: 'long' }), year: new Date().getFullYear(), format: 'PDF' });

  // Fetch Logic
  const fetchDashboard = async () => {
    try {
      const res = await agentEarningsService.getEarningsDashboard();
      if (res.success) setDashboardData(res.data);
    } catch (error) {
      console.error('Earnings Dashboard Error:', error);
    }
  };

  const fetchTable = useCallback(async (silent = false) => {
    if (!silent) setTableLoading(true);
    try {
      const res = await agentEarningsService.getEarningsTable({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        status: filterStatus !== 'All Statuses' ? filterStatus : ''
      });
      if (res.success) {
        setCommissions(res.data.commissions);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load earnings table');
    } finally {
      if (!silent) setTableLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, filterStatus]);

  const fetchRecent = async () => {
    try {
      const res = await agentEarningsService.getRecentPayouts();
      if (res.success) setRecentPayouts(res.data);
    } catch (error) {
      console.error('Recent Payouts Error:', error);
    }
  };

  // Initial Load & Real-time Integration
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchTable(true), fetchRecent()]);
      setLoading(false);
    };
    init();

    const token = localStorage.getItem('token');
    const socket = initiateSocketConnection(token);

    socket.on('commission:generated', (data) => {
      fetchDashboard();
      fetchTable(true);
      fetchRecent();
      toast.success(data.message || 'New commission generated!');
    });

    socket.on('payout:paid', () => {
      fetchDashboard();
      fetchTable(true);
      fetchRecent();
      toast.success('Commission payout processed!');
    });

    return () => {
      socket.off('commission:generated');
      socket.off('payout:paid');
      disconnectSocket();
    };
  }, [fetchTable]);

  // Actions
  const handleViewDetail = async (id) => {
    setSelectedCommissionId(id);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await agentEarningsService.getEarningDetails(id);
      if (res.success) setCommissionDetail(res.data);
    } catch (error) {
      toast.error('Failed to load details');
      setIsDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleExport = async () => {
    setModalLoading(true);
    try {
      const res = await agentEarningsService.exportEarnings(exportForm);
      if (res.success && res.data.commissions) {
        const data = res.data.commissions;
        
        if (exportForm.format === 'PDF') {
          const doc = new jsPDF();
          doc.setFontSize(20);
          doc.setTextColor(46, 58, 116);
          doc.text("Point.47 Loan Management", 14, 15);
          
          doc.setFontSize(14);
          doc.setTextColor(100, 100, 100);
          doc.text("Agent Earnings Report", 14, 25);
          
          doc.setFontSize(10);
          doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
          doc.text(`Filters: ${exportForm.paymentStatus} | ${exportForm.startDate || 'Start'} to ${exportForm.endDate || 'End'}`, 14, 38);

          const tableColumn = ["Code", "Borrower", "Loan", "Amount", "Earned", "Status", "Date"];
          const tableRows = data.map(c => [
            c.commissionCode,
            c.borrowerName,
            c.loanCode,
            formatCurrency(c.loanAmount),
            formatCurrency(c.commissionAmount),
            c.status,
            formatDate(c.createdAt)
          ]);

          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [46, 58, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
          });

          doc.save(`Earnings_Report_${new Date().getTime()}.pdf`);
          toast.success('PDF Report generated successfully');
        } else {
          // CSV or Excel (Basic CSV for both as standard in this repo)
          const headers = ["Commission Code,Borrower,Loan Code,Loan Amount,Earned Amount,Status,Date\n"];
          const rows = data.map(c => 
            `${c.commissionCode},"${c.borrowerName}",${c.loanCode},${c.loanAmount},${c.commissionAmount},${c.status},${formatDate(c.createdAt)}`
          ).join("\n");
          
          const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `Earnings_Data_${new Date().getTime()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('CSV Data exported successfully');
        }
        setIsExportModalOpen(false);
      }
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownloadStatement = async () => {
    setModalLoading(true);
    try {
      const res = await agentEarningsService.downloadStatement(statementForm);
      if (res.success && res.data.commissions) {
        const { commissions: data, summary } = res.data;
        
        if (statementForm.format === 'PDF') {
          const doc = new jsPDF();
          doc.setFontSize(22);
          doc.setTextColor(46, 58, 116);
          doc.text("Point.47 Earnings Statement", 14, 20);
          
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text(`Period: ${statementForm.month} ${statementForm.year}`, 14, 30);
          doc.text(`Agent: ${dashboardData?.agentName || 'Authenticated Agent'}`, 14, 37);

          // Summary Box
          doc.setDrawColor(240, 240, 240);
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(14, 45, 180, 25, 3, 3, 'FD');
          
          doc.setFontSize(10);
          doc.setTextColor(46, 58, 116);
          doc.text("TOTAL EARNED", 25, 55);
          doc.text("TOTAL PAID", 85, 55);
          doc.text("COMMISSIONS", 145, 55);
          
          doc.setFontSize(12);
          doc.text(formatCurrency(summary.totalEarned), 25, 63);
          doc.text(formatCurrency(summary.totalPaid), 85, 63);
          doc.text(summary.count.toString(), 145, 63);

          const tableColumn = ["Date", "Code", "Borrower", "Loan Code", "Loan Amount", "Commission", "Status"];
          const tableRows = data.map(c => [
            formatDate(c.date),
            c.commissionCode,
            c.borrowerName,
            c.loanCode,
            formatCurrency(c.loanAmount),
            formatCurrency(c.commissionAmount),
            c.status
          ]);

          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 80,
            theme: 'striped',
            headStyles: { fillColor: [46, 58, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8 },
          });

          doc.save(`Statement_${statementForm.month}_${statementForm.year}.pdf`);
          toast.success('Statement downloaded successfully');
        } else {
          const headers = ["Date,Code,Borrower,Loan Code,Loan Amount,Commission,Status\n"];
          const rows = data.map(c => 
            `${formatDate(c.date)},${c.commissionCode},"${c.borrowerName}",${c.loanCode},${c.loanAmount},${c.commissionAmount},${c.status}`
          ).join("\n");
          
          const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `Statement_${statementForm.month}_${statementForm.year}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Statement exported successfully');
        }
        setIsStatementModalOpen(false);
      }
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setModalLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-white rounded-3xl" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-8">
           <div className="col-span-2 h-96 bg-white rounded-[2.5rem]" />
           <div className="h-96 bg-white rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-slate-500 font-medium mt-1">Track commissions, monthly earnings, and payout history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white" onClick={() => setIsStatementModalOpen(true)}>
            <Download size={18} /> Statement
          </Button>
          <Button className="flex items-center gap-2 font-bold shadow-lg shadow-primary/20" onClick={() => setIsExportModalOpen(true)}>
            <FileText size={18} /> Export Earnings
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Monthly Commission" value={formatCurrency(dashboardData?.analytics?.monthlyCommission)} icon={TrendingUp} color="navy" />
        <StatCard title="Total Earnings" value={formatCurrency(dashboardData?.analytics?.totalEarnings)} icon={Wallet} color="blue" />
        <StatCard title="Paid Commission" value={formatCurrency(dashboardData?.analytics?.paidCommission)} icon={CheckCircle2} color="emerald" />
        <StatCard title="Unpaid Commission" value={formatCurrency(dashboardData?.analytics?.unpaidCommission)} icon={Clock} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. CHART SECTION */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Monthly Performance</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Paid vs Unpaid Breakdown</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unpaid</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-800">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{payload[0].payload.month}</p>
                          <div className="space-y-1">
                            <p className="text-xs font-black text-emerald-400 flex justify-between gap-8">
                               Paid: <span>{formatCurrency(payload[0].value)}</span>
                            </p>
                            <p className="text-xs font-black text-rose-400 flex justify-between gap-8">
                               Unpaid: <span>{formatCurrency(payload[1].value)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="paid" fill="#1e293b" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="unpaid" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. EARNINGS SUMMARY PANEL */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-150 group-hover:bg-primary/20" />
          
          <div className="relative z-10 space-y-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Earnings Summary</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Operational Progress</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SummaryRow label="Active Commissions" value={dashboardData?.summary?.activeCommissions} color="blue" />
              <SummaryRow label="This Month Earnings" value={formatCurrency(dashboardData?.summary?.thisMonthEarnings)} color="emerald" isCurrency />
              <SummaryRow label="Pending Payouts" value={dashboardData?.summary?.pendingPayouts} color="amber" />
              <SummaryRow label="Completed Payouts" value={dashboardData?.summary?.completedPayouts} color="emerald" />
            </div>

            <div className="pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Payout Threshold</span>
                 <span className="text-xs font-black text-white">75%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full bg-primary" />
              </div>
              <p className="text-[10px] font-bold text-slate-600 mt-4 leading-relaxed">
                * Commissions are processed every Friday for approved loans from the previous week.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. COMMISSION TABLE */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by borrower or loan ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm"
              />
           </div>
           <div className="flex items-center gap-3">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm"
              >
                <option>All Statuses</option>
                <option>Pending</option>
                <option>Processing</option>
                <option>Paid</option>
              </select>
              <Button onClick={() => fetchTable()} variant="secondary" className="px-6 py-4 rounded-2xl border-slate-100 bg-white">
                 <RefreshCw size={18} className={tableLoading ? "animate-spin" : ""} />
              </Button>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                  <th className="px-8 py-6 border-b border-slate-100">Loan Info</th>
                  <th className="px-8 py-6 border-b border-slate-100">Commission %</th>
                  <th className="px-8 py-6 border-b border-slate-100">Earned Amount</th>
                  <th className="px-8 py-6 border-b border-slate-100">Status</th>
                  <th className="px-8 py-6 border-b border-slate-100">Payment Date</th>
                  <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tableLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="7" className="px-8 py-6 h-16 bg-slate-50/20" />
                    </tr>
                  ))
                ) : commissions.length > 0 ? (
                  commissions.map((comm, i) => (
                    <motion.tr 
                      key={comm.commissionId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase border border-primary/10">
                            {comm.borrowerName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{comm.borrowerName}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{comm.commissionCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900">{formatCurrency(comm.loanAmount)}</p>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{comm.loanType}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{comm.commissionPercent}%</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                         </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-primary">{formatCurrency(comm.commissionAmount)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge status={comm.paymentStatus} />
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">{formatDate(comm.paymentDate)}</td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleViewDetail(comm.commissionId)}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Coins size={48} />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">No commission records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. RECENT PAYOUTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" /> Latest Paid
            </h4>
            <div className="space-y-4">
               {recentPayouts?.recentPaid?.length > 0 ? recentPayouts.recentPaid.map((p, idx) => (
                 <PayoutItem key={idx} name={p.borrowerId?.fullName} amount={formatCurrency(p.commissionAmount)} date={formatDate(p.payoutDate)} color="emerald" />
               )) : <p className="text-[10px] font-bold text-slate-300 text-center py-4 uppercase">None</p>}
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
              <Clock size={14} className="text-amber-500" /> Pending Payouts
            </h4>
            <div className="space-y-4">
               {recentPayouts?.pendingPayouts?.length > 0 ? recentPayouts.pendingPayouts.map((p, idx) => (
                 <PayoutItem key={idx} name={p.borrowerId?.fullName} amount={formatCurrency(p.commissionAmount)} date={formatDate(p.createdAt)} color="amber" />
               )) : <p className="text-[10px] font-bold text-slate-300 text-center py-4 uppercase">None</p>}
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-500" /> Recent Approvals
            </h4>
            <div className="space-y-4">
               {recentPayouts?.recentApprovals?.length > 0 ? recentPayouts.recentApprovals.map((p, idx) => (
                 <PayoutItem key={idx} name={p.borrowerId?.fullName} amount={formatCurrency(p.commissionAmount)} date={formatDate(p.createdAt)} color="blue" />
               )) : <p className="text-[10px] font-bold text-slate-300 text-center py-4 uppercase">None</p>}
            </div>
         </div>
      </div>

      {/* 👤 EARNINGS DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Commission Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{commissionDetail?.commission?.commissionCode}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              {drawerLoading ? (
                <div className="flex-1 p-8 space-y-8 animate-pulse">
                  <div className="h-40 bg-slate-50 rounded-3xl" />
                  <div className="h-40 bg-slate-50 rounded-3xl" />
                  <div className="h-40 bg-slate-50 rounded-3xl" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  {/* BORROWER INFO */}
                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <User size={14} className="text-primary" /> Borrower Information
                    </h4>
                    <div className="grid grid-cols-1 gap-5">
                      <DrawerItem icon={User} label="Borrower Name" value={commissionDetail?.borrower?.fullName} />
                      <DrawerItem icon={CreditCard} label="Contact Phone" value={commissionDetail?.borrower?.phone} />
                      <DrawerItem icon={Wallet} label="Loan Amount" value={formatCurrency(commissionDetail?.loan?.loanAmount)} />
                    </div>
                  </section>

                  {/* LOAN INFO */}
                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Briefcase size={14} className="text-primary" /> Loan Breakdown
                    </h4>
                    <div className="grid grid-cols-1 gap-5">
                      <DrawerItem icon={Building2} label="Loan Type" value={commissionDetail?.loan?.loanType} />
                      <DrawerItem icon={Clock} label="Duration" value={`${commissionDetail?.loan?.loanDuration} Months`} />
                      <DrawerItem icon={Calendar} label="Approval Date" value={formatDate(commissionDetail?.loan?.approvalDate)} />
                    </div>
                  </section>

                  {/* COMMISSION SUMMARY */}
                  <section className="space-y-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <PieChart size={14} className="text-primary" /> Earning Calculation
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                          <p className="text-lg font-black text-slate-900">{commissionDetail?.commission?.commissionPercent}%</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Earned</p>
                          <p className="text-lg font-black text-primary">{formatCurrency(commissionDetail?.commission?.earnedAmount)}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Payout Status</p>
                          <StatusBadge status={commissionDetail?.commission?.payoutStatus} />
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Payout Date</p>
                          <p className="text-[11px] font-black text-slate-900">{formatDate(commissionDetail?.commission?.payoutDate)}</p>
                       </div>
                    </div>
                  </section>
                </div>
              )}

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => setIsDrawerOpen(false)}>
                   Close Details
                </Button>
                <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200">
                  Contact Support
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 📄 STATEMENT MODAL */}
      <Modal isOpen={isStatementModalOpen} onClose={() => setIsStatementModalOpen(false)} title="Download Statement" maxWidth="max-w-md">
        <div className="space-y-6">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Month</label>
              <select 
                value={statementForm.month}
                onChange={(e) => setStatementForm({...statementForm, month: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10"
              >
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                  <option key={m}>{m}</option>
                ))}
              </select>
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Year</label>
              <select 
                value={statementForm.year}
                onChange={(e) => setStatementForm({...statementForm, year: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option>2026</option>
                <option>2025</option>
              </select>
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Format</label>
              <div className="grid grid-cols-3 gap-3">
                 {['PDF', 'CSV', 'XLS'].map(f => (
                   <button 
                     key={f}
                     onClick={() => setStatementForm({...statementForm, format: f})}
                     className={cn(
                       "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                       statementForm.format === f ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100"
                     )}
                   >
                     {f}
                   </button>
                 ))}
              </div>
           </div>
           <Button disabled={modalLoading} className="w-full font-bold py-4 shadow-lg shadow-primary/20" onClick={handleDownloadStatement}>
              {modalLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Download Statement'}
           </Button>
        </div>
      </Modal>

      {/* 📤 EXPORT MODAL */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Export Earnings" maxWidth="max-w-md">
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                 <input 
                   type="date" 
                   value={exportForm.startDate}
                   onChange={(e) => setExportForm({...exportForm, startDate: e.target.value})}
                   className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold text-slate-600" 
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                 <input 
                   type="date" 
                   value={exportForm.endDate}
                   onChange={(e) => setExportForm({...exportForm, endDate: e.target.value})}
                   className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold text-slate-600" 
                 />
              </div>
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
              <select 
                value={exportForm.paymentStatus}
                onChange={(e) => setExportForm({...exportForm, paymentStatus: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option>All Statuses</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Processing</option>
              </select>
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Export Format</label>
              <div className="grid grid-cols-3 gap-3">
                 {['PDF', 'CSV', 'Excel'].map(f => (
                   <button 
                     key={f}
                     onClick={() => setExportForm({...exportForm, format: f})}
                     className={cn(
                       "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                       exportForm.format === f ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20" : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100"
                     )}
                   >
                     {f}
                   </button>
                 ))}
              </div>
           </div>
           <Button disabled={modalLoading} className="w-full font-bold py-4 shadow-lg shadow-primary/20" onClick={handleExport}>
              {modalLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Export Earnings'}
           </Button>
        </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SummaryRow = ({ label, value, color, isCurrency }) => (
  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-2 h-2 rounded-full",
        color === 'emerald' ? "bg-emerald-500" : color === 'blue' ? "bg-blue-500" : "bg-amber-500"
      )} />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-black text-white">{value}</span>
  </div>
);

const PayoutItem = ({ name, amount, date, color }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all hover:scale-[1.02] cursor-default">
    <div className="flex items-center gap-3">
       <div className={cn(
         "w-8 h-8 rounded-xl flex items-center justify-center",
         color === 'emerald' ? "bg-emerald-50 text-emerald-500" : color === 'amber' ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500"
       )}>
          <CheckCircle2 size={16} />
       </div>
       <div>
          <p className="text-[11px] font-black text-slate-900 leading-tight">{name}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{date}</p>
       </div>
    </div>
    <span className={cn(
      "text-xs font-black",
      color === 'emerald' ? "text-emerald-600" : "text-slate-900"
    )}>{amount}</span>
  </div>
);

const DrawerItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900 truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

export default Earnings;
