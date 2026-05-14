import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings2, Save, RotateCcw, Percent, 
  Clock, AlertCircle, Briefcase,
  ChevronRight, Activity, ShieldCheck, CheckCircle2,
  Calculator, Info, Zap, Bell, ToggleLeft as Toggle,
  Wallet, TrendingUp, History, ShieldAlert, FileText,
  Landmark, UserCheck, CheckCircle, XCircle, Calendar, Loader2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';
import settingsService from '../../services/settingsService';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'eligibility'
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Real Dynamic Form Data mapped to schema
  const [formData, setFormData] = useState({
    defaultInterestRate: 12.5,
    minInterestRate: 8.0,
    maxInterestRate: 25.0,
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
    enableAutoApprovalLogic: false
  });

  // Dynamic preview state from server
  const [previewData, setPreviewData] = useState({
    monthlyRepayment: 938,
    minPrincipal: 1000,
    maxPrincipal: 50000,
    baseInterest: '12.5%',
    processingFee: 'R 250',
    penaltyGrace: '3 Days',
    logicSummary: {
      interestBasis: 'Reducing Balance',
      feeFrequency: 'Once per approved loan',
      penaltyBasis: 'Automated Overdue Run',
      reviewFlow: 'Manual Verification Gate'
    }
  });

  const [previewLoading, setPreviewLoading] = useState(false);

  // 1. Initial data fetch
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await settingsService.getSettings();
        if (res.data.data) {
          setFormData(res.data.data);
          // Populate preview initially
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

  // 2. Calculate Live Preview with debounce
  const fetchLivePreview = async (currentData) => {
    try {
      setPreviewLoading(true);
      const res = await settingsService.calculateLivePreview(currentData);
      if (res.data.data) {
        setPreviewData(res.data.data);
      }
    } catch (err) {
      // silent error for continuous typing
    } finally {
      setPreviewLoading(false);
    }
  };

  // Setup debounced trigger for preview updates on form changes
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const delay = setTimeout(() => {
      fetchLivePreview(formData);
    }, 500);
    return () => clearTimeout(delay);
  }, [
    formData.defaultInterestRate, 
    formData.interestType, 
    formData.eligibleMinimumPrincipal,
    formData.eligibleMaximumPrincipal,
    formData.processingFeeValue,
    formData.processingFeeType,
    formData.gracePeriodDays,
    formData.autoApplyLateFee,
    formData.enableAutoApprovalLogic
  ]);

  // Input handlers
  const handleInputChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'general') {
        await settingsService.updateGeneralSettings(formData);
        toast.success('General configurations applied');
      } else {
        await settingsService.updateEligibilityRules(formData);
        await settingsService.updateDocumentRules(formData);
        toast.success('Eligibility & documentation protocols locked');
      }
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
        toast.success('Protocols reset to safe system defaults');
      }
    } catch (err) {
      toast.error('Failed to reset system settings');
    } finally {
      setIsResetModalOpen(false);
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings2 },
    { id: 'eligibility', label: 'Eligibility Rules', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={42} className="text-primary animate-spin opacity-80" />
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Querying MongoDB Config Cluster...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 relative">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 font-medium mt-1 max-w-xl">
             Manage loan configurations, eligibility rules, fees, repayment logic, and verification requirements.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             onClick={() => setIsResetModalOpen(true)} 
             variant="secondary" 
             className="flex items-center gap-2 font-bold px-6 border-slate-200"
           >
             <RotateCcw size={18} /> Reset
           </Button>
           <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2 font-bold px-8 shadow-lg shadow-primary/20 bg-primary"
           >
             {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
                <Save size={18} />
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
               <tab.icon size={16} />
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
                  {activeTab === 'general' ? (
                     <>
                        {/* GENERAL SETTINGS CONTENT */}
                        <SettingsSection title="Interest Settings" icon={Percent}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Input 
                                label="Default Interest Rate (%)" 
                                type="number" 
                                value={formData.defaultInterestRate} 
                                onChange={(e) => handleInputChange('defaultInterestRate', Number(e.target.value))}
                                icon={Percent} 
                              />
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Type</label>
                                 <select 
                                   value={formData.interestType}
                                   onChange={(e) => handleInputChange('interestType', e.target.value)}
                                   className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                                 >
                                    <option value="Reducing Balance">Reducing Balance</option>
                                    <option value="Flat Rate">Flat Rate</option>
                                 </select>
                              </div>
                              <Input 
                                label="Min Interest (%)" 
                                type="number" 
                                value={formData.minInterestRate} 
                                onChange={(e) => handleInputChange('minInterestRate', Number(e.target.value))}
                                icon={TrendingUp} 
                              />
                              <Input 
                                label="Max Interest (%)" 
                                type="number" 
                                value={formData.maxInterestRate} 
                                onChange={(e) => handleInputChange('maxInterestRate', Number(e.target.value))}
                                icon={TrendingUp} 
                              />
                           </div>
                        </SettingsSection>

                        <SettingsSection title="Processing Fee Settings" icon={Wallet}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Type</label>
                                 <select 
                                   value={formData.processingFeeType}
                                   onChange={(e) => handleInputChange('processingFeeType', e.target.value)}
                                   className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                                 >
                                    <option value="Fixed Amount">Fixed Amount</option>
                                    <option value="Percentage">Percentage</option>
                                 </select>
                              </div>
                              <Input 
                                label={`Processing Fee Value (${formData.processingFeeType === 'Fixed Amount' ? 'R' : '%'})`} 
                                type="number"
                                value={formData.processingFeeValue} 
                                onChange={(e) => handleInputChange('processingFeeValue', Number(e.target.value))}
                                icon={Landmark} 
                              />
                           </div>
                           <ToggleSwitch 
                             label="Auto Apply Processing Fee" 
                             description="Automatically add fee to new loan applications" 
                             checked={formData.autoApplyProcessingFee} 
                             onChange={(checked) => handleInputChange('autoApplyProcessingFee', checked)}
                           />
                        </SettingsSection>

                        <SettingsSection title="Repayment Governance" icon={Clock}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <Input 
                                label="Grace Period Days" 
                                type="number" 
                                value={formData.gracePeriodDays} 
                                onChange={(e) => handleInputChange('gracePeriodDays', Number(e.target.value))}
                                icon={Clock} 
                              />
                              <Input 
                                label="Late Fee Amount (R)" 
                                type="number"
                                value={formData.lateFeeAmount} 
                                onChange={(e) => handleInputChange('lateFeeAmount', Number(e.target.value))}
                                icon={AlertCircle} 
                              />
                           </div>
                           <div className="space-y-4">
                              <ToggleSwitch 
                                label="Allow Grace Period" 
                                description="Enable grace period for all loan repayments" 
                                checked={formData.allowGracePeriod} 
                                onChange={(c) => handleInputChange('allowGracePeriod', c)}
                              />
                              <ToggleSwitch 
                                label="Auto Apply Late Fee" 
                                description="Charge fee immediately after grace expires" 
                                checked={formData.autoApplyLateFee} 
                                onChange={(c) => handleInputChange('autoApplyLateFee', c)}
                              />
                              <ToggleSwitch 
                                label="Grace Reminders" 
                                description="Notify borrower 24h before grace expires" 
                                checked={formData.graceReminders}
                                onChange={(c) => handleInputChange('graceReminders', c)}
                              />
                           </div>
                        </SettingsSection>

                        <SettingsSection title="Loan Configuration" icon={Briefcase}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Input 
                                label="System Minimum Amount (R)" 
                                type="number"
                                value={formData.minimumLoanAmount} 
                                onChange={(e) => handleInputChange('minimumLoanAmount', Number(e.target.value))}
                                icon={Wallet} 
                              />
                              <Input 
                                label="System Maximum Amount (R)" 
                                type="number"
                                value={formData.maximumLoanAmount} 
                                onChange={(e) => handleInputChange('maximumLoanAmount', Number(e.target.value))}
                                icon={TrendingUp} 
                              />
                           </div>
                        </SettingsSection>
                     </>
                  ) : (
                     <>
                        {/* ELIGIBILITY RULES CONTENT */}
                        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4 mb-8">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
                              <Info size={20} />
                           </div>
                           <div>
                              <p className="text-sm font-black text-blue-900">Eligibility Engine Connection</p>
                              <p className="text-[11px] font-bold text-blue-600/70 leading-relaxed mt-0.5">
                                 These eligibility settings automatically update Borrower Eligibility Info, Apply Loan validations, and Staff verification workflows.
                              </p>
                           </div>
                        </div>

                        <SettingsSection title="Basic Eligibility" icon={UserCheck}>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <Input 
                                label="Minimum Age" 
                                type="number" 
                                value={formData.minimumAge} 
                                onChange={(e) => handleInputChange('minimumAge', Number(e.target.value))}
                                icon={History} 
                              />
                              <Input 
                                label="Min. Monthly Income (R)" 
                                type="number" 
                                value={formData.minimumMonthlyIncome} 
                                onChange={(e) => handleInputChange('minimumMonthlyIncome', Number(e.target.value))}
                                icon={Wallet} 
                              />
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employment</label>
                                 <select 
                                   value={formData.employmentType}
                                   onChange={(e) => handleInputChange('employmentType', e.target.value)}
                                   className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner cursor-pointer"
                                 >
                                    <option value="Employed">Employed</option>
                                    <option value="Self Employed">Self Employed</option>
                                    <option value="Both">Employed / Self Employed</option>
                                 </select>
                              </div>
                           </div>
                        </SettingsSection>

                        <SettingsSection title="Loan Scope Rules" icon={Wallet}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Input 
                                label="Eligible Min Principal (R)" 
                                type="number"
                                value={formData.eligibleMinimumPrincipal} 
                                onChange={(e) => handleInputChange('eligibleMinimumPrincipal', Number(e.target.value))}
                                icon={Wallet} 
                              />
                              <Input 
                                label="Eligible Max Principal (R)" 
                                type="number"
                                value={formData.eligibleMaximumPrincipal} 
                                onChange={(e) => handleInputChange('eligibleMaximumPrincipal', Number(e.target.value))}
                                icon={TrendingUp} 
                              />
                              <div className="md:col-span-2">
                                 <Input 
                                   label="Allowed Repayment Durations (Months)" 
                                   placeholder="e.g., 3, 6, 12, 24"
                                   value={formData.allowedRepaymentDurations} 
                                   onChange={(e) => handleInputChange('allowedRepaymentDurations', e.target.value)}
                                   icon={Calendar} 
                                 />
                              </div>
                           </div>
                        </SettingsSection>

                        <SettingsSection title="Documentation & Verification" icon={ShieldCheck}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                              <Checkbox 
                                label="ID Verification Required" 
                                checked={formData.idVerificationRequired} 
                                onChange={(c) => handleInputChange('idVerificationRequired', c)}
                              />
                              <Checkbox 
                                label="Payslip Verification" 
                                checked={formData.payslipVerification} 
                                onChange={(c) => handleInputChange('payslipVerification', c)}
                              />
                              <Checkbox 
                                label="Bank Statement Review" 
                                checked={formData.bankStatementReview} 
                                onChange={(c) => handleInputChange('bankStatementReview', c)}
                              />
                              <Checkbox 
                                label="Proof of Address Audit" 
                                checked={formData.proofOfAddressAudit} 
                                onChange={(c) => handleInputChange('proofOfAddressAudit', c)}
                              />
                              <Checkbox 
                                label="Credit Bureau Integration" 
                                checked={formData.creditBureauIntegration} 
                                onChange={(c) => handleInputChange('creditBureauIntegration', c)}
                              />
                              <Checkbox 
                                label="Manual Staff Decision" 
                                checked={formData.manualStaffDecision} 
                                onChange={(c) => handleInputChange('manualStaffDecision', c)}
                              />
                           </div>
                           <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                    <Zap size={20} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-slate-900">System Validation Logic</p>
                                    <p className="text-[10px] font-bold text-slate-400">Apply auto-approval if documentation scores 100%.</p>
                                 </div>
                              </div>
                              <ToggleSwitch 
                                checked={formData.enableAutoApprovalLogic} 
                                onChange={(c) => handleInputChange('enableAutoApprovalLogic', c)}
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
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Sample Monthly Repayment</p>
                        <h2 className="text-4xl font-black text-white tracking-tight">R {previewData.monthlyRepayment.toLocaleString()}</h2>
                        <p className="text-[9px] font-bold text-slate-600 mt-2 italic">Calculated dynamically (Sample Principal: R 10,000 / 12m)</p>
                     </div>

                     {/* Breakdown */}
                     <div className="space-y-4 pt-6 border-t border-white/5">
                        <PreviewRow label="Min Principal" value={`R ${Number(previewData.minPrincipal).toLocaleString()}`} />
                        <PreviewRow label="Max Principal" value={`R ${Number(previewData.maxPrincipal).toLocaleString()}`} />
                        <PreviewRow label="Base Interest" value={previewData.baseInterest} />
                        <PreviewRow label="Processing Fee" value={formData.autoApplyProcessingFee ? `+ ${previewData.processingFee}` : 'Disabled'} />
                        <PreviewRow label="Penalty Grace" value={formData.allowGracePeriod ? previewData.penaltyGrace : '0 Days'} />
                     </div>

                     {/* Borrower Eligibility Snapshot */}
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Borrower Eligibility Snapshot</p>
                        <div className="flex flex-wrap gap-2">
                           <SnapshotBadge label={`Age ${formData.minimumAge}+`} />
                           <SnapshotBadge label={`Income R${formData.minimumMonthlyIncome / 1000}k+`} />
                           <SnapshotBadge label={formData.employmentType === 'Both' ? 'Any Income' : formData.employmentType} />
                           {formData.idVerificationRequired && <SnapshotBadge label="ID Req" />}
                           {formData.creditBureauIntegration && <SnapshotBadge label="Bureau Req" />}
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
                        This will wipe your custom configuration thresholds and restore system defaults (12.5% base interest, R250 setup fee). This will impact all NEW application flows instantly.
                     </p>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-50">
                     <Button variant="secondary" onClick={() => setIsResetModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={handleReset} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] shadow-lg shadow-rose-600/20 py-4">Confirm Reset</Button>
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
         {description && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className={cn(
         "w-12 h-6 rounded-full p-1 transition-all duration-300",
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
         checked ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
      )}>{label}</span>
   </label>
);

const PreviewRow = ({ label, value }) => (
   <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-black text-white">{value}</span>
   </div>
);

const SnapshotBadge = ({ label }) => (
   <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">
      {label}
   </div>
);

const LogicItem = ({ label, value }) => (
   <div className="flex justify-between items-center group">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
      <span className="text-[11px] font-black text-slate-900">{value}</span>
   </div>
);

export default Settings;
