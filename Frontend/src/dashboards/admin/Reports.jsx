import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Eye, Search, Filter, 
  MoreVertical, Calendar, TrendingUp, PieChart, 
  FileText, Briefcase, Users, AlertCircle, 
  DollarSign, Activity, ArrowRight, X, Mail,
  Printer, CheckCircle2, Trash2, FileUp, ShieldCheck,
  ChevronRight, Wallet, History, CreditCard, Layout, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { cn } from '../../utils/cn';
import reportService from '../../services/reportService';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ totalCollections: 0, totalLoans: 0, activeBorrowers: 0, overduePayments: 0, agentCommissions: 0 });
  const [chartData, setChartData] = useState([]);
  const [loanPerf, setLoanPerf] = useState({ approved: 0, active: 0, completed: 0, overdue: 0 });
  const [borrowerPerf, setBorrowerPerf] = useState({ active: 0, new: 0, overdue: 0, blacklisted: 0 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [genCategory, setGenCategory] = useState('Loan Reports');
  const [genType, setGenType] = useState('Detailed Summary');
  const [genDateFrom, setGenDateFrom] = useState('');
  const [genDateTo, setGenDateTo] = useState('');
  const [genFormat, setGenFormat] = useState('PDF');

  const [exportFormat, setExportFormat] = useState('PDF');

  const [activeModal, setActiveModal] = useState(null); // 'generate', 'export', 'delete'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedReport, setSelectedReport] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartRes, loanRes, borrowerRes, reportsRes] = await Promise.all([
        reportService.getReportStats(),
        reportService.getCollectionsOverview(),
        reportService.getLoanPerformance(),
        reportService.getBorrowerOverview(),
        reportService.getAllReports({ search: searchQuery, limit: 100 })
      ]);

      setStats(statsRes.data.data);
      setChartData(chartRes.data.data.data);
      setLoanPerf(loanRes.data.data);
      setBorrowerPerf(borrowerRes.data.data);
      setReports(reportsRes.data.data.reports);
    } catch (err) {
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [searchQuery]);

  const openModal = (type, report = null) => {
    setSelectedReport(report);
    setActiveModal(type);
    setOpenMenuId(null);
  };

  const openDrawer = async (type, report) => {
    setActiveDrawer(type);
    setOpenMenuId(null);
    try {
      const res = await reportService.getSingleReport(report._id);
      setSelectedReport(res.data.data.report);
    } catch (err) {
      toast.error('Failed to fetch report details');
    }
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const handleGenerate = async () => {
    try {
      setIsSubmitting(true);
      const dateRange = genDateFrom && genDateTo ? `${genDateFrom} to ${genDateTo}` : 'All Time';
      await reportService.generateReport({
        reportCategory: genCategory,
        reportType: genType,
        dateRange,
        exportFormat: genFormat
      });
      toast.success('Report generated successfully');
      fetchDashboardData();
      closeModal();
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await reportService.deleteReport(selectedReport._id);
      toast.success('Report deleted successfully');
      fetchDashboardData();
      closeModal();
    } catch (err) {
      toast.error('Failed to delete report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportFile = async () => {
    try {
      if (selectedReport) {
        await reportService.exportReport(selectedReport._id, { exportFormat });
      }
      
      if (exportFormat === 'PDF') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Point.47 Analytics Export", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.save(`Export_${new Date().getTime()}.pdf`);
      } else {
        const headers = ["Dummy,Export,Data\n"];
        const rows = "1,2,3";
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Export_${new Date().getTime()}.csv`;
        link.click();
      }

      toast.success('Report exported successfully');
      fetchDashboardData();
      closeModal();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 font-medium mt-1">View business analytics, loan performance, and export financial reports.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export Reports
           </Button>
           <Button onClick={() => openModal('generate')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20 bg-primary">
             <BarChart3 size={18} /> Generate Report
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Collections" value={`R ${stats.totalCollections?.toLocaleString()}`} icon={DollarSign} color="navy" />
        <StatCard title="Total Loans" value={stats.totalLoans?.toLocaleString()} icon={Briefcase} color="blue" />
        <StatCard title="Active Borrowers" value={stats.activeBorrowers?.toLocaleString()} icon={Users} color="emerald" />
        <StatCard title="Overdue Payments" value={stats.overduePayments?.toLocaleString()} icon={AlertCircle} color="rose" />
        <StatCard title="Agent Commissions" value={`R ${stats.agentCommissions?.toLocaleString()}`} icon={TrendingUp} color="navy" />
      </section>

      {/* 3. CHARTS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Collections Chart */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-lg font-black text-slate-900">Collections Overview</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly performance</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-primary" />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Collections</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-accent" />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Repayments</span>
                  </div>
               </div>
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <defs>
                        <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#2E3A74" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#2E3A74" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRepay" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#49B6FF" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#49B6FF" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                     <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}}
                        dy={10}
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}}
                        tickFormatter={(value) => `R${(value/1000).toFixed(0)}k`}
                     />
                     <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                     />
                     <Area type="monotone" dataKey="collections" stroke="#2E3A74" strokeWidth={3} fillOpacity={1} fill="url(#colorColl)" />
                     <Area type="monotone" dataKey="repayments" stroke="#49B6FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRepay)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Loan Performance Summary */}
         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft h-full">
               <h3 className="text-lg font-black text-slate-900 mb-6">Loan Performance</h3>
               <div className="space-y-4">
                  <PerformanceItem label="Approved Loans" value={loanPerf.approved?.toLocaleString()} subValue="Total Approved" color="text-primary" icon={ShieldCheck} />
                  <PerformanceItem label="Active Loans" value={loanPerf.active?.toLocaleString()} subValue="Currently Repaying" color="text-blue-500" icon={Activity} />
                  <PerformanceItem label="Completed" value={loanPerf.completed?.toLocaleString()} subValue="Fully Settled" color="text-emerald-600" icon={CheckCircle2} />
                  <PerformanceItem label="Overdue Loans" value={loanPerf.overdue?.toLocaleString()} subValue="Action Required" color="text-rose-500" icon={AlertCircle} />
               </div>
               
               <div className="mt-10 pt-10 border-t border-slate-50">
                  <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                     <Users size={16} className="text-primary" /> Borrower Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryBox label="Total Active" value={borrowerPerf.active?.toLocaleString()} />
                     <SummaryBox label="New (30d)" value={borrowerPerf.new?.toLocaleString()} />
                     <SummaryBox label="Overdue" value={borrowerPerf.overdue?.toLocaleString()} />
                     <SummaryBox label="Blacklisted" value={borrowerPerf.blacklisted?.toLocaleString()} />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 4. REPORTS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 rounded-t-[2.5rem]">
           <h3 className="text-lg font-black text-slate-900">Recent Reports</h3>
           <div className="flex items-center gap-3">
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search reports..." 
                     className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 transition-all w-64" 
                  />
               </div>
           </div>
        </div>
        <div className="overflow-visible pb-4">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Name</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated By</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Format</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr>
                       <td colSpan="6" className="px-8 py-12 text-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Reports...</p>
                       </td>
                    </tr>
                 ) : reports.length === 0 ? (
                    <tr>
                       <td colSpan="6" className="px-8 py-12 text-center">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Reports Found</p>
                       </td>
                    </tr>
                 ) : reports.map((r, index) => (
                    <tr key={r._id} className={cn("group hover:bg-slate-50/50 transition-all", openMenuId === r._id && "relative z-[100]")}>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                                <FileText size={18} />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{r.reportTitle}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{r.reportCode}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <StatusBadge status={r.reportCategory} className="text-[10px] px-3 py-0.5" />
                       </td>
                       <td className="px-6 py-5 text-sm font-bold text-slate-600">
                          {r.generatedBy?.firstName} {r.generatedBy?.lastName}
                       </td>
                       <td className="px-6 py-5 text-center text-xs font-bold text-slate-500 uppercase">
                          {new Date(r.generatedDate).toLocaleDateString('en-GB')}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={r.exportFormat} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', r)} tooltip="View Report" />
                             <TableAction icon={Download} color="text-primary hover:bg-primary/5" onClick={() => openModal('export', r)} tooltip="Export" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === r._id ? null : r._id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === r._id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === r._id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className={cn(
                                            "absolute right-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-[101]",
                                            index >= reports.length - 2 && reports.length > 2 ? "bottom-full mb-2" : "top-full mt-2"
                                         )}
                                      >
                                         <DropdownItem icon={Mail} label="Email Report" onClick={() => openModal('export', r)} />
                                         <DropdownItem icon={Printer} label="Print PDF" onClick={() => openModal('export', r)} />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={Trash2} 
                                            label="Delete Report" 
                                            color="text-rose-600 hover:bg-rose-50"
                                            onClick={() => openModal('delete', r)} 
                                         />
                                      </motion.div>
                                   )}
                                </AnimatePresence>
                             </div>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </section>

      {/* --- MODALS & DRAWERS --- */}

      {/* GENERATE MODAL */}
      <Modal isOpen={activeModal === 'generate'} onClose={closeModal} title="Generate New Report" maxWidth="max-w-md">
         <div className="space-y-6">
            <Input label="Report Category" type="select" value={genCategory} onChange={e=>setGenCategory(e.target.value)}>
               <option>Loan Reports</option>
               <option>Payment Reports</option>
               <option>Collections Reports</option>
               <option>Borrower Reports</option>
               <option>Agent Commission Reports</option>
            </Input>
            <div className="grid grid-cols-2 gap-4">
               <Input label="From Date" type="date" value={genDateFrom} onChange={e=>setGenDateFrom(e.target.value)} />
               <Input label="To Date" type="date" value={genDateTo} onChange={e=>setGenDateTo(e.target.value)} />
            </div>
            <Input label="Report Type" type="select" value={genType} onChange={e=>setGenType(e.target.value)}>
               <option>Detailed Summary</option>
               <option>Analytics Only</option>
               <option>Raw Data Export</option>
            </Input>
            <Input label="Export Format" type="select" value={genFormat} onChange={e=>setGenFormat(e.target.value)}>
               <option>PDF</option>
               <option>CSV</option>
               <option>Excel</option>
            </Input>
            <Button onClick={handleGenerate} disabled={isSubmitting} className="w-full py-4 shadow-lg shadow-primary/20">
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Generate Report'}
            </Button>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Report" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose your preferred format for the data export.</p>
            <div className="grid grid-cols-2 gap-3">
               <ExportCard label="PDF" icon={FileText} active={exportFormat === 'PDF'} onClick={() => setExportFormat('PDF')} />
               <ExportCard label="CSV" icon={Activity} active={exportFormat === 'CSV'} onClick={() => setExportFormat('CSV')} />
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-50">
               <Input label="Date Range" type="select">
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Current Year</option>
                  <option>Custom Range</option>
               </Input>
            </div>
            <Button onClick={handleExportFile} className="w-full py-4 shadow-lg shadow-primary/20">Generate Export</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Report" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Permanently Delete?</h4>
               <p className="text-sm text-slate-500 mt-2">You are removing <span className="font-bold text-slate-900">{selectedReport?.reportTitle}</span>. This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={handleDelete} disabled={isSubmitting} className="flex-1 shadow-lg shadow-rose-200">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
               </Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Report Preview"
         width="max-w-2xl"
      >
         {selectedReport && (
            <div className="space-y-10">
               {/* Header */}
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg border border-white/10">
                     <FileText size={40} />
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-white tracking-tight">{selectedReport.reportTitle}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedReport.reportCode}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedReport.reportCategory} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xs font-bold text-slate-400 ml-2">Generated on {new Date(selectedReport.generatedDate).toLocaleDateString('en-GB')}</span>
                     </div>
                  </div>
               </div>

               {/* Snapshot */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Activity size={14} className="text-primary" /> Report Summary
                  </h4>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-700 leading-relaxed">
                     {selectedReport.reportSummary}
                  </div>
               </div>

               {/* Business Summary Area */}
               <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 space-y-6 shadow-sm">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Business Snapshot Included</h4>
                  <div className="space-y-4">
                     <ReviewRow label="Total Collections" value={`R ${selectedReport.totalCollections?.toLocaleString()}`} />
                     <ReviewRow label="Overdue Amount" value={`R ${selectedReport.overduePayments?.toLocaleString()}`} />
                     <ReviewRow label="Active Loans" value={selectedReport.totalLoans?.toLocaleString()} />
                     <ReviewRow label="Active Borrowers" value={selectedReport.activeBorrowers?.toLocaleString()} />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="ghost" className="flex-1" onClick={() => openModal('export', selectedReport)}>Export File</Button>
                  <Button onClick={closeDrawer} className="flex-1 shadow-lg shadow-primary/20">Close Preview</Button>
               </div>
            </div>
         )}
      </Drawer>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const TableAction = ({ icon: Icon, color, onClick, tooltip }) => (
  <button 
     onClick={onClick}
     className={cn("p-2 rounded-xl transition-all", color)}
     title={tooltip}
  >
     <Icon size={18} />
  </button>
);

const DropdownItem = ({ icon: Icon, label, onClick, color }) => (
   <button 
      onClick={(e) => {
         e.stopPropagation();
         onClick();
      }}
      className={cn(
         "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
         color || "text-slate-600 hover:bg-slate-50 hover:text-primary"
      )}
   >
      <Icon size={16} />
      {label}
   </button>
);

const PerformanceItem = ({ label, value, subValue, color, icon: Icon }) => (
   <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-primary transition-all">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color.replace('text', 'bg').replace('600', '50').replace('500', '50'))}>
         <Icon size={24} className={color} />
      </div>
      <div className="flex-1">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
         <div className="flex items-baseline gap-2 mt-0.5">
            <span className={cn("text-lg font-black", color)}>{value}</span>
            <span className="text-[10px] font-bold text-slate-400">{subValue}</span>
         </div>
      </div>
   </div>
);

const SummaryBox = ({ label, value }) => (
   <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-center hover:border-primary transition-all group">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
   </div>
);

const ReviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-1">
     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-black text-slate-900">{value}</span>
  </div>
);

const ExportCard = ({ label, icon: Icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
       "flex flex-col items-center justify-center p-6 border rounded-3xl transition-all group",
       active ? "border-primary bg-primary/5 text-primary" : "bg-slate-50 border-slate-100 hover:border-primary hover:bg-primary/5 text-slate-500"
    )}
  >
     <Icon size={28} className={cn("mb-3 transition-colors", active ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
     <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", active ? "text-primary" : "group-hover:text-primary")}>{label}</span>
  </button>
);

export default Reports;
