import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, AlertCircle, TrendingUp, 
  Wallet, Briefcase, FileText, 
  ShieldCheck, ArrowRight, User,
  PieChart, ShieldAlert, Clock,
  CheckCircle, XCircle, Activity,
  FileSearch, ChevronRight, Info,
  MessageSquare, ShieldQuestion,
  History, Eye, Download, Search, Landmark, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { cn } from '../../utils/cn';
import staffLoanRequestService from '../../services/staffLoanRequestService';
import BorrowerLoanService from '../../services/BorrowerLoanService';

const formatZAR = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const EligibilityReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeModal, setActiveModal] = useState(null); // 'approve', 'reject', 'hold'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [application, setApplication] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [validationRules, setValidationRules] = useState(null);
  
  // Load Application Details
  const loadDetails = async () => {
    try {
      setLoading(true);
      const [res, rulesRes] = await Promise.allSettled([
        staffLoanRequestService.getLoanRequestById(id),
        BorrowerLoanService.getValidationRules()
      ]);
      
      if (res.status === 'fulfilled' && res.value.success) {
        setApplication(res.value.data);
      } else {
        toast.error('Invalid response payload.');
        navigate('/staff/loan-requests');
        return;
      }

      if (rulesRes.status === 'fulfilled' && rulesRes.value.success) {
        setValidationRules(rulesRes.value.data);
      }
    } catch (err) {
      toast.error('Failed to load application review details.');
      navigate('/staff/loan-requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  // Handle submission to back-end
  const handleActionSubmit = async (recommendation) => {
    setSubmitting(true);
    try {
      const payload = {
        recommendation,
        reviewNotes: reviewNotes.trim() || `${recommendation} suggested during eligibility assessment.`
      };
      const res = await staffLoanRequestService.submitReview(id, payload);
      if (res.success) {
        toast.success(`Assessment submitted: ${recommendation}`);
        setActiveModal(null);
        // Bounce back to the requests dashboard
        setTimeout(() => {
          navigate('/staff/loan-requests');
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to commit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-slate-400 bg-white rounded-[2.5rem] border border-slate-100">
        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Streaming Credit Files...</p>
      </div>
    );
  }

  if (!application) return null;

  // Dynamic derived conditions
  const monthlyIncome = application.employment?.monthlyIncome || 0;
  const monthlyExpenses = application.affordability?.monthlyExpenses || 0;
  const surplus = monthlyIncome - monthlyExpenses;
  const requestedAmount = application.loanDetails?.requestedAmount || application.banking?.requestedLoanAmount || 0;
  const estimatedEMI = application.loanDetails?.estimatedEMI || 0;
  const dtiRatio = monthlyIncome > 0 ? Math.round((estimatedEMI / monthlyIncome) * 100) : 0;
  
  const isDtiGood = dtiRatio < 30;

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const dob = application.borrower?.dateOfBirth || application.personal?.dateOfBirth || application.personal?.dob;
  const age = dob ? calculateAge(dob) : 0;
  const minAge = validationRules?.minAge || 18;
  const maxAge = validationRules?.maxAge || 65;
  const isAgeValid = !dob || (age >= minAge && age <= maxAge);

  // Workflow helper state
  const currentStatus = application.status || '';
  const statusUpper = currentStatus.toUpperCase();
  const isLocked = application.staffReviewLocked || 
    ['APPROVED', 'ACTIVE', 'READY_FOR_DISBURSEMENT', 'AGREEMENT_SIGNED', 'OTP_VERIFIED', 'OTP VERIFIED', 'REVIEWED', 'AGREEMENT_PENDING_VERIFICATION', 'REJECTED'].includes(statusUpper);

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-primary/5 text-primary rounded-[1.5rem] flex items-center justify-center shadow-sm border border-slate-100">
              <ShieldCheck size={32} />
           </div>
           <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest tracking-widest">Internal Review Desk</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Eligibility Verification</h1>
              <p className="text-slate-500 font-medium text-sm">Reviewing application for <span className="text-slate-900 font-black">{application.borrower?.fullName}</span></p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            variant="secondary" 
            onClick={() => navigate('/staff/loan-requests')}
            className="bg-white border-slate-200 font-black text-[10px] uppercase tracking-widest px-6"
           >
              Cancel / Back
           </Button>
        </div>
      </header>

      {/* WORKFLOW TRACKER */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-premium">
         <div className="flex items-center justify-between max-w-4xl mx-auto">
            <WorkflowStep label="New" status="completed" />
            <WorkflowConnector active />
            <WorkflowStep 
              label="Pending Verification" 
              status={(isLocked || ['PENDING VERIFICATION', 'PENDING REVIEW', 'REVIEWED', 'APPROVED', 'ACTIVE'].includes(statusUpper)) ? 'completed' : 'active'} 
            />
            <WorkflowConnector active={isLocked || ['PENDING REVIEW', 'REVIEWED', 'APPROVED', 'ACTIVE'].includes(statusUpper)} />
            <WorkflowStep 
              label="Assessing" 
              status={(isLocked || ['REVIEWED', 'APPROVED', 'ACTIVE'].includes(statusUpper)) ? 'completed' : ['PENDING REVIEW', 'UNDER REVIEW'].includes(statusUpper) ? 'active' : 'pending'} 
            />
            <WorkflowConnector active={isLocked || ['REVIEWED', 'APPROVED', 'ACTIVE'].includes(statusUpper)} />
            <WorkflowStep 
              label="Reviewed" 
              status={(isLocked || ['REVIEWED', 'APPROVED', 'ACTIVE'].includes(statusUpper)) ? 'completed' : 'pending'} 
            />
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: MATCHES & AFFORDABILITY */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* 1. ELIGIBILITY MATCH CARD */}
           <ReviewCard title="Eligibility Verification Criteria" icon={PieChart}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <MatchItem 
                   label="Income Threshold Match" 
                   value={monthlyIncome >= (validationRules?.minimumIncome || 5000) ? "Passed" : "Requires Review"} 
                   status={monthlyIncome >= (validationRules?.minimumIncome || 5000) ? "success" : "failed"}
                   desc={`Earns ${formatZAR(monthlyIncome)} (Min ${formatZAR(validationRules?.minimumIncome || 5000)} needed).`} 
                 />
                 <MatchItem 
                   label="Loan Amount Range" 
                   value={requestedAmount <= (validationRules?.maximumPrincipal || 100000) ? "Passed" : "Exceeds Limit"} 
                   status={requestedAmount <= (validationRules?.maximumPrincipal || 100000) ? "success" : "failed"}
                   desc={`Requested ${formatZAR(requestedAmount)} (Limit: ${formatZAR(validationRules?.maximumPrincipal || 100000)}).`} 
                 />
                 <MatchItem 
                   label="Age Requirement Check" 
                   value={isAgeValid ? "Passed" : "Requires Review"} 
                   status={isAgeValid ? "success" : "failed"} 
                   desc={dob ? `Age is ${age} years (Limits: ${minAge}-${maxAge} years).` : 'Verified DOB.'} 
                 />
                 <MatchItem 
                   label="Employment Validation" 
                   value={application.employment?.employmentStatus || "Permanent"} 
                   status="success" 
                   desc={`${application.employment?.employerName || 'N/A'} (${application.employment?.employmentDuration || 'N/A'}).`} 
                 />
              </div>
           </ReviewCard>

           {/* 3. AFFORDABILITY ASSESSMENT */}
           <ReviewCard title="Fintech Affordability Matrix" icon={TrendingUp}>
              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-8 shadow-inner">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <StatItem label="Gross Monthly Income" value={formatZAR(monthlyIncome)} />
                    <StatItem label="Estimated Expenses" value={formatZAR(monthlyExpenses)} />
                    <StatItem label="Available Surplus" value={formatZAR(surplus)} highlighted />
                 </div>
                 
                 <div className="space-y-4 pt-4 border-t border-slate-200/50">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Installment to Income (DTI) Ratio</span>
                       <span className={cn("text-sm font-black", isDtiGood ? "text-emerald-500" : "text-rose-500")}>
                         {dtiRatio}% ({isDtiGood ? "Optimal / Secure" : "High Exposure"})
                       </span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(dtiRatio, 100)}%` }}
                         className={cn("h-full rounded-full", isDtiGood ? "bg-emerald-500" : "bg-rose-500")}
                       />
                    </div>
                 </div>
              </div>
           </ReviewCard>

           {/* 4. DOCUMENT VERIFICATION */}
           <ReviewCard title="Uploaded Files Register" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <DocVerifCard label="Identity Document" status={application.documentVerification?.idProofStatus || 'Pending'} icon={User} fileUrl={application.documents?.idDocument} />
                 <DocVerifCard label="Latest Payslip" status={application.documentVerification?.payslipStatus || 'Pending'} icon={Wallet} fileUrl={application.documents?.payslip} />
                 <DocVerifCard label="Bank Statement" status={application.documentVerification?.bankStatementStatus || 'Pending'} icon={Landmark} fileUrl={application.documents?.bankStatement} />
                 <DocVerifCard label="Proof of Address" status={application.documentVerification?.proofOfAddressStatus || 'Pending'} icon={MapPin} fileUrl={application.documents?.proofOfAddress} />
              </div>
           </ReviewCard>
        </div>

        {/* RIGHT COLUMN: RISK & DECISION */}
        <div className="lg:col-span-4 space-y-8">
           <div className="sticky top-8 space-y-8">
              {/* 2. RISK PROFILE SECTION */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
                 <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldAlert size={20} className="text-primary" /> Risk Engine Check
                 </h3>
                 
                 <div className="flex flex-col items-center text-center space-y-6">
                    <div className={cn(
                      "w-32 h-32 rounded-full border-[10px] flex flex-col items-center justify-center relative shadow-sm",
                      isDtiGood ? "border-emerald-50 text-emerald-500" : "border-rose-50 text-rose-500"
                    )}>
                       <span className="text-3xl font-black">{isDtiGood ? "Low" : "High"}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calculated Risk</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <DecisionMetric label="Loan Purpose" value={application.loanDetails?.loanType} icon={Activity} />
                    <DecisionMetric label="Installments" value={`${application.loanDetails?.loanDuration} Mo`} icon={PieChart} />
                 </div>
              </div>

              {/* 5. REVIEWER DECISION BOX */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-premium">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Workflow Location</p>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-sm font-black tracking-wide">{currentStatus}</span>
                    </div>
                 </div>
                 
                 {isLocked ? (
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10 text-center space-y-2">
                       {['Approved', 'APPROVED', 'Active', 'ACTIVE', 'Ready for Disbursement', 'READY_FOR_DISBURSEMENT', 'Agreement Signed', 'AGREEMENT_SIGNED', 'OTP_VERIFIED', 'OTP Verified', 'AGREEMENT_PENDING_VERIFICATION'].includes(currentStatus) ? (
                          <>
                             <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Loan Already Approved</p>
                             <p className="text-[10px] text-white/60 font-medium">Review Locked</p>
                          </>
                       ) : currentStatus === 'Reviewed' ? (
                          <>
                             <p className="text-xs font-black uppercase tracking-widest text-amber-400">Review Submitted</p>
                             <p className="text-[10px] text-white/60 font-medium">Waiting For Admin Decision</p>
                          </>
                       ) : (
                          <>
                             <p className="text-xs font-black uppercase tracking-widest text-slate-400">Application Finalized</p>
                             <p className="text-[10px] text-white/60 font-medium">Review Completed</p>
                          </>
                       )}
                       <p className="text-[9px] text-white/40 pt-2 border-t border-white/5 font-semibold">Assessment Workbench Locked</p>
                    </div>
                 ) : (
                    <div className="space-y-3">
                       <Button 
                        onClick={() => setActiveModal('approve')}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-emerald-500/20"
                       >
                          Recommend Approval
                       </Button>
                       <Button 
                        onClick={() => setActiveModal('reject')}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-rose-500/20"
                       >
                          Recommend Rejection
                       </Button>
                       <Button 
                        onClick={() => setActiveModal('hold')}
                        variant="secondary" 
                        className="w-full bg-white/10 border-white/10 text-white font-black uppercase tracking-widest text-[10px] py-4 hover:bg-white/20"
                       >
                          Put Case On Hold
                       </Button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
         {/* APPROVE MODAL */}
         {activeModal === 'approve' && (
            <Modal isOpen onClose={() => setActiveModal(null)} title="Recommend Approval Confirmation">
               <div className="space-y-6">
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Approval Summary</p>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-[9px] font-bold text-slate-400">Borrower</p>
                           <p className="text-sm font-black text-slate-900">{application.borrower?.fullName}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-slate-400">Loan Amount</p>
                           <p className="text-sm font-black text-slate-900">{formatZAR(requestedAmount)}</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessor Decision Notes</label>
                     <textarea 
                       className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none min-h-[100px]"
                       placeholder="Write detailed motivation why the Admin should approve this profile..."
                       value={reviewNotes}
                       onChange={(e) => setReviewNotes(e.target.value)}
                     />
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setActiveModal(null)} disabled={submitting} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => handleActionSubmit('Recommend Approval')} disabled={submitting} className="flex-1 bg-emerald-500 font-black uppercase text-[10px]">
                       {submitting ? "Saving..." : "Submit Recommendation"}
                     </Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* REJECT MODAL */}
         {activeModal === 'reject' && (
            <Modal isOpen onClose={() => setActiveModal(null)} title="Recommend Rejection Confirmation">
               <div className="space-y-6">
                  <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                     <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Attention Required</p>
                     <p className="text-xs font-medium text-rose-800">You are recommending absolute rejection of this file. Provide detailed feedback below.</p>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Motivation Notes</label>
                     <textarea 
                       className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none min-h-[100px]"
                       placeholder="Provide rejection rationale (e.g. DTI Ratio failure, fake documents, etc.)..."
                       value={reviewNotes}
                       onChange={(e) => setReviewNotes(e.target.value)}
                     />
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setActiveModal(null)} disabled={submitting} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => handleActionSubmit('Recommend Rejection')} disabled={submitting} className="flex-1 bg-rose-500 font-black uppercase text-[10px]">
                       {submitting ? "Saving..." : "Submit Rejection"}
                     </Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* HOLD MODAL */}
         {activeModal === 'hold' && (
            <Modal isOpen onClose={() => setActiveModal(null)} title="Place Case On Hold">
               <div className="space-y-6">
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                     <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Verification Waitlist</p>
                     <p className="text-xs font-medium text-amber-800">Marking as Hold pauses standard escalations. Specify outstanding queries below.</p>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessor Observations</label>
                     <textarea 
                       className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none min-h-[100px]"
                       placeholder="Write the reason why review is suspended..."
                       value={reviewNotes}
                       onChange={(e) => setReviewNotes(e.target.value)}
                     />
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setActiveModal(null)} disabled={submitting} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => handleActionSubmit('Put On Hold')} disabled={submitting} className="flex-1 bg-amber-500 font-black uppercase text-[10px]">
                       {submitting ? "Saving..." : "Pause Processing"}
                     </Button>
                  </div>
               </div>
            </Modal>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const WorkflowStep = ({ label, status }) => (
   <div className="flex flex-col items-center gap-3">
      <div className={cn(
         "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
         status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
         status === 'active' ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 animate-pulse" :
         "bg-white border-slate-200 text-slate-300"
      )}>
         {status === 'completed' ? <CheckCircle2 size={20} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
      </div>
      <span className={cn(
         "text-[10px] font-black uppercase tracking-widest text-center",
         status === 'pending' ? "text-slate-400" : "text-slate-900"
      )}>{label}</span>
   </div>
);

const WorkflowConnector = ({ active }) => (
   <div className="flex-1 h-[2px] bg-slate-100 mx-4 relative -mt-10">
      {active && (
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            className="h-full bg-emerald-500"
         />
      )}
   </div>
);

const ReviewCard = ({ title, icon: Icon, children }) => (
   <motion.section 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden"
   >
      <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/20">
         <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
            <Icon size={20} />
         </div>
         <h3 className="text-md font-black text-slate-900 tracking-tight">{title}</h3>
      </div>
      <div className="p-8">
         {children}
      </div>
   </motion.section>
);

const MatchItem = ({ label, value, status, desc }) => (
   <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-start gap-4 hover:border-primary/20 transition-all group shadow-sm">
      <div className={cn(
         "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
         status === 'success' ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
      )}>
         {status === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
         <p className="text-sm font-black text-slate-900 mt-0.5">{value}</p>
         <p className="text-[9px] font-bold text-slate-400 mt-1">{desc}</p>
      </div>
   </div>
);

const StatItem = ({ label, value, highlighted }) => (
   <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={cn("text-xl font-black", highlighted ? "text-primary" : "text-slate-900")}>{value}</p>
   </div>
);

const DocVerifCard = ({ label, status, icon: Icon, fileUrl }) => (
   <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border border-slate-100 shadow-sm">
            <Icon size={20} />
         </div>
         <div>
            <p className="text-xs font-bold text-slate-700">{label}</p>
            <div className="flex items-center gap-1.5 mt-1">
               <div className={cn(
                 "w-1.5 h-1.5 rounded-full", 
                 status === 'Approved' ? 'bg-emerald-500' : 
                 status === 'Rejected' ? 'bg-rose-500' :
                 'bg-amber-500'
               )} />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{status}</span>
            </div>
         </div>
      </div>
      <div className="flex items-center gap-2">
         {fileUrl ? (
           <>
             <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all border border-slate-100"><Eye size={16} /></a>
             <a href={fileUrl} download target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all border border-slate-100"><Download size={16} /></a>
           </>
         ) : (
           <span className="text-[8px] font-black text-rose-400 uppercase">No File</span>
         )}
      </div>
   </div>
);

const DecisionMetric = ({ label, value, icon: Icon }) => (
   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary border border-slate-100 shadow-sm">
         <Icon size={16} />
      </div>
      <div>
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
         <p className="text-sm font-black text-slate-900 mt-1 truncate max-w-[100px]" title={value}>{value}</p>
      </div>
   </div>
);

export default EligibilityReview;
