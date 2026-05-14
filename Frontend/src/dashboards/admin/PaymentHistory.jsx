import React, { useState, useEffect } from 'react';
import { 
  CreditCard, BadgeCheck, Download, Eye, Search, 
  Filter, MoreVertical, XCircle, Clock, CheckCircle2,
  Activity, FileText, Smartphone, Banknote,
  Receipt, History, UserCheck, ShieldCheck, Mail,
  Printer, ArrowRight, X, Phone, Calendar, DownloadCloud,
  FileUp, Wallet, Trash2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import paymentService from '../../services/paymentService';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalPayments: 0, verifiedPayments: 0, pendingPayments: 0, totalCollections: 0 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');

  const [activeModal, setActiveModal] = useState(null); // 'verify', 'reject', 'receipt', 'export', 'delete'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, statsRes] = await Promise.all([
        paymentService.getAllPayments({ search: searchQuery, status: activeTab === 'All' ? '' : activeTab, limit: 100 }),
        paymentService.getPaymentStats()
      ]);
      setPayments(paymentsRes.data.data?.payments || []);
      setStats(statsRes.data.data || { totalPayments: 0, verifiedPayments: 0, pendingPayments: 0, totalCollections: 0 });
    } catch (error) {
      toast.error('Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [searchQuery, activeTab]);

  const openModal = (type, payment = null) => {
    setSelectedPayment(payment);
    setActiveModal(type);
    setOpenMenuId(null);
    if (type === 'reject') {
      setRejectionReason('');
      setAdminNotes('');
    }
  };

  const openDrawer = async (type, payment) => {
    setActiveDrawer(type);
    setOpenMenuId(null);
    try {
      const res = await paymentService.getPaymentDetails(payment._id);
      setSelectedPayment(res.data.data.payment);
    } catch (err) {
      toast.error('Failed to load payment details');
    }
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const handleVerify = async () => {
    try {
      setIsSubmitting(true);
      await paymentService.verifyPayment(selectedPayment._id);
      toast.success('Payment verified successfully');
      fetchDashboardData();
      closeModal();
      closeDrawer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      setIsSubmitting(true);
      await paymentService.rejectPayment(selectedPayment._id, { rejectionReason, notes: adminNotes });
      toast.success('Payment rejected successfully');
      fetchDashboardData();
      closeModal();
      closeDrawer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await paymentService.getExportData();
      const exportData = res.data.data.payments || [];

      if (exportFormat === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setTextColor(46, 58, 116);
        doc.text("Loan Management System", 14, 15);
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text("Payment History Export", 14, 25);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

        const tableColumn = ["TRX ID", "Borrower", "Loan Code", "Amount", "Method", "Date", "Status"];
        const tableRows = exportData.map(p => [
          p.transactionId, p.borrowerName, p.loanCode, `R ${p.paymentAmount}`, p.paymentMethod, new Date(p.paymentDate).toLocaleDateString(), p.paymentStatus
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: [46, 58, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 3 },
        });

        doc.save(`Payments_Report_${new Date().getTime()}.pdf`);
        toast.success('PDF Export downloaded successfully!');
      } else if (exportFormat === 'csv') {
        const headers = ["TRX ID,Borrower,Loan Code,Amount,Method,Date,Status\n"];
        const rows = exportData.map(p => 
          `${p.transactionId},"${p.borrowerName}",${p.loanCode},${p.paymentAmount},${p.paymentMethod},${new Date(p.paymentDate).toLocaleDateString()},${p.paymentStatus}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Payments_Data_${new Date().getTime()}.csv`);
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
    { id: 'All', label: 'All Payments', count: stats.totalPayments },
    { id: 'Pending', label: 'Pending', count: stats.pendingPayments },
    { id: 'Verified', label: 'Verified', count: stats.verifiedPayments },
    { id: 'Rejected', label: 'Rejected', count: stats.totalPayments - stats.pendingPayments - stats.verifiedPayments },
  ];

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment History</h1>
          <p className="text-slate-500 font-medium mt-1">Track borrower payments, receipts, and transaction verification.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export Payments
           </Button>
           <Button onClick={() => { setActiveTab('Pending'); fetchDashboardData(); }} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20 bg-primary">
             <ShieldCheck size={18} /> Verify Pending
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Payments" value={(stats.totalPayments || 0).toLocaleString()} icon={CreditCard} color="navy" />
        <StatCard title="Verified Payments" value={(stats.verifiedPayments || 0).toLocaleString()} icon={BadgeCheck} color="emerald" />
        <StatCard title="Pending Payments" value={(stats.pendingPayments || 0).toLocaleString()} icon={Clock} color="blue" />
        <StatCard title="Total Collections" value={`R ${(stats.totalCollections || 0).toLocaleString()}`} icon={Banknote} color="navy" />
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
              placeholder="Search borrower by name, loan ID or transaction ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Payment Method</option>
              <option>Bank Transfer</option>
              <option>Cash Deposit</option>
              <option>EFT</option>
              <option>Mobile Payment</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Status</option>
              <option>Verified</option>
              <option>Pending</option>
              <option>Rejected</option>
           </select>
        </div>
      </section>

      {/* 5. PAYMENTS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan & ID</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount Paid</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Method</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Receipt</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr>
                       <td colSpan="8" className="px-8 py-12 text-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Payments...</p>
                       </td>
                    </tr>
                 ) : payments.length === 0 ? (
                    <tr>
                       <td colSpan="8" className="px-8 py-12 text-center">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Payments Found</p>
                       </td>
                    </tr>
                 ) : payments.map((p) => (
                    <tr key={p._id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             {p.borrowerPhoto && p.borrowerPhoto !== 'no-photo.jpg' ? (
                                <img src={p.borrowerPhoto} alt="" className="w-11 h-11 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                             ) : (
                                <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                   {p.borrowerName?.charAt(0) || 'B'}
                                </div>
                             )}
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{p.borrowerName}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{p.borrowerPhone}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-900">{p.loanCode}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{p.transactionId}</p>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                          R {p.paymentAmount?.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center text-xs font-bold text-slate-500 uppercase">
                          {new Date(p.paymentDate).toLocaleDateString('en-GB')}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={p.paymentMethod} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={p.receiptImage || p.receiptFile ? 'Uploaded' : 'Missing'} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={p.paymentStatus} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', p)} tooltip="View Payment" />
                             {p.paymentStatus === 'Pending' && (
                                <TableAction icon={BadgeCheck} color="text-emerald-500 hover:bg-emerald-50" onClick={() => openModal('verify', p)} tooltip="Verify Payment" />
                             )}
                             <TableAction icon={Download} color="text-primary hover:bg-primary/5" onClick={() => openModal('receipt', p)} tooltip="Download Receipt" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === p._id ? null : p._id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === p._id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === p._id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         {p.paymentStatus === 'Pending' && (
                                           <DropdownItem 
                                              icon={XCircle} 
                                              label="Reject Payment" 
                                              color="text-rose-600 hover:bg-rose-50"
                                              onClick={() => openModal('reject', p)} 
                                           />
                                         )}
                                         <DropdownItem 
                                            icon={Mail} 
                                            label="Email Receipt" 
                                            onClick={() => openModal('receipt', p)} 
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

      {/* VERIFICATION MODAL */}
      <Modal isOpen={activeModal === 'verify'} onClose={closeModal} title="Verify Payment" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-primary/5 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/10">
               <ShieldCheck size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Approve Transaction?</h4>
               <p className="text-sm text-slate-500 mt-2">Confirm that the payment of <span className="font-bold text-slate-900">R {selectedPayment?.paymentAmount?.toLocaleString()}</span> has been cleared in the bank.</p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
               {selectedPayment?.receiptImage ? (
                  <div className="aspect-[4/3] bg-white rounded-xl border border-slate-200 overflow-hidden">
                     <img src={selectedPayment.receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                  </div>
               ) : (
                  <div className="aspect-[4/3] bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-6">
                     <Receipt size={32} className="mb-2 opacity-50" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-center">Receipt Preview Not Available</p>
                  </div>
               )}
               <div className="text-left space-y-1">
                  <ReviewRow label="Borrower" value={selectedPayment?.borrowerName} />
                  <ReviewRow label="Ref ID" value={selectedPayment?.transactionId} />
               </div>
            </div>

            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1">Cancel</Button>
               <Button onClick={handleVerify} disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verify Payment'}
               </Button>
            </div>
         </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal isOpen={activeModal === 'reject'} onClose={closeModal} title="Reject Payment" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">Please provide a reason for rejecting the payment of <span className="font-bold text-slate-900">R {selectedPayment?.paymentAmount?.toLocaleString()}</span> for {selectedPayment?.borrowerName}.</p>
            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Rejection Reason</label>
                 <select 
                   value={rejectionReason}
                   onChange={(e) => setRejectionReason(e.target.value)}
                   className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-rose-500/20"
                 >
                   <option value="">Select Reason</option>
                   <option value="Insufficient Funds">Insufficient Funds</option>
                   <option value="Fake Receipt">Fake Receipt</option>
                   <option value="Bank Declined">Bank Declined</option>
                   <option value="Wrong Amount">Wrong Amount</option>
                   <option value="Other">Other</option>
                 </select>
               </div>
               <Input 
                 label="Admin Notes" 
                 isTextArea 
                 value={adminNotes}
                 onChange={(e) => setAdminNotes(e.target.value)}
                 placeholder="Additional context for rejection..." 
               />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} disabled={isSubmitting} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={handleReject} disabled={isSubmitting} className="flex-1 shadow-lg shadow-rose-200">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Reject Payment'}
               </Button>
            </div>
         </div>
      </Modal>

      {/* RECEIPT MODAL */}
      <Modal isOpen={activeModal === 'receipt'} onClose={closeModal} title="Payment Receipt" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Download or share the official payment receipt for this transaction.</p>
            <div className="grid grid-cols-1 gap-3">
               <ReceiptOption label="Download PDF Receipt" icon={DownloadCloud} />
               <ReceiptOption label="Email to Borrower" icon={Mail} />
               <ReceiptOption label="Print Receipt" icon={Printer} />
            </div>
            <Button variant="ghost" onClick={closeModal} className="w-full">Close</Button>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Payment History" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose format for the transaction history export.</p>
            <div className="grid grid-cols-2 gap-3">
               <ExportCard label="PDF" icon={FileText} active={exportFormat === 'pdf'} onClick={() => setExportFormat('pdf')} />
               <ExportCard label="CSV" icon={CreditCard} active={exportFormat === 'csv'} onClick={() => setExportFormat('csv')} />
            </div>
            <Button onClick={handleExport} className="w-full py-4 shadow-lg shadow-primary/20">Generate Report</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Payment Record" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Delete Transaction?</h4>
               <p className="text-sm text-slate-500 mt-2">You are deleting the record for <span className="font-bold text-slate-900">{selectedPayment?.id}</span>. This will affect collection totals.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
               <Checkbox label="I understand this is irreversible" />
               <Checkbox label="Transaction was created in error" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 shadow-lg shadow-rose-200">Confirm Delete</Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Transaction Details"
         width="max-w-2xl"
      >
         {selectedPayment && (
            <div className="space-y-10">
                {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  {selectedPayment.borrowerPhoto && selectedPayment.borrowerPhoto !== 'no-photo.jpg' ? (
                     <img src={selectedPayment.borrowerPhoto} alt="" className="w-20 h-20 rounded-3xl object-cover shadow-lg border border-white/10" />
                  ) : (
                     <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg border border-white/10">
                        {selectedPayment.borrowerName?.charAt(0) || 'B'}
                     </div>
                  )}
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-white tracking-tight">{selectedPayment.borrowerName}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction: {selectedPayment.transactionId}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedPayment.paymentStatus} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xl font-black text-accent ml-2">Amount: R {selectedPayment.paymentAmount?.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               {/* Payment Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Wallet size={14} className="text-primary" /> Payment Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryCard title="Paid Amount" value={`R ${selectedPayment.paymentAmount?.toLocaleString()}`} color="text-emerald-600" />
                     <SummaryCard title="Payment Method" value={selectedPayment.paymentMethod} color="text-primary" />
                     <SummaryCard title="Remaining Balance" value={selectedPayment.remainingBalanceAfterPayment ? `R ${selectedPayment.remainingBalanceAfterPayment.toLocaleString()}` : 'N/A'} color="text-slate-900" />
                     <SummaryCard title="Payment Type" value={selectedPayment.paymentType} color="text-blue-500" />
                  </div>
               </div>

               {/* Receipt Preview */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Receipt size={14} className="text-accent" /> Digital Receipt
                  </h4>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                     {selectedPayment.receiptImage ? (
                        <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner">
                           <img src={selectedPayment.receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                        </div>
                     ) : (
                        <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group">
                           <FileUp size={32} className="mb-2 opacity-50" />
                           <p className="text-xs font-black uppercase tracking-widest">No Receipt Uploaded</p>
                        </div>
                     )}
                     <div className="grid grid-cols-2 gap-8 pt-2">
                        <ReviewRow label="Upload Date" value={new Date(selectedPayment.paymentDate).toLocaleDateString('en-GB')} />
                        <ReviewRow label="Reference ID" value={selectedPayment.transactionId} />
                     </div>
                  </div>
               </div>

               {selectedPayment.paymentStatus === 'Rejected' && (
                  <div className="space-y-5">
                     <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <XCircle size={14} /> Rejection Details
                     </h4>
                     <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl space-y-4">
                        <ReviewRow label="Reason" value={selectedPayment.rejectionReason || 'N/A'} />
                        <ReviewRow label="Admin Notes" value={selectedPayment.notes || 'None'} />
                     </div>
                  </div>
               )}

               {/* Loan Association */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-slate-400" /> Associated Loan
                  </h4>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                     <ReviewRow label="Loan Account" value={selectedPayment.loanCode} />
                     <ReviewRow label="Borrower Name" value={selectedPayment.borrowerName} />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="ghost" className="flex-1" onClick={() => openModal('receipt', selectedPayment)}>View Options</Button>
                  {selectedPayment.paymentStatus === 'Pending' && (
                     <Button onClick={() => openModal('verify', selectedPayment)} className="flex-1 shadow-lg shadow-primary/20">Verify Transaction</Button>
                  )}
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

const ReceiptOption = ({ label, icon: Icon }) => (
   <button className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-primary hover:bg-primary/5 transition-all">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
            <Icon size={18} />
         </div>
         <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{label}</span>
      </div>
      <ArrowRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
   </button>
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

const Checkbox = ({ label }) => (
  <label className="flex items-center gap-3 group cursor-pointer">
    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center transition-all group-hover:border-primary">
      <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </label>
);


export default PaymentHistory;
