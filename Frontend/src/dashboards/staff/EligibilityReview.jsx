import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, TrendingUp, 
  DollarSign, Briefcase, FileText, 
  ShieldCheck, ArrowRight, User,
  PieChart, ShieldAlert, Clock,
  CheckCircle, XCircle, Activity,
  FileSearch, ChevronRight, Info,
  MessageSquare, ShieldQuestion,
  History, Eye, Download, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { cn } from '../../utils/cn';

const EligibilityReview = () => {
  const [activeModal, setActiveModal] = useState(null); // 'approve', 'reject', 'request', 'escalate', 'confirm'
  const [currentStatus, setCurrentStatus] = useState('Under Review');
  const [showToast, setShowToast] = useState(null);

  const applicant = {
    name: 'John Doe',
    income: 25000,
    requested: 15000,
    status: 'Employed',
    risk: 'Low',
    scores: {
       affordability: 85,
       eligibility: 95
    }
  };

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleAction = (type) => {
    setActiveModal(null);
    if (type === 'approve') {
      setCurrentStatus('Ready for Admin Approval');
      triggerToast('Application marked as recommended for admin approval.');
    } else if (type === 'reject') {
      setCurrentStatus('Rejected Recommendation');
      triggerToast('Application marked as rejected recommendation.');
    } else if (type === 'request') {
      triggerToast('Additional information request sent to borrower.');
    } else if (type === 'escalate') {
      setCurrentStatus('Admin Review Required');
      triggerToast('Case escalated for admin review.');
    } else if (type === 'confirm') {
      setCurrentStatus('Verification Completed');
      triggerToast('Borrower verification completed successfully.');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-primary/5 text-primary rounded-[1.5rem] flex items-center justify-center">
              <ShieldCheck size={32} />
           </div>
           <div>
             <div className="flex items-center gap-2 text-primary mb-1">
               <span className="text-[10px] font-black uppercase tracking-widest">Internal Review Mode</span>
             </div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">Eligibility Verification</h1>
             <p className="text-slate-500 font-medium text-sm">Reviewing application for <span className="text-slate-900 font-black">{applicant.name}</span></p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            variant="secondary" 
            onClick={() => setActiveModal('escalate')}
            className="bg-white border-slate-200 font-black text-[10px] uppercase tracking-widest px-6"
           >
              Escalate Case
           </Button>
           <Button 
            onClick={() => setActiveModal('confirm')}
            className="font-black text-[10px] uppercase tracking-widest px-8 shadow-lg shadow-primary/20"
           >
              Confirm Verification
           </Button>
        </div>
      </header>

      {/* WORKFLOW TRACKER */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-premium">
         <div className="flex items-center justify-between max-w-4xl mx-auto">
            <WorkflowStep label="New Application" status="completed" />
            <WorkflowConnector active />
            <WorkflowStep label="Under Review" status={currentStatus === 'Under Review' ? 'active' : 'completed'} />
            <WorkflowConnector active={currentStatus !== 'Under Review'} />
            <WorkflowStep label="Verification Completed" status={currentStatus === 'Verification Completed' ? 'active' : currentStatus.includes('Admin') ? 'completed' : 'pending'} />
            <WorkflowConnector active={currentStatus.includes('Admin')} />
            <WorkflowStep label="Admin Approval" status={currentStatus === 'Ready for Admin Approval' ? 'active' : 'pending'} />
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: MATCHES & AFFORDABILITY */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* 1. ELIGIBILITY MATCH CARD */}
           <ReviewCard title="Eligibility Condition Matching" icon={PieChart}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <MatchItem label="Income Requirement Match" value="Matched" status="success" desc="Income R25k exceeds R5k min." />
                 <MatchItem label="Loan Limit Match" value="Within Limits" status="success" desc="R15k is below R50k max." />
                 <MatchItem label="Age Verification" value="Verified" status="success" desc="Applicant age 34 (18+)." />
                 <MatchItem label="Employment Status" value="Qualified" status="success" desc="Full-time permanent." />
              </div>
           </ReviewCard>

           {/* 3. AFFORDABILITY ASSESSMENT */}
           <ReviewCard title="Affordability Assessment" icon={TrendingUp}>
              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <StatItem label="Monthly Income" value="R25,000" />
                    <StatItem label="Est. Expenses" value="R8,500" />
                    <StatItem label="Available Surplus" value="R16,500" highlighted />
                 </div>
                 
                 <div className="space-y-4 pt-4 border-t border-slate-200/50">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EMI to Income Ratio</span>
                       <span className="text-sm font-black text-emerald-500">5.0% (Very Good)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: '5%' }}
                         className="h-full bg-emerald-500 rounded-full"
                       />
                    </div>
                 </div>
              </div>
           </ReviewCard>

           {/* 4. DOCUMENT VERIFICATION */}
           <ReviewCard title="Document Verification System" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <DocVerifCard label="Identity Document" status="verified" icon={User} />
                 <DocVerifCard label="Latest Payslip" status="verified" icon={DollarSign} />
                 <DocVerifCard label="Bank Statement" status="verified" icon={Landmark} />
                 <DocVerifCard label="Proof of Address" status="pending" icon={MapPin} />
              </div>
           </ReviewCard>
        </div>

        {/* RIGHT COLUMN: RISK & DECISION */}
        <div className="lg:col-span-4 space-y-8">
           <div className="sticky top-8 space-y-8">
              {/* 2. RISK PROFILE SECTION */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
                 <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldAlert size={20} className="text-primary" /> Risk Profile
                 </h3>
                 
                 <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-32 h-32 rounded-full border-[10px] border-emerald-50 flex flex-col items-center justify-center relative">
                       <div className="absolute inset-0 rounded-full border-[10px] border-emerald-500 border-t-transparent animate-spin-slow opacity-20" />
                       <span className="text-3xl font-black text-emerald-500">Low</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Category</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <DecisionMetric label="Credit Score" value="740" icon={Activity} />
                    <DecisionMetric label="DTI Ratio" value="18%" icon={PieChart} />
                 </div>
              </div>

              {/* 5. REVIEWER DECISION BOX */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-premium">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Current Application Status</p>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-sm font-black">{currentStatus}</span>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <Button 
                     onClick={() => setActiveModal('approve')}
                     className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-emerald-500/20"
                    >
                       Approve Application
                    </Button>
                    <Button 
                     onClick={() => setActiveModal('reject')}
                     className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-rose-500/20"
                    >
                       Reject Application
                    </Button>
                    <Button 
                     onClick={() => setActiveModal('request')}
                     variant="secondary" 
                     className="w-full bg-white/10 border-white/10 text-white font-black uppercase tracking-widest text-[10px] py-4"
                    >
                       Request More Info
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
         {/* APPROVE MODAL */}
         {activeModal === 'approve' && (
            <Modal isOpen onClose={() => setActiveModal(null)} title="Confirm Approval Recommendation">
               <div className="space-y-6">
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Approval Summary</p>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-[9px] font-bold text-slate-400">Borrower</p>
                           <p className="text-sm font-black text-slate-900">{applicant.name}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-slate-400">Loan Amount</p>
                           <p className="text-sm font-black text-slate-900">R15,000</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <CheckCircle2 size={16} className="text-emerald-500" /> All eligibility rules matched
                     </div>
                     <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Documents verified manually
                     </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setActiveModal(null)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => handleAction('approve')} className="flex-1 bg-emerald-500 font-black uppercase text-[10px]">Confirm Approval</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* REJECT MODAL */}
         {activeModal === 'reject' && (
            <Modal isOpen onClose={() => setActiveModal(null)} title="Reject Application Recommendation">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Reason</label>
                     <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none">
                        <option>Low Affordability</option>
                        <option>Document Mismatch</option>
                        <option>Eligibility Failed</option>
                        <option>High Risk</option>
                        <option>Incomplete Information</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewer Notes</label>
                     <textarea className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none min-h-[100px]" placeholder="Add detailed rejection reasons..."></textarea>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setActiveModal(null)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => handleAction('reject')} className="flex-1 bg-rose-500 font-black uppercase text-[10px]">Submit Rejection</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* REQUEST INFO MODAL */}
         {activeModal === 'request' && (
            <Modal isOpen onClose={() => setActiveModal(null)} title="Request Additional Information">
               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missing Documents</label>
                     <div className="grid grid-cols-2 gap-3">
                        <Checkbox label="Recent Payslip" />
                        <Checkbox label="RSA ID Document" />
                        <Checkbox label="Bank Statement" checked />
                        <Checkbox label="Address Proof" checked />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message to Borrower</label>
                     <textarea className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none min-h-[100px]" defaultValue="Hi, please provide the latest 3 months bank statements for affordability verification."></textarea>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setActiveModal(null)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => handleAction('request')} className="flex-1 font-black uppercase text-[10px]">Send Request</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* ESCALATE MODAL */}
         {activeModal === 'escalate' && (
            <Modal isOpen onClose={() => setActiveModal(null)} title="Escalate to Admin Review">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escalation Category</label>
                     <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none">
                        <option>Fraud Suspicion</option>
                        <option>Income Mismatch</option>
                        <option>Manual Admin Review</option>
                        <option>Suspicious Documents</option>
                        <option>High Risk Profile</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewer Observations</label>
                     <textarea className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none min-h-[100px]" placeholder="Explain why this case needs admin attention..."></textarea>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setActiveModal(null)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => handleAction('escalate')} className="flex-1 bg-amber-500 font-black uppercase text-[10px]">Submit Escalation</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* CONFIRM VERIFICATION MODAL */}
         {activeModal === 'confirm' && (
            <Modal isOpen onClose={() => setActiveModal(null)} title="Confirm Verification Completion">
               <div className="space-y-6">
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary mx-auto mb-4 shadow-sm border border-slate-100">
                        <ShieldCheck size={32} />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">Ready to Verify?</h3>
                     <p className="text-xs font-medium text-slate-500 mt-1">This will mark the borrower as fully verified within the system.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex items-center gap-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={14} className="text-emerald-500" /> <span className="text-[9px] font-black uppercase tracking-widest">Affordability</span>
                     </div>
                     <div className="flex items-center gap-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={14} className="text-emerald-500" /> <span className="text-[9px] font-black uppercase tracking-widest">Documents</span>
                     </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setActiveModal(null)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => handleAction('confirm')} className="flex-1 bg-primary font-black uppercase text-[10px]">Confirm Verification</Button>
                  </div>
               </div>
            </Modal>
         )}
      </AnimatePresence>

      {/* TOASTS */}
      <AnimatePresence>
         {showToast && (
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
               className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-5 border border-white/10"
            >
               <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={20} className="text-white" />
               </div>
               <div>
                  <p className="text-sm font-black tracking-tight">{showToast}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Update</p>
               </div>
            </motion.div>
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
         <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
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
   <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-start gap-4 hover:border-primary/20 transition-all group">
      <div className={cn(
         "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
         status === 'success' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
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

const DocVerifCard = ({ label, status, icon: Icon }) => (
   <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
            <Icon size={20} />
         </div>
         <div>
            <p className="text-xs font-bold text-slate-700">{label}</p>
            <div className="flex items-center gap-1.5 mt-1">
               <div className={cn("w-1.5 h-1.5 rounded-full", status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500')} />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{status}</span>
            </div>
         </div>
      </div>
      <div className="flex items-center gap-2">
         <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"><Eye size={16} /></button>
         <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"><Download size={16} /></button>
      </div>
   </div>
);

const DecisionMetric = ({ label, value, icon: Icon }) => (
   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
         <Icon size={16} />
      </div>
      <div>
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
         <p className="text-sm font-black text-slate-900 mt-1">{value}</p>
      </div>
   </div>
);

const Checkbox = ({ label, checked }) => (
   <label className="flex items-center gap-3 cursor-pointer group p-3 bg-white border border-slate-100 rounded-xl hover:border-primary/20">
      <div className={cn(
         "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
         checked ? "bg-primary border-primary shadow-sm" : "bg-white border-slate-200"
      )}>
         {checked && <CheckCircle2 size={12} className="text-white" />}
      </div>
      <span className="text-[11px] font-bold text-slate-700">{label}</span>
   </label>
);

// Landmarks import for missing icon
import { Landmark, MapPin } from 'lucide-react';

export default EligibilityReview;
