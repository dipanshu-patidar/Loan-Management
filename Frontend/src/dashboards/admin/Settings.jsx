import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings2, Save, RotateCcw, Percent, 
  Clock, AlertCircle, Briefcase, Edit3,
  ChevronRight, Activity, ShieldCheck, CheckCircle2,
  Calculator, Info, Zap, Bell, ToggleLeft as Toggle,
  Wallet, TrendingUp, History, ShieldAlert, FileText,
  Landmark, UserCheck, CheckCircle, XCircle, Calendar, Loader2, AlertTriangle, Plus, ShieldX, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';
import settingsService from '../../services/settingsService';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form State matching Central rules schema
  const [formData, setFormData] = useState({
    defaultInterestRate: 12.5,
    interestType: 'Reducing Balance',
    processingFeeType: 'Fixed Amount',
    processingFeeValue: 250,
    autoApplyProcessingFee: true,
    gracePeriodDays: 3,
    lateFeeAmount: 150,
    allowGracePeriod: true,
    autoApplyLateFee: true,
    graceReminders: true,
    minimumLoanAmount: 1000,
    maximumLoanAmount: 100000,
    minimumAge: 18,
    maximumAge: 65,
    minimumMonthlyIncome: 5000,
    employmentType: 'Both',
    eligibleMinimumPrincipal: 1000,
    eligibleMaximumPrincipal: 50000,
    allowedRepaymentDurations: '3, 6, 12, 18, 24',
    idVerificationRequired: true,
    bankStatementReview: true,
    payslipVerification: true,
    proofOfAddressAudit: true,
    manualStaffDecision: true,
    creditBureauIntegration: false,
    enableAutoApprovalLogic: false,
    enableEligibilityEngine: true,
    enableAutoAssignment: true,

    // Central rules collections
    loanProducts: [],
    initiationFeeType: 'Percentage',
    initiationFeeValue: 10,
    monthlyServiceFee: 60,
    vatPercentage: 15,
    creditLifeInsuranceRate: 1.2,
    collectionFeeRate: 10,
    latePaymentPenalty: 150,
    debitOrderRetryFee: 50,
    legalCollectionThreshold: 500,

    minDisposableIncome: 2000,
    maxDtiPercentage: 40,
    ncrBenchmarkThreshold: 15000,
    minSalaryRequirement: 5000,
    minEmploymentDuration: 6,

    idDocumentRequired: true,
    proofOfAddressRequired: true,
    ocrRequired: true,
    facialMatchRequired: true,
    amlRequired: true,
    hanisVerificationRequired: false,
    fraudDetectionRequired: true,

    avsEnabled: true,
    verificationProvider: 'Datanamix',
    verificationTimeout: 30,
    retryAttempts: 3,
    manualOverrideAllowed: true,
    fallbackVerificationMode: 'Manual Review',

    approvalRouting: 'Strict Admin Only',
    rejectionPermissions: 'Admin Only',
    escalationTriggers: true,

    // Newly added central engine specs
    employmentCategories: ['Permanently Employed', 'Contract Worker', 'Self Employed', 'Pensioner', 'Government Employee'],
    salaryFrequencies: ['Monthly', 'Weekly', 'Fortnightly'],
    riskCategoryMatrix: 'Medium Risk',
    autoApproveIfEligible: false,
    affordabilityWarningThreshold: 35,
    allowedLoanProducts: ['Personal Loan', 'Payday Loan', 'Business Loan', 'Debt Consolidation', 'Salary Advance'],
    minimumRequiredDocuments: 3
  });

  // Dynamic preview breakdown
  const [previewData, setPreviewData] = useState({
    monthlyRepayment: 938,
    minPrincipal: 1000,
    maxPrincipal: 50000,
    baseInterest: '12.5%',
    processingFee: 'R 250',
    penaltyGrace: '3 Days',
    initiationFee: 1000,
    monthlyServiceFee: 60,
    insuranceFee: 120,
    vatOnFees: 258,
    totalRepayment: 12438,
    logicSummary: {
      interestBasis: 'Reducing Balance',
      feeFrequency: 'Once per approved loan',
      penaltyBasis: 'Automated Overdue Run',
      reviewFlow: 'Manual Verification Gate'
    }
  });

  const [previewLoading, setPreviewLoading] = useState(false);

  // Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productEditIndex, setProductEditIndex] = useState(-1);

  // 1. Initial Load
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await settingsService.getSettings();
        if (res.data.data) {
          // Merge API response onto defaults so any missing fields retain their initial values
          setFormData(prev => ({
            ...prev,
            ...res.data.data,
            // Explicitly ensure arrays are never undefined
            loanProducts: res.data.data.loanProducts?.length > 0 ? res.data.data.loanProducts : prev.loanProducts,
            employmentCategories: res.data.data.employmentCategories?.length > 0 ? res.data.data.employmentCategories : prev.employmentCategories,
            salaryFrequencies: res.data.data.salaryFrequencies?.length > 0 ? res.data.data.salaryFrequencies : prev.salaryFrequencies,
            allowedLoanProducts: res.data.data.allowedLoanProducts?.length > 0 ? res.data.data.allowedLoanProducts : prev.allowedLoanProducts,
          }));
          fetchLivePreview(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load configurations');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 2. Live Preview Calculation
  const fetchLivePreview = async (currentData) => {
    try {
      setPreviewLoading(true);
      const res = await settingsService.calculateLivePreview(currentData);
      if (res.data.data) {
        setPreviewData(res.data.data);
      }
    } catch (err) {
      // silent fail during live edit
    } finally {
      setPreviewLoading(false);
    }
  };

  // Debounce preview calculations on configuration change
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const delay = setTimeout(() => {
      fetchLivePreview(formData);
    }, 600);
    return () => clearTimeout(delay);
  }, [
    formData.defaultInterestRate,
    formData.interestType,
    formData.initiationFeeType,
    formData.initiationFeeValue,
    formData.monthlyServiceFee,
    formData.vatPercentage,
    formData.creditLifeInsuranceRate,
    formData.lateFeeAmount,
    formData.gracePeriodDays,
    formData.autoApplyLateFee,
    formData.enableAutoApprovalLogic
  ]);

  const handleInputChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all rules inside the bulk rules update endpoint
      await settingsService.updateBulkSettings(formData);
      toast.success('Dynamic Lending Rules & configurations locked successfully');
      fetchLivePreview(formData);
    } catch (err) {
      toast.error('Failed to apply configurations');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await settingsService.resetSettings();
      if (res.data.data) {
        setFormData(res.data.data);
        fetchLivePreview(res.data.data);
        toast.success('Central Lending Rules reset to factory defaults');
      }
    } catch (err) {
      toast.error('Failed to reset system settings');
    } finally {
      setIsResetModalOpen(false);
      setLoading(false);
    }
  };

  // Product Modifiers
  const openEditProduct = (product, idx) => {
    setSelectedProduct({ ...product });
    setProductEditIndex(idx);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!selectedProduct.name.trim() || !selectedProduct.code.trim()) {
      toast.error('Product name and code are required');
      return;
    }
    const list = [...formData.loanProducts];
    list[productEditIndex] = selectedProduct;
    handleInputChange('loanProducts', list);
    setIsProductModalOpen(false);
    toast.success(`${selectedProduct.name} configuration updated locally`);
  };

  const tabs = [
    { id: 'products', label: 'Loan Products', icon: Briefcase },
    { id: 'ncrFees', label: 'NCR Fee Engine', icon: Percent },
    { id: 'affordability', label: 'Affordability & KYC', icon: ShieldCheck },
    { id: 'workflow', label: 'Bank & Workflows', icon: Landmark },
    { id: 'eligibility', label: 'Eligibility Engine', icon: UserCheck }
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={42} className="text-primary animate-spin opacity-80" />
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Querying Central Lending Rules Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 relative">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded bg-primary/5 text-[9px] font-black uppercase text-primary tracking-widest border border-primary/10">
              Lending Rules Desk
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400">DHA & NCR Gateways Active</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Rules Configuration</h1>
          <p className="text-slate-500 font-medium mt-0.5 max-w-xl text-xs">
            Manage dynamic loan products, NCR initiation & service fee rules, KYC compliance triggers, and automated underwriting workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsResetModalOpen(true)} 
            variant="secondary" 
            className="flex items-center gap-2 font-bold px-6 border-slate-200 text-xs"
          >
            <RotateCcw size={16} /> Reset Engine
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 font-bold px-8 shadow-lg shadow-primary/20 bg-primary text-xs"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? 'Applying...' : 'Save Settings'}
          </Button>
        </div>
      </header>

      {/* 2. TAB NAVIGATION */}
      <nav className="flex items-center p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
              activeTab === tab.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Settings Content */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* TAB 1: LOAN PRODUCTS */}
              {activeTab === 'products' && (
                <SettingsSection title="Loan Product Settings" icon={Briefcase}>
                  <p className="text-slate-400 font-semibold text-xs mb-6 uppercase tracking-wider">
                    Select a product code to configure its dynamic interest brackets, tenure limits, and document triggers.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(formData.loanProducts || []).map((p, idx) => (
                      <div 
                        key={p._id || idx}
                        className={cn(
                          "p-6 rounded-[2rem] border transition-all flex flex-col justify-between group",
                          p.status === 'Active' 
                            ? "bg-white border-slate-200/60 hover:border-primary/40 shadow-soft" 
                            : "bg-slate-50 border-slate-100 opacity-60"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10">
                              {p.code}
                            </span>
                            <h4 className="text-sm font-black text-slate-800 tracking-tight mt-2">{p.name}</h4>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                            p.status === 'Active' 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {p.status}
                          </span>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 space-y-2 text-[10px] font-semibold text-slate-400">
                          <div className="flex justify-between">
                            <span>Amount Limits</span>
                            <span className="text-slate-700 font-bold">R{p.minAmount?.toLocaleString()} - R{p.maxAmount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tenure Limits</span>
                            <span className="text-slate-700 font-bold">{p.minTenure} - {p.maxTenure} Months</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Interest Bracket</span>
                            <span className="text-slate-700 font-bold">{p.defaultInterestRate}% ({p.interestType === 'Reducing Balance' ? 'Red' : 'Flat'})</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditProduct(p, idx)}
                          className="mt-6 flex items-center justify-center gap-1.5 w-full py-3 rounded-xl border border-slate-150 group-hover:border-primary/30 group-hover:text-primary transition-all text-[9px] font-black uppercase tracking-widest text-slate-400"
                        >
                          <Edit3 size={11} /> Modify Product Rules
                        </button>
                      </div>
                    ))}
                  </div>
                </SettingsSection>
              )}

              {/* TAB 2: NCR FEE ENGINE */}
              {activeTab === 'ncrFees' && (
                <>
                  <SettingsSection title="NCR Initiation & Service Fees" icon={Percent}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initiation Fee Type</label>
                        <select 
                          value={formData.initiationFeeType}
                          onChange={(e) => handleInputChange('initiationFeeType', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                        >
                          <option value="Percentage">Percentage of Principal</option>
                          <option value="Fixed Amount">Fixed Amount (ZAR)</option>
                        </select>
                      </div>
                      <Input 
                        label={`Initiation Fee Value (${formData.initiationFeeType === 'Fixed Amount' ? 'R' : '%'})`} 
                        type="number" 
                        value={formData.initiationFeeValue} 
                        onChange={(e) => handleInputChange('initiationFeeValue', Number(e.target.value))}
                        icon={Percent} 
                      />
                      <Input 
                        label="Monthly Service Fee (R)" 
                        type="number" 
                        value={formData.monthlyServiceFee} 
                        onChange={(e) => handleInputChange('monthlyServiceFee', Number(e.target.value))}
                        icon={Wallet} 
                      />
                      <Input 
                        label="VAT Rate (%)" 
                        type="number" 
                        value={formData.vatPercentage} 
                        onChange={(e) => handleInputChange('vatPercentage', Number(e.target.value))}
                        icon={TrendingUp} 
                      />
                    </div>
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <Info size={16} className="text-blue-700 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-wider">
                        NCR Regulation Notice: Initiation fees for microloans must not exceed 15% of the principal, and monthly service fees are capped under National Credit Act guidelines.
                      </p>
                    </div>
                  </SettingsSection>

                  <SettingsSection title="Credit Life & Penalty Governance" icon={Clock}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <Input 
                        label="Credit Life Insurance % p.a." 
                        type="number" 
                        value={formData.creditLifeInsuranceRate} 
                        onChange={(e) => handleInputChange('creditLifeInsuranceRate', Number(e.target.value))}
                        icon={ShieldCheck} 
                      />
                      <Input 
                        label="Late Payment Penalty (R)" 
                        type="number" 
                        value={formData.latePaymentPenalty} 
                        onChange={(e) => handleInputChange('latePaymentPenalty', Number(e.target.value))}
                        icon={AlertCircle} 
                      />
                      <Input 
                        label="Grace Period (Days)" 
                        type="number" 
                        value={formData.gracePeriodDays} 
                        onChange={(e) => handleInputChange('gracePeriodDays', Number(e.target.value))}
                        icon={Clock} 
                      />
                      <Input 
                        label="Debit Order Retry Fee (R)" 
                        type="number" 
                        value={formData.debitOrderRetryFee} 
                        onChange={(e) => handleInputChange('debitOrderRetryFee', Number(e.target.value))}
                        icon={RefreshCw} 
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <ToggleSwitch 
                        label="Enable Grace Period" 
                        description="Exempt late payment penalty runs during the grace window" 
                        checked={formData.allowGracePeriod} 
                        onChange={(c) => handleInputChange('allowGracePeriod', c)}
                      />
                      <ToggleSwitch 
                        label="Automated Late Fee Runs" 
                        description="Trigger penalty run automatically at midnight after grace period expiration" 
                        checked={formData.autoApplyLateFee} 
                        onChange={(c) => handleInputChange('autoApplyLateFee', c)}
                      />
                      <ToggleSwitch 
                        label="Late Fee Reminders" 
                        description="Send automated warning SMS/Email 24 hours prior to grace period expiration" 
                        checked={formData.graceReminders} 
                        onChange={(c) => handleInputChange('graceReminders', c)}
                      />
                    </div>
                  </SettingsSection>
                </>
              )}

              {/* TAB 3: AFFORDABILITY & KYC */}
              {activeTab === 'affordability' && (
                <>
                  <SettingsSection title="NCR Affordability Rules" icon={Calculator}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <Input 
                        label="Min Salary Requirement (R)" 
                        type="number" 
                        value={formData.minSalaryRequirement} 
                        onChange={(e) => handleInputChange('minSalaryRequirement', Number(e.target.value))}
                        icon={Wallet} 
                      />
                      <Input 
                        label="Min Disposable Income (R)" 
                        type="number" 
                        value={formData.minDisposableIncome} 
                        onChange={(e) => handleInputChange('minDisposableIncome', Number(e.target.value))}
                        icon={Calculator} 
                      />
                      <Input 
                        label="Max DTI Threshold (%)" 
                        type="number" 
                        value={formData.maxDtiPercentage} 
                        onChange={(e) => handleInputChange('maxDtiPercentage', Number(e.target.value))}
                        icon={TrendingUp} 
                      />
                      <Input 
                        label="Affordability Warning Threshold (DTI %)" 
                        type="number" 
                        value={formData.affordabilityWarningThreshold || 35} 
                        onChange={(e) => handleInputChange('affordabilityWarningThreshold', Number(e.target.value))}
                        icon={AlertTriangle} 
                      />
                      <Input 
                        label="Min Employment (Months)" 
                        type="number" 
                        value={formData.minEmploymentDuration} 
                        onChange={(e) => handleInputChange('minEmploymentDuration', Number(e.target.value))}
                        icon={History} 
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Category Matrix</label>
                        <select 
                          value={formData.riskCategoryMatrix || 'Medium Risk'}
                          onChange={(e) => handleInputChange('riskCategoryMatrix', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer text-xs"
                        >
                          <option value="Low Risk">Low Risk (Permissive checks)</option>
                          <option value="Medium Risk">Medium Risk (Standard caps)</option>
                          <option value="High Risk">High Risk (Strict gates)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <ToggleSwitch 
                        label="Auto Approve If Eligible" 
                        description="Mark application as Pre-Approved automatically if OCR, AML, AVS and DTI validation gates pass" 
                        checked={formData.autoApproveIfEligible || false} 
                        onChange={(c) => handleInputChange('autoApproveIfEligible', c)}
                      />
                    </div>
                  </SettingsSection>

                  <SettingsSection title="KYC & Compliance Verification Rules" icon={ShieldCheck}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                      <Checkbox 
                        label="ID Document Required" 
                        checked={formData.idDocumentRequired} 
                        onChange={(c) => handleInputChange('idDocumentRequired', c)}
                      />
                      <Checkbox 
                        label="Proof of Address Required" 
                        checked={formData.proofOfAddressRequired} 
                        onChange={(c) => handleInputChange('proofOfAddressRequired', c)}
                      />
                      <Checkbox 
                        label="Payslip File Audit" 
                        checked={formData.payslipVerification} 
                        onChange={(c) => handleInputChange('payslipVerification', c)}
                      />
                      <Checkbox 
                        label="Bank Statement Audit" 
                        checked={formData.bankStatementReview} 
                        onChange={(c) => handleInputChange('bankStatementReview', c)}
                      />
                    </div>
                    
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100/50 space-y-5">
                      <ToggleSwitch 
                        label="Dynamic OCR Document Analysis" 
                        description="Automatically parse salary and ID values from uploaded PDFs" 
                        checked={formData.ocrRequired} 
                        onChange={(c) => handleInputChange('ocrRequired', c)}
                      />
                      <ToggleSwitch 
                        label="Biometric Facial Match Verification" 
                        description="Match borrower photo against ID document biometric chips" 
                        checked={formData.facialMatchRequired} 
                        onChange={(c) => handleInputChange('facialMatchRequired', c)}
                      />
                      <ToggleSwitch 
                        label="Automated AML & Fraud Checks" 
                        description="Query anti-money laundering registries and credit bureau blacklist records" 
                        checked={formData.amlRequired} 
                        onChange={(c) => handleInputChange('amlRequired', c)}
                      />
                      <ToggleSwitch 
                        label="DHA HANIS Registry Gateway" 
                        description="Direct integration with the Department of Home Affairs identity system" 
                        checked={formData.hanisVerificationRequired} 
                        onChange={(c) => handleInputChange('hanisVerificationRequired', c)}
                      />
                    </div>
                  </SettingsSection>
                </>
              )}

              {/* TAB 4: BANK & WORKFLOWS */}
              {activeTab === 'workflow' && (
                <>
                  <SettingsSection title="Bank Account Verification Rules" icon={Landmark}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Provider</label>
                        <select 
                          value={formData.verificationProvider}
                          onChange={(e) => handleInputChange('verificationProvider', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                        >
                          <option value="Datanamix">Datanamix Gateway</option>
                          <option value="Plaid API">Plaid Africa</option>
                          <option value="DHA Registry">Direct DHA AVS</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fallback Mode</label>
                        <select 
                          value={formData.fallbackVerificationMode}
                          onChange={(e) => handleInputChange('fallbackVerificationMode', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                        >
                          <option value="Manual Review">Hold for Manual Review</option>
                          <option value="AVS Only">Strict AVS Failure Lockout</option>
                        </select>
                      </div>
                      <Input 
                        label="AVS Verification Timeout (Seconds)" 
                        type="number" 
                        value={formData.verificationTimeout} 
                        onChange={(e) => handleInputChange('verificationTimeout', Number(e.target.value))}
                        icon={Clock} 
                      />
                      <Input 
                        label="Retry Limit Attempts" 
                        type="number" 
                        value={formData.retryAttempts} 
                        onChange={(e) => handleInputChange('retryAttempts', Number(e.target.value))}
                        icon={RefreshCw} 
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <ToggleSwitch 
                        label="Strict AVS Verification" 
                        description="Requires active bank verification before disbursement approval" 
                        checked={formData.avsEnabled} 
                        onChange={(c) => handleInputChange('avsEnabled', c)}
                      />
                      <ToggleSwitch 
                        label="Manual Override Allowed" 
                        description="Allow administrators to manually mark bank account as verified" 
                        checked={formData.manualOverrideAllowed} 
                        onChange={(c) => handleInputChange('manualOverrideAllowed', c)}
                      />
                    </div>
                  </SettingsSection>

                  <SettingsSection title="Application Workflow & Routing Settings" icon={Activity}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approval Routing Gate</label>
                        <select 
                          value={formData.approvalRouting}
                          onChange={(e) => handleInputChange('approvalRouting', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                        >
                          <option value="Strict Admin Only">Strict Admin-Only Approval</option>
                          <option value="Reviewer Direct">Assigned Reviewer Auto-Approve</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Permission</label>
                        <select 
                          value={formData.rejectionPermissions}
                          onChange={(e) => handleInputChange('rejectionPermissions', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                        >
                          <option value="Admin Only">Admin Only Decision</option>
                          <option value="Reviewer Allowed">Reviewers & Staff Allowed</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <ToggleSwitch 
                        label="Automated Reviewer Assignment" 
                        description="Equitably allocate incoming applications to available staff reviewers" 
                        checked={formData.enableAutoAssignment} 
                        onChange={(c) => handleInputChange('enableAutoAssignment', c)}
                      />
                      <ToggleSwitch 
                        label="Automated Risk Escalate Triggers" 
                        description="Auto-escalate applications with DTI over 35% directly to executive desk" 
                        checked={formData.escalationTriggers} 
                        onChange={(c) => handleInputChange('escalationTriggers', c)}
                      />
                      <ToggleSwitch 
                        label="Auto Approval Logic Engine" 
                        description="Bypass manual verification if bureau credit checks pass clean" 
                        checked={formData.enableAutoApprovalLogic} 
                        onChange={(c) => handleInputChange('enableAutoApprovalLogic', c)}
                      />
                    </div>
                  </SettingsSection>
                </>
              )}

              {/* TAB 5: ELIGIBILITY ENGINE */}
              {activeTab === 'eligibility' && (
                <>
                  {/* Basic Eligibility Section */}
                  <SettingsSection title="Basic Eligibility Rules" icon={UserCheck}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <Input 
                        label="Minimum Age" 
                        type="number" 
                        value={formData.minimumAge} 
                        onChange={(e) => handleInputChange('minimumAge', Number(e.target.value))}
                        icon={Clock} 
                      />
                      <Input 
                        label="Maximum Age" 
                        type="number" 
                        value={formData.maximumAge || 65} 
                        onChange={(e) => handleInputChange('maximumAge', Number(e.target.value))}
                        icon={Clock} 
                      />
                      <Input 
                        label="Minimum Monthly Income (R)" 
                        type="number" 
                        value={formData.minimumMonthlyIncome} 
                        onChange={(e) => handleInputChange('minimumMonthlyIncome', Number(e.target.value))}
                        icon={Wallet} 
                      />
                      <Input 
                        label="Minimum Employment Duration (Months)" 
                        type="number" 
                        value={formData.minEmploymentDuration} 
                        onChange={(e) => handleInputChange('minEmploymentDuration', Number(e.target.value))}
                        icon={History} 
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Employment Type</label>
                        <select 
                          value={formData.employmentType}
                          onChange={(e) => handleInputChange('employmentType', e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                        >
                          <option value="Employed">Formally Employed Only</option>
                          <option value="Self Employed">Self-Employed Only</option>
                          <option value="Both">Both Qualify</option>
                        </select>
                      </div>
                    </div>

                    {/* Employment Categories Multi-Select */}
                    <div className="space-y-3 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 mb-8">
                      <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Qualifying Employment Categories</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Define which employment categories qualify for funding under NCR standards</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                        {['Permanently Employed', 'Contract Worker', 'Self Employed', 'Pensioner', 'Government Employee'].map((cat) => {
                          const list = formData.employmentCategories || [];
                          const checked = list.includes(cat);
                          return (
                            <Checkbox 
                              key={cat}
                              label={cat}
                              checked={checked}
                              onChange={(c) => {
                                const newList = c 
                                  ? [...list, cat] 
                                  : list.filter(item => item !== cat);
                                handleInputChange('employmentCategories', newList);
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Salary Frequency Multi-Select */}
                    <div className="space-y-3 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Accepted Salary Frequencies</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Accepted cycles for payday tracking and EMI deduction runs</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        {['Monthly', 'Weekly', 'Fortnightly'].map((freq) => {
                          const list = formData.salaryFrequencies || [];
                          const checked = list.includes(freq);
                          return (
                            <Checkbox 
                              key={freq}
                              label={freq}
                              checked={checked}
                              onChange={(c) => {
                                const newList = c 
                                  ? [...list, freq] 
                                  : list.filter(item => item !== freq);
                                handleInputChange('salaryFrequencies', newList);
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </SettingsSection>

                  {/* Loan Scope Rules Section */}
                  <SettingsSection title="Loan Scope Rules" icon={Briefcase}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <Input 
                        label="Eligible Minimum Principal (R)" 
                        type="number" 
                        value={formData.eligibleMinimumPrincipal} 
                        onChange={(e) => handleInputChange('eligibleMinimumPrincipal', Number(e.target.value))}
                        icon={Wallet} 
                      />
                      <Input 
                        label="Eligible Maximum Principal (R)" 
                        type="number" 
                        value={formData.eligibleMaximumPrincipal} 
                        onChange={(e) => handleInputChange('eligibleMaximumPrincipal', Number(e.target.value))}
                        icon={TrendingUp} 
                      />
                      <Input 
                        label="Allowed Repayment Durations (comma separated months)" 
                        value={formData.allowedRepaymentDurations} 
                        onChange={(e) => handleInputChange('allowedRepaymentDurations', e.target.value)}
                        icon={Clock} 
                      />
                    </div>

                    {/* Allowed Loan Products Multi-Select */}
                    <div className="space-y-3 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 mb-8">
                      <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Access-Allowed Loan Products</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Permit specific lending channels to be offered to eligible users</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                        {(formData.loanProducts || []).map((prod) => {
                          const list = formData.allowedLoanProducts || [];
                          const checked = list.includes(prod.name);
                          return (
                            <Checkbox 
                              key={prod._id || prod.code}
                              label={prod.name}
                              checked={checked}
                              onChange={(c) => {
                                const newList = c 
                                  ? [...list, prod.name] 
                                  : list.filter(item => item !== prod.name);
                                handleInputChange('allowedLoanProducts', newList);
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Product Eligibility Mapping - dynamic rule table */}
                    <div className="space-y-3 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Product Scope Mapping</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-semibold">
                          <thead>
                            <tr className="border-b border-slate-200/50 text-[10px] uppercase text-slate-400 tracking-wider">
                              <th className="py-3">Product Name</th>
                              <th className="py-3">Min Salary Req.</th>
                              <th className="py-3">Allowed Employment</th>
                              <th className="py-3">OCR Gate</th>
                              <th className="py-3">AML Gate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(formData.loanProducts || []).map((p) => (
                              <tr key={p.code} className="border-b border-slate-100/50 hover:bg-slate-100/30 transition-colors">
                                <td className="py-3 font-black text-slate-800">{p.name}</td>
                                <td className="py-3 text-slate-600">R{p.minIncomeRequired || p.minAmount * 3}</td>
                                <td className="py-3 text-slate-600">{p.allowedEmploymentType || 'Both'}</td>
                                <td className="py-3 text-slate-600">{p.autoOcrEnabled ? 'Yes' : 'No'}</td>
                                <td className="py-3 text-slate-600">{p.autoAmlEnabled ? 'Yes' : 'No'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </SettingsSection>

                  {/* Documentation & Verification Section */}
                  <SettingsSection title="Documentation & Verification Gates" icon={FileText}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <Input 
                        label="Minimum Required Documents (Count)" 
                        type="number" 
                        value={formData.minimumRequiredDocuments || 3} 
                        onChange={(e) => handleInputChange('minimumRequiredDocuments', Number(e.target.value))}
                        icon={FileText} 
                      />
                    </div>
                    
                    <div className="space-y-5 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <ToggleSwitch 
                        label="Mandatory OCR Validation" 
                        description="Automatically parse salary and verify ID files before proceeding" 
                        checked={formData.ocrRequired} 
                        onChange={(c) => handleInputChange('ocrRequired', c)}
                      />
                      <ToggleSwitch 
                        label="Bureau AML Screening Gate" 
                        description="Perform real-time checks on PEP registries and anti-money laundering blacklists" 
                        checked={formData.amlRequired} 
                        onChange={(c) => handleInputChange('amlRequired', c)}
                      />
                      <ToggleSwitch 
                        label="Facial Biometric Verification" 
                        description="Run biometric face comparisons on submitted ID versus passport photo" 
                        checked={formData.facialMatchRequired} 
                        onChange={(c) => handleInputChange('facialMatchRequired', c)}
                      />
                      <ToggleSwitch 
                        label="Mandatory Credit Bureau Integration" 
                        description="Require real-time scoring data retrieval from TransUnion/Experian registries" 
                        checked={formData.creditBureauIntegration} 
                        onChange={(c) => handleInputChange('creditBureauIntegration', c)}
                      />
                      <ToggleSwitch 
                        label="Auto-Reject Fraud Matches" 
                        description="Automatically reject and lock borrowers flagged with PEP or fraud records" 
                        checked={formData.fraudDetectionRequired} 
                        onChange={(c) => handleInputChange('fraudDetectionRequired', c)}
                      />
                    </div>
                  </SettingsSection>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. CONSOLIDATED PREVIEW SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-8 space-y-6">
            {/* PREVIEW PANEL */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-premium overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative z-10 flex items-center justify-between mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Logic Preview</h4>
                {previewLoading ? (
                  <Loader2 size={14} className="text-primary animate-spin" />
                ) : (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </div>

              <div className="relative z-10 space-y-8">
                {/* EMI Preview */}
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">NCR Monthly EMI</p>
                  <h2 className="text-4xl font-black text-white tracking-tight">R {previewData.monthlyRepayment.toLocaleString()}</h2>
                  <p className="text-[9px] font-bold text-slate-600 mt-2 italic">Calculated dynamically (Sample Principal: R10,000 / 12 Months)</p>
                </div>

                {/* Breakdown */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <PreviewRow label="Base Interest" value={previewData.baseInterest} />
                  <PreviewRow label="Initiation Fee" value={`+ R ${previewData.initiationFee || 0}`} />
                  <PreviewRow label="Monthly Service Fee" value={`+ R ${previewData.monthlyServiceFee || 0} /m`} />
                  <PreviewRow label="Credit Life Insurance" value={`+ R ${previewData.insuranceFee || 0}`} />
                  <PreviewRow label="VAT On Fees (15%)" value={`+ R ${previewData.vatOnFees || 0}`} />
                  <div className="h-[1px] bg-white/10 my-2" />
                  <PreviewRow label="Total Loan Cost" value={`R ${previewData.totalRepayment?.toLocaleString() || 0}`} />
                </div>

                {/* Real-time Logic Snapshots */}
                <div className="space-y-4 pt-6 border-t border-white/5 text-[11px] font-semibold text-slate-400">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">DTI & Disposable Thresholds</p>
                    <div className="flex justify-between items-center bg-white/5 px-3 py-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-slate-400">Max DTI Gate</span>
                      <span className="font-black text-white">{formData.maxDtiPercentage}% (Warn at {formData.affordabilityWarningThreshold || 35}%)</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">NCR Risk Profile Matrix</p>
                    <div className="flex justify-between items-center bg-white/5 px-3 py-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-slate-400">Risk Severity Level</span>
                      <span className="font-black text-primary uppercase tracking-widest text-[8px] bg-primary/20 px-2 py-0.5 rounded border border-primary/20">{formData.riskCategoryMatrix || 'Medium Risk'}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Auto-Underwriting Routing</p>
                    <div className="flex justify-between items-center bg-white/5 px-3 py-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-slate-400">Eligibility Output</span>
                      <span className="font-black text-emerald-400 uppercase tracking-widest text-[8px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {formData.autoApproveIfEligible ? 'Auto Pre-Approved' : 'Manual verification required'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">KYC Document Gateways</p>
                    <div className="flex justify-between items-center bg-white/5 px-3 py-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-slate-400">Doc Verification Rules</span>
                      <span className="font-black text-white">{formData.minimumRequiredDocuments || 3} files mandatory</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* HELP PANEL */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Info size={16} className="text-primary" /> Logic Summary
              </h4>
              <div className="space-y-4">
                <LogicItem label="Interest Basis" value={previewData.logicSummary.interestBasis} />
                <LogicItem label="Fee Frequency" value={previewData.logicSummary.feeFrequency} />
                <LogicItem label="Penalty Basis" value={previewData.logicSummary.penaltyBasis} />
                <LogicItem label="Review Flow" value={previewData.logicSummary.reviewFlow} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {isResetModalOpen && (
          <Modal isOpen onClose={() => setIsResetModalOpen(false)} title="Factory Reset Protocol" maxWidth="max-w-md">
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">Reset to Factory Safe defaults?</h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  This will wipe all custom configurations, reset initiation fees to 10% and restore South African safe defaults. This will impact all active origination wizards immediately.
                </p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <Button variant="secondary" onClick={() => setIsResetModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                <Button onClick={handleReset} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] shadow-lg shadow-rose-600/20 py-4">Confirm Reset</Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Dynamic Product Editor Modal */}
        {isProductModalOpen && selectedProduct && (
          <Modal isOpen onClose={() => setIsProductModalOpen(false)} title={`Configure: ${selectedProduct.name}`} maxWidth="max-w-2xl">
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
              <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
                <Briefcase className="text-primary" size={20} />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Dynamic Lending Specifications</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Customize rule compliance settings for product code: {selectedProduct.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input 
                  label="Product Name" 
                  value={selectedProduct.name} 
                  onChange={(e) => setSelectedProduct(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input 
                  label="Product Code" 
                  value={selectedProduct.code} 
                  onChange={(e) => setSelectedProduct(prev => ({ ...prev, code: e.target.value }))}
                />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Status</label>
                  <select 
                    value={selectedProduct.status}
                    onChange={(e) => setSelectedProduct(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Calculation Basis</label>
                  <select 
                    value={selectedProduct.interestType}
                    onChange={(e) => setSelectedProduct(prev => ({ ...prev, interestType: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                  >
                    <option value="Reducing Balance">Reducing Balance</option>
                    <option value="Flat Rate">Flat Rate</option>
                  </select>
                </div>

                <Input 
                  label="Min Principal (R)" 
                  type="number"
                  value={selectedProduct.minAmount} 
                  onChange={(e) => setSelectedProduct(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
                />
                <Input 
                  label="Max Principal (R)" 
                  type="number"
                  value={selectedProduct.maxAmount} 
                  onChange={(e) => setSelectedProduct(prev => ({ ...prev, maxAmount: Number(e.target.value) }))}
                />
                <Input 
                  label="Min Tenure (Months)" 
                  type="number"
                  value={selectedProduct.minTenure} 
                  onChange={(e) => setSelectedProduct(prev => ({ ...prev, minTenure: Number(e.target.value) }))}
                />
                <Input 
                  label="Max Tenure (Months)" 
                  type="number"
                  value={selectedProduct.maxTenure} 
                  onChange={(e) => setSelectedProduct(prev => ({ ...prev, maxTenure: Number(e.target.value) }))}
                />

                <Input 
                  label="Default Interest Rate (%)" 
                  type="number"
                  value={selectedProduct.defaultInterestRate} 
                  onChange={(e) => setSelectedProduct(prev => ({ ...prev, defaultInterestRate: Number(e.target.value) }))}
                />
                <Input 
                  label="Maximum Allowed Interest (%)" 
                  type="number"
                  value={selectedProduct.maxInterestRate} 
                  onChange={(e) => setSelectedProduct(prev => ({ ...prev, maxInterestRate: Number(e.target.value) }))}
                />
              </div>

              <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 mt-6">
                <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Automated Underwriting Triggers</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Checkbox 
                    label="Auto Affordability Validation" 
                    checked={selectedProduct.autoAffordabilityEnabled} 
                    onChange={(c) => setSelectedProduct(prev => ({ ...prev, autoAffordabilityEnabled: c }))}
                  />
                  <Checkbox 
                    label="Auto OCR PDF Verification" 
                    checked={selectedProduct.autoOcrEnabled} 
                    onChange={(c) => setSelectedProduct(prev => ({ ...prev, autoOcrEnabled: c }))}
                  />
                  <Checkbox 
                    label="Biometric AML Gateway Check" 
                    checked={selectedProduct.autoAmlEnabled} 
                    onChange={(c) => setSelectedProduct(prev => ({ ...prev, autoAmlEnabled: c }))}
                  />
                  <Checkbox 
                    label="Include VAT on Initiation Fees" 
                    checked={selectedProduct.vatEnabled} 
                    onChange={(c) => setSelectedProduct(prev => ({ ...prev, vatEnabled: c }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100 mt-8">
                <Button variant="secondary" onClick={() => setIsProductModalOpen(false)} className="flex-1 font-black uppercase text-[10px] py-4">Cancel</Button>
                <Button onClick={handleSaveProduct} className="flex-1 bg-primary text-white font-black uppercase text-[10px] shadow-lg shadow-primary/20 py-4">Lock Product Rules</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SettingsSection = ({ title, icon: Icon, children }) => (
  <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
    <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/20">
      <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
        <Icon size={20} />
      </div>
      <h3 className="text-md font-black text-slate-900 tracking-tight">{title}</h3>
    </div>
    <div className="p-8">
      {children}
    </div>
  </section>
);

const ToggleSwitch = ({ label, description, checked, onChange }) => (
  <div onClick={() => onChange && onChange(!checked)} className="flex items-center justify-between group cursor-pointer select-none">
    <div>
      {label && <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{label}</p>}
      {description && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{description}</p>}
    </div>
    <div className={cn(
      "w-12 h-6 rounded-full p-1 transition-all duration-300 shrink-0",
      checked ? "bg-primary" : "bg-slate-200"
    )}>
      <div className={cn(
        "w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
        checked ? "translate-x-6" : "translate-x-0"
      )} />
    </div>
  </div>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label onClick={() => onChange && onChange(!checked)} className="flex items-center gap-3 cursor-pointer group select-none">
    <div className={cn(
      "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
      checked ? "bg-primary border-primary shadow-sm" : "bg-white border-slate-200 group-hover:border-primary/40"
    )}>
      {checked && <CheckCircle size={12} className="text-white" />}
    </div>
    <span className={cn(
      "text-xs font-bold transition-colors",
      checked ? "text-slate-900" : "text-slate-450 group-hover:text-slate-600"
    )}>{label}</span>
  </label>
);

const PreviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
    <span className="uppercase tracking-widest text-[9px]">{label}</span>
    <span className="font-black text-white">{value}</span>
  </div>
);

const SnapshotBadge = ({ label }) => {
  if (!label) return null;
  return (
    <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">
      {label}
    </div>
  );
};

const LogicItem = ({ label, value }) => (
  <div className="flex justify-between items-center group">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
    <span className="text-[11px] font-black text-slate-900">{value}</span>
  </div>
);

export default Settings;
