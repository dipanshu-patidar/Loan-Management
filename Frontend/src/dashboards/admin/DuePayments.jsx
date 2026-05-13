// Due Payments Module
import React, { useState, useEffect } from 'react';
import { 
  BellRing, ClipboardCheck, Eye, Search, Filter, 
  MoreVertical, Download, Clock, AlertTriangle, 
  DollarSign, Activity, Users, ArrowRight, X, 
  Mail, MessageSquare, Phone, Calendar, CheckCircle2,
  Trash2, UserCheck, ShieldCheck, History, Wallet,
  CreditCard, Smartphone, FileText, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import duePaymentService from '../../services/duePaymentService';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DuePayments = () => {
  const [dues, setDues] = useState([]);
  const [stats, setStats] = useState({ dueTodayCount: 0, overdueCount: 0, totalDueAmount: 0, lateEmiAccounts: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [notesInput, setNotesInput] = useState('');
  const [bulkFilter, setBulkFilter] = useState('Due Today');

  const [activeModal, setActiveModal] = useState(null); // 'reminder', 'followup', 'bulk', 'export'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedDue, setSelectedDue] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  const fetchDuePaymentsData = async () => {
    try {
      setLoading(true);
      const [dueRes, statsRes] = await Promise.all([
        duePaymentService.getAllDuePayments({ search: searchQuery, status: activeTab === 'All' ? '' : activeTab, limit: 100 }),
        duePaymentService.getDuePaymentStats()
      ]);
      setDues(dueRes.data.data?.duePayments || []);
      setStats(statsRes.data.data || { dueTodayCount: 0, overdueCount: 0, totalDueAmount: 0, lateEmiAccounts: 0 });
    } catch (err) {
      toast.error('Failed to load due payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuePaymentsData();
  }, [searchQuery, activeTab]);

  const openModal = (type, due = null) => {
    setSelectedDue(due);
    setActiveModal(type);
    setOpenMenuId(null);
    if (type === 'followup') {
      setNotesInput(due?.notes || '');
    }
  };

  const openDrawer = async (type, due) => {
    setActiveDrawer(type);
    setOpenMenuId(null);
    try {
      const res = await duePaymentService.getDuePaymentDetails(due._id);
      setSelectedDue(res.data.data.duePayment);
    } catch (err) {
      toast.error('Failed to load details');
    }
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const handleSendReminder = async () => {
    try {
      setIsSubmitting(true);
      await duePaymentService.sendReminder(selectedDue._id);
      toast.success('Reminder sent successfully');
      fetchDuePaymentsData();
      closeModal();
    } catch (error) {
      toast.error('Failed to send reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkReminders = async () => {
    try {
      setIsSubmitting(true);
      await duePaymentService.sendBulkReminders(bulkFilter);
      toast.success('Bulk reminders sent');
      fetchDuePaymentsData();
      closeModal();
    } catch (error) {
      toast.error('Failed to send bulk reminders');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSubmitting(true);
      await duePaymentService.updateNotes(selectedDue._id, notesInput);
      toast.success('Notes updated successfully');
      fetchDuePaymentsData();
      closeModal();
    } catch (error) {
      toast.error('Failed to update notes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await duePaymentService.exportDuePayments();
      const exportData = res.data.data.duePayments || [];

      if (exportFormat === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Due Payments Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableColumn = ["Borrower", "Loan Code", "EMI Amount", "Total Due", "Due Date", "Status", "Late Days"];
        const tableRows = exportData.map(p => [
          p.borrowerName, p.loanCode, `R ${p.emiAmount}`, `R ${p.totalDueAmount}`, new Date(p.dueDate).toLocaleDateString(), p.dueStatus, p.overdueDays
        ]);

        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 40, theme: 'grid' });
        doc.save(`DuePayments_${new Date().getTime()}.pdf`);
        toast.success('PDF Export successful');
      } else {
        const headers = ["Borrower,Loan Code,EMI Amount,Total Due,Due Date,Status,Late Days\n"];
        const rows = exportData.map(p => 
          `"${p.borrowerName}",${p.loanCode},${p.emiAmount},${p.totalDueAmount},${new Date(p.dueDate).toLocaleDateString()},${p.dueStatus},${p.overdueDays}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `DuePayments_${new Date().getTime()}.csv`;
        link.click();
        toast.success('CSV Export successful');
      }
      closeModal();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const tabs = [
    { id: 'All', label: 'All Dues', count: stats.dueTodayCount + stats.overdueCount },
    { id: 'Due Today', label: 'Due Today', count: stats.dueTodayCount },
    { id: 'Overdue', label: 'Overdue', count: stats.overdueCount },
  ];

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Due Payments</h1>
          <p className="text-slate-500 font-medium mt-1">Track unpaid EMIs, overdue payments, and send borrower reminders.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export Due
           </Button>
           <Button onClick={() => openModal('bulk')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20 bg-primary">
             <BellRing size={18} /> Bulk Reminders
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Due Today" value={stats.dueTodayCount.toLocaleString()} icon={Clock} color="blue" />
        <StatCard title="Overdue Payments" value={stats.overdueCount.toLocaleString()} icon={AlertTriangle} color="rose" />
        <StatCard title="Total Due Amount" value={`R ${stats.totalDueAmount.toLocaleString()}`} icon={DollarSign} color="navy" />
        <StatCard title="Late EMI Accounts" value={stats.lateEmiAccounts.toLocaleString()} icon={Users} color="navy" />
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search borrower by name, loan code or phone..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Due Status</option>
              <option>Due Today</option>
              <option>Overdue</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Overdue Days</option>
              <option>1-7 Days</option>
              <option>8-14 Days</option>
              <option>15+ Days</option>
           </select>
        </div>
      </section>

      {/* 5. DUE PAYMENTS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">EMI Amount</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Due Date</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Late Days</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Due</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Reminder</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr>
                       <td colSpan="8" className="px-8 py-12 text-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Dues...</p>
                       </td>
                    </tr>
                 ) : dues.length === 0 ? (
                    <tr>
                       <td colSpan="8" className="px-8 py-12 text-center">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Due Payments Found</p>
                       </td>
                    </tr>
                 ) : dues.map((due) => (
                    <tr key={due._id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             {due.borrowerPhoto && due.borrowerPhoto !== 'no-photo.jpg' ? (
                                <img src={due.borrowerPhoto} alt="" className="w-11 h-11 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                             ) : (
                                <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                   {due.borrowerName?.charAt(0) || 'B'}
                                </div>
                             )}
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{due.borrowerName}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{due.borrowerPhone} • {due.loanCode}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                          R {due.emiAmount?.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center text-xs font-bold text-slate-500 uppercase">
                          {new Date(due.dueDate).toLocaleDateString('en-GB')}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={due.lateDayStatus} />
                       </td>
                       <td className="px-6 py-5 text-right font-black text-primary text-sm">
                          R {due.totalDueAmount?.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={due.reminderStatus} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={due.dueStatus} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', due)} tooltip="View Borrower" />
                             <TableAction icon={BellRing} color="text-primary hover:bg-primary/5" onClick={() => openModal('reminder', due)} tooltip="Send Reminder" />
                             <TableAction icon={ClipboardCheck} color="text-emerald-500 hover:bg-emerald-50" onClick={() => openModal('followup', due)} tooltip="Mark Follow-Up" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === due._id ? null : due._id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === due._id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === due._id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={Mail} 
                                            label="Email Statement" 
                                            onClick={() => openModal('reminder', due)} 
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

      <Modal isOpen={activeModal === 'reminder'} onClose={closeModal} title="Send Payment Reminder" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black">{selectedDue?.borrowerName?.charAt(0) || 'B'}</div>
               <div>
                  <p className="text-sm font-black text-slate-900">{selectedDue?.borrowerName}</p>
                  <p className="text-xs font-black text-primary">R {selectedDue?.totalDueAmount?.toLocaleString()} Due</p>
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choose Channel</p>
               <div className="grid grid-cols-1 gap-3">
                  <ChannelButton icon={Mail} label="Email Reminder" active />
               </div>
            </div>

            <Input label="Reminder Message" isTextArea defaultValue={`Dear ${selectedDue?.borrowerName}, your loan repayment of R ${selectedDue?.totalDueAmount?.toLocaleString()} is due today. Please ensure funds are available.`} />
            
            <Button onClick={handleSendReminder} disabled={isSubmitting} className="w-full py-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><BellRing size={18} /> Send Reminder</>}
            </Button>
         </div>
      </Modal>

      <Modal isOpen={activeModal === 'followup'} onClose={closeModal} title="Update Notes" maxWidth="max-w-md">
         <div className="space-y-6">
            <Input 
              label="Admin Notes" 
              isTextArea 
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Enter details of the conversation or follow-up..." 
            />
            <Button onClick={handleSaveNotes} disabled={isSubmitting} className="w-full py-4 shadow-lg shadow-primary/20">
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Notes'}
            </Button>
         </div>
      </Modal>

      <Modal isOpen={activeModal === 'bulk'} onClose={closeModal} title="Bulk Reminders" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Send automated reminders to all borrowers in selected categories.</p>
            <div className="space-y-3">
               <BulkOption 
                  label="Due Today Borrowers" 
                  count={stats.dueTodayCount} 
                  icon={Clock} 
                  color="bg-blue-500" 
                  active={bulkFilter === 'Due Today'}
                  onClick={() => setBulkFilter('Due Today')}
               />
               <BulkOption 
                  label="Overdue Borrowers" 
                  count={stats.overdueCount} 
                  icon={AlertTriangle} 
                  color="bg-rose-500" 
                  active={bulkFilter === 'Overdue'}
                  onClick={() => setBulkFilter('Overdue')}
               />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1">Cancel</Button>
               <Button onClick={handleBulkReminders} disabled={isSubmitting || (bulkFilter === 'Due Today' && stats.dueTodayCount === 0) || (bulkFilter === 'Overdue' && stats.overdueCount === 0)} className="flex-[2] shadow-lg shadow-primary/20">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send All Reminders'}
               </Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Due Payments" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose format for the due payments list export.</p>
            <div className="grid grid-cols-2 gap-3">
               <ExportCard label="PDF" icon={FileText} active={exportFormat === 'pdf'} onClick={() => setExportFormat('pdf')} />
               <ExportCard label="CSV" icon={CreditCard} active={exportFormat === 'csv'} onClick={() => setExportFormat('csv')} />
            </div>
            <Button onClick={handleExport} className="w-full py-4 shadow-lg shadow-primary/20">Generate Report</Button>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Borrower Due Summary"
         width="max-w-2xl"
      >
         {selectedDue && (
            <div className="space-y-10">
                {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  {selectedDue.borrowerPhoto && selectedDue.borrowerPhoto !== 'no-photo.jpg' ? (
                     <img src={selectedDue.borrowerPhoto} alt="" className="w-20 h-20 rounded-3xl object-cover border border-white/10 shadow-lg" />
                  ) : (
                     <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg border border-white/10">
                        {selectedDue.borrowerName?.charAt(0) || 'B'}
                     </div>
                  )}
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-white tracking-tight">{selectedDue.borrowerName}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Loan ID: {selectedDue.loanCode}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedDue.dueStatus} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xl font-black text-accent ml-2">Total Due: R {selectedDue.totalDueAmount?.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               {/* Due Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Wallet size={14} className="text-primary" /> Due Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryCard title="Current EMI Due" value={`R ${selectedDue.emiAmount?.toLocaleString()}`} color="text-slate-900" />
                     <SummaryCard title="Penalty Amount" value={`R ${selectedDue.penaltyAmount?.toLocaleString()}`} color="text-rose-500" />
                     <SummaryCard title="Overdue Days" value={`${selectedDue.overdueDays} Days`} color="text-emerald-600" />
                     <SummaryCard title="Reminder Status" value={selectedDue.reminderStatus} color="text-blue-500" />
                  </div>
               </div>

               {/* Loan Association */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Activity size={14} className="text-accent" /> Active Loan Details
                  </h4>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                     <ReviewRow label="Loan Type" value="Personal Loan" />
                     <ReviewRow label="Approved Amount" value={`R ${selectedDue.loanAmount?.toLocaleString()}`} />
                     <ReviewRow label="Remaining Balance" value={`R ${selectedDue.remainingBalance?.toLocaleString()}`} />
                     <ReviewRow label="Borrower Phone" value={selectedDue.borrowerPhone} />
                     <ReviewRow label="Borrower Email" value={selectedDue.borrowerEmail} />
                  </div>
               </div>

               {/* Reminder History */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-slate-400" /> Reminder History
                  </h4>
                  <div className="space-y-4">
                     {selectedDue.reminderHistory && selectedDue.reminderHistory.length > 0 ? (
                        selectedDue.reminderHistory.map((rem, idx) => (
                           <PaymentItem key={idx} date={new Date(rem.date).toLocaleString('en-GB')} amount={rem.type} status={rem.status} />
                        ))
                     ) : (
                        <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-3xl text-slate-400 text-sm font-bold">
                           No reminders sent yet.
                        </div>
                     )}
                  </div>
               </div>

               {selectedDue.notes && (
                  <div className="space-y-5">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={14} className="text-slate-400" /> Admin Notes
                     </h4>
                     <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-3xl text-sm font-medium text-slate-700">
                        {selectedDue.notes}
                     </div>
                  </div>
               )}

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="ghost" className="flex-1" onClick={() => openModal('followup', selectedDue)}>Update Notes</Button>
                  <Button onClick={() => openModal('reminder', selectedDue)} className="flex-1 shadow-lg shadow-primary/20">Send Reminder</Button>
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

const ChannelButton = ({ icon: Icon, label, active }) => (
   <button className={cn(
      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group",
      active ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 border-slate-100 hover:border-primary/20"
   )}>
      <Icon size={20} className={cn("mb-2", active ? "text-white" : "group-hover:text-primary")} />
      <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-white" : "group-hover:text-primary")}>{label}</span>
   </button>
);

const BulkOption = ({ label, count, icon: Icon, color, active, onClick }) => (
   <div onClick={onClick} className={cn("flex items-center justify-between p-5 bg-white border rounded-2xl shadow-sm group hover:border-primary transition-all cursor-pointer", active ? "border-primary bg-primary/5" : "border-slate-100")}>
      <div className="flex items-center gap-4">
         <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", color)}>
            <Icon size={24} />
         </div>
         <div>
            <p className="text-sm font-black text-slate-900">{label}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {count} Borrowers</p>
         </div>
      </div>
      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", active ? "border-primary" : "border-slate-200 group-hover:border-primary")}>
         <div className={cn("w-3 h-3 bg-primary rounded-full transition-opacity", active ? "opacity-100" : "opacity-0 group-hover:opacity-20")} />
      </div>
   </div>
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

export default DuePayments;
