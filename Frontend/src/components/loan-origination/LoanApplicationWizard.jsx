import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Landmark, Scale, FileText, CheckCircle, RefreshCw, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import BorrowerSearchPanel from './BorrowerSearchPanel';
import AffordabilitySection from './AffordabilitySection';
import LoanConfigurationCard from './LoanConfigurationCard';
import DocumentComplianceCenter from './DocumentComplianceCenter';
import FinalReviewPanel from './FinalReviewPanel';
import { cn } from '../../utils/cn';

const steps = [
  { number: 1, title: 'Profile', desc: 'Identity Desk' },
  { number: 2, title: 'Affordability', desc: 'Financials & KYC' },
  { number: 3, title: 'Config', desc: 'Loan Cost & Bank' },
  { number: 4, title: 'Compliance', desc: 'OCR & AML Check' },
  { number: 5, title: 'Review', desc: 'Consent & Submit' }
];

const LoanApplicationWizard = ({ isOpen, onClose, onRefreshList }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // WIZARD STATE PACKS
  const [activeBorrower, setActiveBorrower] = useState(null);
  
  const [affordability, setAffordability] = useState({
    income: { basicSalary: 0, allowances: 0, overtime: 0, otherIncome: 0, totalIncome: 0 },
    expenses: { taxes: 0, rentMortgage: 0, debtRepayments: 0, livingExpenses: 0, totalExpenses: 0 },
    disposableIncome: 0,
    debtToIncomeRatio: 0,
    isNcrCompliant: false
  });

  const [loanConfig, setLoanConfig] = useState({
    loanType: 'Personal Loan',
    requestedAmount: 15000,
    requestedDuration: 12,
    loanPurpose: 'Debt Consolidation',
    processingFee: 0,
    interestRate: 12.5,
    estimatedMonthlyEMI: 0,
    totalRepayment: 0,
    banking: {
      bankName: 'Standard Bank',
      accountNumber: '',
      branchCode: '000205',
      accountType: 'Savings',
      accountHolderName: '',
      verified: false
    }
  });

  const [documents, setDocuments] = useState([]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setActiveStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const role = localStorage.getItem('role') || 'staff';
      const endpoint = role === 'admin' 
        ? '/admin/loan-applications/create-on-behalf' 
        : '/staff/loan-requests/create-on-behalf';

      const payload = {
        borrowerId: activeBorrower._id || activeBorrower.userId || activeBorrower.borrowerProfileId,
        personal: {
          fullName: activeBorrower.fullName,
          phoneNumber: activeBorrower.phoneNumber || activeBorrower.phone,
          emailAddress: activeBorrower.email,
          idNumber: activeBorrower.idNumber,
          dateOfBirth: activeBorrower.dateOfBirth || new Date(),
          residentialAddress: activeBorrower.physicalAddress || "Not Stated"
        },
        employment: {
          employmentStatus: 'Employed',
          employerName: activeBorrower.employerName || "Gauteng Dept of Health",
          monthlyIncome: affordability.income?.totalIncome || activeBorrower.monthlyNetSalary || 0,
          workAddress: activeBorrower.physicalAddress || "Not Stated",
          employmentDuration: activeBorrower.yearsOfService ? `${activeBorrower.yearsOfService} Years` : "2 Years"
        },
        banking: {
          requestedLoanAmount: loanConfig.requestedAmount,
          requestedDuration: loanConfig.requestedDuration,
          bankName: loanConfig.banking?.bankName,
          accountHolderName: loanConfig.banking?.accountHolderName,
          accountNumber: loanConfig.banking?.accountNumber,
          branchCode: loanConfig.banking?.branchCode
        },
        documents: documents.map(doc => ({
          type: doc.type,
          url: doc.url,
          fileId: doc.fileId,
          fileName: doc.fileName,
          fileSize: doc.fileSize
        })),
        confirmationAccepted: true,
        creditConsentAccepted: true,
        creditConsentAcceptedAt: new Date()
      };

      const res = await api.post(endpoint, payload);
      if (res.data.success) {
        setSuccessMsg('Loan Application Submitted Successfully! 🎉');
        setTimeout(() => {
          onRefreshList?.();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Submission Error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit loan application. Please verify details.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepIcon = (num) => {
    switch (num) {
      case 1: return User;
      case 2: return Scale;
      case 3: return Landmark;
      case 4: return Sparkles;
      case 5: return ShieldCheck;
      default: return User;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl bg-slate-50 rounded-[36px] shadow-2xl border border-slate-100/50 flex flex-col overflow-hidden max-h-[90vh] my-4"
      >
        {/* HEADER */}
        <div className="px-8 py-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                New Loan Application Wizard
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Internal Origination Workflow Desk
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-50 border border-slate-200/40 text-slate-400 hover:text-slate-700 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* PROGRESS STEP BAR */}
        <div className="px-8 py-5 bg-white border-b border-slate-100 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between relative">
            
            {/* Centered Connector Line */}
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[3px] bg-slate-100 z-0 rounded-full" />
            
            {/* Dynamic Active Connector Line */}
            <div 
              className="absolute left-4 top-1/2 -translate-y-1/2 h-[3px] bg-primary transition-all duration-300 z-0 rounded-full" 
              style={{ width: `${((activeStep - 1) / 4) * 98}%` }}
            />

            {steps.map((s) => {
              const StepIcon = getStepIcon(s.number);
              const isCompleted = activeStep > s.number;
              const isActive = activeStep === s.number;

              return (
                <div key={s.number} className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border font-black text-xs transition-all shadow-sm",
                    isCompleted 
                      ? "bg-primary border-primary text-white" 
                      : isActive 
                        ? "bg-slate-900 border-slate-900 text-white scale-110 shadow-md shadow-slate-900/10" 
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  )}>
                    {isCompleted ? <CheckCircle size={14} /> : s.number}
                  </div>
                  <div className="text-center mt-2">
                    <p className={cn("text-[9px] font-black uppercase tracking-wider", isActive ? "text-slate-800" : "text-slate-400")}>
                      {s.title}
                    </p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5 max-w-[80px] hidden md:block leading-tight">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COMPONENT VIEWS (scrollable body) */}
        <div className="flex-1 p-8 overflow-y-auto min-h-[400px]">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-700 mb-6 shadow-sm">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-700 mb-6 shadow-sm text-center">
              {successMsg}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {activeStep === 1 && (
                <BorrowerSearchPanel
                  activeBorrower={activeBorrower}
                  setActiveBorrower={setActiveBorrower}
                  onNextStep={handleNextStep}
                  onClose={onClose}
                />
              )}

              {activeStep === 2 && (
                <AffordabilitySection
                  affordability={affordability}
                  setAffordability={setAffordability}
                  documents={documents}
                  setDocuments={setDocuments}
                  onNextStep={handleNextStep}
                  onPrevStep={handlePrevStep}
                />
              )}

              {activeStep === 3 && (
                <LoanConfigurationCard
                  loanConfig={loanConfig}
                  setLoanConfig={setLoanConfig}
                  activeBorrower={activeBorrower}
                  onNextStep={handleNextStep}
                  onPrevStep={handlePrevStep}
                />
              )}

              {activeStep === 4 && (
                <DocumentComplianceCenter
                  documents={documents}
                  activeBorrower={activeBorrower}
                  onNextStep={handleNextStep}
                  onPrevStep={handlePrevStep}
                />
              )}

              {activeStep === 5 && (
                <FinalReviewPanel
                  activeBorrower={activeBorrower}
                  affordability={affordability}
                  loanConfig={loanConfig}
                  documents={documents}
                  onSubmit={handleFinalSubmit}
                  submitting={submitting}
                  onPrevStep={handlePrevStep}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LoanApplicationWizard;
