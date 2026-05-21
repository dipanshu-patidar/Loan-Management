import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Briefcase, FileText, PieChart,
  CheckCircle2, XCircle, AlertCircle,
  ArrowLeft, Download, Eye, Wallet,
  MapPin, Phone, Building2, Save, Send,
  Clock, ScanFace, BadgeCheck, TriangleAlert, ShieldAlert
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

export default LoanReview;
