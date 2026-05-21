import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Briefcase, FileText, PieChart,
  CheckCircle2, XCircle, AlertCircle,
  ArrowLeft, Download, Eye, Wallet,
  MapPin, Phone, Building2, Save, Send,
  Clock, ScanFace, BadgeCheck, TriangleAlert, ShieldAlert,
  ChevronDown, ChevronUp, AlertTriangle, CreditCard, Hash, Users
} from 'lucide-react';
import loanApplicationService from '../../services/loanApplicationService';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';

const LoanReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [staffNotes, setStaffNotes] = useState('');
  const [appData, setAppData] = useState(null);
  const [showBureauHistory, setShowBureauHistory] = useState(false);

  useEffect(() => {
    if (!id) return;
    loanApplicationService.getApplicationDetails(id)
      .then(res => setAppData(res.data))
      .catch(() => {});
  }, [id]);

  const borrower = {
    name: 'Alice Johnson',
    phone: '+27 71 888 4444',
    address: '123 Financial District, Sandton, 2196',
    employment: 'Senior Software Engineer at TechCorp SA',
    income: 'R45,000',
    expenses: 'R15,000',
    status: 'Active'
  };

  const loan = {
    amount: 'R5,000',
    type: 'Personal Loan',
    duration: '12 Months',
    emi: 'R485.50',
    affordability: 'High'
  };

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/staff/loan-requests')}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Application</h1>
              <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</span>
            </div>
            <p className="text-slate-500 font-medium mt-1">Carefully review the borrower's details and documents.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="font-bold border-slate-200 bg-white" onClick={() => setIsRequestModalOpen(true)}>
            Request More Docs
          </Button>
          <Button className="font-bold shadow-lg shadow-primary/20">
            Save Progress
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: BORROWER & LOAN INFO */}
        <div className="lg:col-span-2 space-y-8">
          {/* BORROWER & LOAN DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <User size={16} className="text-primary" /> Borrower Details
              </h3>
              <div className="space-y-4">
                <DetailRow label="Full Name" value={borrower.name} icon={User} />
                <DetailRow label="Phone" value={borrower.phone} icon={Phone} />
                <DetailRow label="Address" value={borrower.address} icon={MapPin} />
                <DetailRow label="Employment" value={borrower.employment} icon={Building2} />
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <PieChart size={16} className="text-primary" /> Loan Details
              </h3>
              <div className="space-y-4">
                <DetailRow label="Requested Amount" value={loan.amount} icon={Wallet} />
                <DetailRow label="Loan Type" value={loan.type} icon={FileText} />
                <DetailRow label="Duration" value={loan.duration} icon={Clock} />
                <DetailRow label="Estimated EMI" value={loan.emi} icon={Wallet} />
              </div>
            </section>
          </div>

          {/* DOCUMENTS SECTION */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-primary" /> Uploaded Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocCard name="ID Document" status="Verified" />
              <DocCard name="Recent Payslip" status="Verified" />
              <DocCard name="Bank Statement (3 Months)" status="Pending Review" />
              <DocCard name="Proof of Residence" status="Verified" />
            </div>
          </section>

          {/* BIOMETRIC VERIFICATION RESULT */}
          {appData && (
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ScanFace size={16} className="text-primary" /> Biometric Verification Result
              </h3>
              <KycResultPanel kyc={appData.kycVerification} />
            </section>
          )}

          {/* BUREAU VERIFICATION RESULT */}
          {appData && (
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Bureau Verification Result
              </h3>
              <StaffBureauPanel
                bureau={appData.bureauVerification}
                showHistory={showBureauHistory}
                onToggleHistory={() => setShowBureauHistory(v => !v)}
              />
            </section>
          )}

          {/* CONSUMER CREDIT SEARCH */}
          {appData && (
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={16} className="text-primary" /> Consumer Credit Search
              </h3>
              <StaffCreditPanel credit={appData.creditAssessment} />
            </section>
          )}

          {/* AFFORDABILITY SUMMARY */}
          <section className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <PieChart size={16} className="text-primary" /> Affordability Analysis
                </h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Income</p>
                    <p className="text-2xl font-black text-white">{borrower.income}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fixed Expenses</p>
                    <p className="text-2xl font-black text-rose-400">{borrower.expenses}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] text-center min-w-[200px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                <div className="text-3xl font-black text-emerald-400">{loan.affordability}</div>
                <p className="text-[10px] font-bold text-slate-500 mt-2">Recommended for Approval</p>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: REVIEW ACTIONS */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium flex flex-col h-full sticky top-24">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" /> Review Decision
            </h3>
            
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Review Notes</label>
                <textarea 
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Enter detailed review findings..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[200px] focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-3 pt-4">
                <Button className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 font-black uppercase tracking-widest text-[10px]" onClick={() => navigate('/staff/loan-requests')}>
                  Recommend Approval
                </Button>
                <Button className="w-full py-4 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 font-black uppercase tracking-widest text-[10px]" onClick={() => navigate('/staff/loan-requests')}>
                  Recommend Rejection
                </Button>
                <Button variant="ghost" className="w-full py-4 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px]" onClick={() => navigate('/staff/loan-requests')}>
                  Put On Hold
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* REQUEST DOCUMENT MODAL */}
      <Modal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
        title="Request Additional Documents"
        maxWidth="max-w-xl"
      >
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</label>
              <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10">
                <option>Updated Proof of Residence</option>
                <option>Marriage Certificate</option>
                <option>Additional Bank Statements</option>
                <option>Employment Contract</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message to Borrower</label>
              <textarea 
                placeholder="Explain why this document is required..."
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => setIsRequestModalOpen(false)}>
              <Send size={18} className="mr-2" /> Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const DetailRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

const DocCard = ({ name, status }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
        <FileText size={18} />
      </div>
      <div>
        <p className="text-xs font-black text-slate-900">{name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Verified' ? "bg-emerald-500" : "bg-amber-500")} />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{status}</p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1">
      <button className="p-2 text-slate-400 hover:text-primary transition-colors">
        <Eye size={16} />
      </button>
      <button className="p-2 text-slate-400 hover:text-primary transition-colors">
        <Download size={16} />
      </button>
    </div>
  </div>
);

const KycResultPanel = ({ kyc }) => {
  if (!kyc || kyc.verificationStatus === 'Pending') {
    return (
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
        <AlertCircle size={16} className="text-amber-400 shrink-0" />
        <p className="text-xs font-bold text-slate-500">Identity verification not yet completed by borrower.</p>
      </div>
    );
  }

  const isVerified = kyc.verificationStatus === 'Verified' || kyc.verificationStatus === 'Overridden';
  const isOverride = kyc.verificationStatus === 'Overridden';

  return (
    <div className="space-y-4">
      {/* Status badge row */}
      <div className={cn(
        'flex items-center justify-between p-4 rounded-2xl border',
        isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
      )}>
        <div className="flex items-center gap-3">
          {isVerified
            ? <BadgeCheck size={20} className="text-emerald-600 shrink-0" />
            : <ShieldAlert size={20} className="text-rose-500 shrink-0" />
          }
          <div>
            <p className={cn('text-xs font-black', isVerified ? 'text-emerald-800' : 'text-rose-800')}>
              {isOverride ? 'Admin Override — Manually Approved' : isVerified ? 'Biometric Verification Passed' : 'Biometric Verification Failed'}
            </p>
            {kyc.responseMessage && (
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{kyc.responseMessage}</p>
            )}
          </div>
        </div>
        {kyc.faceMatchScore != null && (
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Face Match</p>
            <p className={cn('text-2xl font-black', isVerified ? 'text-emerald-700' : 'text-rose-600')}>
              {Math.round(kyc.faceMatchScore)}%
            </p>
          </div>
        )}
      </div>

      {/* OCR data */}
      {kyc.extractedOCRData && Object.keys(kyc.extractedOCRData).length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">OCR Extracted Data</p>
          {Object.entries(kyc.extractedOCRData).slice(0, 6).map(([k, v]) => v ? (
            <div key={k}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-xs font-bold text-slate-800">{String(v)}</p>
            </div>
          ) : null)}
        </div>
      )}

      {/* Fraud flags */}
      {kyc.fraudFlags?.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
          <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
            <TriangleAlert size={11} /> Fraud Indicators
          </p>
          {kyc.fraudFlags.map((f, i) => (
            <p key={i} className="text-[10px] font-bold text-rose-600">• {f}</p>
          ))}
        </div>
      )}

      {/* Override reason */}
      {isOverride && kyc.overrideReason && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Admin Override Reason</p>
          <p className="text-xs font-medium text-amber-800">{kyc.overrideReason}</p>
        </div>
      )}

      {/* Timestamp + ref */}
      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
        {kyc.verificationTimestamp && (
          <span>{new Date(kyc.verificationTimestamp).toLocaleString('en-ZA')}</span>
        )}
        {kyc.verificationReference && (
          <span>Ref: {kyc.verificationReference}</span>
        )}
      </div>
    </div>
  );
};

// ── Staff Credit Panel (read-only) ───────────────────────────────────────────

const StaffCreditPanel = ({ credit }) => {
  if (!credit || credit.verificationStatus === 'Pending') {
    return (
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
        <AlertCircle size={16} className="text-amber-400 shrink-0" />
        <p className="text-xs font-bold text-slate-500">Consumer credit search has not been run yet.</p>
      </div>
    );
  }

  const isVerified = credit.verificationStatus === 'Verified';
  const isWarning  = credit.verificationStatus === 'Warning';
  const consumers  = credit.matchedConsumers ?? [];

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className={cn(
        'flex items-center justify-between p-4 rounded-2xl border',
        isVerified ? 'bg-emerald-50 border-emerald-200' :
        isWarning  ? 'bg-amber-50 border-amber-200' :
        'bg-rose-50 border-rose-200'
      )}>
        <div className="flex items-center gap-3">
          {isVerified
            ? <BadgeCheck size={18} className="text-emerald-600 shrink-0" />
            : isWarning
              ? <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              : <TriangleAlert size={18} className="text-rose-500 shrink-0" />
          }
          <p className={cn('text-xs font-black',
            isVerified ? 'text-emerald-800' : isWarning ? 'text-amber-800' : 'text-rose-800'
          )}>
            {isVerified ? 'Credit Profile Found'
              : isWarning ? 'No Credit Profile Found'
              : 'Credit Search Failed'}
          </p>
        </div>
        {consumers.length > 0 && (
          <span className="text-[9px] font-black text-slate-400 shrink-0">
            {consumers.length} profile{consumers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Reference data */}
      {(credit.reportReference || credit.enquiryId) && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          {credit.reportReference && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Report Reference</p>
              <p className="text-xs font-bold text-slate-800">{credit.reportReference}</p>
            </div>
          )}
          {credit.enquiryId && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enquiry ID</p>
              <p className="text-xs font-bold text-slate-800">{credit.enquiryId}</p>
            </div>
          )}
          {credit.enquiryResultId && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enquiry Result ID</p>
              <p className="text-xs font-bold text-slate-800">{credit.enquiryResultId}</p>
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
      )}

      {/* Matched consumers (read-only) */}
      {consumers.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={11} /> Matched Consumer Profile{consumers.length !== 1 ? 's' : ''}
          </p>
          {consumers.map((c, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-black text-slate-900">{c.firstName} {c.surname}</p>
              <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                ID: {c.idNo} &bull; DOB: {c.birthDate} &bull; Gender: {c.gender}
              </p>
              {c.enquiryId && (
                <p className="text-[9px] font-bold text-slate-400 mt-1">
                  Enquiry ID: {c.enquiryId}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Staff Bureau Panel (read-only, no override) ───────────────────────────────

const StaffBureauPanel = ({ bureau, showHistory, onToggleHistory }) => {
  if (!bureau || bureau.verificationStatus === 'Pending') {
    return (
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
        <AlertCircle size={16} className="text-amber-400 shrink-0" />
        <p className="text-xs font-bold text-slate-500">Bureau address verification has not been completed by the borrower.</p>
      </div>
    );
  }

  const isVerified  = bureau.verificationStatus === 'Verified' || bureau.verificationStatus === 'Overridden';
  const isWarning   = bureau.verificationStatus === 'Warning';
  const isFailed    = bureau.verificationStatus === 'Failed';
  const isOverride  = bureau.verificationStatus === 'Overridden';

  const statusColor = isFailed ? 'rose' : isWarning ? 'amber' : 'emerald';
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   icon: 'text-amber-600'   },
    rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    icon: 'text-rose-500'    },
  };
  const c = colorMap[statusColor];

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className={cn('flex items-center justify-between p-4 rounded-2xl border', c.bg, c.border)}>
        <div className="flex items-center gap-3">
          {isFailed ? <ShieldAlert size={18} className={c.icon} />
            : isWarning ? <AlertTriangle size={18} className={c.icon} />
            : <BadgeCheck size={18} className={c.icon} />
          }
          <div>
            <p className={cn('text-xs font-black', c.text)}>
              {isOverride ? 'Admin Overridden'
                : isFailed ? 'Bureau Verification Failed'
                : isWarning ? 'Bureau Verified — Data Mismatches'
                : 'Bureau Verified'}
            </p>
            {bureau.responseMessage && (
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{bureau.responseMessage}</p>
            )}
          </div>
        </div>
        {bureau.bureauReference && (
          <span className="text-[9px] font-black text-slate-400 shrink-0">Ref: {bureau.bureauReference}</span>
        )}
      </div>

      {/* Fatal indicators (staff cannot override) */}
      {(bureau.deceasedStatus || bureau.safpsFlag) && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
              <TriangleAlert size={10} />
              {bureau.deceasedStatus ? 'DECEASED PERSON' : 'FRAUD LISTED'}
            </span>
            <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest">High Risk — Admin Action Required</p>
          </div>
          {bureau.deceasedStatus && (
            <p className="text-[10px] font-bold text-rose-600">
              • Deceased flag confirmed on Home Affairs record
              {bureau.deceasedDate ? ` — Date: ${bureau.deceasedDate}` : ''}
            </p>
          )}
          {bureau.safpsFlag && <p className="text-[10px] font-bold text-rose-600">• SAFPS fraud listing detected</p>}
        </div>
      )}

      {/* Verified contact details */}
      {(bureau.verifiedFirstName || bureau.verifiedPhone || bureau.verifiedEmail || bureau.verifiedEmployer) && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bureau Verified Details</p>
          {(bureau.verifiedFirstName || bureau.verifiedSurname) && (
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</p>
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
            <div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</p>
              <p className="text-xs font-bold text-slate-800">{bureau.verifiedResidentialAddress}</p></div>
          )}
        </div>
      )}

      {/* Data comparison */}
      {bureau.comparedFields && (
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
                <AlertCircle size={11} className="shrink-0" /> {label} Unavailable
              </div>
            );
            return null;
          })}
        </div>
      )}

      {/* Address history */}
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

      {/* PDF report note — staff cannot override but can note */}
      {bureau.pdfReport && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <FileText size={14} className="text-primary shrink-0" />
          <p className="text-[10px] font-bold text-slate-600">Bureau PDF report available — request admin download.</p>
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

export default LoanReview;
