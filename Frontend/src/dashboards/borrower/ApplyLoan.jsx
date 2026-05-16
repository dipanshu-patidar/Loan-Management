import React, { useState, useEffect } from 'react';
import {
  User, Briefcase, Landmark, FileText,
  CheckCircle2, ArrowRight, ArrowLeft,
  Info, ShieldCheck, Calculator, Clock,
  Mail, Phone, Calendar, Building2, MapPin, Wallet,
  TrendingUp, Activity, Shield, ClipboardList, AlertTriangle
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';

import BorrowerLoanService from '../../services/BorrowerLoanService';
import StepperNavigation from '../../components/loan/StepperNavigation';
import LoanSummaryCard from '../../components/loan/LoanSummaryCard';
import UploadDocumentCard from '../../components/loan/UploadDocumentCard';
import LoanEstimateCard from '../../components/loan/LoanEstimateCard';
import ValidationMessage from '../../components/loan/ValidationMessage';
import SuccessScreen from '../../components/loan/SuccessScreen';
import StatusTracker from '../../components/loan/StatusTracker';

const ApplyLoan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [referenceNo, setReferenceNo] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [creditConsentAccepted, setCreditConsentAccepted] = useState(false);
  const [creditConsentError, setCreditConsentError] = useState(false);
  const [eligibilitySettings, setEligibilitySettings] = useState(null);

  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const res = await BorrowerLoanService.getEligibilitySettings();
        if (res.success) {
          setEligibilitySettings(res.data);
        }
      } catch (error) {
        console.error('Error fetching eligibility:', error);
      }
    };
    fetchEligibility();
  }, []);

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm({
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      emailAddress: '',
      idNumber: '',
      dateOfBirth: '',
      residentialAddress: '',
      employmentStatus: 'Employed',
      employerName: '',
      monthlyIncome: '',
      workAddress: '',
      employmentDuration: '',
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      branchCode: '',
      requestedLoanAmount: location.state?.amount || '',
      requestedDuration: location.state?.duration || '',
      confirmationAccepted: false
    }
  });

  const watchAmount = watch('requestedLoanAmount');
  const watchDuration = watch('requestedDuration');

  const fetchEstimate = async (amount, duration) => {
    if (!amount || !duration) return;
    try {
      const res = await BorrowerLoanService.getLoanEstimate(amount, duration);
      if (res?.success) {
        setEstimate(res.data);
      }
    } catch (error) {
      console.error('Error fetching estimate:', error);
    }
  };

  useEffect(() => {
    if (watchAmount && watchDuration) {
      const timer = setTimeout(() => fetchEstimate(watchAmount, watchDuration), 500);
      return () => clearTimeout(timer);
    }
  }, [watchAmount, watchDuration]);

  const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Employment', icon: Briefcase },
    { id: 3, title: 'Banking', icon: Landmark },
    { id: 4, title: 'Documents', icon: FileText },
    { id: 5, title: 'Review', icon: ShieldCheck },
  ];

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(['fullName', 'phoneNumber', 'emailAddress', 'idNumber', 'dateOfBirth', 'residentialAddress']);
      if (isValid) setCurrentStep(2);
    } else if (currentStep === 2) {
      isValid = await trigger(['employmentStatus', 'employerName', 'monthlyIncome', 'workAddress', 'employmentDuration']);
      if (isValid) setCurrentStep(3);
    } else if (currentStep === 3) {
      isValid = await trigger(['bankName', 'accountHolderName', 'accountNumber', 'branchCode', 'requestedLoanAmount', 'requestedDuration']);
      if (isValid) setCurrentStep(4);
    } else if (currentStep === 4) {
      if (uploadedDocs.length < 1) {
        toast.error('Please upload at least one document');
        return;
      }
      setCurrentStep(5);
    }
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleDocUpload = (docInfo) => {
    setUploadedDocs(prev => {
      const filtered = prev.filter(d => d.type !== docInfo.type);
      return [...filtered, docInfo];
    });
  };

  const handleDocRemove = (docType) => {
    setUploadedDocs(prev => prev.filter(d => d.type !== docType));
  };

  const REQUIRED_DOC_TYPES = ['ID Document', 'Payslip', 'Bank Statement', 'Proof Of Address'];

  const getAuditStatus = () => {
    const allDocs = REQUIRED_DOC_TYPES.every(t => uploadedDocs.find(d => d.type === t));
    if (!allDocs) return { label: 'Missing Required Documents', color: 'red' };
    if (!creditConsentAccepted) return { label: 'Credit Consent Missing', color: 'amber' };
    return { label: 'Ready For Review Stage', color: 'emerald' };
  };

  const onFinalSubmit = async (data) => {
    // Step 1: Validate all required documents
    const missingDocs = REQUIRED_DOC_TYPES.filter(t => !uploadedDocs.find(d => d.type === t));
    if (missingDocs.length > 0) {
      toast.error(`Please upload: ${missingDocs.join(', ')}`);
      return;
    }

    // Step 2: Validate credit consent
    if (!creditConsentAccepted) {
      setCreditConsentError(true);
      toast.error('Please accept the credit check consent to proceed');
      return;
    }

    // Step 3: Validate confirmation (existing)
    if (!data.confirmationAccepted) {
      toast.error('Please confirm that the information is correct');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        personal: {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          emailAddress: data.emailAddress,
          idNumber: data.idNumber,
          dateOfBirth: data.dateOfBirth,
          residentialAddress: data.residentialAddress
        },
        employment: {
          employmentStatus: data.employmentStatus,
          employerName: data.employerName,
          monthlyIncome: data.monthlyIncome,
          workAddress: data.workAddress,
          employmentDuration: data.employmentDuration
        },
        banking: {
          bankName: data.bankName,
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumber,
          branchCode: data.branchCode,
          requestedLoanAmount: data.requestedLoanAmount,
          requestedDuration: data.requestedDuration
        },
        documents: uploadedDocs,
        confirmationAccepted: true,
        creditConsentAccepted: true,
        creditConsentAcceptedAt: new Date().toISOString()
      };

      const res = await BorrowerLoanService.submitFullApplication(payload);
      setReferenceNo(res.data.application.applicationId);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return <SuccessScreen referenceNo={referenceNo} navigate={navigate} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Apply Loan</h1>
          <p className="text-slate-500 font-medium mt-1">Submit your loan request, upload documents, and track approval status.</p>
        </div>
        <button 
          type="button"
          onClick={() => setIsEligibilityModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-primary shadow-sm hover:shadow-md transition-all"
        >
          <Info size={16} /> Loan Eligibility Info
        </button>
      </header>

      <StatusTracker status="Draft" />

      <StepperNavigation steps={steps} currentStep={currentStep} />

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
         <form onSubmit={handleSubmit(onFinalSubmit)}>
            <div className="p-10">
               <AnimatePresence mode="wait">
                  <motion.div
                     key={currentStep}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.3 }}
                  >
                     {currentStep === 1 && (
                        <div className="space-y-8">
                           <div>
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Personal Information</h2>
                              <p className="text-sm font-medium text-slate-500 mt-1">Provide your basic contact and identity details.</p>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                 <Input label="Full Name" placeholder="Enter your full name" icon={User} {...register('fullName', { required: 'Full Name is required' })} />
                                 <ValidationMessage message={errors.fullName?.message} />
                              </div>
                              <div>
                                 <Input label="ID Number" placeholder="ID / Passport Number" icon={FileText} {...register('idNumber', { required: 'ID Number is required' })} />
                                 <ValidationMessage message={errors.idNumber?.message} />
                              </div>
                              <div>
                                 <Input label="Email Address" type="email" placeholder="john@example.com" icon={Mail} {...register('emailAddress', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} />
                                 <ValidationMessage message={errors.emailAddress?.message} />
                              </div>
                              <div>
                                 <Input label="Phone Number" placeholder="e.g. 0821234567" icon={Phone} {...register('phoneNumber', { required: 'Phone number is required', pattern: { value: /^0\d{9}$/, message: 'Enter a valid SA phone number (e.g. 0821234567)' } })} />
                                 <ValidationMessage message={errors.phoneNumber?.message} />
                              </div>
                              <div>
                                 <Input label="Date of Birth" type="date" icon={Calendar} {...register('dateOfBirth', { required: 'DOB is required' })} />
                                 <ValidationMessage message={errors.dateOfBirth?.message} />
                              </div>
                              <div className="md:col-span-2">
                                 <Input label="Residential Address" isTextArea placeholder="Enter your full home address..." icon={MapPin} {...register('residentialAddress', { required: 'Address is required' })} />
                                 <ValidationMessage message={errors.residentialAddress?.message} />
                              </div>
                           </div>
                        </div>
                     )}

                     {currentStep === 2 && (
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
                                 <select {...register('employmentStatus', { required: true })} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner">
                                    <option value="Employed">Employed</option>
                                    <option value="Self-Employed">Self-Employed</option>
                                    <option value="Business Owner">Business Owner</option>
                                 </select>
                              </div>
                              <div>
                                 <Input label="Employer Name" placeholder="Company name" icon={Building2} {...register('employerName', { required: watch('employmentStatus') === 'Employed' })} />
                                 <ValidationMessage message={errors.employerName?.message} />
                              </div>
                              <div>
                                 <Input label="Monthly Income (R)" type="number" placeholder="Gross monthly salary" icon={Wallet} {...register('monthlyIncome', { required: 'Income is required' })} />
                                 <ValidationMessage message={errors.monthlyIncome?.message} />
                              </div>
                              <div>
                                 <Input label="Employment Duration" placeholder="e.g. 3 Years" icon={Clock} {...register('employmentDuration', { required: 'Duration is required' })} />
                                 <ValidationMessage message={errors.employmentDuration?.message} />
                              </div>
                              <div className="md:col-span-2">
                                 <Input label="Work Address" isTextArea placeholder="Enter company address..." icon={MapPin} {...register('workAddress', { required: 'Work address is required' })} />
                                 <ValidationMessage message={errors.workAddress?.message} />
                              </div>
                           </div>
                        </div>
                     )}

                     {currentStep === 3 && (
                        <div className="space-y-10">
                           <div className="space-y-8">
                              <div>
                                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Banking Information</h2>
                                 <p className="text-sm font-medium text-slate-500 mt-1">Where should we disburse your loan funds?</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                    <Input label="Bank Name" placeholder="e.g. Global Bank" icon={Landmark} {...register('bankName', { required: 'Bank name is required' })} />
                                    <ValidationMessage message={errors.bankName?.message} />
                                 </div>
                                 <div>
                                    <Input label="Account Holder" placeholder="Name as per bank" icon={User} {...register('accountHolderName', { required: 'Account holder is required' })} />
                                    <ValidationMessage message={errors.accountHolderName?.message} />
                                 </div>
                                 <div>
                                    <Input label="Account Number" placeholder="10-digit account no." icon={FileText} {...register('accountNumber', { required: 'Account number is required' })} />
                                    <ValidationMessage message={errors.accountNumber?.message} />
                                 </div>
                                 <div>
                                    <Input label="Branch Code" placeholder="6-digit code" icon={MapPin} {...register('branchCode', { required: 'Branch code is required' })} />
                                    <ValidationMessage message={errors.branchCode?.message} />
                                 </div>
                                 <div>
                                    <Input label="Loan Amount (R)" type="number" icon={Wallet} {...register('requestedLoanAmount', { required: 'Amount is required' })} />
                                    <ValidationMessage message={errors.requestedLoanAmount?.message} />
                                 </div>
                                 <div>
                                    <Input label="Loan Duration (Months)" type="number" icon={Clock} {...register('requestedDuration', { required: 'Duration is required' })} />
                                    <ValidationMessage message={errors.requestedDuration?.message} />
                                 </div>
                              </div>
                           </div>

                           {estimate && (
                              <LoanEstimateCard 
                                amount={estimate.requestedAmount}
                                processingFee={estimate.processingFee}
                                interestRate={estimate.interestRate}
                                monthlyEMI={estimate.estimatedMonthlyEMI}
                                totalRepayment={estimate.totalRepayment}
                              />
                           )}
                        </div>
                     )}

                     {currentStep === 4 && (
                        <div className="space-y-8">
                           <div>
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Document Upload</h2>
                              <p className="text-sm font-medium text-slate-500 mt-1">Please provide the following supporting documents (PDF, JPG, PNG).</p>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <UploadDocumentCard 
                                label="Identity Document" 
                                desc="Clear scan of RSA ID / Passport" 
                                type="ID Document"
                                onUploadSuccess={handleDocUpload}
                                existingFile={uploadedDocs.find(d => d.type === 'ID Document')?.fileName}
                              />
                              <UploadDocumentCard 
                                label="Latest Payslip" 
                                desc="Proof of monthly income" 
                                type="Payslip"
                                onUploadSuccess={handleDocUpload}
                                existingFile={uploadedDocs.find(d => d.type === 'Payslip')?.fileName}
                              />
                              <UploadDocumentCard 
                                label="3-Month Bank Statement" 
                                desc="Banking history proof" 
                                type="Bank Statement"
                                onUploadSuccess={handleDocUpload}
                                existingFile={uploadedDocs.find(d => d.type === 'Bank Statement')?.fileName}
                              />
                              <UploadDocumentCard 
                                label="Proof of Address" 
                                desc="Utility bill or lease agreement" 
                                type="Proof Of Address"
                                onUploadSuccess={handleDocUpload}
                                existingFile={uploadedDocs.find(d => d.type === 'Proof Of Address')?.fileName}
                              />
                           </div>
                           {uploadedDocs.length > 0 && (
                              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                 <CheckCircle2 size={16} className="text-emerald-500" />
                                 <span className="text-xs font-bold text-emerald-700">{uploadedDocs.length} documents uploaded successfully.</span>
                              </div>
                           )}
                        </div>
                     )}

                     {currentStep === 5 && (
                        <div className="space-y-10">
                           {/* ── Header ── */}
                           <div>
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Review &amp; Documents</h2>
                              <p className="text-sm font-medium text-slate-500 mt-1">Confirm your information, review uploaded documents, and complete compliance checks before submitting.</p>
                           </div>

                           {/* ── Application Summary ── */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <LoanSummaryCard title="Personal" data={[
                                 { label: 'Name', value: watch('fullName') },
                                 { label: 'ID', value: watch('idNumber') },
                                 { label: 'Phone', value: watch('phoneNumber') },
                                 { label: 'Email', value: watch('emailAddress') }
                              ]} />
                              <LoanSummaryCard title="Employment" data={[
                                 { label: 'Status', value: watch('employmentStatus') },
                                 { label: 'Employer', value: watch('employerName') },
                                 { label: 'Income', value: `R${watch('monthlyIncome')}` }
                              ]} />
                              <LoanSummaryCard title="Banking" data={[
                                 { label: 'Bank', value: watch('bankName') },
                                 { label: 'Account', value: watch('accountNumber') },
                                 { label: 'Amount', value: `R${watch('requestedLoanAmount')}` }
                              ]} />
                              <div className="bg-primary p-8 rounded-[2rem] text-white space-y-4 shadow-lg shadow-primary/20 flex flex-col justify-center">
                                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Final Loan Summary</p>
                                 <div className="flex justify-between items-end">
                                    <div>
                                       <p className="text-3xl font-black">R{Number(watch('requestedLoanAmount')).toLocaleString()}</p>
                                       <p className="text-[10px] font-bold mt-1">Requested Principal</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-xl font-black opacity-90">R{Math.round(estimate?.estimatedMonthlyEMI || 0).toLocaleString()}</p>
                                       <p className="text-[10px] font-bold mt-1 opacity-60 text-white">Est. Monthly EMI</p>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* ── Divider ── */}
                           <div className="border-t border-slate-100" />

                           {/* ── Documents Review Section ── */}
                           <div className="space-y-6">
                              <div>
                                 <h3 className="text-base font-black text-slate-900 tracking-tight">Uploaded Documents</h3>
                                 <p className="text-xs font-medium text-slate-500 mt-0.5">Review your documents below. You may replace or remove any file before submitting.</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <UploadDocumentCard
                                    label="South African ID"
                                    desc="Clear scan of RSA ID / Passport"
                                    type="ID Document"
                                    onUploadSuccess={handleDocUpload}
                                    onRemove={handleDocRemove}
                                    existingFile={uploadedDocs.find(d => d.type === 'ID Document')?.fileName}
                                    existingFileData={uploadedDocs.find(d => d.type === 'ID Document')}
                                 />
                                 <UploadDocumentCard
                                    label="Last 3 Months Payslips"
                                    desc="Proof of monthly income"
                                    type="Payslip"
                                    onUploadSuccess={handleDocUpload}
                                    onRemove={handleDocRemove}
                                    existingFile={uploadedDocs.find(d => d.type === 'Payslip')?.fileName}
                                    existingFileData={uploadedDocs.find(d => d.type === 'Payslip')}
                                 />
                                 <UploadDocumentCard
                                    label="Bank Statement"
                                    desc="3-month banking history"
                                    type="Bank Statement"
                                    onUploadSuccess={handleDocUpload}
                                    onRemove={handleDocRemove}
                                    existingFile={uploadedDocs.find(d => d.type === 'Bank Statement')?.fileName}
                                    existingFileData={uploadedDocs.find(d => d.type === 'Bank Statement')}
                                 />
                                 <UploadDocumentCard
                                    label="Proof of Residence"
                                    desc="Utility bill or lease agreement"
                                    type="Proof Of Address"
                                    onUploadSuccess={handleDocUpload}
                                    onRemove={handleDocRemove}
                                    existingFile={uploadedDocs.find(d => d.type === 'Proof Of Address')?.fileName}
                                    existingFileData={uploadedDocs.find(d => d.type === 'Proof Of Address')}
                                 />
                              </div>
                           </div>

                           {/* ── Divider ── */}
                           <div className="border-t border-slate-100" />

                           {/* ── Credit Check Consent ── */}
                           <div className="space-y-5">
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                                    <Shield size={18} />
                                 </div>
                                 <div>
                                    <h3 className="text-base font-black text-slate-900">Credit Check Consent</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">NCA Compliance Required</p>
                                 </div>
                              </div>

                              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                    I consent to the Credit Provider accessing my credit information from registered Credit Bureaus for assessment and verification in line with the National Credit Act (NCA). I confirm that my information is accurate and authorise lawful sharing of my payment behaviour.
                                 </p>
                              </div>

                              <label
                                 onClick={() => { setCreditConsentAccepted(v => !v); setCreditConsentError(false); }}
                                 className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer group transition-all ${
                                    creditConsentAccepted
                                       ? 'bg-primary/5 border-primary/20'
                                       : creditConsentError
                                          ? 'bg-red-50 border-red-200'
                                          : 'bg-slate-50 border-slate-100 hover:border-primary/20'
                                 }`}
                              >
                                 <div className="relative shrink-0">
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                       creditConsentAccepted
                                          ? 'bg-primary border-primary'
                                          : creditConsentError
                                             ? 'bg-white border-red-400'
                                             : 'bg-white border-slate-200'
                                    }`}>
                                       {creditConsentAccepted && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                 </div>
                                 <span className={`text-sm font-bold transition-colors ${
                                    creditConsentAccepted ? 'text-primary' : creditConsentError ? 'text-red-600' : 'text-slate-600 group-hover:text-slate-900'
                                 }`}>
                                    I agree to the credit check
                                 </span>
                              </label>

                              {creditConsentError && (
                                 <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-2xl">
                                    <AlertTriangle size={13} className="text-red-400 shrink-0" />
                                    <p className="text-[10px] font-bold text-red-600">Credit check consent is required before submitting your application.</p>
                                 </div>
                              )}
                           </div>

                           {/* ── Divider ── */}
                           <div className="border-t border-slate-100" />

                           {/* ── Final Application Audit ── */}
                           {(() => {
                              const audit = getAuditStatus();
                              const auditStyles = {
                                 emerald: { bg: 'bg-primary', text: 'text-white', badge: 'bg-white/20 text-white', icon: 'text-white' },
                                 amber:   { bg: 'bg-amber-500', text: 'text-white', badge: 'bg-white/20 text-white', icon: 'text-white' },
                                 red:     { bg: 'bg-red-500', text: 'text-white', badge: 'bg-white/20 text-white', icon: 'text-white' },
                              };
                              const s = auditStyles[audit.color];
                              return (
                                 <div className={`${s.bg} p-6 rounded-[2rem] flex items-center justify-between shadow-lg`}>
                                    <div className="space-y-1">
                                       <p className={`text-[10px] font-black uppercase tracking-widest ${s.text} opacity-70`}>Final Application Audit</p>
                                       <p className={`text-base font-black ${s.text}`}>{audit.label}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl ${s.badge} flex items-center justify-center shrink-0`}>
                                       {audit.color === 'emerald'
                                          ? <CheckCircle2 size={24} className={s.icon} />
                                          : audit.color === 'amber'
                                             ? <ClipboardList size={24} className={s.icon} />
                                             : <AlertTriangle size={24} className={s.icon} />
                                       }
                                    </div>
                                 </div>
                              );
                           })()}

                           {/* ── Existing Confirmation Checkbox ── */}
                           <label className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group">
                              <div className="relative">
                                 <input type="checkbox" {...register('confirmationAccepted')} className="sr-only peer" />
                                 <div className="w-6 h-6 bg-white border-2 border-slate-200 rounded-lg peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                    <CheckCircle2 size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                                 </div>
                              </div>
                              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">I confirm all the information provided is correct and true.</span>
                           </label>
                        </div>
                     )}
                  </motion.div>
               </AnimatePresence>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <Button 
                  type="button"
                  variant="secondary" 
                  disabled={currentStep === 1 || isLoading} 
                  onClick={handleBack}
                  className="font-black text-[10px] uppercase tracking-widest bg-white border-slate-200"
               >
                  <ArrowLeft size={16} className="mr-2" /> Previous Step
               </Button>
               
               <div className="flex items-center gap-3">
                  {currentStep < 5 ? (
                     <Button type="button" onClick={handleNext} isLoading={isLoading} className="font-black text-[10px] uppercase tracking-widest px-8">
                        {isLoading ? 'Processing...' : 'Next Step'} <ArrowRight size={16} className="ml-2" />
                     </Button>
                  ) : (
                     <Button type="submit" isLoading={isLoading} className="font-black text-[10px] uppercase tracking-widest px-10 shadow-lg shadow-primary/20">
                        {isLoading ? 'Submitting...' : 'Submit Application'} <CheckCircle2 size={16} className="ml-2" />
                     </Button>
                  )}
               </div>
            </div>
         </form>
      </div>

      {/* 📊 ELIGIBILITY SUMMARY */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <EligibilityCard 
            icon={Wallet} 
            label="Min Amount" 
            value={eligibilitySettings ? `R${eligibilitySettings.eligibleMinimumPrincipal?.toLocaleString()}` : "R1,000"} 
            color="blue" 
         />
         <EligibilityCard 
            icon={TrendingUp} 
            label="Max Amount" 
            value={eligibilitySettings ? `R${eligibilitySettings.eligibleMaximumPrincipal?.toLocaleString()}` : "R100,000"} 
            color="emerald" 
         />
         <EligibilityCard 
            icon={Clock} 
            label="Duration" 
            value={eligibilitySettings ? `${eligibilitySettings.allowedRepaymentDurations} Months` : "3 - 24 Months"} 
            color="amber" 
         />
         <EligibilityCard 
            icon={Activity} 
            label="Est. Interest" 
            value={eligibilitySettings ? `${eligibilitySettings.defaultInterestRate}% p.a.` : "12.5% p.a."} 
            color="primary" 
         />
      </section>

      <EligibilityModal 
        isOpen={isEligibilityModalOpen} 
        onClose={() => setIsEligibilityModalOpen(false)} 
        settings={eligibilitySettings}
      />
    </div>
  );
};

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

const EligibilityModal = ({ isOpen, onClose, settings }) => (
   <Modal isOpen={isOpen} onClose={onClose} title="Loan Eligibility Information" maxWidth="max-w-4xl">
      <div className="space-y-10 custom-scrollbar max-h-[70vh] overflow-y-auto pr-2 pb-6">
         <div className="space-y-4">
            <p className="text-sm font-medium text-slate-500 leading-relaxed">Check the minimum requirements before submitting your loan application to ensure a smooth approval process.</p>
         </div>
         <section className="space-y-6">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
               <ShieldCheck size={14} /> Basic Requirements
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               <ReqItem icon={User} label="Minimum Age" value={settings ? `${settings.minimumAge} Years+` : "18 Years+"} />
               <ReqItem icon={Briefcase} label="Employment" value={settings ? settings.employmentType : "Employed / Self"} />
               <ReqItem icon={Wallet} label="Min Income" value={settings ? `R${settings.minimumMonthlyIncome?.toLocaleString()} Monthly` : "R5,000 Monthly"} />
               <ReqItem icon={FileText} label="Valid ID" value={settings?.idVerificationRequired ? "Government ID Required" : "ID Document"} />
               <ReqItem icon={Landmark} label="Bank Account" value="Active Account Required" />
            </div>
         </section>
      </div>
      <div className="flex gap-4 pt-6 mt-4 border-t border-slate-50">
         <Button variant="secondary" className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 bg-white border-slate-200" onClick={onClose}>
            Close
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

export default ApplyLoan;
