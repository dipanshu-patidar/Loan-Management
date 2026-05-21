import React, { useState, useEffect, useRef } from 'react';
import {
  User, Briefcase, Landmark, FileText,
  CheckCircle2, ArrowRight, ArrowLeft,
  Info, ShieldCheck, Calculator, Clock,
  Mail, Phone, Calendar, Building2, MapPin, Wallet,
  TrendingUp, Activity, Shield, ClipboardList, AlertTriangle, Sparkles,
  ScanFace, Upload, XCircle, Loader2, BadgeCheck, TriangleAlert,
  Building2 as OfficeBuildingIcon, ChevronDown, ChevronUp,
  CreditCard, Users, Hash
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
import kycVerificationService from '../../services/kycVerificationService';
import addressProfileVerificationService from '../../services/addressProfileVerificationService';
import creditReportSearchService from '../../services/creditReportSearchService';
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
  const [validationRules, setValidationRules] = useState(null);

  // ── KYC state ──────────────────────────────────────────────────────────────
  const [kycVerified, setKycVerified]     = useState(false);
  const [kycLoading, setKycLoading]       = useState(false);
  const [kycResult, setKycResult]         = useState(null);
  const [kycIdFront, setKycIdFront]       = useState(null);  // File
  const [kycIdBack, setKycIdBack]         = useState(null);  // File
  const [kycSelfie, setKycSelfie]         = useState(null);  // File
  const kycIdFrontRef                     = useRef(null);
  const kycIdBackRef                      = useRef(null);
  const kycSelfieRef                      = useRef(null);

  // ── Bureau / Address IDV state (Step 1.5) ─────────────────────────────────
  const [bureauVerified, setBureauVerified]     = useState(false);
  const [bureauLoading, setBureauLoading]       = useState(false);
  const [bureauResult, setBureauResult]         = useState(null);
  const [bureauBlocked, setBureauBlocked]       = useState(false);
  const [showAddressHistory, setShowAddressHistory] = useState(false);

  // ── Consumer Credit Search state (Step 2) ─────────────────────────────────
  const [creditSearchDone, setCreditSearchDone]     = useState(false);
  const [creditSearchLoading, setCreditSearchLoading] = useState(false);
  const [creditSearchResult, setCreditSearchResult]   = useState(null);
  const [selectedConsumer, setSelectedConsumer]       = useState(null);

  useEffect(() => {
    const fetchEligibilityAndRules = async () => {
      try {
        const [eligRes, rulesRes] = await Promise.allSettled([
          BorrowerLoanService.getEligibilitySettings(),
          BorrowerLoanService.getValidationRules()
        ]);
        
        if (eligRes.status === 'fulfilled' && eligRes.value.success) {
          setEligibilitySettings(eligRes.value.data);
        }
        if (rulesRes.status === 'fulfilled' && rulesRes.value.success) {
          setValidationRules(rulesRes.value.data);
        }
      } catch (error) {
        console.error('Error fetching eligibility/rules:', error);
      }
    };
    fetchEligibilityAndRules();
  }, []);

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger, setError } = useForm({
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

  const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Employment', icon: Briefcase },
    { id: 3, title: 'Banking', icon: Landmark },
    { id: 4, title: 'Documents', icon: FileText },
    { id: 5, title: 'Review', icon: ShieldCheck },
  ];

  // ── KYC: handle file picks ─────────────────────────────────────────────────
  const handleKycFilePick = (setter, inputRef) => {
    inputRef.current?.click();
    inputRef.current.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) setter(file);
    };
  };

  // ── KYC: verify identity ───────────────────────────────────────────────────
  const handleVerifyIdentity = async () => {
    const idNumber = watch('idNumber');
    if (!idNumber) { toast.error('Enter your ID Number first'); return; }
    if (!kycIdFront) { toast.error('Upload your ID Document Front to verify'); return; }

    setKycLoading(true);
    try {
      const formData = new FormData();
      formData.append('idNumber', idNumber);
      formData.append('idFrontImage', kycIdFront);
      if (kycSelfie) formData.append('selfieImage', kycSelfie);
      if (kycIdBack) formData.append('idBackImage', kycIdBack);

      const res = await kycVerificationService.verifyProfileIdPhoto(formData);
      setKycResult(res.data);

      if (res.success && res.data?.responseStatusCode === 1) {
        setKycVerified(true);
        toast.success('Identity verified successfully!');
      } else {
        setKycVerified(false);
        toast.error(res.data?.responseMessage || res.message || 'Verification failed');
      }
    } catch (error) {
      setKycVerified(false);
      const msg = error.response?.data?.message || 'Verification service unavailable. Please try again.';
      setKycResult({ verificationStatus: 'Failed', responseMessage: msg });
      toast.error(msg);
    } finally {
      setKycLoading(false);
    }
  };

  // ── Bureau: verify address + profile ──────────────────────────────────────
  const handleVerifyBureau = async () => {
    const idNumber   = watch('idNumber');
    const fullName   = watch('fullName');
    const phone      = watch('phoneNumber');
    const email      = watch('emailAddress');
    const address    = watch('residentialAddress');
    const employer   = watch('employerName');

    if (!idNumber || !fullName) {
      toast.error('ID Number and Full Name are required for bureau verification');
      return;
    }

    // Extract surname — use last word of full name as surname approximation
    const nameParts = fullName.trim().split(/\s+/);
    const surname   = nameParts[nameParts.length - 1];

    setBureauLoading(true);
    try {
      const res = await addressProfileVerificationService.verifyAddressProfile({
        idNumber,
        surname,
        phoneNumber:         phone,
        emailAddress:        email,
        residentialAddress:  address,
        employerName:        employer,
      });

      setBureauResult(res.data);

      const fatal = res.data?.isFatal;
      setBureauBlocked(!!fatal);
      setBureauVerified(!fatal);

      if (fatal) {
        toast.error(
          res.data?.deceasedStatus
            ? 'Verification blocked: Deceased flag on record.'
            : 'Verification blocked: SAFPS fraud listing detected.'
        );
      } else if (res.data?.hasWarnings) {
        toast('Bureau verification complete — some data mismatches detected.', { icon: '⚠️' });
      } else {
        toast.success('Bureau profile verified successfully!');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Bureau verification service unavailable.';
      setBureauResult({ verificationStatus: 'Failed', responseMessage: msg });
      setBureauBlocked(false);
      setBureauVerified(false);
      toast.error(msg);
    } finally {
      setBureauLoading(false);
    }
  };

  // ── Credit: run consumer credit search ────────────────────────────────────
  const handleRunCreditSearch = async () => {
    const idNumber = watch('idNumber');
    if (!idNumber) { toast.error('Enter your ID Number first'); return; }

    setCreditSearchLoading(true);
    try {
      const res = await creditReportSearchService.runConsumerCreditSearch({ idNumber });
      setCreditSearchResult(res.data);

      if (res.data?.matchedConsumers?.length === 1) {
        setSelectedConsumer(res.data.matchedConsumers[0]);
      }

      setCreditSearchDone(true);

      if (res.data?.verificationStatus === 'Warning') {
        toast('Credit search complete — no matching consumer profile found.', { icon: 'ℹ️' });
      } else if (res.data?.matchedConsumers?.length > 1) {
        toast('Multiple profiles found — please select the correct one.', { icon: '⚠️' });
      } else {
        toast.success('Consumer credit profile found successfully!');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Credit search service unavailable.';
      setCreditSearchResult({ verificationStatus: 'Failed', responseMessage: msg });
      setCreditSearchDone(false);
      toast.error(msg);
    } finally {
      setCreditSearchLoading(false);
    }
  };

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(['fullName', 'phoneNumber', 'emailAddress', 'idNumber', 'dateOfBirth', 'residentialAddress']);
      if (isValid && !kycVerified) {
        toast.error('Complete identity verification before proceeding');
        return;
      }
      if (isValid && bureauBlocked) {
        toast.error('Bureau verification has blocked progression due to a fatal fraud indicator.');
        return;
      }
      if (isValid && !bureauVerified) {
        toast.error('Complete bureau & address verification before proceeding');
        return;
      }
      if (isValid && !creditSearchDone) {
        toast.error('Complete the consumer credit assessment before proceeding');
        return;
      }
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
          requestedDuration: data.requestedDuration,
          loanType: 'Personal Loan'
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
      if (error.response?.data?.validationErrors) {
        const valErrors = error.response.data.validationErrors;
        Object.keys(valErrors).forEach(key => {
          let formKey = key;
          if (key === 'age') formKey = 'dateOfBirth';
          else if (key === 'monthlyIncome') formKey = 'monthlyIncome';
          else if (key === 'employmentDuration') formKey = 'employmentDuration';
          else if (key === 'loanAmount') formKey = 'requestedLoanAmount';
          else if (key === 'loanDuration') formKey = 'requestedDuration';
          else if (key === 'employmentType') formKey = 'employmentStatus';

          setError(formKey, {
            type: 'manual',
            message: valErrors[key]
          });
        });
        toast.error('Validation failed. Please review input fields.');
      } else {
        toast.error(error.response?.data?.message || 'Submission failed');
      }
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
                                 <Input 
                                   label="Date of Birth" 
                                   type="date" 
                                   icon={Calendar} 
                                   {...register('dateOfBirth', { 
                                     required: 'DOB is required',
                                     validate: (val) => {
                                       const age = calculateAge(val);
                                       const minAge = validationRules?.minAge || eligibilitySettings?.minimumAge || 18;
                                       const maxAge = validationRules?.maxAge || eligibilitySettings?.maximumAge || 65;
                                       if (age < minAge) return `Minimum age requirement is ${minAge} years.`;
                                       if (age > maxAge) return `Maximum eligible age is ${maxAge} years.`;
                                       return true;
                                     }
                                   })} 
                                 />
                                 <ValidationMessage message={errors.dateOfBirth?.message} />
                              </div>
                              <div className="md:col-span-2">
                                 <Input label="Residential Address" isTextArea placeholder="Enter your full home address..." icon={MapPin} {...register('residentialAddress', { required: 'Address is required' })} />
                                 <ValidationMessage message={errors.residentialAddress?.message} />
                              </div>
                           </div>

                           {/* ── KYC Identity & Biometric Verification Card ── */}
                           <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
                             <div className="flex items-center gap-3 px-8 py-5 bg-slate-50 border-b border-slate-100">
                               <ScanFace size={16} className="text-primary" />
                               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Identity &amp; Biometric Verification</h3>
                               {kycVerified && (
                                 <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                                   <BadgeCheck size={11} /> Verified
                                 </span>
                               )}
                             </div>
                             <div className="p-8 space-y-6">
                               <p className="text-xs font-medium text-slate-500">Upload your ID document and selfie to complete biometric verification. This is required to proceed with your application.</p>

                               {/* File upload row */}
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 {/* ID Front */}
                                 <KycFilePickerCard
                                   label="ID Document Front"
                                   required
                                   file={kycIdFront}
                                   onPick={() => handleKycFilePick(setKycIdFront, kycIdFrontRef)}
                                   onClear={() => { setKycIdFront(null); setKycVerified(false); setKycResult(null); }}
                                   inputRef={kycIdFrontRef}
                                 />
                                 {/* ID Back */}
                                 <KycFilePickerCard
                                   label="ID Document Back"
                                   file={kycIdBack}
                                   onPick={() => handleKycFilePick(setKycIdBack, kycIdBackRef)}
                                   onClear={() => setKycIdBack(null)}
                                   inputRef={kycIdBackRef}
                                 />
                                 {/* Selfie */}
                                 <KycFilePickerCard
                                   label="Selfie / Portrait"
                                   file={kycSelfie}
                                   onPick={() => handleKycFilePick(setKycSelfie, kycSelfieRef)}
                                   onClear={() => setKycSelfie(null)}
                                   inputRef={kycSelfieRef}
                                 />
                               </div>

                               {/* Verify button */}
                               {!kycVerified && (
                                 <button
                                   type="button"
                                   onClick={handleVerifyIdentity}
                                   disabled={kycLoading || !kycIdFront}
                                   className={cn(
                                     'w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
                                     kycIdFront && !kycLoading
                                       ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30'
                                       : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                   )}
                                 >
                                   {kycLoading
                                     ? <><Loader2 size={14} className="animate-spin" /> Verifying Identity...</>
                                     : <><ScanFace size={14} /> Verify Identity</>
                                   }
                                 </button>
                               )}

                               {/* Result banner */}
                               {kycResult && (
                                 <KycResultBanner result={kycResult} />
                               )}
                             </div>
                           </div>

                           {/* ── Step 1.5 — Address & Bureau Verification Card ── */}
                           <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
                             <div className="flex items-center gap-3 px-8 py-5 bg-slate-50 border-b border-slate-100">
                               <MapPin size={16} className="text-primary" />
                               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Address &amp; Bureau Verification</h3>
                               {bureauVerified && !bureauBlocked && (
                                 <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                                   <BadgeCheck size={11} /> Verified
                                 </span>
                               )}
                               {bureauBlocked && (
                                 <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-xl text-[9px] font-black text-rose-700 uppercase tracking-widest">
                                   <TriangleAlert size={11} /> Blocked
                                 </span>
                               )}
                             </div>
                             <div className="p-8 space-y-6">
                               <p className="text-xs font-medium text-slate-500">
                                 Bureau verification checks your address, contact details, and fraud indicators against national databases.
                                 {!kycVerified && <span className="ml-1 font-bold text-amber-600">Complete biometric verification first.</span>}
                               </p>

                               {/* Fatal blocked banner */}
                               {bureauBlocked && (
                                 <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                                   <TriangleAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                                   <div>
                                     <p className="text-xs font-black text-rose-800 uppercase tracking-widest">
                                       Application Blocked — Fatal Fraud Indicator
                                     </p>
                                     <p className="text-[10px] font-medium text-rose-700 mt-1">
                                       {bureauResult?.deceasedStatus
                                         ? 'Deceased person detected on Home Affairs record. This application cannot proceed.'
                                         : 'SAFPS fraud listing detected. This application cannot proceed.'
                                       }
                                     </p>
                                   </div>
                                 </div>
                               )}

                               {/* Verify button */}
                               {!bureauVerified && !bureauBlocked && (
                                 <button
                                   type="button"
                                   onClick={handleVerifyBureau}
                                   disabled={bureauLoading || !kycVerified}
                                   className={cn(
                                     'w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
                                     kycVerified && !bureauLoading
                                       ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30'
                                       : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                   )}
                                 >
                                   {bureauLoading
                                     ? <><Loader2 size={14} className="animate-spin" /> Verifying Bureau Profile...</>
                                     : <><MapPin size={14} /> Verify Address &amp; Bureau</>
                                   }
                                 </button>
                               )}

                               {/* Bureau result */}
                               {bureauResult && (
                                 <BureauResultPanel
                                   result={bureauResult}
                                   showHistory={showAddressHistory}
                                   onToggleHistory={() => setShowAddressHistory(v => !v)}
                                 />
                               )}
                             </div>
                           </div>

                           {/* ── Step 2 — Consumer Credit Risk Assessment Card ── */}
                           <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
                             <div className="flex items-center gap-3 px-8 py-5 bg-slate-50 border-b border-slate-100">
                               <CreditCard size={16} className="text-primary" />
                               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Consumer Credit Risk Assessment</h3>
                               {creditSearchDone && (
                                 <span className={cn(
                                   'ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border',
                                   creditSearchResult?.verificationStatus === 'Verified'
                                     ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                     : creditSearchResult?.verificationStatus === 'Warning'
                                       ? 'bg-amber-50 border-amber-100 text-amber-700'
                                       : 'bg-rose-50 border-rose-100 text-rose-700'
                                 )}>
                                   <BadgeCheck size={11} />
                                   {creditSearchResult?.verificationStatus ?? 'Done'}
                                 </span>
                               )}
                             </div>
                             <div className="p-8 space-y-6">
                               <p className="text-xs font-medium text-slate-500">
                                 This credit assessment checks the borrower's financial and credit profile using national credit bureau data.
                                 {!bureauVerified && <span className="ml-1 font-bold text-amber-600">Complete bureau verification first.</span>}
                               </p>

                               {/* Run button */}
                               {!creditSearchDone && (
                                 <button
                                   type="button"
                                   onClick={handleRunCreditSearch}
                                   disabled={creditSearchLoading || !bureauVerified || bureauBlocked}
                                   className={cn(
                                     'w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
                                     bureauVerified && !bureauBlocked && !creditSearchLoading
                                       ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30'
                                       : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                   )}
                                 >
                                   {creditSearchLoading
                                     ? <><Loader2 size={14} className="animate-spin" /> Running Credit Assessment...</>
                                     : <><CreditCard size={14} /> Run Credit Assessment</>
                                   }
                                 </button>
                               )}

                               {/* Credit search result */}
                               {creditSearchResult && (
                                 <CreditSearchResultPanel
                                   result={creditSearchResult}
                                   selectedConsumer={selectedConsumer}
                                   onSelectConsumer={setSelectedConsumer}
                                 />
                               )}
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
                                 <select 
                                   {...register('employmentStatus', { 
                                     required: 'Employment status is required',
                                     validate: (val) => {
                                       const allowedCategories = validationRules?.employmentTypes || eligibilitySettings?.employmentCategories || [
                                         'Permanently Employed', 'Contract Worker', 'Self Employed', 'Government Employee'
                                       ];
                                       const normalizedStatus = val === 'Permanent' || val === 'Employed' ? 'Permanently Employed' 
                                         : val === 'Contract' ? 'Contract Worker'
                                         : val === 'Self-Employed' || val === 'Business Owner' ? 'Self Employed'
                                         : val;
                                         
                                       const isCategoryEligible = allowedCategories.some(cat => 
                                         cat.toLowerCase().replace(/[^a-z]/g, '') === normalizedStatus.toLowerCase().replace(/[^a-z]/g, '')
                                       );
                                       
                                       return isCategoryEligible || 'This employment category is currently not eligible.';
                                     }
                                   })} 
                                   className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
                                 >
                                    <option value="Employed">Employed</option>
                                    <option value="Self-Employed">Self-Employed</option>
                                    <option value="Business Owner">Business Owner</option>
                                 </select>
                              </div>
                              <div>
                                 <Input label="Employer Name" placeholder="Company name" icon={Building2} error={errors.employerName?.message} {...register('employerName', { required: watch('employmentStatus') === 'Employed' })} />
                                 <ValidationMessage message={errors.employerName?.message} />
                              </div>
                              <div>
                                 <Input 
                                   label="Monthly Income (R)" 
                                   type="number" 
                                   placeholder="Gross monthly salary" 
                                   icon={Wallet} 
                                   error={errors.monthlyIncome?.message}
                                   {...register('monthlyIncome', { 
                                     required: 'Income is required',
                                     validate: (val) => {
                                       const minIncome = validationRules?.minimumIncome || eligibilitySettings?.minSalaryRequirement || eligibilitySettings?.minimumMonthlyIncome || 5000;
                                       return Number(val) >= minIncome || `Minimum monthly income requirement is R${minIncome.toLocaleString()}.`;
                                     }
                                   })} 
                                 />
                                 <ValidationMessage message={errors.monthlyIncome?.message} />
                              </div>
                              <div>
                                 <Input 
                                   label="Employment Duration" 
                                   placeholder="e.g. 12 Months" 
                                   icon={Clock} 
                                   error={errors.employmentDuration?.message}
                                   {...register('employmentDuration', { 
                                     required: 'Duration is required',
                                     validate: (val) => {
                                       const minMonths = validationRules?.minimumEmploymentMonths || eligibilitySettings?.minEmploymentDuration || 6;
                                       const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                                       if (isNaN(num)) return true;
                                       let months = num;
                                       if (val.toLowerCase().includes('year') || val.toLowerCase().includes('yr')) {
                                         months = num * 12;
                                       }
                                       return months >= minMonths || `Borrower must be employed for at least ${minMonths} months.`;
                                     }
                                   })} 
                                 />
                                 <ValidationMessage message={errors.employmentDuration?.message} />
                              </div>
                              <div className="md:col-span-2">
                                 <Input label="Work Address" isTextArea placeholder="Enter company address..." icon={MapPin} error={errors.workAddress?.message} {...register('workAddress', { required: 'Work address is required' })} />
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
                                     <Input 
                                        label="Loan Amount (R)" 
                                        type="number" 
                                        icon={Wallet} 
                                        {...register('requestedLoanAmount', { 
                                           required: 'Amount is required',
                                           validate: (val) => {
                                              const min = validationRules?.minimumPrincipal || eligibilitySettings?.eligibleMinimumPrincipal || 1000;
                                              const max = validationRules?.maximumPrincipal || eligibilitySettings?.eligibleMaximumPrincipal || 50000;
                                              if (Number(val) < min) return `Minimum loan amount is R${min.toLocaleString()}.`;
                                              if (Number(val) > max) return `Maximum loan amount is R${max.toLocaleString()}.`;
                                              return true;
                                           }
                                        })} 
                                     />
                                     <ValidationMessage message={errors.requestedLoanAmount?.message} />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={12} className="text-primary" /> Loan Duration (Months)
                                     </label>
                                     <select
                                        {...register('requestedDuration', { required: 'Duration is required' })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                                     >
                                        {(validationRules?.allowedDurations ? validationRules.allowedDurations.map(String) : (eligibilitySettings?.allowedRepaymentDurations || '3, 6, 12, 18, 24').split(',').map(d => d.trim())).map(durationOption => (
                                           <option key={durationOption} value={durationOption}>{durationOption} {durationOption === '1' ? 'Month' : 'Months'}</option>
                                        ))}
                                     </select>
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
                     <Button
                        type="button"
                        onClick={handleNext}
                        isLoading={isLoading}
                        disabled={isLoading || (currentStep === 1 && (bureauBlocked || !creditSearchDone))}
                        className={cn(
                          'font-black text-[10px] uppercase tracking-widest px-8',
                          currentStep === 1 && (bureauBlocked || !creditSearchDone) && 'opacity-50 cursor-not-allowed'
                        )}
                     >
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

const EligibilityModal = ({ isOpen, onClose, settings }) => {
  const getRequirementStatus = (isRequired) => {
    return isRequired 
      ? { text: 'Mandatory', class: 'bg-rose-50 text-rose-600 border border-rose-100' }
      : { text: 'Optional', class: 'bg-slate-50 text-slate-500 border border-slate-100' };
  };

  const getComplianceStatus = (isEnabled) => {
    return isEnabled 
      ? { text: 'Enabled', class: 'bg-emerald-50 text-emerald-600 border border-emerald-100' }
      : { text: 'Disabled', class: 'bg-slate-50 text-slate-400 border border-slate-100' };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loan Eligibility Information" maxWidth="max-w-4xl">
      <div className="space-y-8 custom-scrollbar max-h-[70vh] overflow-y-auto pr-2 pb-6">
        <p className="text-xs font-semibold text-slate-500 leading-relaxed">
          Verify your eligibility against our live NCR-compliant rules system before initiating a new application.
        </p>

        {/* 1. BASIC ELIGIBILITY */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
            <User size={14} /> Basic Eligibility Criteria
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <ReqItem icon={User} label="Age Range" value={`${settings?.minimumAge || 18} - ${settings?.maximumAge || 65} Years`} />
            <ReqItem icon={Wallet} label="Min Net Income" value={`R ${(settings?.minSalaryRequirement || settings?.minimumMonthlyIncome || 5000).toLocaleString()}`} />
            <ReqItem icon={Clock} label="Min Employment" value={`${settings?.minEmploymentDuration || 6} Months`} />
            <ReqItem icon={Briefcase} label="Base Employment Type" value={settings?.employmentType || "Both Qualify"} />
            <ReqItem icon={ClipboardList} label="Qualifying Categories" value={settings?.employmentCategories?.join(', ') || 'All Sectors'} />
            <ReqItem icon={Activity} label="Salary Frequencies" value={settings?.salaryFrequencies?.join(', ') || 'Monthly, Weekly, Fortnightly'} />
          </div>
        </div>

        {/* 2. DOCUMENT REQUIREMENTS */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
            <FileText size={14} /> Mandatory Verification Documents
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <ReqItem 
              icon={Shield} 
              label="RSA Government ID" 
              value={getRequirementStatus(settings?.idDocumentRequired || settings?.idVerificationRequired).text} 
              badgeClass={getRequirementStatus(settings?.idDocumentRequired || settings?.idVerificationRequired).class}
            />
            <ReqItem 
              icon={Landmark} 
              label="Active Bank Account" 
              value="Mandatory" 
              badgeClass="bg-rose-50 text-rose-600 border border-rose-100"
            />
            <ReqItem 
              icon={Wallet} 
              label="Latest Payslip" 
              value={getRequirementStatus(settings?.payslipVerification).text} 
              badgeClass={getRequirementStatus(settings?.payslipVerification).class}
            />
            <ReqItem 
              icon={MapPin} 
              label="Proof of Address" 
              value={getRequirementStatus(settings?.proofOfAddressRequired || settings?.proofOfAddressAudit).text} 
              badgeClass={getRequirementStatus(settings?.proofOfAddressRequired || settings?.proofOfAddressAudit).class}
            />
            <ReqItem 
              icon={FileText} 
              label="Bank Statements" 
              value={getRequirementStatus(settings?.bankStatementReview).text} 
              badgeClass={getRequirementStatus(settings?.bankStatementReview).class}
            />
          </div>
        </div>

        {/* 3. COMPLIANCE GATES */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
            <ShieldCheck size={14} /> Automated Compliance Checks
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <ReqItem 
              icon={Sparkles} 
              label="Document OCR" 
              value={getComplianceStatus(settings?.ocrRequired).text} 
              badgeClass={getComplianceStatus(settings?.ocrRequired).class}
            />
            <ReqItem 
              icon={Shield} 
              label="AML screening" 
              value={getComplianceStatus(settings?.amlRequired).text} 
              badgeClass={getComplianceStatus(settings?.amlRequired).class}
            />
            <ReqItem 
              icon={User} 
              label="Facial Biometrics" 
              value={getComplianceStatus(settings?.facialMatchRequired).text} 
              badgeClass={getComplianceStatus(settings?.facialMatchRequired).class}
            />
            <ReqItem 
              icon={TrendingUp} 
              label="Credit Bureau Check" 
              value={getComplianceStatus(settings?.creditBureauIntegration).text} 
              badgeClass={getComplianceStatus(settings?.creditBureauIntegration).class}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-4 pt-6 mt-4 border-t border-slate-50">
        <Button variant="secondary" className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 bg-white border-slate-200" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

const ReqItem = ({ icon: Icon, label, value, badgeClass }) => (
   <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
      <div className="w-9 h-9 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center transition-colors group-hover:text-primary shrink-0 animate-fade-in">
         <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
         {badgeClass ? (
            <span className={cn("inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded mt-1 border", badgeClass)}>
               {value}
            </span>
         ) : (
            <p className="text-[11px] font-black text-slate-900 mt-0.5 truncate">{value}</p>
         )}
      </div>
   </div>
);

// ── Credit Search sub-components ─────────────────────────────────────────────

const CreditSearchResultPanel = ({ result, selectedConsumer, onSelectConsumer }) => {
  const isVerified = result?.verificationStatus === 'Verified';
  const isWarning  = result?.verificationStatus === 'Warning';
  const isFailed   = result?.verificationStatus === 'Failed';
  const consumers  = result?.matchedConsumers ?? [];

  return (
    <div className="space-y-4">
      {/* Status banner */}
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
          <div>
            <p className={cn('text-xs font-black',
              isVerified ? 'text-emerald-800' : isWarning ? 'text-amber-800' : 'text-rose-800'
            )}>
              {isVerified ? 'Credit Profile Found' : isWarning ? 'No Credit Profile Found' : 'Credit Search Failed'}
            </p>
            {result?.responseMessage && (
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{result.responseMessage}</p>
            )}
          </div>
        </div>
        {consumers.length > 1 && (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0">
            {consumers.length} Profiles
          </span>
        )}
      </div>

      {/* Report metadata */}
      {(result?.reportReference || result?.enquiryId) && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          {result.reportReference && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Report Reference</p>
              <p className="text-xs font-bold text-slate-800">{result.reportReference}</p>
            </div>
          )}
          {result.enquiryId && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enquiry ID</p>
              <p className="text-xs font-bold text-slate-800">{result.enquiryId}</p>
            </div>
          )}
          {result.enquiryResultId && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enquiry Result ID</p>
              <p className="text-xs font-bold text-slate-800">{result.enquiryResultId}</p>
            </div>
          )}
          {result.reportDate && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Search Date</p>
              <p className="text-xs font-bold text-slate-800">{result.reportDate}</p>
            </div>
          )}
        </div>
      )}

      {/* No profile found */}
      {isWarning && consumers.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <Info size={14} className="text-amber-600 shrink-0" />
          <p className="text-[10px] font-bold text-amber-800">
            No credit profile was found for the provided ID number. You may still proceed — this will be reviewed by staff.
          </p>
        </div>
      )}

      {/* Multiple consumers — must select one */}
      {consumers.length > 1 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={11} /> Select Your Consumer Profile
          </p>
          <div className="space-y-2">
            {consumers.map((c, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectConsumer(c)}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border-2 transition-all',
                  selectedConsumer?.enquiryId === c.enquiryId
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-100 bg-white hover:border-primary/30'
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-slate-900">{c.firstName} {c.surname}</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                      ID: {c.idNo} &bull; DOB: {c.birthDate} &bull; {c.gender === 'M' ? 'Male' : c.gender === 'F' ? 'Female' : c.gender}
                    </p>
                  </div>
                  {selectedConsumer?.enquiryId === c.enquiryId && (
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single consumer summary */}
      {consumers.length === 1 && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Matched Consumer</p>
          <p className="text-xs font-black text-slate-900">{consumers[0].firstName} {consumers[0].surname}</p>
          <p className="text-[10px] font-bold text-slate-500 mt-0.5">
            ID: {consumers[0].idNo} &bull; DOB: {consumers[0].birthDate}
          </p>
        </div>
      )}
    </div>
  );
};

// ── Bureau sub-components ─────────────────────────────────────────────────────

const BureauResultPanel = ({ result, showHistory, onToggleHistory }) => {
  const isVerified = result?.verificationStatus === 'Verified';
  const isWarning  = result?.verificationStatus === 'Warning' || result?.hasWarnings;
  const isFailed   = result?.verificationStatus === 'Failed' || result?.isFatal;

  const statusColor = isFailed ? 'rose' : isWarning ? 'amber' : 'emerald';
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   icon: 'text-amber-600'   },
    rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    icon: 'text-rose-500'    },
  };
  const c = colorMap[statusColor];

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={cn('flex items-center justify-between p-4 rounded-2xl border', c.bg, c.border)}>
        <div className="flex items-center gap-3">
          {isFailed
            ? <TriangleAlert size={18} className={c.icon} />
            : isWarning
              ? <AlertTriangle size={18} className={c.icon} />
              : <BadgeCheck size={18} className={c.icon} />
          }
          <div>
            <p className={cn('text-xs font-black', c.text)}>
              {isFailed ? 'Bureau Verification Blocked' : isWarning ? 'Bureau Verified — With Warnings' : 'Bureau Verification Successful'}
            </p>
            {result?.responseMessage && (
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{result.responseMessage}</p>
            )}
          </div>
        </div>
        {result?.bureauReference && (
          <span className="text-[9px] font-black text-slate-400 shrink-0">Ref: {result.bureauReference}</span>
        )}
      </div>

      {/* Fatal fraud indicators */}
      {(result?.deceasedStatus || result?.safpsFlag) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
          <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
            <TriangleAlert size={11} /> Fatal Fraud Indicators
          </p>
          {result.deceasedStatus && <p className="text-[10px] font-bold text-rose-600">• Deceased flag active on Home Affairs record</p>}
          {result.safpsFlag      && <p className="text-[10px] font-bold text-rose-600">• SAFPS fraud listing detected</p>}
        </div>
      )}

      {/* Verified contact details */}
      {(result?.verifiedFirstName || result?.verifiedPhone || result?.verifiedEmail || result?.verifiedEmployer) && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bureau Verified Details</p>
          {result.verifiedFirstName && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</p>
              <p className="text-xs font-bold text-slate-800">{result.verifiedFirstName} {result.verifiedSurname}</p>
            </div>
          )}
          {result.verifiedPhone && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
              <p className="text-xs font-bold text-slate-800">{result.verifiedPhone}</p>
            </div>
          )}
          {result.verifiedEmail && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
              <p className="text-xs font-bold text-slate-800 truncate">{result.verifiedEmail}</p>
            </div>
          )}
          {result.verifiedEmployer && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employer</p>
              <p className="text-xs font-bold text-slate-800">{result.verifiedEmployer}</p>
            </div>
          )}
          {result.verifiedResidentialAddress && (
            <div className="col-span-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</p>
              <p className="text-xs font-bold text-slate-800">{result.verifiedResidentialAddress}</p>
            </div>
          )}
        </div>
      )}

      {/* Comparison results */}
      {result?.comparedFields && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Comparison</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(result.comparedFields).map(([field, val]) => {
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

      {/* Address history toggle */}
      {result?.addressHistory?.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onToggleHistory}
            className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest"
          >
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Address History ({result.addressHistory.length} records)
          </button>

          {showHistory && (
            <div className="space-y-2 pl-2 border-l-2 border-slate-200">
              {result.addressHistory.map((entry, idx) => (
                <div key={idx} className="pl-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest',
                      entry.addressType === 'Residential' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'
                    )}>
                      {entry.addressType || 'Address'}
                    </span>
                    {entry.lastUpdatedDate && (
                      <span className="text-[9px] font-bold text-slate-400">{entry.lastUpdatedDate}</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800">{entry.address}</p>
                  {entry.subscriberName && (
                    <p className="text-[9px] font-medium text-slate-400 mt-0.5">via {entry.subscriberName}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── KYC sub-components ────────────────────────────────────────────────────────

const KycFilePickerCard = ({ label, required = false, file, onPick, onClear, inputRef }) => (
  <div
    className={cn(
      'relative p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer group',
      file ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-primary/30'
    )}
    onClick={() => !file && onPick()}
  >
    {/* Hidden file input */}
    <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,application/pdf" className="hidden" />

    <div className="flex flex-col items-center gap-2 text-center">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
        file ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 group-hover:text-primary'
      )}>
        {file ? <CheckCircle2 size={20} /> : <Upload size={18} />}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </p>
        <p className="text-[9px] font-medium text-slate-400 mt-0.5 max-w-[120px] truncate">
          {file ? file.name : 'JPG, PNG, PDF · Max 10MB'}
        </p>
      </div>
    </div>

    {file && (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        className="absolute top-2 right-2 p-1 rounded-lg bg-white text-slate-400 hover:text-rose-500 transition-colors shadow-sm"
      >
        <XCircle size={14} />
      </button>
    )}
  </div>
);

const KycResultBanner = ({ result }) => {
  const isVerified = result?.verificationStatus === 'Verified' || result?.responseStatusCode === 1;
  const hasFraud = result?.fraudFlags?.length > 0;

  const errorMap = {
    'Face Match Failed': 'Face match failed. Please use a clear, well-lit photo.',
    'No Face Found': 'No face detected in the document image.',
    'Invalid RSA ID': 'The South African ID number provided is invalid.',
    'Service Unavailable': 'Verification service is currently unavailable.',
  };

  const friendlyMessage = result?.responseMessage
    ? Object.keys(errorMap).find(k => result.responseMessage.toLowerCase().includes(k.toLowerCase()))
      ? errorMap[Object.keys(errorMap).find(k => result.responseMessage.toLowerCase().includes(k.toLowerCase()))]
      : result.responseMessage
    : isVerified ? 'Identity successfully verified' : 'Verification failed';

  return (
    <div className={cn(
      'p-5 rounded-2xl border space-y-4 transition-all',
      isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
    )}>
      {/* Status row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isVerified
            ? <BadgeCheck size={20} className="text-emerald-600 shrink-0" />
            : <TriangleAlert size={20} className="text-rose-500 shrink-0" />
          }
          <div>
            <p className={cn('text-xs font-black', isVerified ? 'text-emerald-800' : 'text-rose-800')}>
              {isVerified ? 'Verification Successful' : 'Verification Failed'}
            </p>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{friendlyMessage}</p>
          </div>
        </div>
        {result?.faceMatchScore != null && (
          <div className="text-right shrink-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Face Match</p>
            <p className={cn('text-lg font-black', isVerified ? 'text-emerald-700' : 'text-rose-600')}>
              {Math.round(result.faceMatchScore)}%
            </p>
          </div>
        )}
      </div>

      {/* OCR extracted name */}
      {result?.extractedOCRData && Object.keys(result.extractedOCRData).length > 0 && (
        <div className="pt-3 border-t border-current/10 grid grid-cols-2 gap-3">
          {result.extractedOCRData.FirstName && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OCR First Name</p>
              <p className="text-xs font-bold text-slate-700">{result.extractedOCRData.FirstName}</p>
            </div>
          )}
          {result.extractedOCRData.LastName && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OCR Last Name</p>
              <p className="text-xs font-bold text-slate-700">{result.extractedOCRData.LastName}</p>
            </div>
          )}
        </div>
      )}

      {/* Fraud flags */}
      {hasFraud && (
        <div className="pt-3 border-t border-rose-200 space-y-1">
          <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle size={11} /> Fraud Indicators Detected
          </p>
          {result.fraudFlags.map((flag, i) => (
            <p key={i} className="text-[10px] font-bold text-rose-600">• {flag}</p>
          ))}
        </div>
      )}

      {/* Timestamp */}
      {result?.verificationTimestamp && (
        <p className="text-[9px] font-bold text-slate-400 text-right">
          {new Date(result.verificationTimestamp).toLocaleString('en-ZA')}
        </p>
      )}
    </div>
  );
};

export default ApplyLoan;
