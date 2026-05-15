import React, { useState, useEffect } from 'react';
import { 
  Clock, FileText, User, Search, Filter, 
  Eye, FileCheck, ChevronRight, Download,
  Calendar, RefreshCw, ArrowRight,
  CheckCircle2, AlertCircle, X, ShieldCheck,
  Building2, PieChart, MapPin, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import Modal from '../../ui/Modal';
import staffLoanRequestService from '../../services/staffLoanRequestService';
import { getSocket } from '../../socket/socketClient';

const formatZAR = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const LoanRequests = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ newRequests: 0, pendingReviews: 0, pendingDocVerification: 0, reviewedToday: 0 });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [loanTypeFilter, setLoanTypeFilter] = useState('All Loan Types');
  
  // Drawer / Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  
  const [isVerifyDocsModalOpen, setIsVerifyDocsModalOpen] = useState(false);
  const [verifyingDocType, setVerifyingDocType] = useState('ID Document');
  const [verifNotes, setVerifNotes] = useState('');
  const [submittingVerif, setSubmittingVerif] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // 1. Load Counters
  const fetchOverview = async () => {
    try {
      setStatsLoading(true);
      const res = await staffLoanRequestService.getLoanRequestOverview();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed stats hydration:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // 2. Load Queue
  const fetchQueue = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        limit: 10,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'All Statuses' ? statusFilter : undefined,
        loanType: loanTypeFilter !== 'All Loan Types' ? loanTypeFilter : undefined
      };

      const res = await staffLoanRequestService.getLoanRequests(params);
      if (res.success) {
        setApplications(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load application queue.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Load Single Detail for Drawer
  const handleOpenDrawer = async (appId) => {
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedApp(null);
    try {
      const res = await staffLoanRequestService.getLoanRequestById(appId);
      if (res.success) {
        setSelectedApp(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch deep application file.');
      setIsDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  // 4. Perform verification API
  const handleSingleDocVerify = async (docType, targetStatus) => {
    if (!selectedApp) return;
    setSubmittingVerif(true);
    try {
      const payload = {
        documentType: docType,
        verificationStatus: targetStatus,
        verificationNotes: verifNotes
      };
      const res = await staffLoanRequestService.verifyDocuments(selectedApp._id, payload);
      if (res.success) {
        toast.success(`${docType} ${targetStatus} successfully.`);
        // Reload full data block inside modal/drawer
        const fresh = await staffLoanRequestService.getLoanRequestById(selectedApp._id);
        if (fresh.success) {
          setSelectedApp(fresh.data);
        }
        // Silent refresh table
        fetchQueue(pagination.page);
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify document');
    } finally {
      setSubmittingVerif(false);
    }
  };

  // 5. Setup Listeners
  useEffect(() => {
    fetchOverview();
    fetchQueue(1);
  }, [statusFilter, loanTypeFilter]);

  // Debounced search handler
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchQueue(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Real-time Socket integration
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleRefresh = () => {
        fetchQueue(pagination.page);
        fetchOverview();
      };

      socket.on('loan-request:new', handleRefresh);
      socket.on('loan-request:updated', handleRefresh);
      socket.on('document:verified', handleRefresh);
      socket.on('review:submitted', handleRefresh);

      return () => {
        socket.off('loan-request:new', handleRefresh);
        socket.off('loan-request:updated', handleRefresh);
        socket.off('document:verified', handleRefresh);
        socket.off('review:submitted', handleRefresh);
      };
    }
  }, [pagination.page]);

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loan Requests</h1>
          <p className="text-slate-500 font-medium mt-1">Review incoming borrower applications, verify documents, and process loan requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => { fetchOverview(); fetchQueue(pagination.page); }}
            className="flex items-center gap-2 font-bold border-slate-200 bg-white"
          >
            <RefreshCw size={18} /> Refresh
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100/70 border border-slate-200 animate-pulse rounded-3xl" />
          ))
        ) : (
          <>
            <StatCard title="New Requests" value={String(stats.newRequests)} icon={Plus} color="navy" />
            <StatCard title="Pending Reviews" value={String(stats.pendingReviews)} icon={Clock} color="blue" />
            <StatCard title="Pending Doc Verification" value={String(stats.pendingDocVerification)} icon={FileText} color="accent" />
            <StatCard title="Reviewed Today" value={String(stats.reviewedToday)} icon={CheckCircle2} color="green" />
          </>
        )}
      </div>

      {/* 4. SEARCH & FILTER SECTION */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search borrower by name, phone or ID..." 
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
          <option>New</option>
          <option>Pending Verification</option>
          <option>Pending Review</option>
          <option>Reviewed</option>
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

      {/* 5. LOAN REQUESTS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                <th className="px-8 py-6 border-b border-slate-100">Loan Info</th>
                <th className="px-8 py-6 border-b border-slate-100">Docs Status</th>
                <th className="px-8 py-6 border-b border-slate-100">Review Status</th>
                <th className="px-8 py-6 border-b border-slate-100">Review Result</th>
                <th className="px-8 py-6 border-b border-slate-100">Submitted</th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-50">
                    <td colSpan={6} className="px-8 py-5"><div className="h-12 bg-slate-50 rounded-2xl" /></td>
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center space-y-4 text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100"><FileText size={32} /></div>
                      <p className="font-black tracking-tight text-lg text-slate-600">No Applications Found</p>
                      <p className="text-xs font-medium">Your current filters match no outstanding incoming requests.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app, i) => (
                  <motion.tr 
                    key={app._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl border border-slate-100 bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase overflow-hidden shadow-sm">
                          {app.borrowerPhoto && app.borrowerPhoto !== 'no-photo.jpg' ? (
                            <img src={app.borrowerPhoto} alt="avatar" className="w-full h-full object-cover" />
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
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">{formatZAR(app.requestedAmount)}</p>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{app.loanType}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <DocStatusBadge status={app.uploadedDocsStatus} />
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={app.reviewStatus} />
                    </td>
                    <td className="px-8 py-5">
                      <ReviewResultBadge staffReview={app.staffReview} />
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(app.submittedDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenDrawer(app._id)}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                          title="Quick View"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            handleOpenDrawer(app._id).then(() => {
                              setIsVerifyDocsModalOpen(true);
                            });
                          }}
                          className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                          title="Verify Docs"
                        >
                          <ShieldCheck size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/staff/loan-review/${app._id}`)}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                          title="Full Review"
                        >
                          <FileCheck size={18} />
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

      {/* Pagination Buttons */}
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
          <span className="text-xs font-black text-slate-500 uppercase px-2">
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

      {/* 👤 APPLICATION PREVIEW DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              
              {drawerLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 bg-white">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest">Streaming File...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Application Preview</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedApp?.applicationId}</p>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* BORROWER INFO */}
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <User size={14} className="text-primary" /> Borrower Information
                      </h4>
                      <div className="grid grid-cols-1 gap-5">
                        <DrawerItem icon={User} label="Full Name" value={selectedApp?.borrower?.fullName} />
                        <DrawerItem icon={Phone} label="Contact" value={selectedApp?.borrower?.phone} />
                        <DrawerItem icon={Building2} label="Employment" value={selectedApp?.employment?.employerName} />
                        <DrawerItem icon={MapPin} label="Residential Address" value={selectedApp?.borrower?.address || 'No Address Registered'} />
                      </div>
                    </section>

                    {/* AFFORDABILITY SUMMARY */}
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <PieChart size={14} className="text-primary" /> Affordability Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <AffordabilityCard label="Monthly Income" value={formatZAR(selectedApp?.employment?.monthlyIncome)} color="emerald" />
                        <AffordabilityCard label="Est. EMI" value={formatZAR(selectedApp?.loanDetails?.estimatedEMI)} color="navy" />
                        <AffordabilityCard label="Term Months" value={`${selectedApp?.loanDetails?.loanDuration || 0} Mo`} color="accent" />
                        <AffordabilityCard label="Affordability" value={selectedApp?.affordability?.affordabilityStatus} color="default" />
                      </div>
                    </section>

                    {/* DOCUMENTS SECTION */}
                    <section className="space-y-6 pb-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <FileText size={14} className="text-primary" /> Uploaded Documents
                      </h4>
                      <div className="space-y-3">
                        <DocumentCard name="Identity Document" status={selectedApp?.documentVerification?.idProofStatus || 'Pending'} fileUrl={selectedApp?.documents?.idDocument} />
                        <DocumentCard name="Recent Payslip" status={selectedApp?.documentVerification?.payslipStatus || 'Pending'} fileUrl={selectedApp?.documents?.payslip} />
                        <DocumentCard name="Bank Statement" status={selectedApp?.documentVerification?.bankStatementStatus || 'Pending'} fileUrl={selectedApp?.documents?.bankStatement} />
                        <DocumentCard name="Proof of Address" status={selectedApp?.documentVerification?.proofOfAddressStatus || 'Pending'} fileUrl={selectedApp?.documents?.proofOfAddress} />
                      </div>
                    </section>
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                    <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => navigate(`/staff/loan-review/${selectedApp?._id}`)}>
                      Review Borrower
                    </Button>
                    <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200" onClick={() => setIsVerifyDocsModalOpen(true)}>
                      Verify Documents
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 📄 DOCUMENT VERIFICATION MODAL */}
      <Modal 
        isOpen={isVerifyDocsModalOpen} 
        onClose={() => setIsVerifyDocsModalOpen(false)} 
        title="Document Verification Desk"
        maxWidth="max-w-4xl"
      >
        {selectedApp && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VerificationDocItem 
                name="ID Document" 
                status={selectedApp.documentVerification?.idProofStatus || 'Pending'} 
                notes={selectedApp.documentVerification?.idProofNotes}
                fileUrl={selectedApp.documents?.idDocument}
                isActive={verifyingDocType === 'ID Document'}
                onClick={() => setVerifyingDocType('ID Document')}
                onAction={(target) => handleSingleDocVerify('ID Document', target)}
                submitting={submittingVerif}
              />
              <VerificationDocItem 
                name="Recent Payslip" 
                status={selectedApp.documentVerification?.payslipStatus || 'Pending'} 
                notes={selectedApp.documentVerification?.payslipNotes}
                fileUrl={selectedApp.documents?.payslip}
                isActive={verifyingDocType === 'Payslip'}
                onClick={() => setVerifyingDocType('Payslip')}
                onAction={(target) => handleSingleDocVerify('Payslip', target)}
                submitting={submittingVerif}
              />
              <VerificationDocItem 
                name="Bank Statement" 
                status={selectedApp.documentVerification?.bankStatementStatus || 'Pending'} 
                notes={selectedApp.documentVerification?.bankStatementNotes}
                fileUrl={selectedApp.documents?.bankStatement}
                isActive={verifyingDocType === 'Bank Statement'}
                onClick={() => setVerifyingDocType('Bank Statement')}
                onAction={(target) => handleSingleDocVerify('Bank Statement', target)}
                submitting={submittingVerif}
              />
              <VerificationDocItem 
                name="Proof of Address" 
                status={selectedApp.documentVerification?.proofOfAddressStatus || 'Pending'} 
                notes={selectedApp.documentVerification?.proofOfAddressNotes}
                fileUrl={selectedApp.documents?.proofOfAddress}
                isActive={verifyingDocType === 'Proof of Address'}
                onClick={() => setVerifyingDocType('Proof of Address')}
                onAction={(target) => handleSingleDocVerify('Proof of Address', target)}
                submitting={submittingVerif}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Assessor Notes for: <span className="text-primary font-black tracking-normal lowercase font-bold italic">"{verifyingDocType}"</span>
                  </label>
                </div>
                <textarea 
                  placeholder="Write observations or feedback about document status here before clicking 'Approve' or 'Reject'..."
                  value={verifNotes}
                  onChange={(e) => setVerifNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[90px] focus:ring-2 focus:ring-primary/10 outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="secondary" className="w-full font-bold border-slate-200" onClick={() => setIsVerifyDocsModalOpen(false)}>
                Done / Close Workspace
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const DocStatusBadge = ({ status }) => (
  <div className={cn(
    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
    status === 'Complete' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
    status === 'Missing' ? "bg-rose-50 text-rose-600 border-rose-100" :
    "bg-amber-50 text-amber-600 border-amber-100"
  )}>
    <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Complete' ? "bg-emerald-500" : status === 'Missing' ? "bg-rose-500" : "bg-amber-500")} />
    {status}
  </div>
);

const DrawerItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors border border-slate-100">
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900 truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const AffordabilityCard = ({ label, value, color }) => (
  <div className={cn(
    "p-4 rounded-2xl border flex flex-col gap-1 transition-all cursor-default",
    color === 'emerald' ? "bg-emerald-50 border-emerald-100 text-emerald-900" :
    color === 'rose' ? "bg-rose-50 border-rose-100 text-rose-900" :
    color === 'navy' ? "bg-slate-900 border-slate-800 text-white" :
    "bg-primary/5 border-primary/10 text-slate-800"
  )}>
    <p className={cn("text-[8px] font-black uppercase tracking-widest", color === 'navy' ? "text-slate-500" : "text-slate-400")}>{label}</p>
    <p className="text-xs font-black">{value || 'N/A'}</p>
  </div>
);

const DocumentCard = ({ name, status, fileUrl }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm border border-slate-100">
        <FileText size={18} />
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-900 truncate max-w-[150px]">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full", 
            status === 'Approved' ? "bg-emerald-500" : 
            status === 'Rejected' ? "bg-rose-500" :
            "bg-amber-500"
          )} />
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{status}</p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1">
      {fileUrl ? (
        <>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Eye size={14} /></a>
          <a href={fileUrl} download target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Download size={14} /></a>
        </>
      ) : (
        <span className="text-[8px] font-bold text-rose-400 uppercase">Missing</span>
      )}
    </div>
  </div>
);

const VerificationDocItem = ({ name, status, notes, fileUrl, isActive, onClick, onAction, submitting }) => (
  <div 
    onClick={onClick}
    className={cn(
      "p-5 rounded-2xl border-2 flex flex-col gap-4 group transition-all cursor-pointer relative overflow-hidden",
      isActive ? "bg-primary/5 border-primary shadow-lg" : "bg-white border-slate-100 hover:border-slate-200"
    )}
  >
    {isActive && <div className="absolute top-0 right-0 w-2 h-full bg-primary" />}
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={18} className={cn(isActive && "text-primary")} />
        </div>
        <div>
          <p className={cn("text-xs font-black text-slate-900", isActive && "text-primary")}>{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
              status === 'Approved' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
              status === 'Rejected' ? "bg-rose-50 border-rose-100 text-rose-600" :
              "bg-amber-50 border-amber-100 text-amber-600"
            )}>
              {status}
            </span>
          </div>
        </div>
      </div>
      {fileUrl ? (
        <a href={fileUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-slate-50 border border-slate-100 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-sm"><Eye size={16} /></a>
      ) : (
        <span className="text-[8px] font-bold text-rose-400">No File</span>
      )}
    </div>

    {notes && (
      <p className="text-[9px] text-slate-500 italic bg-slate-50 p-2 rounded border border-dashed border-slate-200">"{notes}"</p>
    )}
    
    <div className="grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
      <button 
        disabled={submitting || !fileUrl}
        onClick={() => onAction('Approved')}
        className="py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[8px] font-black uppercase rounded-lg hover:bg-emerald-600 hover:text-white disabled:opacity-50 transition-all"
      >
        Approve
      </button>
      <button 
        disabled={submitting || !fileUrl}
        onClick={() => onAction('Rejected')}
        className="py-2 bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-black uppercase rounded-lg hover:bg-rose-600 hover:text-white disabled:opacity-50 transition-all"
      >
        Reject
      </button>
      <button 
        disabled={submitting || !fileUrl}
        onClick={() => onAction('Reupload Requested')}
        className="py-2 bg-amber-50 border border-amber-100 text-amber-600 text-[8px] font-black uppercase rounded-lg hover:bg-amber-600 hover:text-white disabled:opacity-50 transition-all"
      >
        Re-upload
      </button>
    </div>
  </div>
);

const RECOMMENDATION_CFG = {
  'Recommended':               { label: '✅ Recommended Approval',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'Recommended for Approval':  { label: '✅ Recommended Approval',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'Recommend Approval':        { label: '✅ Recommended Approval',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'Rejected':                  { label: '❌ Recommended Rejection', cls: 'bg-rose-50   text-rose-700   border-rose-100' },
  'Rejected Recommendation':   { label: '❌ Recommended Rejection', cls: 'bg-rose-50   text-rose-700   border-rose-100' },
  'Recommended for Rejection': { label: '❌ Recommended Rejection', cls: 'bg-rose-50   text-rose-700   border-rose-100' },
  'Recommend Rejection':       { label: '❌ Recommended Rejection', cls: 'bg-rose-50   text-rose-700   border-rose-100' },
  'Put On Hold':               { label: '⏸ Hold Recommended',       cls: 'bg-amber-50 text-amber-700 border-amber-100' },
};

const ReviewResultBadge = ({ staffReview }) => {
  if (!staffReview?.recommendation || staffReview.recommendation === 'Pending') {
    return <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">—</span>;
  }
  const cfg = RECOMMENDATION_CFG[staffReview.recommendation];
  if (!cfg) return <span className="text-[9px] font-bold text-slate-500 uppercase">{staffReview.recommendation}</span>;
  return (
    <div className="space-y-0.5">
      <span className={cn('inline-flex px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest whitespace-nowrap', cfg.cls)}>
        {cfg.label}
      </span>
      {staffReview.riskLevel && staffReview.riskLevel !== 'N/A' && (
        <p className={cn('text-[8px] font-black uppercase tracking-widest',
          staffReview.riskLevel === 'Low' ? 'text-emerald-500' :
          staffReview.riskLevel === 'Medium' ? 'text-amber-500' : 'text-rose-500'
        )}>
          {staffReview.riskLevel} Risk
        </p>
      )}
    </div>
  );
};

const Plus = ({ size, className }) => <FileText size={size} className={className} />;
const Check = ({ size, strokeWidth, className }) => <CheckCircle2 size={size} strokeWidth={strokeWidth} className={className} />;

export default LoanRequests;
