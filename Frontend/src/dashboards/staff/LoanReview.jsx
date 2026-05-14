import React, { useState, useEffect } from 'react';
import { 
  Clock, FileText, User, Search, Filter, 
  Eye, FileCheck, ChevronRight, Download,
  Calendar, Wallet, RefreshCw, ArrowRight,
  CheckCircle2, AlertCircle, X, ShieldCheck,
  Building2, PieChart, MapPin, Phone, Send,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import Modal from '../../ui/Modal';
import staffLoanReviewService from '../../services/staffLoanReviewService';
import { getSocket } from '../../socket/socketClient';

// Currency Formatter
const formatZAR = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const LoanReview = () => {
  const navigate = useNavigate();

  // Data & Loading States
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    applicationsUnderReview: 0,
    recommendationsSubmitted: 0,
    pendingDecisions: 0,
    reviewsCompletedToday: 0
  });
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Filters & Paging
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Review Statuses');
  const [loanTypeFilter, setLoanTypeFilter] = useState('All Loan Types');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Drawer & Active Object
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [activeDossier, setActiveDossier] = useState(null);

  // Modals & Submission Payloads
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isRequestDocsModalOpen, setIsRequestDocsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [notesPayload, setNotesPayload] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Low Affordability Score');
  const [requestedDocType, setRequestedDocType] = useState('ID Document');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isInactive = currentUser.operationalStatus === 'Inactive';

  // 1. Load Stat Cards
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await staffLoanReviewService.getLoanReviewOverview();
      if (res.success) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Failed to load review summary cards:', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  // 2. Load Main Application Grid
  const fetchQueue = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        limit: 10,
        search: searchQuery.trim() || undefined,
        reviewStatus: statusFilter !== 'All Review Statuses' ? statusFilter : undefined,
        loanType: loanTypeFilter !== 'All Loan Types' ? loanTypeFilter : undefined
      };

      const res = await staffLoanReviewService.getLoanReviews(params);
      if (res.success) {
        setReviews(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to stream evaluation queue.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial loads
  useEffect(() => {
    fetchOverview();
    fetchQueue(1);
  }, [statusFilter, loanTypeFilter]);

  // Input Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => fetchQueue(1), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 3. Load Drawer Details
  const handleOpenDrawer = async (id) => {
    setSelectedId(id);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await staffLoanReviewService.getLoanReviewById(id);
      if (res.success) {
        setActiveDossier(res.data);
      }
    } catch (err) {
      toast.error('Unable to load application dossier.');
      setIsDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Action Committer: Approve Recommendation
  const handleSubmitApproval = async () => {
    if (!selectedId) return;
    try {
      setSubmitting(true);
      const payload = { recommendationNotes: notesPayload };
      const res = await staffLoanReviewService.recommendApproval(selectedId, payload);
      if (res.success) {
        toast.success('Recommendation dispatched to Admin queues.');
        setIsApprovalModalOpen(false);
        setIsDrawerOpen(false);
        setNotesPayload('');
        fetchQueue(pagination.page);
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Workflow commit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Action Committer: Suggest Rejection
  const handleSubmitRejection = async () => {
    if (!selectedId) return;
    try {
      setSubmitting(true);
      const payload = { rejectionReason, notes: notesPayload };
      const res = await staffLoanReviewService.recommendRejection(selectedId, payload);
      if (res.success) {
        toast.success('Rejection suggestion submitted to Admin.');
        setIsRejectionModalOpen(false);
        setIsDrawerOpen(false);
        setNotesPayload('');
        fetchQueue(pagination.page);
        fetchOverview();
      }
    } catch (err) {
      toast.error('Workflow commit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Action Committer: Request Docs
  const handleSubmitDocRequest = async () => {
    if (!selectedId) return;
    try {
      setSubmitting(true);
      const payload = { documentType: requestedDocType, message: notesPayload };
      const res = await staffLoanReviewService.requestDocuments(selectedId, payload);
      if (res.success) {
        toast.success(`Borrower notified to upload ${requestedDocType}.`);
        setIsRequestDocsModalOpen(false);
        setIsDrawerOpen(false);
        setNotesPayload('');
        fetchQueue(pagination.page);
        fetchOverview();
      }
    } catch (err) {
      toast.error('Dispatch failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Socket IO Hooks
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleBroadSync = () => {
        fetchQueue(pagination.page);
        fetchOverview();
      };
      socket.on('review:new', handleBroadSync);
      socket.on('recommendation:submitted', handleBroadSync);
      socket.on('recommendation:rejected', handleBroadSync);
      socket.on('documents:requested', handleBroadSync);
      socket.on('review:updated', handleBroadSync);

      return () => {
        socket.off('review:new', handleBroadSync);
        socket.off('recommendation:submitted', handleBroadSync);
        socket.off('recommendation:rejected', handleBroadSync);
        socket.off('documents:requested', handleBroadSync);
        socket.off('review:updated', handleBroadSync);
      };
    }
  }, [pagination.page]);

  return (
    <div className="space-y-8 pb-10">
      {/* PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loan Review</h1>
          <p className="text-slate-500 font-medium mt-1">Review borrower applications, assess affordability, and submit loan recommendations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => { fetchOverview(); fetchQueue(pagination.page); }}
            className="flex items-center gap-2 font-bold border-slate-200 bg-white"
          >
            <RefreshCw size={18} /> Refresh Reviews
          </Button>
        </div>
      </header>

      {/* ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-50/50 animate-pulse border border-slate-100 rounded-3xl" />
          ))
        ) : (
          <>
            <StatCard title="Applications Under Review" value={String(overview.applicationsUnderReview || 0)} icon={Clock} color="navy" />
            <StatCard title="Recommendations Submitted" value={String(overview.recommendationsSubmitted || 0)} icon={Send} color="blue" />
            <StatCard title="Pending Decisions" value={String(overview.pendingDecisions || 0)} icon={AlertCircle} color="accent" />
            <StatCard title="Reviews Completed Today" value={String(overview.reviewsCompletedToday || 0)} icon={CheckCircle2} color="green" />
          </>
        )}
      </div>

      {/* SEARCH & FILTER GRID */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search borrower by name, phone, or ID..." 
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
          <option>All Review Statuses</option>
          <option>Pending Review</option>
          <option>Reviewed</option>
          <option>Recommendation Submitted</option>
          <option>Rejected Recommendation</option>
        </select>
        <select 
          value={loanTypeFilter}
          onChange={(e) => setLoanTypeFilter(e.target.value)}
          className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]"
        >
          <option>All Loan Types</option>
          <option>Personal Loan</option>
          <option>Emergency Loan</option>
          <option>Business Loan</option>
          <option>Education Loan</option>
        </select>
      </div>

      {/* TABLE DATA VIEW */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                <th className="px-8 py-6 border-b border-slate-100">Loan Type</th>
                <th className="px-8 py-6 border-b border-slate-100">Amount</th>
                <th className="px-8 py-6 border-b border-slate-100">Affordability</th>
                <th className="px-8 py-6 border-b border-slate-100">Review Status</th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6"><div className="h-10 bg-slate-50 rounded-xl w-full" /></td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-50 border flex items-center justify-center text-slate-400"><ShieldCheck size={32} /></div>
                      <p className="text-lg font-black text-slate-600 tracking-tight">Empty Work Queue</p>
                      <p className="text-xs font-semibold text-slate-400">Currently, there are no application dossiers matching the selected queues.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((app, i) => (
                  <motion.tr 
                    key={app._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 border border-slate-100 text-primary flex items-center justify-center font-black text-xs uppercase overflow-hidden">
                          {app.borrowerPhoto && app.borrowerPhoto !== 'no-photo.jpg' ? (
                            <img src={app.borrowerPhoto} alt="photo" className="w-full h-full object-cover" />
                          ) : (
                            (app.borrowerName || '').split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">{app.borrowerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{app.borrowerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{app.loanType}</span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-900">{formatZAR(app.requestedAmount)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <AffordabilityBadge status={app.affordabilityStatus} />
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={app.reviewStatus} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenDrawer(app._id)}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                          title="Quick View Dossier"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/staff/loan-review/${app._id}`)}
                          className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                          title="Comprehensive Eligibility Workbench"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE PAGINATION */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <Button 
            variant="secondary" 
            disabled={pagination.page === 1}
            onClick={() => fetchQueue(pagination.page - 1)}
            className="px-4 py-2 text-xs font-bold border-slate-200 bg-white"
          >
            Prev
          </Button>
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Page {pagination.page} of {pagination.pages}</span>
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

      {/* DYNAMIC REVIEW SLIDING DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Review Dossier</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{activeDossier?.applicationId || 'LAPP-...'}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin">
                {drawerLoading ? (
                  <div className="space-y-6 animate-pulse">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-50 rounded-2xl" />)}
                  </div>
                ) : activeDossier ? (
                  <>
                    {/* BORROWER INFORMATION */}
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <User size={14} className="text-primary" /> Borrower Information
                      </h4>
                      <div className="grid grid-cols-1 gap-5">
                        <DrawerItem icon={User} label="Full Name" value={activeDossier.borrower.fullName} />
                        <DrawerItem icon={Building2} label="Employer" value={activeDossier.employment.employerName} />
                        <DrawerItem icon={Phone} label="Contact" value={activeDossier.borrower.phone} />
                      </div>
                    </section>

                    {/* LOAN DETAILS */}
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <Wallet size={14} className="text-primary" /> Loan Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <DrawerItem icon={Wallet} label="Requested" value={formatZAR(activeDossier.loanDetails.requestedAmount)} />
                        <DrawerItem icon={Clock} label="Duration" value={`${activeDossier.loanDetails.loanDuration} Months`} />
                      </div>
                    </section>

                    {/* AFFORDABILITY */}
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <PieChart size={14} className="text-primary" /> Affordability Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <MiniCard label="Monthly Income" value={formatZAR(activeDossier.affordability.monthlyIncome)} color="emerald" />
                        <MiniCard label="Estimated EMI" value={formatZAR(activeDossier.loanDetails.estimatedEMI)} color="navy" />
                        <MiniCard label="Affordability" value={activeDossier.affordability.affordabilityStatus} color="accent" />
                        <MiniCard label="Account Status" value={activeDossier.status} color="blue" />
                      </div>
                    </section>

                    {/* DOCUMENTS STATUS */}
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <FileText size={14} className="text-primary" /> Verification Documents
                      </h4>
                      <div className="space-y-3">
                        <ReviewDocCard name="ID Document" file={activeDossier.documents.idDocument} />
                        <ReviewDocCard name="Payslip" file={activeDossier.documents.payslip} />
                        <ReviewDocCard name="Bank Statement" file={activeDossier.documents.bankStatement} />
                        <ReviewDocCard name="Proof of Address" file={activeDossier.documents.proofOfAddress} />
                      </div>
                    </section>

                    {/* PREVIOUS FEEDBACK LOGS */}
                    {(activeDossier.notes.recommendationNotes || activeDossier.notes.adminComments) && (
                      <section className="space-y-4 pb-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                          <FileText size={14} className="text-primary" /> Notes Archive
                        </h4>
                        <div className="space-y-4">
                          {activeDossier.notes.recommendationNotes && (
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Submissions</p>
                              <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">"{activeDossier.notes.recommendationNotes}"</p>
                            </div>
                          )}
                          {activeDossier.notes.adminComments && (
                            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Administrator Comments</p>
                              <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">"{activeDossier.notes.adminComments}"</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                  </>
                ) : null}
              </div>

              {/* FOOTER ACTION KEYS */}
              {activeDossier && (
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                  <Button 
                    className={cn(
                      "w-full font-black uppercase tracking-widest text-[10px] py-4 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20",
                      (isInactive || activeDossier.reviewStatus === 'Recommendation Submitted') && "bg-slate-300 hover:bg-slate-300 opacity-50 cursor-not-allowed shadow-none"
                    )}
                    onClick={() => !isInactive && activeDossier.reviewStatus !== 'Recommendation Submitted' && setIsApprovalModalOpen(true)}
                    disabled={isInactive || activeDossier.reviewStatus === 'Recommendation Submitted'}
                  >
                    Approve Recommendation
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="secondary" 
                      className={cn(
                        "font-black uppercase tracking-widest text-[8px] py-4 border-rose-100 text-rose-500",
                        isInactive && "opacity-50"
                      )}
                      onClick={() => !isInactive && setIsRejectionModalOpen(true)}
                      disabled={isInactive}
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="secondary" 
                      className={cn(
                        "font-black uppercase tracking-widest text-[8px] py-4 border-slate-200",
                        isInactive && "opacity-50"
                      )}
                      onClick={() => !isInactive && setIsRequestDocsModalOpen(true)}
                      disabled={isInactive}
                    >
                      Request Docs
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full font-black uppercase tracking-widest text-[8px] py-3 text-slate-400 hover:text-primary" 
                    onClick={() => { setIsDrawerOpen(false); navigate(`/staff/loan-review/${activeDossier._id}`); }}
                  >
                    Open Assessment Workbench
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* APPROVAL WORKFLOW MODAL */}
      <Modal 
        isOpen={isApprovalModalOpen} 
        onClose={() => { setIsApprovalModalOpen(false); setNotesPayload(''); }} 
        title="Recommend Approval" 
        maxWidth="max-w-xl"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Borrower Profile</p>
              <p className="text-sm font-black text-slate-900">{activeDossier?.borrower.fullName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested Limit</p>
                <p className="text-sm font-black text-slate-900">{formatZAR(activeDossier?.loanDetails.requestedAmount)}</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Matrix</p>
                <p className="text-sm font-black text-emerald-600">{activeDossier?.affordability.affordabilityStatus}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendation Notes</label>
            <textarea 
              placeholder="Write assessment summary providing context on affordability and files to final Admin..." 
              value={notesPayload}
              onChange={(e) => setNotesPayload(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none" 
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsApprovalModalOpen(false)}>Cancel</Button>
            <Button 
              className="flex-1 font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600" 
              disabled={submitting}
              onClick={handleSubmitApproval}
            >
              {submitting ? 'Saving...' : 'Submit Recommendation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REJECTION WORKFLOW MODAL */}
      <Modal 
        isOpen={isRejectionModalOpen} 
        onClose={() => { setIsRejectionModalOpen(false); setNotesPayload(''); }} 
        title="Recommend Rejection" 
        maxWidth="max-w-xl"
      >
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Reasoning</label>
              <select 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option>Low Affordability Score</option>
                <option>Insufficient Document Proof</option>
                <option>Negative External Credit History</option>
                <option>Employment Instability</option>
                <option>High Debt-To-Income Ratio</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Narrative</label>
              <textarea 
                placeholder="Detail specifics why rejection was endorsed..." 
                value={notesPayload}
                onChange={(e) => setNotesPayload(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none" 
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
            <Button 
              className="flex-1 font-bold shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600" 
              disabled={submitting}
              onClick={handleSubmitRejection}
            >
              {submitting ? 'Committing...' : 'Submit Recommendation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DOCUMENT CORRECTION DISPATCH MODAL */}
      <Modal 
        isOpen={isRequestDocsModalOpen} 
        onClose={() => { setIsRequestDocsModalOpen(false); setNotesPayload(''); }} 
        title="Request Corrective Documents" 
        maxWidth="max-w-xl"
      >
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type Target</label>
              <select 
                value={requestedDocType}
                onChange={(e) => setRequestedDocType(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option>ID Document</option>
                <option>Payslip</option>
                <option>Bank Statement</option>
                <option>Proof of Address</option>
                <option>Additional Supporting Docs</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Message to Borrower</label>
              <textarea 
                placeholder="Explain instructions clearly e.g. 'Last 3 months bank statement requested, current file only has 1 month.'..." 
                value={notesPayload}
                onChange={(e) => setNotesPayload(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none" 
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsRequestDocsModalOpen(false)}>Cancel</Button>
            <Button 
              className="flex-1 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary-dark" 
              disabled={submitting}
              onClick={handleSubmitDocRequest}
            >
              {submitting ? 'Sending Notification...' : 'Dispatch Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- REUSABLE INNER LAYOUT COMPONENTS ---

const AffordabilityBadge = ({ status }) => {
  const cleaned = status || 'Pending';
  const config = {
    'Eligible': 'bg-emerald-50 text-emerald-600 border-emerald-100 dot-bg-emerald-500',
    'Passed': 'bg-emerald-50 text-emerald-600 border-emerald-100 dot-bg-emerald-500',
    'Moderate': 'bg-amber-50 text-amber-600 border-amber-100 dot-bg-amber-500',
    'Risky': 'bg-rose-50 text-rose-600 border-rose-100 dot-bg-rose-500',
    'Failed': 'bg-rose-50 text-rose-600 border-rose-100 dot-bg-rose-500',
    'Pending': 'bg-slate-50 text-slate-500 border-slate-100 dot-bg-slate-400'
  }[cleaned] || 'bg-slate-50 text-slate-500 border-slate-100 dot-bg-slate-400';

  const isDotRose = config.includes('dot-bg-rose-500');
  const isDotAmber = config.includes('dot-bg-amber-500');
  const isDotEmerald = config.includes('dot-bg-emerald-500');

  return (
    <div className={cn(
      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
      config.split(' dot-bg-')[0]
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full", 
        isDotRose ? "bg-rose-500" : isDotAmber ? "bg-amber-500" : isDotEmerald ? "bg-emerald-500" : "bg-slate-400"
      )} />
      {cleaned}
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

const MiniCard = ({ label, value, color }) => (
  <div className={cn(
    "p-4 rounded-xl border flex flex-col gap-1 transition-all hover:scale-105",
    color === 'emerald' ? "bg-emerald-50 border-emerald-100" :
    color === 'rose' ? "bg-rose-50 border-rose-100" :
    color === 'navy' ? "bg-slate-900 border-slate-800 text-white" :
    "bg-primary/5 border-primary/10 text-primary"
  )}>
    <p className={cn("text-[7px] font-black uppercase tracking-widest", color === 'navy' ? "text-slate-500" : "text-slate-400")}>{label}</p>
    <p className={cn("text-xs font-black truncate", color === 'navy' ? "text-white" : "text-slate-900")}>{value || 'N/A'}</p>
  </div>
);

const ReviewDocCard = ({ name, file }) => (
  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm"><FileText size={14} /></div>
      <div>
        <p className="text-[10px] font-black text-slate-900 truncate max-w-[120px]">{name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <div className={cn("w-1 h-1 rounded-full", file ? "bg-emerald-500" : "bg-amber-500")} />
          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{file ? 'Available' : 'Pending'}</p>
        </div>
      </div>
    </div>
    {file && (
      <div className="flex items-center gap-1">
        <a 
          href={file} 
          target="_blank" 
          rel="noreferrer" 
          className="p-1.5 text-slate-400 hover:text-primary transition-colors"
          title="Preview File"
        >
          <Eye size={14} />
        </a>
        <a 
          href={file} 
          download 
          className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
          title="Download File"
        >
          <FileDown size={14} />
        </a>
      </div>
    )}
  </div>
);

export default LoanReview;
