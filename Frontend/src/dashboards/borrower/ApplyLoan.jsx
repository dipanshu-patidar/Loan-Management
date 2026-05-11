import React, { useState } from 'react';
import { 
  User, Briefcase, Landmark, FileText, 
  CheckCircle2, ArrowRight, ArrowLeft, 
  Upload, Info, AlertCircle, ShieldCheck,
  DollarSign, Clock, FileCheck, ChevronRight,
  X, Image as ImageIcon, MapPin, Phone, Mail,
  Calendar, Building2, Wallet, TrendingUp, Activity, RefreshCw,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';
import { useEffect } from 'react';

const ApplyLoan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Personal
    fullName: 'John Doe',
    phone: '+27 71 234 5678',
    email: 'john.doe@example.com',
    idNumber: '9001015000081',
    dob: '1990-01-01',
    address: '123 Fintech Lane, Sandton, 2196',
    // Employment
    status: 'Employed',
    employer: 'Tech Solutions SA',
    income: '25000',
    workAddress: '45 Corporate Drive, Johannesburg',
    duration: '3 Years',
    // Banking
    bankName: 'Global Bank',
    accountHolder: 'John Doe',
    accountNumber: '1020304050',
    branchCode: '678110',
    loanAmount: '15000'
  });

  // Handle pre-filled data from EMI Calculator
  useEffect(() => {
    if (location.state?.amount || location.state?.duration) {
      setFormData(prev => ({
        ...prev,
        loanAmount: location.state.amount || prev.loanAmount,
        loanDuration: location.state.duration || prev.loanDuration
      }));
    }
  }, [location.state]);

  const totalSteps = 5;
  const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Employment', icon: Briefcase },
    { id: 3, title: 'Banking', icon: Landmark },
    { id: 4, title: 'Documents', icon: FileText },
    { id: 5, title: 'Review', icon: ShieldCheck },
  ];

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleSubmit = () => {
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  if (isSubmitted) {
    return <SuccessScreen navigate={navigate} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Apply Loan</h1>
          <p className="text-slate-500 font-medium mt-1">Submit your loan request, upload documents, and track approval status.</p>
        </div>
        <button 
          onClick={() => setIsEligibilityModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-primary shadow-sm hover:shadow-md transition-all"
        >
          <Info size={16} /> Loan Eligibility Info
        </button>
      </header>

      {/* 📊 LOAN SELECTION PREVIEW (If redirected from EMI) */}
      {location.state?.amount && (
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent/5 border border-accent/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="bg-accent/10 p-4 rounded-2xl">
              <Calculator size={28} className="text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Your Loan Selection</h3>
              <p className="text-sm font-medium text-slate-500">Complete your loan application to continue with these terms.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-50 text-center min-w-[140px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan Amount</p>
                <p className="text-xl font-black text-primary">${location.state.amount.toLocaleString()}</p>
             </div>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-50 text-center min-w-[140px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                <p className="text-xl font-black text-primary">{location.state.duration} Months</p>
             </div>
             <div className="bg-primary p-5 rounded-2xl shadow-lg shadow-primary/20 text-center min-w-[140px]">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Est. Monthly EMI</p>
                <p className="text-xl font-black text-white">
                  ${Math.round(
                    (location.state.amount * (4.7 / 100 / 12) * Math.pow(1 + 4.7 / 100 / 12, location.state.duration)) /
                    (Math.pow(1 + 4.7 / 100 / 12, location.state.duration) - 1)
                  ).toLocaleString()}
                </p>
             </div>
          </div>
        </motion.section>
      )}

      {/* 📌 SIMPLE LOAN FLOW */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
         <div className="flex flex-wrap items-center justify-between gap-8 max-w-4xl mx-auto">
            <WorkflowItem icon={FileCheck} title="Apply Loan" status="active" />
            <div className="hidden sm:block flex-1 h-px bg-white/10" />
            <WorkflowItem icon={Clock} title="Under Review" status="pending" />
            <div className="hidden sm:block flex-1 h-px bg-white/10" />
            <WorkflowItem icon={CheckCircle2} title="Final Status" status="pending" />
         </div>
      </section>

      {/* PROGRESS STEPPER */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium">
         <div className="flex items-center justify-between px-4">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-3 relative">
                 <div className={cn(
                   "w-10 h-10 rounded-xl flex items-center justify-center transition-all z-10",
                   currentStep >= step.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400"
                 )}>
                    <step.icon size={18} />
                 </div>
                 <span className={cn(
                   "text-[10px] font-black uppercase tracking-widest",
                   currentStep >= step.id ? "text-primary" : "text-slate-400"
                 )}>
                    {step.title}
                 </span>
              </div>
            ))}
         </div>
      </div>

      {/* FORM CONTENT */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
         <div className="p-10">
            <AnimatePresence mode="wait">
               <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
               >
                  {currentStep === 1 && <PersonalInfoStep formData={formData} setFormData={setFormData} />}
                  {currentStep === 2 && <EmploymentInfoStep formData={formData} setFormData={setFormData} />}
                  {currentStep === 3 && <BankingInfoStep formData={formData} setFormData={setFormData} />}
                  {currentStep === 4 && <DocumentsUploadStep />}
                  {currentStep === 5 && <ReviewStep formData={formData} />}
               </motion.div>
            </AnimatePresence>
         </div>

         {/* ACTIONS */}
         <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <Button 
               variant="secondary" 
               disabled={currentStep === 1} 
               onClick={handleBack}
               className="font-black text-[10px] uppercase tracking-widest bg-white border-slate-200"
            >
               <ArrowLeft size={16} className="mr-2" /> Previous Step
            </Button>
            
            <div className="flex items-center gap-3">
               <Button variant="secondary" className="font-black text-[10px] uppercase tracking-widest text-slate-400 bg-transparent border-transparent hover:bg-slate-100">
                  Save Draft
               </Button>
               {currentStep < totalSteps ? (
                  <Button onClick={handleNext} className="font-black text-[10px] uppercase tracking-widest px-8">
                     Next Step <ArrowRight size={16} className="ml-2" />
                  </Button>
               ) : (
                  <Button onClick={handleSubmit} className="font-black text-[10px] uppercase tracking-widest px-10 shadow-lg shadow-primary/20">
                     Submit Application <CheckCircle2 size={16} className="ml-2" />
                  </Button>
               )}
            </div>
         </div>
      </div>

      {/* 📊 ELIGIBILITY SUMMARY (BOTTOM) */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <EligibilityCard icon={DollarSign} label="Min Amount" value="R1,000" color="blue" />
         <EligibilityCard icon={TrendingUp} label="Max Amount" value="R50,000" color="emerald" />
         <EligibilityCard icon={Clock} label="Duration" value="3 - 24 Months" color="amber" />
         <EligibilityCard icon={Activity} label="Est. Interest" value="12.5% p.a." color="primary" />
      </section>

      {/* 🚀 LOAN ELIGIBILITY MODAL */}
      <EligibilityModal isOpen={isEligibilityModalOpen} onClose={() => setIsEligibilityModalOpen(false)} />
    </div>
  );
};

// --- STEPS ---

const PersonalInfoStep = ({ formData, setFormData }) => (
   <div className="space-y-8">
      <div>
         <h2 className="text-2xl font-black text-slate-900 tracking-tight">Personal Information</h2>
         <p className="text-sm font-medium text-slate-500 mt-1">Provide your basic contact and identity details.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Input label="Full Name" placeholder="Enter your full name" icon={User} defaultValue={formData.fullName} />
         <Input label="ID Number" placeholder="RSA ID Number" icon={FileText} defaultValue={formData.idNumber} />
         <Input label="Email Address" type="email" placeholder="john@example.com" icon={Mail} defaultValue={formData.email} />
         <Input label="Phone Number" placeholder="+27" icon={Phone} defaultValue={formData.phone} />
         <Input label="Date of Birth" type="date" icon={Calendar} defaultValue={formData.dob} />
         <div className="md:col-span-2">
            <Input label="Residential Address" isTextArea placeholder="Enter your full home address..." icon={MapPin} defaultValue={formData.address} />
         </div>
      </div>
   </div>
);

const EmploymentInfoStep = ({ formData, setFormData }) => (
   <div className="space-y-8">
      <div>
         <h2 className="text-2xl font-black text-slate-900 tracking-tight">Employment Details</h2>
         <p className="text-sm font-medium text-slate-500 mt-1">Tell us about your current work status and income.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Briefcase size={12} className="text-primary" /> Employment Status
            </label>
            <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner">
               <option>Employed</option>
               <option>Self-Employed</option>
               <option>Business Owner</option>
            </select>
         </div>
         <Input label="Employer Name" placeholder="Company name" icon={Building2} defaultValue={formData.employer} />
         <Input label="Monthly Income (R)" type="number" placeholder="Gross monthly salary" icon={DollarSign} defaultValue={formData.income} />
         <Input label="Employment Duration" placeholder="e.g. 3 Years" icon={Clock} defaultValue={formData.duration} />
         <div className="md:col-span-2">
            <Input label="Work Address" isTextArea placeholder="Enter company address..." icon={MapPin} defaultValue={formData.workAddress} />
         </div>
      </div>
   </div>
);

const BankingInfoStep = ({ formData, setFormData }) => (
   <div className="space-y-10">
      <div className="space-y-8">
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Banking Information</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Where should we disburse your loan funds?</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Bank Name" placeholder="e.g. Global Bank" icon={Landmark} defaultValue={formData.bankName} />
            <Input label="Account Holder" placeholder="Name as per bank" icon={User} defaultValue={formData.accountHolder} />
            <Input label="Account Number" placeholder="10-digit account no." icon={FileText} defaultValue={formData.accountNumber} />
            <Input label="Branch Code" placeholder="6-digit code" icon={MapPin} defaultValue={formData.branchCode} />
         </div>
      </div>

      <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 space-y-6">
         <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-[0.15em] flex items-center gap-2">
            <DollarSign size={14} /> Estimated Fees & Repayment
         </h4>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ReadOnlyStat label="Requested Amount" value={`R${formData.loanAmount}`} />
            <ReadOnlyStat label="Processing Fee (Admin)" value="R250" />
            <ReadOnlyStat label="Total Estimated" value="R16,250" highlighted />
         </div>
         <p className="text-[10px] font-bold text-blue-400">Fees are automatically calculated and are subject to final credit assessment.</p>
      </div>
   </div>
);

const DocumentsUploadStep = () => (
   <div className="space-y-8">
      <div>
         <h2 className="text-2xl font-black text-slate-900 tracking-tight">Document Upload</h2>
         <p className="text-sm font-medium text-slate-500 mt-1">Please provide the following supporting documents (PDF, JPG, PNG).</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <UploadCard label="Identity Document" desc="Clear scan of RSA ID / Passport" />
         <UploadCard label="Latest Payslip" desc="Proof of monthly income" />
         <UploadCard label="3-Month Bank Statement" desc="Banking history proof" />
         <UploadCard label="Proof of Address" desc="Utility bill or lease agreement" />
      </div>
   </div>
);

const ReviewStep = ({ formData }) => (
   <div className="space-y-10">
      <div>
         <h2 className="text-2xl font-black text-slate-900 tracking-tight">Review & Submit</h2>
         <p className="text-sm font-medium text-slate-500 mt-1">Please confirm that all your information is accurate.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SummaryCard title="Personal" data={[
            { label: 'Name', value: formData.fullName },
            { label: 'ID', value: formData.idNumber },
            { label: 'Phone', value: formData.phone }
         ]} />
         <SummaryCard title="Employment" data={[
            { label: 'Status', value: formData.status },
            { label: 'Employer', value: formData.employer },
            { label: 'Income', value: `R${formData.income}` }
         ]} />
         <SummaryCard title="Banking" data={[
            { label: 'Bank', value: formData.bankName },
            { label: 'Account', value: formData.accountNumber }
         ]} />
         <div className="bg-primary p-8 rounded-[2rem] text-white space-y-4 shadow-lg shadow-primary/20">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Final Loan Summary</p>
            <div className="flex justify-between items-end">
               <div>
                  <p className="text-3xl font-black">R15,000</p>
                  <p className="text-[10px] font-bold mt-1">Requested Principal</p>
               </div>
               <div className="text-right">
                  <p className="text-xl font-black opacity-90">R1,250</p>
                  <p className="text-[10px] font-bold mt-1 opacity-60 text-white">Est. Monthly EMI</p>
               </div>
            </div>
         </div>
      </div>

      <label className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group">
         <div className="relative">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-6 h-6 bg-white border-2 border-slate-200 rounded-lg peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
               <CheckCircle2 size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
            </div>
         </div>
         <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">I confirm all the information provided is correct and true.</span>
      </label>
   </div>
);

// --- HELPER COMPONENTS ---

const WorkflowItem = ({ icon: Icon, title, status }) => (
   <div className="flex flex-col items-center gap-4">
      <div className={cn(
         "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg",
         status === 'active' ? "bg-primary border-primary text-white shadow-primary/40 scale-110" : "bg-white/5 border-white/10 text-white/40"
      )}>
         <Icon size={24} />
      </div>
      <span className={cn(
         "text-[11px] font-black uppercase tracking-widest",
         status === 'active' ? "text-white" : "text-white/40"
      )}>{title}</span>
   </div>
);

const EligibilityCard = ({ icon: Icon, label, value, color }) => (
   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium flex flex-col items-center text-center gap-4 group hover:border-primary/20 transition-all">
      <div className={cn(
         "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform",
         color === 'blue' ? "bg-blue-50 text-blue-500" :
         color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
         color === 'amber' ? "bg-amber-50 text-amber-500" :
         "bg-primary/5 text-primary"
      )}>
         <Icon size={18} />
      </div>
      <div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <p className="text-sm font-black text-slate-900">{value}</p>
      </div>
   </div>
);

const ReadOnlyStat = ({ label, value, highlighted }) => (
   <div className={cn(
      "p-5 rounded-2xl border transition-all",
      highlighted ? "bg-white border-blue-200 shadow-sm" : "bg-transparent border-blue-100/50"
   )}>
      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={cn("font-black tracking-tight", highlighted ? "text-xl text-primary" : "text-lg text-blue-600")}>{value}</p>
   </div>
);

const UploadCard = ({ label, desc }) => {
   const [selectedFile, setSelectedFile] = useState(null);
   const inputId = React.useId();

   const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
         setSelectedFile(file.name);
      }
   };

   return (
      <div 
         onClick={() => document.getElementById(inputId).click()}
         className={cn(
            "p-8 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center text-center gap-4 group transition-all cursor-pointer",
            selectedFile 
               ? "border-emerald-200 bg-emerald-50/30" 
               : "border-slate-200 bg-slate-50/50 hover:border-primary/40 hover:bg-white"
         )}
      >
         <input 
            type="file" 
            id={inputId} 
            className="hidden" 
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
         />
         <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all",
            selectedFile 
               ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20" 
               : "bg-white text-slate-400 group-hover:text-primary"
         )}>
            {selectedFile ? <FileCheck size={24} /> : <Upload size={24} />}
         </div>
         <div>
            <h4 className="text-sm font-black text-slate-900">{selectedFile || label}</h4>
            <p className="text-[10px] font-medium text-slate-400 mt-1">
               {selectedFile ? "File selected successfully" : desc}
            </p>
         </div>
         <div className={cn(
            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
            selectedFile 
               ? "bg-emerald-100 text-emerald-600" 
               : "bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-white"
         )}>
            {selectedFile ? "Change File" : "Browse Files"}
         </div>
      </div>
   );
};

const SummaryCard = ({ title, data }) => (
   <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-5">
      <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] border-b border-slate-200 pb-3">{title} Details</h5>
      <div className="space-y-4">
         {data.map((item, i) => (
            <div key={i} className="flex justify-between items-center">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
               <span className="text-xs font-black text-slate-700">{item.value}</span>
            </div>
         ))}
      </div>
   </div>
);

const SuccessScreen = ({ navigate }) => (
   <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto py-20 text-center space-y-10"
   >
      <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30">
         <CheckCircle2 size={48} />
      </div>
      <div className="space-y-4">
         <h2 className="text-4xl font-black text-slate-900 tracking-tight">Application Submitted!</h2>
         <p className="text-slate-500 font-medium">Your loan request has been received. Our team will review your application and get back to you shortly.</p>
      </div>
      
      <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
         <div className="flex justify-between items-center text-left border-b border-slate-50 pb-6">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference No</p>
               <p className="text-xl font-black text-slate-900 mt-1">APP-2024-9981</p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
               <StatusBadge status="Under Review" />
            </div>
         </div>
         <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">"You will receive a notification via email once your application has been processed."</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <Button className="font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => navigate('/borrower/loans')}>
            View My Loans
         </Button>
         <Button variant="secondary" className="font-black uppercase tracking-widest text-[10px] py-4 bg-white border-slate-200" onClick={() => navigate('/borrower/dashboard')}>
            Back to Dashboard
         </Button>
      </div>
   </motion.div>
);

const EligibilityModal = ({ isOpen, onClose }) => (
   <Modal isOpen={isOpen} onClose={onClose} title="Loan Eligibility Information" maxWidth="max-w-4xl">
      <div className="space-y-10 custom-scrollbar max-h-[70vh] overflow-y-auto pr-2 pb-6">
         <div className="space-y-4">
            <p className="text-sm font-medium text-slate-500 leading-relaxed">Check the minimum requirements before submitting your loan application to ensure a smooth approval process.</p>
         </div>

         {/* 📌 ELIGIBILITY REQUIREMENTS */}
         <section className="space-y-6">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
               <ShieldCheck size={14} /> Basic Requirements
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               <ReqItem icon={User} label="Minimum Age" value="18 Years+" />
               <ReqItem icon={Briefcase} label="Employment" value="Employed / Self" />
               <ReqItem icon={DollarSign} label="Min Income" value="R5,000 Monthly" />
               <ReqItem icon={FileText} label="Valid ID" value="Government ID" />
               <ReqItem icon={Landmark} label="Bank Account" value="Active Account" />
            </div>
         </section>

         {/* 💰 LOAN LIMITS SECTION */}
         <section className="space-y-6">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
               <Wallet size={14} /> Loan Limits & Periods
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-6 group hover:border-primary/20 transition-all">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                     <TrendingUp size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Limits</p>
                     <p className="text-lg font-black text-slate-900 mt-0.5">R1,000 - R50,000</p>
                  </div>
               </div>
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-6 group hover:border-primary/20 transition-all">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                     <Calendar size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Period</p>
                     <p className="text-lg font-black text-slate-900 mt-0.5">3 to 24 Months</p>
                  </div>
               </div>
            </div>
         </section>

         {/* 📄 REQUIRED DOCUMENTS */}
         <section className="space-y-6">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
               <FileText size={14} /> Documentation Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <DocCheckItem icon={FileCheck} label="Identity Document" desc="RSA ID, Passport, or Driving License" />
               <DocCheckItem icon={FileCheck} label="Proof of Income" desc="Latest 3 months' payslips" />
               <DocCheckItem icon={FileCheck} label="Bank Statements" desc="Standard 3 months' transaction history" />
               <DocCheckItem icon={FileCheck} label="Proof of Residence" desc="Utility bill or lease agreement" />
            </div>
         </section>

         {/* 📅 REPAYMENT INFORMATION */}
         <section className="space-y-6">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
               <RefreshCw size={14} /> Repayment Rules
            </h4>
            <div className="p-8 bg-blue-50/30 rounded-[2.5rem] border border-blue-100/50 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner">
               <RuleItem title="Monthly EMI" desc="Fixed monthly payments deducted via debit order or bank transfer." />
               <RuleItem title="Late Penalties" desc="A 5% late fee applies to any payments missed after the grace period." />
               <RuleItem title="Grace Period" desc="5 business days allowed from the original due date." />
               <RuleItem title="Verification" desc="Payments are verified within 24-48 hours by our staff." />
            </div>
         </section>

         {/* ⚠️ IMPORTANT NOTICE */}
         <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
               <AlertCircle size={20} />
            </div>
            <p className="text-[11px] font-bold text-amber-700 leading-relaxed py-1">
               Loan approval depends on document verification, affordability review, and final admin approval. We encourage responsible borrowing.
            </p>
         </div>
      </div>

      <div className="flex gap-4 pt-6 mt-4 border-t border-slate-50">
         <Button variant="secondary" className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 bg-white border-slate-200" onClick={onClose}>
            Close
         </Button>
         <Button className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20" onClick={onClose}>
            Continue Application
         </Button>
      </div>
   </Modal>
);

const ReqItem = ({ icon: Icon, label, value }) => (
   <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center transition-colors group-hover:text-primary">
         <Icon size={18} />
      </div>
      <div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
         <p className="text-[11px] font-black text-slate-900 mt-0.5">{value}</p>
      </div>
   </div>
);

const DocCheckItem = ({ icon: Icon, label, desc }) => (
   <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm">
         <Icon size={14} />
      </div>
      <div>
         <h5 className="text-[11px] font-black text-slate-900">{label}</h5>
         <p className="text-[9px] font-medium text-slate-500 mt-0.5">{desc}</p>
      </div>
   </div>
);

const RuleItem = ({ title, desc }) => (
   <div className="space-y-1.5">
      <h5 className="text-[11px] font-black text-slate-900 flex items-center gap-2">
         <div className="w-1 h-1 bg-primary rounded-full" /> {title}
      </h5>
      <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{desc}</p>
   </div>
);

export default ApplyLoan;
