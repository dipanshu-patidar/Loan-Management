import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, User, Search, Filter, 
  Eye, CheckCircle2, XCircle, Download,
  Calendar, DollarSign, Receipt, CreditCard,
  RefreshCw, ArrowRight, X, ZoomIn, 
  AlertCircle, FileText, Phone, FileDown, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import StatCard from '../../components/StatCard';
import staffPaymentVerificationService from '../../services/staffPaymentVerificationService';
import { getSocket } from '../../socket/socketClient';

const formatZAR = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const PaymentVerification = () => {
  // Data & Loading States
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    verifiedPayments: 0,
    rejectedProofs: 0,
    verifiedToday: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Filter & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [methodFilter, setMethodFilter] = useState('All Methods');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Drawer & Detail
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [hydratedDetails, setHydratedDetails] = useState(null);

  // Modals & Payloads
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Invalid Receipt/Screenshot');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Staff Permission / Status Context
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isInactive = currentUser.operationalStatus === 'Inactive';

  // 1. Load Analytics Summary
  const fetchOverview = async () => {
    try {
      setStatsLoading(true);
      const res = await staffPaymentVerificationService.getPaymentVerificationOverview();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load overview analytics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // 2. Load Paginated Payments
  const fetchQueue = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        limit: 10,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'All Statuses' ? statusFilter : undefined,
        method: methodFilter !== 'All Methods' ? methodFilter : undefined
      };

      const res = await staffPaymentVerificationService.getPaymentVerifications(params);
      if (res.success) {
        setVerifications(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load payment queue.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data calls
  useEffect(() => {
    fetchOverview();
    fetchQueue(1);
  }, [statusFilter, methodFilter]);

  // Debounced search handler
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchQueue(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Real-time Sockets Synchronization
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleRefresh = () => {
        fetchQueue(pagination.page);
        fetchOverview();
      };

      socket.on('payment:new', handleRefresh);
      socket.on('payment:verified', handleRefresh);
      socket.on('payment:rejected', handleRefresh);
      socket.on('payment:updated', handleRefresh);

      return () => {
        socket.off('payment:new', handleRefresh);
        socket.off('payment:verified', handleRefresh);
        socket.off('payment:rejected', handleRefresh);
        socket.off('payment:updated', handleRefresh);
      };
    }
  }, [pagination.page]);

  // 3. Load Full Single Detail for Drawer
  const handleOpenDrawer = async (payment) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setHydratedDetails(null);
    try {
      const res = await staffPaymentVerificationService.getPaymentVerificationById(payment._id);
      if (res.success) {
        setHydratedDetails(res.data);
      }
    } catch (err) {
      toast.error('Failed to load payment details.');
      setIsDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  // 4. Perform Verification
  const handleConfirmVerify = async () => {
    if (!selectedPayment) return;
    
    // Pre-verification logic rule: Cannot verify if proof is missing
    if (selectedPayment.uploadedProofType === 'Missing Proof') {
       return toast.error('Cannot verify payment without an uploaded receipt.');
    }

    try {
      setSubmitting(true);
      const payload = { verificationNotes: verifyNotes };
      const res = await staffPaymentVerificationService.verifyPayment(selectedPayment._id, payload);
      if (res.success) {
        toast.success('Payment successfully verified!');
        setIsVerifyModalOpen(false);
        setIsDrawerOpen(false);
        setVerifyNotes('');
        fetchQueue(pagination.page);
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete verification workflow.');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Perform Rejection
  const handleConfirmReject = async () => {
    if (!selectedPayment) return;
    try {
      setSubmitting(true);
      const payload = { rejectionReason, notes: rejectionNotes };
      const res = await staffPaymentVerificationService.rejectPayment(selectedPayment._id, payload);
      if (res.success) {
        toast.success('Payment proof successfully rejected.');
        setIsRejectionModalOpen(false);
        setIsDrawerOpen(false);
        setRejectionNotes('');
        fetchQueue(pagination.page);
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject proof.');
    } finally {
      setSubmitting(false);
    }
  };

  // Extract filename or formatted label for receipt
  const getReceiptLabel = () => {
    if (!hydratedDetails?.UPLOADED_PROOFS) return 'No File';
    const proofs = hydratedDetails.UPLOADED_PROOFS;
    if (proofs.receipt) return 'EFT Receipt';
    if (proofs.screenshot) return 'Screenshot';
    return 'No File';
  };

  const getReceiptUrl = () => {
    if (!hydratedDetails?.UPLOADED_PROOFS) return null;
    const proofs = hydratedDetails.UPLOADED_PROOFS;
    return proofs.receipt || proofs.screenshot || null;
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Verification</h1>
          <p className="text-slate-500 font-medium mt-1">Verify borrower payment proofs, uploaded receipts, and transfer confirmations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => { fetchOverview(); fetchQueue(pagination.page); }}
            className="flex items-center gap-2 font-bold border-slate-200 bg-white"
          >
            <RefreshCw size={18} /> Refresh Payments
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />
          ))
        ) : (
          <>
            <StatCard title="Pending Verifications" value={String(stats.pendingVerifications)} icon={Clock} color="navy" />
            <StatCard title="Verified Payments" value={String(stats.verifiedPayments)} icon={CheckCircle2} color="green" />
            <StatCard title="Rejected Proofs" value={String(stats.rejectedProofs)} icon={XCircle} color="rose" />
            <StatCard title="Verified Today" value={String(stats.verifiedToday)} icon={ShieldCheck} color="blue" />
          </>
        )}
      </div>


      {/* 4. SEARCH & FILTER SECTION */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search borrower, transaction, or loan ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]"
        >
          <option>All Statuses</option>
          <option>Pending</option>
          <option>Verified</option>
          <option>Rejected</option>
        </select>
        <select 
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]"
        >
          <option>All Methods</option>
          <option>EFT</option>
          <option>Bank Transfer</option>
          <option>Cash Deposit</option>
          <option>Mobile Payment</option>
        </select>
      </div>

      {/* 5. PAYMENT VERIFICATION TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                <th className="px-8 py-6 border-b border-slate-100">Loan ID</th>
                <th className="px-8 py-6 border-b border-slate-100">Amount</th>
                <th className="px-8 py-6 border-b border-slate-100">Proof Status</th>
                <th className="px-8 py-6 border-b border-slate-100">Verification</th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-5"><div className="h-10 bg-slate-50 rounded-2xl w-full" /></td>
                  </tr>
                ))
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center space-y-4 text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 border flex items-center justify-center text-slate-300">
                        <ShieldCheck size={32} />
                      </div>
                      <p className="text-lg font-black text-slate-600 tracking-tight">Clean Verification Queue</p>
                      <p className="text-xs font-semibold text-slate-400">Currently no pending payment submissions match your query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                verifications.map((item, i) => (
                  <motion.tr 
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-slate-100 flex items-center justify-center font-black text-xs uppercase overflow-hidden">
                          {item.borrowerPhoto && item.borrowerPhoto !== 'no-photo.jpg' ? (
                            <img src={item.borrowerPhoto} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            item.borrowerName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">{item.borrowerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{item.borrowerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.loanId}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">{formatZAR(item.paymentAmount)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <CreditCard size={10} /> {item.paymentMethod}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <ProofBadge status={item.uploadedProofType} />
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={item.verificationStatus} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenDrawer(item)}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                          title="View Verification Drawer"
                        >
                          <Eye size={18} />
                        </button>
                        {item.verificationStatus === 'Pending' && (
                          <button 
                            onClick={() => { setSelectedPayment(item); setIsVerifyModalOpen(true); }}
                            className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                            title="Verify Instantly"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION WORKFLOW */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="secondary"
            disabled={pagination.page === 1}
            onClick={() => fetchQueue(pagination.page - 1)}
            className="px-4 py-2 text-xs font-bold border-slate-200 bg-white"
          >
            Previous
          </Button>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="secondary"
            disabled={pagination.page === pagination.pages}
            onClick={() => fetchQueue(pagination.page + 1)}
            className="px-4 py-2 text-xs font-bold border-slate-200 bg-white"
          >
            Next
          </Button>
        </div>
      )}

      {/* 👤 VERIFICATION DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Verification</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedPayment?.paymentId || 'TRX-...'}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {drawerLoading ? (
                  <div className="flex items-center justify-center h-64">
                     <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest">Streaming Ledger File...</span>
                     </div>
                  </div>
                ) : hydratedDetails ? (
                  <>
                    {/* BORROWER & LOAN INFO */}
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <User size={14} className="text-primary" /> Borrower Details
                      </h4>
                      <div className="grid grid-cols-1 gap-5">
                        <DrawerItem icon={User} label="Borrower Name" value={hydratedDetails.BORROWER.fullName} />
                        <DrawerItem icon={Phone} label="Phone Number" value={hydratedDetails.BORROWER.phone} />
                        <DrawerItem icon={FileText} label="Loan Code Identifier" value={hydratedDetails.LOAN.loanId} />
                        <DrawerItem icon={CreditCard} label="Payment Method" value={hydratedDetails.PAYMENT.paymentMethod} />
                        <DrawerItem icon={Calendar} label="Submitted Date" value={new Date(hydratedDetails.PAYMENT.paymentDate || selectedPayment.submittedDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })} />
                      </div>
                    </section>

                    {/* ACCOUNT SUMMARY */}
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <DollarSign size={14} className="text-primary" /> Account Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <SummaryCard label="Payment Amount" value={formatZAR(hydratedDetails.PAYMENT.paymentAmount)} color="emerald" />
                        <SummaryCard label="Remaining Balance" value={formatZAR(hydratedDetails.LOAN.remainingBalance)} color="navy" />
                        <SummaryCard label="Overdue Amount" value={formatZAR(hydratedDetails.LOAN.overdueAmount)} color="rose" />
                        <SummaryCard label="Current Status" value={hydratedDetails.VERIFICATION.verificationStatus} color="accent" />
                      </div>
                    </section>

                    {/* PAYMENT PROOF SECTION */}
                    <section className="space-y-6 pb-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <Receipt size={14} className="text-primary" /> Uploaded Proof
                      </h4>
                      <div className="space-y-4">
                        {getReceiptUrl() ? (
                          <div className="aspect-video bg-slate-50 rounded-[2rem] border-4 border-slate-100 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                            {getReceiptUrl().match(/\.(jpeg|jpg|gif|png)$/i) ? (
                              <img src={getReceiptUrl()} alt="Receipt Proof" className="w-full h-full object-cover" />
                            ) : (
                              <Receipt size={48} className="text-slate-300" />
                            )}
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                              <a href={getReceiptUrl()} target="_blank" rel="noreferrer" className="p-4 bg-white rounded-full text-primary shadow-xl hover:scale-110 transition-transform">
                                <ZoomIn size={24} />
                              </a>
                            </div>
                            {!getReceiptUrl().match(/\.(jpeg|jpg|gif|png)$/i) && (
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">payment_document.pdf</p>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                             <AlertCircle size={36} className="text-slate-300" />
                             <p className="text-[10px] font-black uppercase tracking-widest">No Uploaded Document Proof</p>
                          </div>
                        )}
                        {getReceiptUrl() && (
                          <div className="flex gap-2">
                            <ProofActionCard name={getReceiptLabel()} status="Attached" url={getReceiptUrl()} />
                          </div>
                        )}
                      </div>
                    </section>
                    
                    {/* NOTES */}
                    {hydratedDetails.PAYMENT.paymentNotes && (
                      <section className="space-y-3">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Borrower Notes</h4>
                         <div className="p-5 bg-slate-50 rounded-2xl text-[11px] font-medium text-slate-600 leading-relaxed italic border border-slate-100">
                           "{hydratedDetails.PAYMENT.paymentNotes}"
                         </div>
                      </section>
                    )}

                    {/* FEEDBACK */}
                    {hydratedDetails.VERIFICATION.verificationStatus === 'Rejected' && hydratedDetails.VERIFICATION.rejectionReason && (
                      <section className="space-y-3">
                         <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.15em]">Rejection Verdict</h4>
                         <div className="p-5 bg-rose-50/50 rounded-2xl text-[11px] font-bold text-rose-600 border border-rose-100">
                           {hydratedDetails.VERIFICATION.rejectionReason}
                           {hydratedDetails.VERIFICATION.verificationNotes && <p className="font-medium text-slate-600 italic mt-2">"{hydratedDetails.VERIFICATION.verificationNotes}"</p>}
                         </div>
                      </section>
                    )}
                  </>
                ) : null}
              </div>

              {/* FOOTER BUTTON CONTAINER */}
              {hydratedDetails && hydratedDetails.VERIFICATION.verificationStatus === 'Pending' && (
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                  <Button 
                    className={cn(
                      "w-full font-black uppercase tracking-widest text-[10px] py-4",
                      isInactive ? "bg-slate-300 cursor-not-allowed opacity-70 shadow-none" : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                    )} 
                    onClick={() => !isInactive && setIsVerifyModalOpen(true)}
                    disabled={isInactive}
                    title={isInactive ? "Your account is inactive" : "Verify Payment"}
                  >
                    Verify Payment
                  </Button>
                  <Button 
                    variant="secondary" 
                    className={cn(
                      "w-full font-black uppercase tracking-widest text-[10px] py-4",
                      isInactive ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-rose-100 text-rose-500 bg-white hover:bg-rose-50"
                    )}
                    onClick={() => !isInactive && setIsRejectionModalOpen(true)}
                    disabled={isInactive}
                    title={isInactive ? "Your account is inactive" : "Reject Proof"}
                  >
                    Reject Proof
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ VERIFICATION MODAL */}
      <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} title="Confirm Payment Verification" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verifying Payment For</p>
              <p className="text-lg font-black text-emerald-900">{selectedPayment?.borrowerName}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Amount</p>
              <p className="text-lg font-black text-emerald-900">{formatZAR(selectedPayment?.paymentAmount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</p>
                <p className="text-xs font-black text-slate-900">{selectedPayment?.paymentId}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                <p className="text-xs font-black text-slate-900">{selectedPayment?.paymentMethod}</p>
              </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Notes</label>
            <textarea 
              placeholder="Add any audit notes regarding this payment verification..." 
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[100px] focus:ring-2 focus:ring-primary/10 outline-none transition-all" 
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsVerifyModalOpen(false)}>Cancel</Button>
            <Button 
              className="flex-1 font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600" 
              onClick={handleConfirmVerify}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Confirm Verification'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ❌ REJECTION MODAL */}
      <Modal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} title="Reject Payment Proof" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Reason</label>
              <select 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option>Invalid Receipt/Screenshot</option>
                <option>Transaction ID Not Found</option>
                <option>Amount Mismatch</option>
                <option>Blurry/Unreadable Document</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes to Borrower</label>
              <textarea 
                placeholder="Explain why the proof was rejected and what to re-upload..." 
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none" 
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
            <Button 
              className="flex-1 font-bold shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600" 
              onClick={handleConfirmReject}
              disabled={submitting}
            >
              {submitting ? 'Committing...' : 'Reject Payment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ProofBadge = ({ status }) => {
  const isUploaded = status === 'Receipt Uploaded' || status === 'Screenshot Uploaded';
  return (
    <div className={cn(
      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
      isUploaded ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
      "bg-rose-50 text-rose-600 border-rose-100"
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full", isUploaded ? "bg-emerald-500" : "bg-rose-500")} />
      {status}
    </div>
  );
};

const DrawerItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors"><Icon size={16} /></div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs font-black text-slate-900 truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const SummaryCard = ({ label, value, color }) => (
  <div className={cn(
    "p-4 rounded-xl border flex flex-col gap-1 transition-all hover:scale-105",
    color === 'emerald' ? "bg-emerald-50 border-emerald-100" :
    color === 'rose' ? "bg-rose-50 border-rose-100" :
    color === 'navy' ? "bg-slate-900 border-slate-800 text-white" :
    "bg-primary/5 border-primary/10"
  )}>
    <p className={cn("text-[7px] font-black uppercase tracking-widest", color === 'navy' ? "text-slate-500" : "text-slate-400")}>{label}</p>
    <p className={cn("text-xs font-black truncate", color === 'navy' ? "text-white" : "text-slate-900")}>{value || 'N/A'}</p>
  </div>
);

const ProofActionCard = ({ name, status, url }) => (
  <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm font-black text-[8px] uppercase">
        {url && url.match(/\.(pdf)$/i) ? 'PDF' : 'IMG'}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-900 truncate max-w-[100px]">{name}</p>
        <p className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest">{status}</p>
      </div>
    </div>
    <div className="flex items-center gap-1">
      {url && (
        <>
          <a href={url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-primary transition-colors"><Eye size={12} /></a>
          <a href={url} download target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"><FileDown size={12} /></a>
        </>
      )}
    </div>
  </div>
);

export default PaymentVerification;
