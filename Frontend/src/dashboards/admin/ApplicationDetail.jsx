import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Wallet, Building2, ShieldCheck,
  FileText, Phone, Mail, MapPin, CheckCircle2,
  Clock, Pause, ExternalLink, Download, Loader2,
  FileCheck, FileX, Info, ScanFace, BadgeCheck,
  TriangleAlert, ShieldAlert, RefreshCw, Shield,
  AlertTriangle, ChevronDown, ChevronUp, CreditCard, Hash, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import loanApplicationService from '../../services/loanApplicationService';
import agreementService from '../../services/agreementService';
import kycVerificationService from '../../services/kycVerificationService';
import addressProfileVerificationService from '../../services/addressProfileVerificationService';
import creditReportSearchService from '../../services/creditReportSearchService';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import AgreementPreviewModal from '../../components/AgreementPreviewModal';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionData, setDecisionData] = useState({
    adminNotes: '', approvedAmount: '', finalDuration: '',
    interestOverride: '', rejectionReason: '', holdReason: ''
  });
  const [agreementDetails, setAgreementDetails] = useState(null);
  const [loadingAgreement, setLoadingAgreement] = useState(false);
  const [isViewDocOpen, setIsViewDocOpen] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [isAgreementPreviewOpen, setIsAgreementPreviewOpen] = useState(false);
  const [isKycOverrideOpen, setIsKycOverrideOpen] = useState(false);
  const [kycOverrideReason, setKycOverrideReason] = useState('');
  const [kycOverrideLoading, setKycOverrideLoading] = useState(false);

  // ── Bureau override ──────────────────────────────────────────────────────────
  const [isBureauOverrideOpen, setIsBureauOverrideOpen] = useState(false);
  const [bureauOverrideReason, setBureauOverrideReason] = useState('');
  const [bureauOverrideLoading, setBureauOverrideLoading] = useState(false);
  const [showAdminBureauHistory, setShowAdminBureauHistory] = useState(false);

  // ── Credit override ───────────────────────────────────────────────────────────
  const [isCreditOverrideOpen, setIsCreditOverrideOpen] = useState(false);
  const [creditOverrideReason, setCreditOverrideReason] = useState('');
  const [creditOverrideLoading, setCreditOverrideLoading] = useState(false);

  const fetchAgreementStatus = async () => {
    try {
      const res = await agreementService.getAgreementStatus(id);
      setAgreementDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch agreement details:', err);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await loanApplicationService.getApplicationDetails(id);
        setApp(res.data);
        setDecisionData(prev => ({
          ...prev,
          approvedAmount: res.data?.requestedAmount || '',
          finalDuration: res.data?.requestedDuration || '',
          interestOverride: res.data?.interestRate || '',
        }));

        const isApprovedOrHigher = ['Approved', 'Agreement Pending', 'Agreement Signed', 'Ready for Disbursement', 'AGREEMENT_PENDING', 'AGREEMENT_SIGNED', 'READY_FOR_DISBURSEMENT', 'AGREEMENT_PENDING_VERIFICATION', 'OTP_VERIFIED'].includes(res.data?.status);
        if (isApprovedOrHigher) {
          const agreementRes = await agreementService.getAgreementStatus(id);
          setAgreementDetails(agreementRes.data);
        }
      } catch {
        toast.error('Failed to load application details');
        navigate('/admin/applications');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleViewAgreement = async () => {
    setIsAgreementPreviewOpen(true);
  };

  const handleDownloadAgreement = async () => {
    setIsAgreementPreviewOpen(true);
    toast.success('Opening high-fidelity document preview for PDF download...');
  };

  const handleGenerateAgreement = async () => {
    try {
      setLoadingAgreement(true);
      await agreementService.generateAgreement(id);
      toast.success('Loan agreement generated successfully');
      
      const appRes = await loanApplicationService.getApplicationDetails(id);
      setApp(appRes.data);
      await fetchAgreementStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate agreement');
    } finally {
      setLoadingAgreement(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoadingAgreement(true);
      await agreementService.sendOtp(id);
      toast.success('OTP email successfully resent to borrower');
      await fetchAgreementStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoadingAgreement(false);
    }
  };

  const handleMarkReadyForDisbursement = async () => {
    try {
      setLoadingAgreement(true);
      await agreementService.markReadyForDisbursement(id);
      toast.success('Loan application successfully marked as ready for disbursement');
      
      const appRes = await loanApplicationService.getApplicationDetails(id);
      setApp(appRes.data);
      await fetchAgreementStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update disbursement status');
    } finally {
      setLoadingAgreement(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await loanApplicationService.approveApplication(id, {
        approvedAmount: decisionData.approvedAmount,
        finalDuration: decisionData.finalDuration,
        adminNotes: decisionData.adminNotes,
        interestOverride: decisionData.interestOverride,
      });
      toast.success('Application approved. Secure OTP dispatched.');
      setActiveModal(null);
      
      // Re-fetch application data
      const res = await loanApplicationService.getApplicationDetails(id);
      setApp(res.data);
      await fetchAgreementStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await loanApplicationService.rejectApplication(id, {
        rejectionReason: decisionData.rejectionReason,
        adminNotes: decisionData.adminNotes,
      });
      toast.success('Application rejected');
      setActiveModal(null);
      navigate('/admin/applications');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHold = async () => {
    try {
      setIsSubmitting(true);
      await loanApplicationService.holdApplication(id, {
        holdReason: decisionData.holdReason,
        adminNotes: decisionData.adminNotes,
      });
      toast.success('Application placed on hold');
      setActiveModal(null);
      navigate('/admin/applications');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hold failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKycOverride = async () => {
    if (!kycOverrideReason.trim()) {
      toast.error('Override reason is required');
      return;
    }
    try {
      setKycOverrideLoading(true);
      await kycVerificationService.overrideKYCVerification(id, kycOverrideReason);
      toast.success('KYC verification successfully overridden');
      setIsKycOverrideOpen(false);
      setKycOverrideReason('');
      const res = await loanApplicationService.getApplicationDetails(id);
      setApp(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally {
      setKycOverrideLoading(false);
    }
  };

  const handleCreditOverride = async () => {
    if (!creditOverrideReason.trim()) {
      toast.error('Override reason is required');
      return;
    }
    try {
      setCreditOverrideLoading(true);
      await creditReportSearchService.overrideCreditAssessment(id, creditOverrideReason);
      toast.success('Credit assessment successfully overridden');
      setIsCreditOverrideOpen(false);
      setCreditOverrideReason('');
      const res = await loanApplicationService.getApplicationDetails(id);
      setApp(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally {
      setCreditOverrideLoading(false);
    }
  };

  const handleBureauOverride = async () => {
    if (!bureauOverrideReason.trim()) {
      toast.error('Override reason is required');
      return;
    }
    try {
      setBureauOverrideLoading(true);
      await addressProfileVerificationService.overrideBureauVerification(id, bureauOverrideReason);
      toast.success('Bureau verification successfully overridden');
      setIsBureauOverrideOpen(false);
      setBureauOverrideReason('');
      const res = await loanApplicationService.getApplicationDetails(id);
      setApp(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally {
      setBureauOverrideLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!app) return null;

  const review = app.staffReview;
  const reviewDone = review?.recommendation && review.recommendation !== 'Pending';

  return (
    <div className="space-y-8 pb-20">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/applications')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back to Applications
      </button>

      {/* Header Banner */}
      <div className="p-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {app.borrower?.profilePhoto?.url ? (
              <img
                src={app.borrower.profilePhoto.url}
                className="w-20 h-20 rounded-[2rem] object-cover border-4 border-white/10 shadow-2xl"
                alt=""
              />
            ) : (
              <div className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center text-white text-3xl font-black border-4 border-white/5">
                {app.borrower?.fullName?.charAt(0) || app.fullName?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {app.borrower?.fullName || app.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-[10px] font-black text-white/50 bg-white/5 px-3 py-1 rounded-lg uppercase tracking-widest border border-white/10">
                  ID: {app.applicationId}
                </span>
                <StatusBadge status={app.status} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end text-white">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Requested Amount</p>
            <p className="text-4xl font-black tracking-tighter">R {app.requestedAmount?.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2 text-primary">
              <Clock size={14} />
              <p className="text-xs font-black uppercase">{app.requestedDuration} Months Duration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT — Application Details */}
        <div className="lg:col-span-2 space-y-8">

          {/* Borrower Details */}
          <Section title="Borrower Details" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoBox icon={ShieldCheck} label="Identity Number" value={app.idNumber} />
              <InfoBox icon={Phone} label="Phone Number" value={app.phoneNumber} />
              <InfoBox icon={Mail} label="Email Address" value={app.emailAddress} />
              <InfoBox icon={Building2} label="Employment Status" value={app.employmentStatus} />
              <InfoBox icon={MapPin} label="Residential Address" value={app.residentialAddress} fullWidth />
            </div>
          </Section>

          {/* Loan Details */}
          <Section title="Loan Details" icon={Wallet}>
            <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <DetailItem label="Requested Amount" value={`R ${app.requestedAmount?.toLocaleString()}`} isBold />
              <DetailItem label="Loan Duration" value={`${app.requestedDuration} Months`} />
              <DetailItem label="Interest Rate" value={`${app.interestRate}% P.A.`} />
              <DetailItem label="Estimated EMI" value={`R ${app.estimatedMonthlyEMI?.toLocaleString()}`} isPrimary />
              <DetailItem label="Processing Fee" value={`R ${app.processingFee?.toLocaleString() || '0'}`} />
              <DetailItem label="Total Repayment" value={`R ${app.totalRepayment?.toLocaleString() || 'N/A'}`} />
            </div>
          </Section>

          {/* Employment Details */}
          <Section title="Employment Details" icon={Building2}>
            <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <DetailItem label="Employer Name" value={app.employerName} />
              <DetailItem label="Monthly Income" value={`R ${app.monthlyIncome?.toLocaleString()}`} isBold />
              <DetailItem label="Years Of Service" value={`${app.yearsOfService} Years`} />
              <DetailItem label="Work Address" value={app.workAddress} />
            </div>
          </Section>

          {/* Banking Details */}
          <Section title="Banking Details" icon={ShieldCheck}>
            <div className="grid grid-cols-2 gap-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
              <DetailItem label="Bank Name" value={app.bankName} />
              <DetailItem label="Account Number" value={app.accountNumber} isBold />
              <DetailItem label="Account Holder" value={app.accountHolder || app.borrower?.fullName} />
              <DetailItem label="Branch Code" value={app.branchCode} />
            </div>
          </Section>

          {/* Uploaded Documents */}
          <Section title="Uploaded Documents" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Identity Document', key: 'idProof' },
                { label: 'Payslip', key: 'payslip' },
                { label: 'Bank Statement', key: 'bankStatement' },
                { label: 'Proof of Address', key: 'addressProof' },
              ].map(({ label, key }) => {
                const doc = app.documents?.[key];
                return (
                  <div key={key} className="group p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:border-primary/30 transition-all shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                        <p className="text-xs font-bold text-slate-900">{doc ? 'Uploaded' : 'Missing'}</p>
                      </div>
                    </div>
                    {doc?.url && (
                      <div className="flex items-center gap-1">
                        <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-primary hover:bg-primary/5 transition-all">
                          <ExternalLink size={15} />
                        </a>
                        <a href={doc.url} download className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-all">
                          <Download size={15} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* KYC & Identity Audit */}
          <Section title="KYC & Identity Audit" icon={ScanFace}>
            <AdminKycPanel
              kyc={app.kycVerification}
              onOverride={() => setIsKycOverrideOpen(true)}
            />
          </Section>

          {/* Bureau Profile Verification */}
          <Section title="Bureau Profile Verification" icon={MapPin}>
            <AdminBureauPanel
              bureau={app.bureauVerification}
              onOverride={() => setIsBureauOverrideOpen(true)}
              showHistory={showAdminBureauHistory}
              onToggleHistory={() => setShowAdminBureauHistory(v => !v)}
            />
          </Section>

          {/* Credit Report Search Audit */}
          <Section title="Credit Report Search Audit" icon={CreditCard}>
            <AdminCreditPanel
              credit={app.creditAssessment}
              onOverride={() => setIsCreditOverrideOpen(true)}
            />
          </Section>

        </div>

        {/* RIGHT — Staff Review + Admin Decision */}
        <div className="space-y-8">

          {/* Staff Review */}
          <Section title="Staff Review" icon={ShieldCheck}>
            <div className="space-y-4">
              {/* Reviewer info */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                  {(review?.staffName || app.staffReviewer?.fullName || 'U').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewer</p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {review?.staffName || app.staffReviewer?.fullName || 'Unassigned'}
                  </p>
                </div>
                {review?.verificationDate && (
                  <p className="text-[10px] font-bold text-slate-400 shrink-0">
                    {new Date(review.verificationDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Recommendation banner */}
              {reviewDone ? (
                <div className={cn(
                  'p-4 rounded-2xl border',
                  review.recommendation === 'Recommended' ? 'bg-emerald-50 border-emerald-200' :
                  review.recommendation === 'Rejected' ? 'bg-rose-50 border-rose-200' :
                  'bg-amber-50 border-amber-200'
                )}>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Staff Recommendation</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm font-black',
                      review.recommendation === 'Recommended' ? 'text-emerald-700' :
                      review.recommendation === 'Rejected' ? 'text-rose-700' : 'text-amber-700'
                    )}>
                      {review.recommendation === 'Recommended' ? '✅ Recommended for Approval' :
                       review.recommendation === 'Rejected' ? '❌ Recommended for Rejection' :
                       '⏸ Hold Recommended'}
                    </p>
                    <span className={cn(
                      'px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0',
                      review.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                      review.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      review.riskLevel === 'High' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-500'
                    )}>
                      {review.riskLevel || 'N/A'} Risk
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Review Submitted Yet</p>
                </div>
              )}

              {/* Verification checklist */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Findings</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Employment', key: 'idProof' },
                    { label: 'Banking', key: 'bankStatement' },
                    { label: 'Identity', key: 'idProof' },
                    { label: 'Address', key: 'addressProof' },
                  ].map(({ label, key }) => {
                    const verified = !!app.documents?.[key];
                    return (
                      <div key={label} className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold',
                        verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                      )}>
                        <CheckCircle2 size={12} className={verified ? 'text-emerald-500' : 'text-slate-300'} />
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Staff notes */}
              {review?.verificationNotes && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Notes</p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-600 italic leading-relaxed">
                    "{review.verificationNotes}"
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Admin Final Decision */}
          <Section title="Admin Final Decision" icon={CheckCircle2}>
            {['Approved', 'APPROVED', 'Active', 'ACTIVE', 'Ready for Disbursement', 'READY_FOR_DISBURSEMENT', 'Disbursed', 'DISBURSED', 'Agreement Signed', 'AGREEMENT_SIGNED', 'OTP_VERIFIED', 'Agreement Pending', 'AGREEMENT_PENDING', 'AGREEMENT_PENDING_VERIFICATION', 'Rejected', 'REJECTED', 'Hold', 'HOLD'].includes(app.status) ? (
              <div className={cn(
                "p-6 rounded-[2rem] space-y-4 border shadow-sm",
                ['Approved', 'APPROVED', 'Active', 'ACTIVE', 'Ready for Disbursement', 'READY_FOR_DISBURSEMENT', 'Disbursed', 'DISBURSED', 'Agreement Signed', 'AGREEMENT_SIGNED', 'OTP_VERIFIED', 'Agreement Pending', 'AGREEMENT_PENDING', 'AGREEMENT_PENDING_VERIFICATION'].includes(app.status) ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
                ['Rejected', 'REJECTED'].includes(app.status) ? "bg-rose-50 border-rose-200 text-rose-900" :
                "bg-amber-50 border-amber-200 text-amber-900"
              )}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Outcome</p>
                  <StatusBadge status={app.status} />
                </div>
                
                {['Approved', 'APPROVED', 'Active', 'ACTIVE', 'Ready for Disbursement', 'READY_FOR_DISBURSEMENT', 'Disbursed', 'DISBURSED', 'Agreement Signed', 'AGREEMENT_SIGNED', 'OTP_VERIFIED', 'Agreement Pending', 'AGREEMENT_PENDING', 'AGREEMENT_PENDING_VERIFICATION'].includes(app.status) && (
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-emerald-200/50">
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-60">Approved Amount</p>
                      <p className="text-lg font-black">R {app.adminDecision?.approvedAmount?.toLocaleString() || app.requestedAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-60">Final Duration</p>
                      <p className="text-lg font-black">{app.adminDecision?.finalDuration || app.requestedDuration} Months</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Admin Notes</p>
                  <p className="text-xs font-medium italic leading-relaxed">
                    "{app.adminDecision?.adminNotes || app.adminDecision?.rejectionReason || app.adminDecision?.holdReason || 'No notes provided.'}"
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[9px] font-bold opacity-40 uppercase tracking-widest">
                  <span>Decided By Admin</span>
                  <span>{new Date(app.adminDecision?.approvedDate || app.adminDecision?.rejectedDate || app.adminDecision?.holdDate || app.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-900 rounded-[2rem] space-y-3 shadow-xl shadow-slate-900/20">
                <Button
                  onClick={() => setActiveModal('approve')}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 border-none text-white"
                >
                  <FileCheck size={18} />
                  <span className="font-black uppercase tracking-widest text-xs">Approve Loan</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setActiveModal('hold')}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 text-white flex items-center justify-center gap-2 border-none"
                >
                  <Pause size={18} />
                  <span className="font-black uppercase tracking-widest text-xs">Put On Hold</span>
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setActiveModal('reject')}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 border-none text-white"
                >
                  <FileX size={18} />
                  <span className="font-black uppercase tracking-widest text-xs">Reject Loan</span>
                </Button>
              </div>
            )}
          </Section>

          {/* Digital Loan Agreement Panel */}
          {['Approved', 'Agreement Pending', 'Agreement Signed', 'Ready for Disbursement', 'AGREEMENT_PENDING', 'AGREEMENT_SIGNED', 'READY_FOR_DISBURSEMENT', 'AGREEMENT_PENDING_VERIFICATION', 'OTP_VERIFIED'].includes(app.status) && (
            <Section title="Digital Loan Agreement Panel" icon={FileText}>
              <div className="space-y-6 text-left">
                {/* Details Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60">Agreement Status</p>
                    <p className="text-sm font-bold text-slate-800">
                      {['Agreement Pending', 'AGREEMENT_PENDING', 'AGREEMENT_PENDING_VERIFICATION'].includes(app.status) ? 'Awaiting Signature' :
                       ['Agreement Signed', 'AGREEMENT_SIGNED', 'READY_FOR_DISBURSEMENT', 'Ready for Disbursement'].includes(app.status) ? 'Digitally Signed' : 'Not Generated'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60">Agreement Generated At</p>
                    <p className="text-sm font-bold text-slate-800">
                      {app.agreementGeneratedAt ? new Date(app.agreementGeneratedAt).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60">OTP Verification Status</p>
                    <p className="text-sm font-bold text-slate-800">
                      {app.otpVerificationStatus || 'Pending'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60">Borrower Consent Status</p>
                    <p className="text-sm font-bold text-slate-800">
                      {app.borrowerConsentVerified ? 'Verified & Completed' : 'Pending Borrower Signature'}
                    </p>
                  </div>
                </div>

                {/* Buttons Row */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleViewAgreement}
                    disabled={loadingDoc}
                    className="py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-2"
                  >
                    {loadingDoc ? <Loader2 size={14} className="animate-spin text-slate-700" /> : <FileText size={14} className="text-slate-700" />}
                    <span className="font-black uppercase tracking-widest text-[9px]">View Agreement</span>
                  </Button>

                  <Button
                    onClick={handleDownloadAgreement}
                    className="py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-2"
                  >
                    <Download size={14} className="text-slate-700" />
                    <span className="font-black uppercase tracking-widest text-[9px]">Download Agreement</span>
                  </Button>

                  {['AGREEMENT_PENDING_VERIFICATION', 'Agreement Pending', 'AGREEMENT_PENDING'].includes(app.status) && (
                    <Button
                      onClick={handleResendOTP}
                      disabled={loadingAgreement}
                      className="py-3 bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2 border-none shadow-sm col-span-2"
                    >
                      {loadingAgreement ? <Loader2 size={14} className="animate-spin text-white" /> : <Clock size={14} className="text-white" />}
                      <span className="font-black uppercase tracking-widest text-[9px]">Resend OTP Signature Code</span>
                    </Button>
                  )}

                  {['READY_FOR_DISBURSEMENT', 'Ready for Disbursement', 'AGREEMENT_SIGNED', 'Agreement Signed', 'OTP_VERIFIED'].includes(app.status) && (
                    <Button
                      onClick={handleMarkReadyForDisbursement}
                      disabled={loadingAgreement}
                      className="py-3 bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center gap-2 border-none shadow-sm col-span-2"
                    >
                      {loadingAgreement ? <Loader2 size={14} className="animate-spin text-white" /> : <CheckCircle2 size={14} className="text-white" />}
                      <span className="font-black uppercase tracking-widest text-[9px]">Confirm Disbursement Ready</span>
                    </Button>
                  )}
                </div>

                {/* OTP Verification History Logs */}
                {agreementDetails?.otpHistory && agreementDetails.otpHistory.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OTP Request History</p>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="px-4 py-2">Requested At</th>
                            <th className="px-3 py-2">Attempts</th>
                            <th className="px-4 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agreementDetails.otpHistory.map((otp, idx) => {
                            const isExpired = new Date() > new Date(otp.expiresAt);
                            return (
                              <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-bold text-slate-600">
                                  {new Date(otp.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })} {new Date(otp.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-3 py-2.5 font-black text-slate-500 text-center">{(otp.attempts !== undefined ? otp.attempts : otp.retryCount) || 0} / 5</td>
                                <td className="px-4 py-2.5 text-right">
                                  <span className={cn(
                                    "inline-block px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wide",
                                    otp.verified ? "bg-emerald-100 text-emerald-700" :
                                    isExpired ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
                                  )}>
                                    {otp.verified ? 'Verified' : isExpired ? 'Expired' : 'Active'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={['approve', 'reject', 'hold'].includes(activeModal)}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'approve' ? 'Approve Loan Application' :
          activeModal === 'reject' ? 'Reject Loan Application' :
          'Put Application On Hold'
        }
        maxWidth="max-w-xl"
      >
        <div className="space-y-5 text-left">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
              {activeModal === 'approve' ? <FileCheck size={22} /> : activeModal === 'reject' ? <FileX size={22} /> : <Pause size={22} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirming decision for</p>
              <p className="text-sm font-bold text-slate-900">{app.borrower?.fullName || app.fullName} — {app.applicationId}</p>
            </div>
          </div>

          {activeModal === 'approve' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Approved Amount (R)" type="number" value={decisionData.approvedAmount}
                onChange={(e) => setDecisionData({ ...decisionData, approvedAmount: e.target.value })} />
              <Input label="Final Duration (Months)" type="number" value={decisionData.finalDuration}
                onChange={(e) => setDecisionData({ ...decisionData, finalDuration: e.target.value })} />
              <Input label="Interest Override (%)" type="number" className="col-span-2" value={decisionData.interestOverride}
                onChange={(e) => setDecisionData({ ...decisionData, interestOverride: e.target.value })} />
              <div className="col-span-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 flex items-center gap-2">
                <Info size={14} />
                <p className="text-[10px] font-black uppercase tracking-tight">Approved loan will automatically move to Active Loans.</p>
              </div>
            </div>
          )}

          {activeModal === 'reject' && (
            <Input label="Rejection Reason" isTextArea
              placeholder="Specify why this application is being rejected..."
              value={decisionData.rejectionReason}
              onChange={(e) => setDecisionData({ ...decisionData, rejectionReason: e.target.value })} />
          )}

          {activeModal === 'hold' && (
            <Input label="Hold Reason" isTextArea
              placeholder="Specify what documents or info is missing..."
              value={decisionData.holdReason}
              onChange={(e) => setDecisionData({ ...decisionData, holdReason: e.target.value })} />
          )}

          <Input label="Admin Notes (Internal)" isTextArea
            placeholder="Private notes for records..."
            value={decisionData.adminNotes}
            onChange={(e) => setDecisionData({ ...decisionData, adminNotes: e.target.value })} />

          <div className="flex gap-3 pt-2 border-t border-slate-50">
            <Button variant="ghost" onClick={() => setActiveModal(null)} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button
              onClick={activeModal === 'approve' ? handleApprove : activeModal === 'reject' ? handleReject : handleHold}
              disabled={isSubmitting}
              className={cn(
                'flex-1 py-4 font-black uppercase tracking-widest text-[10px]',
                activeModal === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' :
                activeModal === 'reject' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white'
              )}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Confirm ${activeModal ? activeModal.charAt(0).toUpperCase() + activeModal.slice(1) : ''}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* VIEW AGREEMENT MODAL */}
      <Modal
        isOpen={isViewDocOpen}
        onClose={() => setIsViewDocOpen(false)}
        title="View Loan Agreement Document"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 text-left">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-[10px] leading-relaxed text-slate-700 max-h-[350px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
            {documentContent}
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-3">
            <Button
              onClick={() => setIsViewDocOpen(false)}
              className="py-3 px-6 bg-slate-900 text-white hover:bg-slate-800 border-none font-black uppercase tracking-widest text-[9px]"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* High-Fidelity Agreement PDF Preview & Download Modal */}
      <AgreementPreviewModal
        isOpen={isAgreementPreviewOpen}
        onClose={() => setIsAgreementPreviewOpen(false)}
        app={app}
        agreementDetails={agreementDetails}
      />

      {/* Credit Override Modal */}
      <Modal
        isOpen={isCreditOverrideOpen}
        onClose={() => { setIsCreditOverrideOpen(false); setCreditOverrideReason(''); }}
        title="Override Credit Assessment"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 text-left">
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <CreditCard size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-800">Admin Manual Credit Override</p>
              <p className="text-[10px] font-medium text-amber-700 mt-0.5">
                Manually approves a failed or warning credit assessment. All overrides create a permanent audit log.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Override Reason (Required)</label>
            <textarea
              value={creditOverrideReason}
              onChange={(e) => setCreditOverrideReason(e.target.value)}
              placeholder="Explain why this credit assessment is being manually overridden..."
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-700 min-h-[100px] focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-50">
            <Button variant="ghost"
              onClick={() => { setIsCreditOverrideOpen(false); setCreditOverrideReason(''); }}
              className="flex-1 py-4 font-black uppercase tracking-widest text-[10px]">
              Cancel
            </Button>
            <Button onClick={handleCreditOverride}
              disabled={creditOverrideLoading || !creditOverrideReason.trim()}
              className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] border-none shadow-lg shadow-amber-500/20">
              {creditOverrideLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Override'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bureau Override Modal */}
      <Modal
        isOpen={isBureauOverrideOpen}
        onClose={() => { setIsBureauOverrideOpen(false); setBureauOverrideReason(''); }}
        title="Override Bureau Verification"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 text-left">
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <MapPin size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-800">Admin Manual Bureau Override</p>
              <p className="text-[10px] font-medium text-amber-700 mt-0.5">
                Overrides mismatch warnings or low-risk flags. Fatal conditions (deceased/SAFPS) still require documented reason. All overrides create a permanent audit log.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Override Reason (Required)</label>
            <textarea
              value={bureauOverrideReason}
              onChange={(e) => setBureauOverrideReason(e.target.value)}
              placeholder="Explain why this bureau verification is being manually overridden..."
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-700 min-h-[100px] focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-50">
            <Button variant="ghost" onClick={() => { setIsBureauOverrideOpen(false); setBureauOverrideReason(''); }}
              className="flex-1 py-4 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button onClick={handleBureauOverride}
              disabled={bureauOverrideLoading || !bureauOverrideReason.trim()}
              className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] border-none shadow-lg shadow-amber-500/20">
              {bureauOverrideLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Override'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* KYC Override Modal */}
      <Modal
        isOpen={isKycOverrideOpen}
        onClose={() => { setIsKycOverrideOpen(false); setKycOverrideReason(''); }}
        title="Override KYC Verification"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 text-left">
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <Shield size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-800">Admin Manual Override</p>
              <p className="text-[10px] font-medium text-amber-700 mt-0.5">
                Overriding a failed KYC creates a permanent audit log. Use only when identity has been confirmed through alternative means.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Override Reason (Required)</label>
            <textarea
              value={kycOverrideReason}
              onChange={(e) => setKycOverrideReason(e.target.value)}
              placeholder="Explain why this KYC is being manually overridden..."
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-700 min-h-[100px] focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-50">
            <Button
              variant="ghost"
              onClick={() => { setIsKycOverrideOpen(false); setKycOverrideReason(''); }}
              className="flex-1 py-4 font-black uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleKycOverride}
              disabled={kycOverrideLoading || !kycOverrideReason.trim()}
              className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] border-none shadow-lg shadow-amber-500/20"
            >
              {kycOverrideLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Override'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
      <Icon size={16} className="text-primary" />
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="p-8">{children}</div>
  </div>
);

const InfoBox = ({ icon: Icon, label, value, fullWidth = false }) => (
  <div className={cn('p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3', fullWidth ? 'col-span-2' : '')}>
    <div className="p-2 bg-white rounded-xl text-primary border border-slate-100 shadow-sm shrink-0">
      <Icon size={15} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-900 break-all">{value || 'N/A'}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value, isBold, isPrimary }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={cn('text-sm', isBold ? 'font-black text-slate-900' : 'font-bold text-slate-700', isPrimary ? 'text-primary font-black' : '')}>
      {value || 'N/A'}
    </p>
  </div>
);

const AdminCreditPanel = ({ credit, onOverride }) => {
  if (!credit || credit.verificationStatus === 'Pending') {
    return (
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
        <Info size={16} className="text-amber-400 shrink-0" />
        <p className="text-xs font-bold text-slate-500">Consumer credit search has not been run yet.</p>
      </div>
    );
  }

  const isVerified = credit.verificationStatus === 'Verified';
  const isWarning  = credit.verificationStatus === 'Warning';
  const isFailed   = credit.verificationStatus === 'Failed';
  const consumers  = credit.matchedConsumers ?? [];
  const isOverride = !!(credit.overriddenAt);

  return (
    <div className="space-y-5">
      {/* Status + override button */}
      <div className={cn(
        'flex items-center justify-between p-5 rounded-2xl border',
        isVerified || isOverride ? 'bg-emerald-50 border-emerald-200' :
        isWarning  ? 'bg-amber-50 border-amber-200' :
        'bg-rose-50 border-rose-200'
      )}>
        <div className="flex items-center gap-3">
          {isVerified || isOverride
            ? <BadgeCheck size={22} className="text-emerald-600 shrink-0" />
            : isWarning
              ? <AlertTriangle size={22} className="text-amber-500 shrink-0" />
              : <TriangleAlert size={22} className="text-rose-500 shrink-0" />
          }
          <div>
            <p className={cn('text-sm font-black',
              isVerified || isOverride ? 'text-emerald-800' :
              isWarning  ? 'text-amber-800' : 'text-rose-800'
            )}>
              {isOverride ? 'Admin Override — Credit Manually Approved'
                : isVerified ? 'Credit Profile Found'
                : isWarning  ? 'No Credit Profile Found'
                : 'Credit Search Failed'}
            </p>
            {consumers.length > 0 && (
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                {consumers.length} consumer profile{consumers.length !== 1 ? 's' : ''} matched
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {credit.reportReference && (
            <span className="text-[9px] font-black text-slate-400 shrink-0">Ref: {credit.reportReference}</span>
          )}
          {(isFailed || isWarning) && !isOverride && (
            <Button onClick={onOverride}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest border-none shadow-sm">
              <RefreshCw size={12} className="mr-1.5 inline" /> Override
            </Button>
          )}
        </div>
      </div>

      {/* Enquiry IDs */}
      <div className="grid grid-cols-2 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
        {credit.enquiryId && (
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enquiry ID</p>
            <p className="text-xs font-bold text-slate-800 font-mono">{credit.enquiryId}</p>
          </div>
        )}
        {credit.enquiryResultId && (
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enquiry Result ID</p>
            <p className="text-xs font-bold text-slate-800 font-mono">{credit.enquiryResultId}</p>
          </div>
        )}
        {credit.reportDate && (
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Search Date</p>
            <p className="text-xs font-bold text-slate-800">{credit.reportDate}</p>
          </div>
        )}
        {credit.completedAt && (
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completed At</p>
            <p className="text-xs font-bold text-slate-800">
              {new Date(credit.completedAt).toLocaleString('en-ZA')}
            </p>
          </div>
        )}
      </div>

      {/* Matched consumer profiles */}
      {consumers.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={11} /> Matched Consumer Profile{consumers.length !== 1 ? 's' : ''}
          </p>
          {consumers.map((c, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-slate-900">{c.firstName} {c.surname}</p>
                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                    ID: {c.idNo} &bull; DOB: {c.birthDate} &bull; Gender: {c.gender}
                  </p>
                </div>
                {c.enquiryId && (
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enquiry ID</p>
                    <p className="text-[10px] font-bold text-slate-700 font-mono">{c.enquiryId}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Override details */}
      {isOverride && credit.overrideReason && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Override Reason</p>
          <p className="text-xs font-medium text-amber-800">{credit.overrideReason}</p>
          {credit.overriddenAt && (
            <p className="text-[9px] font-bold text-amber-600">
              Overridden: {new Date(credit.overriddenAt).toLocaleString('en-ZA')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const AdminBureauPanel = ({ bureau, onOverride, showHistory, onToggleHistory }) => {
  if (!bureau || bureau.verificationStatus === 'Pending') {
    return (
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
        <Info size={16} className="text-amber-400 shrink-0" />
        <p className="text-xs font-bold text-slate-500">Bureau address verification not yet completed by borrower.</p>
      </div>
    );
  }

  const isVerified = bureau.verificationStatus === 'Verified';
  const isWarning  = bureau.verificationStatus === 'Warning';
  const isFailed   = bureau.verificationStatus === 'Failed';
  const isOverride = bureau.verificationStatus === 'Overridden';
  const canOverride = isFailed || isWarning;

  const statusColor = (isFailed && !isOverride) ? 'rose' : isWarning ? 'amber' : 'emerald';
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', iconClass: 'text-emerald-600' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   iconClass: 'text-amber-600'   },
    rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    iconClass: 'text-rose-500'    },
  };
  const c = colorMap[isOverride ? 'amber' : statusColor];

  return (
    <div className="space-y-5">
      {/* Status banner + override button */}
      <div className={cn('flex items-center justify-between p-5 rounded-2xl border', c.bg, c.border)}>
        <div className="flex items-center gap-3">
          {(isFailed && !isOverride)
            ? <ShieldAlert size={22} className={c.iconClass} />
            : isWarning
              ? <AlertTriangle size={22} className={c.iconClass} />
              : isOverride
                ? <Shield size={22} className={c.iconClass} />
                : <BadgeCheck size={22} className={c.iconClass} />
          }
          <div>
            <p className={cn('text-sm font-black', c.text)}>
              {isOverride ? 'Admin Override — Bureau Manually Approved'
                : isFailed ? 'Bureau Verification Failed'
                : isWarning ? 'Bureau Verified — Mismatches Detected'
                : 'Bureau Verified'}
            </p>
            {bureau.responseMessage && (
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{bureau.responseMessage}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {bureau.bureauReference && (
            <span className="text-[9px] font-black text-slate-400 shrink-0">Ref: {bureau.bureauReference}</span>
          )}
          {canOverride && (
            <Button onClick={onOverride}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest border-none shadow-sm">
              <RefreshCw size={12} className="mr-1.5 inline" /> Override
            </Button>
          )}
        </div>
      </div>

      {/* Fatal flags */}
      {(bureau.deceasedStatus || bureau.safpsFlag) && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
              <TriangleAlert size={10} />
              {bureau.deceasedStatus ? 'DECEASED PERSON' : 'FRAUD LISTED'}
            </span>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
              High Risk
            </span>
          </div>
          {bureau.deceasedStatus && (
            <p className="text-[10px] font-bold text-rose-600">
              • Home Affairs record confirms deceased status
              {bureau.deceasedDate ? ` — Date of death: ${bureau.deceasedDate}` : ''}
            </p>
          )}
          {bureau.safpsFlag && (
            <p className="text-[10px] font-bold text-rose-600">
              • SAFPS fraud listing: borrower appears on national fraud register
            </p>
          )}
        </div>
      )}

      {/* Verified details grid */}
      {(bureau.verifiedFirstName || bureau.verifiedPhone || bureau.verifiedEmail || bureau.verifiedEmployer) && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bureau Verified Details</p>
          <div className="grid grid-cols-2 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            {(bureau.verifiedFirstName || bureau.verifiedSurname) && (
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                <p className="text-xs font-bold text-slate-800">{bureau.verifiedFirstName} {bureau.verifiedSurname}</p></div>
            )}
            {bureau.verifiedPhone && (
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                <p className="text-xs font-bold text-slate-800">{bureau.verifiedPhone}</p></div>
            )}
            {bureau.verifiedEmail && (
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                <p className="text-xs font-bold text-slate-800 truncate">{bureau.verifiedEmail}</p></div>
            )}
            {bureau.verifiedEmployer && (
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employer</p>
                <p className="text-xs font-bold text-slate-800">{bureau.verifiedEmployer}</p></div>
            )}
            {bureau.verifiedResidentialAddress && (
              <div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Residential Address</p>
                <p className="text-xs font-bold text-slate-800">{bureau.verifiedResidentialAddress}</p></div>
            )}
            {bureau.verifiedPostalAddress && (
              <div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Postal Address</p>
                <p className="text-xs font-bold text-slate-800">{bureau.verifiedPostalAddress}</p></div>
            )}
          </div>
        </div>
      )}

      {/* Comparison / mismatch results */}
      {bureau.comparedFields && Object.keys(bureau.comparedFields).length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Comparison</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(bureau.comparedFields).map(([field, val]) => {
              const label = field.charAt(0).toUpperCase() + field.slice(1);
              if (val.status === 'matched') return (
                <div key={field} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" /> {label} Matched
                </div>
              );
              if (val.status === 'mismatch') return (
                <div key={field} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700">
                  <AlertTriangle size={11} className="text-amber-500 shrink-0" /> {label} Mismatch
                </div>
              );
              if (val.status === 'unavailable') return (
                <div key={field} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold bg-slate-50 text-slate-400">
                  <Info size={11} className="shrink-0" /> {label} Unavailable
                </div>
              );
              if (val.status === 'not_provided') return (
                <div key={field} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold bg-slate-50 text-slate-400">
                  <Info size={11} className="shrink-0" /> {label} Not Provided
                </div>
              );
              return null;
            })}
          </div>
        </div>
      )}

      {/* Address history timeline */}
      {bureau.addressHistory?.length > 0 && (
        <div className="space-y-2">
          <button type="button" onClick={onToggleHistory}
            className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Address History ({bureau.addressHistory.length} records)
          </button>
          {showHistory && (
            <div className="space-y-2 pl-2 border-l-2 border-slate-200">
              {bureau.addressHistory.map((entry, idx) => (
                <div key={idx} className="pl-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest',
                      entry.addressType === 'Residential' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'
                    )}>{entry.addressType || 'Address'}</span>
                    {entry.lastUpdatedDate && <span className="text-[9px] font-bold text-slate-400">{entry.lastUpdatedDate}</span>}
                  </div>
                  <p className="text-xs font-bold text-slate-800">{entry.address}</p>
                  {entry.subscriberName && <p className="text-[9px] font-medium text-slate-400 mt-0.5">via {entry.subscriberName}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PDF download */}
      {bureau.pdfReport && (
        <a
          href={`data:application/pdf;base64,${bureau.pdfReport}`}
          download={`bureau-report-${id}.pdf`}
          className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all group"
        >
          <Download size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
          <p className="text-[10px] font-bold text-slate-600 group-hover:text-primary transition-colors">Download Bureau PDF Report</p>
        </a>
      )}

      {/* Override details */}
      {isOverride && bureau.overrideReason && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Override Reason</p>
          <p className="text-xs font-medium text-amber-800">{bureau.overrideReason}</p>
          {bureau.overrideAt && (
            <p className="text-[9px] font-bold text-amber-600">Overridden: {new Date(bureau.overrideAt).toLocaleString('en-ZA')}</p>
          )}
        </div>
      )}

      {bureau.verifiedAt && (
        <p className="text-[9px] font-bold text-slate-400 text-right">
          Verified: {new Date(bureau.verifiedAt).toLocaleString('en-ZA')}
        </p>
      )}
    </div>
  );
};

const AdminKycPanel = ({ kyc, onOverride }) => {
  if (!kyc || kyc.verificationStatus === 'Pending') {
    return (
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
        <Info size={16} className="text-amber-400 shrink-0" />
        <p className="text-xs font-bold text-slate-500">KYC identity verification has not been completed by the borrower yet.</p>
      </div>
    );
  }

  const isVerified = kyc.verificationStatus === 'Verified';
  const isOverride = kyc.verificationStatus === 'Overridden';
  const isFailed = kyc.verificationStatus === 'Failed';

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={cn(
        'flex items-center justify-between p-5 rounded-2xl border',
        isVerified ? 'bg-emerald-50 border-emerald-200' :
        isOverride ? 'bg-amber-50 border-amber-200' :
        'bg-rose-50 border-rose-200'
      )}>
        <div className="flex items-center gap-3">
          {isVerified
            ? <BadgeCheck size={22} className="text-emerald-600 shrink-0" />
            : isOverride
              ? <Shield size={22} className="text-amber-600 shrink-0" />
              : <ShieldAlert size={22} className="text-rose-500 shrink-0" />
          }
          <div>
            <p className={cn('text-sm font-black',
              isVerified ? 'text-emerald-800' :
              isOverride ? 'text-amber-800' : 'text-rose-800'
            )}>
              {isVerified ? 'Identity Verified'
                : isOverride ? 'Manually Overridden by Admin'
                : 'Verification Failed'}
            </p>
            {kyc.responseMessage && (
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{kyc.responseMessage}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {kyc.faceMatchScore != null && (
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Face Match</p>
              <p className={cn('text-2xl font-black',
                isVerified ? 'text-emerald-700' :
                isOverride ? 'text-amber-700' : 'text-rose-600'
              )}>
                {Math.round(kyc.faceMatchScore)}%
              </p>
            </div>
          )}
          {isFailed && (
            <Button
              onClick={onOverride}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest border-none shadow-sm"
            >
              <RefreshCw size={12} className="mr-1.5 inline" /> Override
            </Button>
          )}
        </div>
      </div>

      {/* KYC metadata grid */}
      <div className="grid grid-cols-2 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
        {kyc.verificationReference && (
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference</p>
            <p className="text-xs font-bold text-slate-800">{kyc.verificationReference}</p>
          </div>
        )}
        {kyc.verificationTimestamp && (
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified At</p>
            <p className="text-xs font-bold text-slate-800">
              {new Date(kyc.verificationTimestamp).toLocaleString('en-ZA')}
            </p>
          </div>
        )}
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Provider</p>
          <p className="text-xs font-bold text-slate-800">{kyc.verificationProvider || 'Datanamix'}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Source</p>
          <p className="text-xs font-bold text-slate-800">{kyc.verificationSource || 'N/A'}</p>
        </div>
      </div>

      {/* OCR extracted data */}
      {kyc.extractedOCRData && Object.keys(kyc.extractedOCRData).length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OCR Extracted Data</p>
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {Object.entries(kyc.extractedOCRData).slice(0, 8).map(([k, v]) => v ? (
              <div key={k}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-xs font-bold text-slate-800">{String(v)}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Fraud flags */}
      {kyc.fraudFlags?.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
          <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
            <TriangleAlert size={11} /> Fraud Indicators Detected
          </p>
          {kyc.fraudFlags.map((f, i) => (
            <p key={i} className="text-[10px] font-bold text-rose-600">• {f}</p>
          ))}
        </div>
      )}

      {/* Override details */}
      {isOverride && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Override Reason</p>
          <p className="text-xs font-medium text-amber-800">{kyc.overrideReason}</p>
          {kyc.overrideAt && (
            <p className="text-[9px] font-bold text-amber-600">
              Overridden: {new Date(kyc.overrideAt).toLocaleString('en-ZA')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;
