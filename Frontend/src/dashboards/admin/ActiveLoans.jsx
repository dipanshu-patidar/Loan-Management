import React, { useState } from 'react';
import { 
  Wallet, CalendarDays, BadgeCheck, Trash2, Eye, 
  Search, Download, MoreVertical, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, X, Calendar,
  Activity, ArrowUpRight, ArrowDownRight, History,
  ShieldCheck, Phone, Mail, UserCheck, CreditCard, FileUp, UserPlus, Users,
  FileText, Lock, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

import { toast } from 'react-hot-toast';
import activeLoanService from '../../services/activeLoanService';
import agentService from '../../services/agentService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loader2 } from 'lucide-react';
import repaymentService from '../../services/repaymentService';
import agreementService from '../../services/agreementService';
import AgreementPreviewModal from '../../components/AgreementPreviewModal';

const ActiveLoans = () => {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({ totalActiveLoans: 0, outstandingBalance: 0, overdueLoans: 0, completedThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Active', 'Overdue', 'Completed'
  const [activeModal, setActiveModal] = useState(null); // 'schedule', 'complete', 'export', 'delete', 'penalty', 'due-payments', 'notes', 'assign-agent'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Agent Assignment States
  const [availableAgents, setAvailableAgents] = useState([]);
  const [assignmentData, setAssignmentData] = useState({ agentId: '', notes: '', priority: 'Low' });
  const [isAgentsLoading, setIsAgentsLoading] = useState(false);
  
  const [duePayments, setDuePayments] = useState([]);
  const [isDuePaymentsLoading, setIsDuePaymentsLoading] = useState(false);

  const [adminNotes, setAdminNotes] = useState('');
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  // Close Loan states
  const [closureReason, setClosureReason] = useState('Fully Repaid');
  const [closureNotes, setClosureNotes] = useState('');

  const [isAgreementPreviewOpen, setIsAgreementPreviewOpen] = useState(false);
  const [agreementDetails, setAgreementDetails] = useState(null);

  const handleViewAgreement = async (loan) => {
    setSelectedLoan(loan);
    setIsAgreementPreviewOpen(true);
    try {
      const res = await agreementService.getAgreementStatus(loan.loanApplicationId || loan._id);
      setAgreementDetails(res.data);
    } catch (err) {
      setAgreementDetails({
        status: loan.loanStatus || 'Active',
        agreementGenerated: true,
        agreementGeneratedAt: loan.agreementGeneratedAt || loan.createdAt,
        agreementSignedAt: loan.agreementSignedAt || loan.createdAt,
        agreementStatus: loan.agreementStatus || 'SIGNED',
        otpHistory: []
      });
    }
  };

  const handleDownloadAgreement = async (loan) => {
    setSelectedLoan(loan);
    setIsAgreementPreviewOpen(true);
    toast.success('Opening digital agreement document...');
    try {
      const res = await agreementService.getAgreementStatus(loan.loanApplicationId || loan._id);
      setAgreementDetails(res.data);
    } catch (err) {
      setAgreementDetails({
        status: loan.loanStatus || 'Active',
        agreementGenerated: true,
        agreementGeneratedAt: loan.agreementGeneratedAt || loan.createdAt,
        agreementSignedAt: loan.agreementSignedAt || loan.createdAt,
        agreementStatus: loan.agreementStatus || 'SIGNED',
        otpHistory: []
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [loansRes, statsRes] = await Promise.all([
        activeLoanService.getAllActiveLoans({ search: searchQuery, status: activeTab === 'All' ? '' : activeTab, limit: 100 }),
        activeLoanService.getDashboardStats()
      ]);
      setLoans(loansRes.data.data?.activeLoans || []);
      setStats(statsRes.data.data || { totalActiveLoans: 0, outstandingBalance: 0, overdueLoans: 0, completedThisMonth: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch active loans data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, [searchQuery, activeTab]);

  const openModal = (type, loan = null) => {
    setSelectedLoan(loan);
    setActiveModal(type);
    setOpenMenuId(null);
    if (type === 'notes') setAdminNotes(loan?.notes || '');
    
    if (type === 'assign-agent') {
      fetchAvailableAgents();
      setAssignmentData({ agentId: '', notes: '', priority: 'Low' });
    }

    if (type === 'schedule') {
      fetchRepaymentSchedule(loan._id);
    }
  };

  const fetchRepaymentSchedule = async (loanId) => {
    try {
      setIsScheduleLoading(true);
      const res = await repaymentService.getLoanSchedule(loanId);
      setRepaymentSchedule(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch real-time schedule');
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const handleWaivePenalty = async (repaymentId) => {
    if (!window.confirm('Are you sure you want to waive this penalty?')) return;
    try {
      await repaymentService.waivePenalty(repaymentId);
      toast.success('Penalty waived');
      fetchRepaymentSchedule(selectedLoan._id);
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to waive penalty');
    }
  };

  const handleMarkDispute = async (repaymentId) => {
    const reason = window.prompt('Enter dispute reason:');
    if (!reason) return;
    try {
      await repaymentService.markDispute(repaymentId, reason);
      toast.success('Marked as Disputed');
      fetchRepaymentSchedule(selectedLoan._id);
    } catch (err) {
      toast.error('Failed to mark dispute');
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      setIsAgentsLoading(true);
      const res = await agentService.getAllAgents();
      // Filter for active agents
      const activeAgents = (res.data || []).filter(a => a.accountStatus === 'Active');
      setAvailableAgents(activeAgents);
    } catch (err) {
      toast.error('Failed to fetch available agents');
    } finally {
      setIsAgentsLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    try {
      if (!assignmentData.agentId) return toast.error('Please select an agent');
      setIsSubmitting(true);
      
      await activeLoanService.assignAgent({
        loanId: selectedLoan._id,
        agentId: assignmentData.agentId,
        notes: assignmentData.notes,
        priority: assignmentData.priority
      });
      
      toast.success('Agent assigned successfully');
      fetchDashboardData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDrawer = async (type, loan) => {
    setActiveDrawer(type);
    setOpenMenuId(null);
    try {
      const res = await activeLoanService.getLoanDetails(loan._id);
      setSelectedLoan(res.data.data.activeLoan);
    } catch (err) {
      toast.error('Failed to fetch loan details');
    }
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const handleUpdateStatus = async (status) => {
    try {
      setIsSubmitting(true);
      await activeLoanService.updateLoanStatus(selectedLoan._id, status);
      toast.success('Loan status updated');
      fetchDashboardData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNotes = async () => {
    try {
      setIsSubmitting(true);
      await activeLoanService.addAdminNotes(selectedLoan._id, adminNotes);
      toast.success('Loan notes added');
      fetchDashboardData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add notes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLoan = async () => {
    // Guard: only allow deletion of closed loans
    if (selectedLoan?.loanStatus !== 'Closed') {
      toast.error('Loan must be closed before deletion.');
      return;
    }
    try {
      setIsSubmitting(true);
      await activeLoanService.deleteLoan(selectedLoan._id);
      toast.success('Loan permanently deleted.');
      fetchDashboardData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseLoan = async () => {
    try {
      setIsSubmitting(true);
      await activeLoanService.closeLoan(selectedLoan._id, { closureReason, closureNotes });
      toast.success(`Loan ${selectedLoan.loanCode} closed successfully.`);
      fetchDashboardData();
      closeModal();
      setClosureReason('Fully Repaid');
      setClosureNotes('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDuePayments = async () => {
    setActiveModal('due-payments');
    try {
      setIsDuePaymentsLoading(true);
      const res = await activeLoanService.getDuePayments();
      setDuePayments(res.data.data.duePayments || []);
    } catch (err) {
      toast.error('Failed to fetch due payments');
    } finally {
      setIsDuePaymentsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await activeLoanService.getExportData();
      const exportData = res.data.data.activeLoans || [];

      if (exportFormat === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setTextColor(46, 58, 116);
        doc.text("Loan Management System", 14, 15);
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text("Active Loans Export", 14, 25);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

        const tableColumn = ["Loan Code", "Borrower", "Amount", "Balance", "Status", "Date"];
        const tableRows = exportData.map(l => [
          l.loanCode, l.borrowerName, `R ${l.approvedAmount}`, `R ${l.remainingBalance}`, l.loanStatus, new Date(l.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: [46, 58, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 3 },
        });

        doc.save(`ActiveLoans_Report_${new Date().getTime()}.pdf`);
        toast.success('PDF Export downloaded successfully!');
      } else if (exportFormat === 'csv') {
        const headers = ["Loan Code,Borrower,Amount,Balance,Status,Date\n"];
        const rows = exportData.map(l => 
          `${l.loanCode},"${l.borrowerName}",${l.approvedAmount},${l.remainingBalance},${l.loanStatus},${new Date(l.createdAt).toLocaleDateString()}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ActiveLoans_Data_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Data exported successfully!');
      }
      closeModal();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const tabs = [
    { id: 'All', label: 'All Loans', count: stats.totalActiveLoans + stats.overdueLoans + stats.completedThisMonth },
    { id: 'Active', label: 'Active', count: stats.totalActiveLoans },
    { id: 'Overdue', label: 'Overdue', count: stats.overdueLoans },
    { id: 'Completed', label: 'Completed', count: stats.completedThisMonth },
    { id: 'Closed', label: 'Closed', count: stats.closedLoans || 0 },
  ];

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Loans</h1>
          <p className="text-slate-500 font-medium mt-1">Manage approved running loans, repayment schedules, and overdue payments.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button onClick={handleViewDuePayments} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20 bg-primary">
             <Calendar size={18} /> View Due Payments
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Active Loans" value={(stats.totalActiveLoans || 0).toLocaleString()} icon={Wallet} color="navy" />
        <StatCard title="Outstanding Balance" value={`R ${(stats.outstandingBalance || 0).toLocaleString()}`} icon={Wallet} color="blue" />
        <StatCard title="Overdue Loans" value={(stats.overdueLoans || 0).toLocaleString()} icon={AlertTriangle} color="rose" />
        <StatCard title="Completed This Month" value={(stats.completedThisMonth || 0).toLocaleString()} icon={BadgeCheck} color="emerald" />
      </section>

      {/* 3. TABS SECTION */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap relative",
              activeTab === tab.id 
                ? "border-primary text-primary bg-primary/5" 
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === tab.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </section>

      {/* 4. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search borrower by name or loan ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Loan Status</option>
              <option>Active</option>
              <option>Overdue</option>
              <option>Completed</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Overdue Loans</option>
              <option>On Time</option>
              <option>Late</option>
           </select>
        </div>
      </section>

      {/* 5. ACTIVE LOANS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-visible">
        <div className="overflow-visible">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Loan Amount</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">EMI Amount</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Next Due</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Overdue</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Penalties</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr>
                       <td colSpan="9" className="px-8 py-12 text-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Loans...</p>
                       </td>
                    </tr>
                 ) : loans.length === 0 ? (
                    <tr>
                       <td colSpan="9" className="px-8 py-12 text-center">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Loans Found</p>
                       </td>
                    </tr>
                 ) : loans.map((loan) => (
                    <tr key={loan._id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             {loan.borrowerPhoto && loan.borrowerPhoto !== 'no-photo.jpg' ? (
                                <img src={loan.borrowerPhoto} alt="" className="w-11 h-11 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                             ) : (
                                <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                   {loan.borrowerName?.charAt(0) || 'B'}
                                </div>
                             )}
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{loan.borrowerName}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{loan.loanCode} • {loan.loanType}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                          R {loan.approvedAmount?.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-right font-black text-primary text-sm">
                          R {loan.emiAmount?.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                          R {loan.remainingBalance?.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <p className="text-xs font-bold text-slate-600">
                             {loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </p>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={loan.overdueStatus} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={loan.penaltyAmount > 0 ? 'Late Fee Applied' : 'No Penalty'} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={loan.loanStatus} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', loan)} tooltip="View Loan" />
                             <TableAction icon={CalendarDays} color="text-primary hover:bg-primary/5" onClick={() => openModal('schedule', loan)} tooltip="Repayment Schedule" />
                             {loan.loanStatus !== 'Closed' && (
                                <TableAction icon={Lock} color="text-amber-500 hover:bg-amber-50" onClick={() => openModal('close-loan', loan)} tooltip="Close Loan" />
                             )}
                             {loan.loanStatus === 'Active' && !loan.assignedAgent && (
                                <TableAction icon={UserPlus} color="text-violet-500 hover:bg-violet-50" onClick={() => openModal('assign-agent', loan)} tooltip="Assign Recovery Agent" />
                             )}
                             {loan.loanStatus === 'Closed' && (
                                <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', loan)} tooltip="Delete Loan" />
                             )}
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === loan._id ? null : loan._id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === loan._id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === loan._id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={BadgeCheck} 
                                            label="Mark Completed" 
                                            color="text-emerald-600 hover:bg-emerald-50"
                                            onClick={() => openModal('complete', loan)} 
                                         />
                                         <DropdownItem 
                                            icon={AlertTriangle} 
                                            label="Update Status" 
                                            onClick={() => openModal('status', loan)} 
                                         />
                                         <DropdownItem 
                                            icon={Activity} 
                                            label="Add Notes" 
                                            onClick={() => openModal('notes', loan)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={Download} 
                                            label="Export Statement" 
                                            onClick={() => openModal('export', loan)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={FileText} 
                                            label="View Agreement" 
                                            onClick={() => handleViewAgreement(loan)} 
                                         />
                                         <DropdownItem 
                                            icon={Download} 
                                            label="Download Agreement" 
                                            onClick={() => handleDownloadAgreement(loan)} 
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

      {/* ASSIGN AGENT MODAL */}
      <Modal isOpen={activeModal === 'assign-agent'} onClose={closeModal} title="Assign Recovery Agent" maxWidth="max-w-2xl">
         <div className="space-y-6">
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                    {selectedLoan?.borrowerName?.charAt(0)}
                  </div>
                  <div>
                     <p className="text-sm font-black text-slate-900">{selectedLoan?.borrowerName}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedLoan?.loanCode} • R {selectedLoan?.remainingBalance?.toLocaleString()}</p>
                  </div>
               </div>
               <div className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                  selectedLoan?.loanStatus === 'Overdue' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
               )}>
                  {selectedLoan?.loanStatus}
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Operational Agent</label>
                  <span className="text-[10px] font-bold text-slate-400">{availableAgents.length} Active Agents Available</span>
               </div>
               
               <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {isAgentsLoading ? (
                     <div className="py-10 text-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Loading agents...</p>
                     </div>
                  ) : availableAgents.length === 0 ? (
                     <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">No active agents found in this region</p>
                     </div>
                  ) : availableAgents.map(agent => (
                     <button
                        key={agent._id}
                        onClick={() => setAssignmentData({ ...assignmentData, agentId: agent._id })}
                        className={cn(
                           "flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all text-left group",
                           assignmentData.agentId === agent._id 
                              ? "bg-primary/5 border-primary shadow-md" 
                              : "bg-white border-slate-100 hover:border-primary/30"
                        )}
                     >
                        {agent.profilePhoto ? (
                           <img src={agent.profilePhoto} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
                        ) : (
                           <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-lg">
                              {agent.fullName.charAt(0)}
                           </div>
                        )}
                        <div className="flex-1">
                           <div className="flex items-center justify-between">
                              <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{agent.fullName}</p>
                              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg uppercase">{agent.assignedRegion}</span>
                           </div>
                           <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1">
                                 <Users size={10} className="text-slate-400" />
                                 <span className="text-[10px] font-bold text-slate-500">{agent.assignedBorrowers?.length || 0} Clients</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <Activity size={10} className="text-emerald-500" />
                                 <span className="text-[10px] font-bold text-emerald-600">92% Recovery</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <AlertTriangle size={10} className="text-rose-500" />
                                 <span className="text-[10px] font-bold text-rose-600">3 Overdue</span>
                              </div>
                           </div>
                        </div>
                        {assignmentData.agentId === agent._id && (
                           <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                              <CheckCircle2 size={14} />
                           </div>
                        )}
                     </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Follow-Up Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                     {['Low', 'Medium', 'High'].map(p => (
                        <button 
                           key={p}
                           onClick={() => setAssignmentData({ ...assignmentData, priority: p })}
                           className={cn(
                              "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                              assignmentData.priority === p 
                                 ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                                 : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                           )}
                        >
                           {p}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Internal Assignment Notes</label>
                  <textarea 
                     value={assignmentData.notes}
                     onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
                     placeholder="Special instructions..."
                     className="w-full h-[45px] bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
               </div>
            </div>

            <div className="flex gap-4 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button 
                  onClick={handleAssignAgent} 
                  disabled={isSubmitting || !assignmentData.agentId}
                  className="flex-1 bg-primary shadow-lg shadow-primary/20"
               >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Assignment"}
               </Button>
            </div>
         </div>
      </Modal>

      {/* REPAYMENT SCHEDULE MODAL */}
      <Modal isOpen={activeModal === 'schedule'} onClose={closeModal} title="Repayment Schedule" maxWidth="max-w-2xl">
         <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">{selectedLoan?.borrowerName?.charAt(0)}</div>
                  <div>
                     <p className="text-sm font-black text-slate-900">{selectedLoan?.borrowerName}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedLoan?.loanCode} • R {selectedLoan?.approvedAmount?.toLocaleString()}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xs font-black text-slate-900">EMI Amount</p>
                  <p className="text-lg font-black text-primary">R {selectedLoan?.emiAmount?.toLocaleString()}</p>
               </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                     <tr className="text-left">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">#</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Due Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {isScheduleLoading ? (
                        <tr><td colSpan="5" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                      ) : repaymentSchedule.length > 0 ? repaymentSchedule.map((schedule, i) => (
                         <tr key={schedule._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{schedule.emiNumber}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(schedule.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col">
                                  <span className="font-black text-slate-900">R {schedule.amount.toLocaleString()}</span>
                                  {schedule.penaltyAmount > 0 && <span className="text-[10px] font-bold text-rose-500">+ R {schedule.penaltyAmount} Late Fee</span>}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <StatusBadge status={schedule.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  {schedule.penaltyAmount > 0 && (
                                     <button onClick={() => handleWaivePenalty(schedule._id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors" title="Waive Penalty"><ShieldCheck size={14} /></button>
                                  )}
                                  <button onClick={() => handleMarkDispute(schedule._id)} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors" title="Mark Dispute"><AlertTriangle size={14} /></button>
                               </div>
                            </td>
                         </tr>
                      )) : (
                        <tr><td colSpan="5" className="py-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No schedule data found</td></tr>
                      )}
                  </tbody>
               </table>
            </div>

            <Button onClick={closeModal} className="w-full py-4 shadow-lg shadow-primary/20">Close Schedule</Button>
         </div>
      </Modal>

      {/* PENALTY MODAL */}
      <Modal isOpen={activeModal === 'penalty'} onClose={closeModal} title="Add Loan Penalty" maxWidth="max-w-xl">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">Apply a late payment penalty to the borrower's active loan.</p>
            
            {/* Loan Summary Card */}
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-4">
               <ReviewRow label="Borrower" value={selectedLoan?.borrowerName} />
               <ReviewRow label="Loan ID" value={selectedLoan?.loanCode} />
               <ReviewRow label="EMI Amount" value={`R ${selectedLoan?.emiAmount?.toLocaleString() || '0'}`} />
               <ReviewRow label="Days Overdue" value={selectedLoan?.loanStatus === 'Overdue' ? '12 Days' : '0 Days'} />
               <ReviewRow label="Balance" value={`R ${selectedLoan?.remainingBalance?.toLocaleString() || '0'}`} />
            </div>

            {/* Penalty Form */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Penalty Type</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold">
                     <option>Late Payment Fee</option>
                     <option>Overdue Penalty</option>
                     <option>Manual Adjustment</option>
                  </select>
               </div>
               <Input label="Penalty Amount" placeholder="R 0.00" />
               <Input label="Penalty Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notify Borrower</span>
                  <div className="w-10 h-5 bg-primary rounded-full p-1 cursor-pointer flex justify-end">
                     <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
               </div>
            </div>
            <Input label="Reason" isTextArea placeholder="Brief explanation for this penalty..." />

            {/* Penalty Preview */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
               <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Current Balance</span>
                  <span className="text-slate-900">R {selectedLoan?.remainingBalance?.toLocaleString() || '0'}</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Penalty Charge</span>
                  <span className="text-primary">+ R 250.00</span>
               </div>
               <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Updated Balance</span>
                  <span className="text-lg font-black text-primary">R {((selectedLoan?.remainingBalance || 0) + 250).toLocaleString()}</span>
               </div>
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-700">
               <AlertTriangle size={20} />
               <p className="text-[11px] font-bold uppercase">Penalty charges will increase the borrower's remaining loan balance.</p>
            </div>

            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 bg-primary shadow-lg shadow-primary/20">Apply Penalty</Button>
            </div>
         </div>
      </Modal>

      {/* COMPLETION MODAL */}
      <Modal isOpen={activeModal === 'complete'} onClose={closeModal} title="Mark Loan Completed" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
               <BadgeCheck size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Final Settlement?</h4>
               <p className="text-sm text-slate-500 mt-2">You are confirming full repayment for <span className="font-bold text-slate-900">{selectedLoan?.borrowerName}</span>. This will mark the loan account as Completed.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 text-left">
               <ReviewRow label="Final Balance" value={`R ${selectedLoan?.remainingBalance?.toLocaleString()}`} />
               <ReviewRow label="Settlement Date" value={new Date().toLocaleDateString('en-GB')} />
               <ReviewRow label="Completion Status" value="Debt Free" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={() => handleUpdateStatus('Completed')} disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Mark Completed'}
               </Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Active Loans" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose format for the active loan portfolio export.</p>
            <div className="grid grid-cols-2 gap-3">
               <ExportCard label="PDF" icon={FileUp} active={exportFormat === 'pdf'} onClick={() => setExportFormat('pdf')} />
               <ExportCard label="CSV" icon={CreditCard} active={exportFormat === 'csv'} onClick={() => setExportFormat('csv')} />
            </div>
            <Button onClick={handleExport} className="w-full py-4 shadow-lg shadow-primary/20">Download Report</Button>
         </div>
      </Modal>

      {/* DELETE MODAL — only works when loan is CLOSED */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Loan Record" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
           {selectedLoan?.loanStatus !== 'Closed' ? (
             // BLOCKED STATE — loan is not closed
             <>
               <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
                  <Lock size={28} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">Cannot Delete Active Loan</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    <span className="font-bold text-slate-900">{selectedLoan?.loanCode}</span> is currently{' '}
                    <span className="font-bold text-amber-600">{selectedLoan?.loanStatus}</span>.
                  </p>
               </div>
               <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-left space-y-3">
                  <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Required Action</p>
                  <p className="text-sm font-medium text-amber-800">
                    You must <strong>close this loan first</strong> before it can be permanently deleted.
                    Use the <strong>🔒 Close Loan</strong> button on the loan row.
                  </p>
               </div>
               <Button variant="ghost" onClick={closeModal} className="w-full">Dismiss</Button>
             </>
           ) : (
             // ALLOWED STATE — loan is closed, permit deletion
             <>
               <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
                  <Trash2 size={28} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">Permanently Delete Loan?</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    You are permanently deleting <span className="font-bold text-slate-900">{selectedLoan?.loanCode}</span>.
                    This will also remove all linked EMI schedules and payment records.
                  </p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Closed Loan Details</p>
                  <ReviewRow label="Borrower" value={selectedLoan?.borrowerName} />
                  <ReviewRow label="Loan Code" value={selectedLoan?.loanCode} />
                  <ReviewRow label="Closure Reason" value={selectedLoan?.closureReason || 'N/A'} />
               </div>
               <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3 text-left">
                  <AlertTriangle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-bold text-rose-700">This action is irreversible. All loan records, EMI schedules and payment history will be permanently erased.</p>
               </div>
               <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1">Cancel</Button>
                  <Button variant="danger" onClick={handleDeleteLoan} disabled={isSubmitting} className="flex-1 shadow-lg shadow-rose-200">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete Permanently'}
                  </Button>
               </div>
             </>
           )}
         </div>
      </Modal>

      {/* CLOSE LOAN MODAL */}
      <Modal isOpen={activeModal === 'close-loan'} onClose={() => { closeModal(); setClosureReason('Fully Repaid'); setClosureNotes(''); }} title="Close Loan" maxWidth="max-w-md">
         <div className="space-y-6">
            {/* Loan Summary */}
            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
               <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100">
                  <Lock size={22} />
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900">{selectedLoan?.borrowerName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedLoan?.loanCode} • R {selectedLoan?.remainingBalance?.toLocaleString()}</p>
               </div>
            </div>

            {/* Warning message */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
               <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
               <div>
                  <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Fintech Lifecycle Rule</p>
                  <p className="text-xs font-medium text-amber-800">
                    Closing this loan will lock it from all modifications. Only after closure will permanent deletion become available.
                  </p>
               </div>
            </div>

            {/* Closure Reason */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Closure Reason</label>
               <select
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10"
               >
                  <option>Fully Repaid</option>
                  <option>Written Off</option>
                  <option>Refinanced</option>
                  <option>Fraud Closure</option>
                  <option>Administrative Closure</option>
                  <option>Settlement Agreement</option>
               </select>
            </div>

            {/* Closure Notes */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes (Optional)</label>
               <textarea
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder="Additional closure notes for audit trail..."
                  className="w-full h-24 bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all resize-none"
               />
            </div>

            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1">Cancel</Button>
               <Button
                  onClick={handleCloseLoan}
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 border-none"
               >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '🔒 Confirm Closure'}
               </Button>
            </div>
         </div>
      </Modal>

      {/* STATUS MODAL */}
      <Modal isOpen={activeModal === 'status'} onClose={closeModal} title="Update Loan Status" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">Change the operational status for <span className="font-bold text-slate-900">{selectedLoan?.borrowerName}</span>.</p>
            <div className="space-y-3">
               {['Active', 'Overdue', 'Completed', 'Closed'].map(status => (
                  <button 
                     key={status}
                     onClick={() => handleUpdateStatus(status)}
                     disabled={isSubmitting || selectedLoan?.loanStatus === status}
                     className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-sm font-bold",
                        selectedLoan?.loanStatus === status ? "bg-primary/5 border-primary text-primary" : "bg-slate-50 border-slate-100 text-slate-600 hover:border-primary hover:bg-white"
                     )}
                  >
                     <span>Mark as {status}</span>
                     {selectedLoan?.loanStatus === status && <CheckCircle2 size={18} className="text-primary" />}
                  </button>
               ))}
            </div>
            <Button variant="ghost" onClick={closeModal} className="w-full">Cancel</Button>
         </div>
      </Modal>

      {/* NOTES MODAL */}
      <Modal isOpen={activeModal === 'notes'} onClose={closeModal} title="Admin Notes" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">Add internal administrative notes for <span className="font-bold text-slate-900">{selectedLoan?.loanCode}</span>.</p>
            <textarea 
               value={adminNotes}
               onChange={(e) => setAdminNotes(e.target.value)}
               className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all resize-none"
               placeholder="Write internal notes here..."
            />
            <div className="flex gap-3">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={handleAddNotes} disabled={isSubmitting} className="flex-1 shadow-lg shadow-primary/20 bg-primary">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Notes'}
               </Button>
            </div>
         </div>
      </Modal>

      {/* DUE PAYMENTS MODAL */}
      <Modal isOpen={activeModal === 'due-payments'} onClose={closeModal} title="Due & Overdue Payments" maxWidth="max-w-4xl">
         <div className="space-y-6">
            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                     <tr className="text-left">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Installment #</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">EMI Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {isDuePaymentsLoading ? (
                        <tr>
                           <td colSpan="6" className="px-6 py-8 text-center">
                              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                              <span className="text-xs font-bold text-slate-400">Loading payments...</span>
                           </td>
                        </tr>
                     ) : duePayments.length === 0 ? (
                        <tr>
                           <td colSpan="6" className="px-6 py-8 text-center">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No due payments found.</span>
                           </td>
                        </tr>
                     ) : duePayments.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-900">{p.borrowerName} <span className="block text-[10px] text-slate-400 uppercase">{p.loanCode}</span></td>
                           <td className="px-6 py-4 text-xs font-bold text-slate-600">{p.borrowerPhone}</td>
                           <td className="px-6 py-4 text-center font-bold text-slate-900">{p.installmentNumber}</td>
                           <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(p.dueDate).toLocaleDateString('en-GB')}</td>
                           <td className="px-6 py-4 font-black text-primary text-right">R {p.emiAmount.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">
                              <StatusBadge status={p.isOverdue ? 'Overdue' : 'Pending'} />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Loan Details"
         width="max-w-2xl"
      >
         {selectedLoan && (
            <div className="space-y-10">
               {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  {selectedLoan.borrowerPhoto && selectedLoan.borrowerPhoto !== 'no-photo.jpg' ? (
                     <img src={selectedLoan.borrowerPhoto} alt="" className="w-20 h-20 rounded-3xl object-cover shadow-lg border border-white/10" />
                  ) : (
                     <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg border border-white/10">
                        {selectedLoan.borrowerName?.charAt(0) || 'B'}
                     </div>
                  )}
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-white tracking-tight">{selectedLoan.borrowerName}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {selectedLoan.loanCode} • {selectedLoan.loanType}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedLoan.loanStatus} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xl font-black text-accent ml-2">Balance: R {selectedLoan.remainingBalance?.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               {/* Loan Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Activity size={14} className="text-primary" /> Loan Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryCard title="Total Paid" value={`R ${(selectedLoan.totalPayableAmount - selectedLoan.remainingBalance).toLocaleString()}`} color="text-emerald-600" />
                     <SummaryCard title="Remaining" value={`R ${selectedLoan.remainingBalance?.toLocaleString()}`} color="text-rose-500" />
                     <SummaryCard title="Overdue Amount" value={selectedLoan.loanStatus === 'Overdue' ? `R ${selectedLoan.emiAmount?.toLocaleString()}` : 'R 0'} color="text-amber-500" />
                     <SummaryCard title="Total Penalties" value={`R ${selectedLoan.penaltyAmount?.toLocaleString()}`} color="text-rose-600" />
                  </div>
               </div>

               {/* Repayment Progress */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <CheckCircle2 size={14} className="text-accent" /> Repayment Progress
                  </h4>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Collection Target</span>
                        <span className="text-lg font-black text-primary">64%</span>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[64%] shadow-inner" />
                     </div>
                     <div className="grid grid-cols-2 gap-8 pt-2">
                        <ReviewRow label="Installments Paid" value="8 / 12" />
                        <ReviewRow label="Next EMI Date" value={selectedLoan.nextDue} />
                     </div>
                  </div>
               </div>

               {/* Recent Payments */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-slate-400" /> Recent Repayments
                  </h4>
                  <div className="space-y-4">
                     {selectedLoan.repaymentSchedule?.filter(s => s.paymentStatus === 'Paid').slice(0,3).map((s, idx) => (
                        <PaymentItem 
                          key={idx} 
                          date={s.paidDate ? new Date(s.paidDate).toLocaleDateString('en-GB') : '-'} 
                          amount={`R ${s.emiAmount?.toLocaleString()}`} 
                          status={s.paymentStatus} 
                        />
                     ))}
                     {selectedLoan.repaymentSchedule?.filter(s => s.paymentStatus === 'Paid').length === 0 && (
                       <p className="text-xs text-slate-400 font-bold">No payments made yet.</p>
                     )}
                  </div>
               </div>

               {/* Admin Notes */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <UserCheck size={14} className="text-primary" /> Admin Notes
                  </h4>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl shadow-sm text-sm text-slate-600">
                     {selectedLoan.notes || "No admin notes added."}
                  </div>
               </div>

               {/* Digital Loan Agreement Panel */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <FileText size={14} className="text-primary" /> Digital Loan Agreement
                  </h4>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <ReviewRow label="Agreement Status" value={selectedLoan.agreementStatus || 'SIGNED'} />
                        <ReviewRow label="Signed Date" value={selectedLoan.agreementSignedAt ? new Date(selectedLoan.agreementSignedAt).toLocaleDateString('en-GB') : new Date(selectedLoan.createdAt || selectedLoan.approvedDate).toLocaleDateString('en-GB')} />
                     </div>
                     <div className="flex gap-3 pt-2">
                        <Button
                           onClick={() => handleViewAgreement(selectedLoan)}
                           className="flex-1 py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-2"
                        >
                           <FileText size={14} className="text-slate-700" />
                           <span className="font-black uppercase tracking-widest text-[9px]">View Agreement</span>
                        </Button>
                        <Button
                           onClick={() => handleDownloadAgreement(selectedLoan)}
                           className="flex-1 py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-2"
                        >
                           <Download size={14} className="text-slate-700" />
                           <span className="font-black uppercase tracking-widest text-[9px]">Download Agreement</span>
                        </Button>
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="ghost" className="flex-1" onClick={() => openModal('schedule', selectedLoan)}>Full Schedule</Button>
                  <Button onClick={() => openModal('complete', selectedLoan)} className="flex-1 shadow-lg shadow-primary/20">Settle Loan</Button>
               </div>
            </div>
         )}
      </Drawer>

      <AgreementPreviewModal
         isOpen={isAgreementPreviewOpen}
         onClose={() => setIsAgreementPreviewOpen(false)}
         app={selectedLoan}
         agreementDetails={agreementDetails}
      />
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

const ReviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-1">
     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-black text-slate-900">{value}</span>
  </div>
);

const SummaryCard = ({ title, value, color }) => (
   <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center group hover:border-primary transition-all">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className={cn("text-lg font-black", color)}>{value}</p>
   </div>
);

const PaymentItem = ({ date, amount, status }) => (
   <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-primary transition-all">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><CreditCard size={18} /></div>
         <div>
            <p className="text-sm font-black text-slate-900">{amount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
         </div>
      </div>
      <StatusBadge status={status} className="text-[10px]" />
   </div>
);

const Checkbox = ({ label }) => (
  <label className="flex items-center gap-3 group cursor-pointer">
    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center transition-all group-hover:border-primary">
      <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </label>
);

const ExportCard = ({ label, icon: Icon, active, onClick }) => (
  <button 
     onClick={onClick}
     className={cn(
        "flex flex-col items-center justify-center p-5 border rounded-2xl transition-all group",
        active ? "border-primary bg-primary/5 text-primary" : "bg-slate-50 border-slate-100 hover:border-primary hover:bg-primary/5"
     )}
  >
     <Icon size={24} className={cn("mb-3 transition-colors", active ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
     <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", active ? "text-primary" : "text-slate-500 group-hover:text-primary")}>{label}</span>
  </button>
);


export default ActiveLoans;
