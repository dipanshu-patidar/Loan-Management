import React, { useState } from 'react';
import { 
  Settings2, Save, RotateCcw, Percent, 
  DollarSign, Clock, AlertCircle, Briefcase,
  ChevronRight, Activity, ShieldCheck, CheckCircle2,
  Calculator, Info, Zap, Bell, ToggleLeft as Toggle,
  Wallet, TrendingUp, History, ShieldAlert, FileText,
  Landmark, UserCheck, CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'eligibility'
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings2 },
    { id: 'eligibility', label: 'Eligibility Rules', icon: ShieldCheck },
  ];

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
           <Button variant="secondary" className="flex items-center gap-2 font-bold px-6 border-slate-200">
             <RotateCcw size={18} /> Reset
           </Button>
           <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2 font-bold px-8 shadow-lg shadow-primary/20 bg-primary"
           >
             {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
                <Save size={18} />
             )}
             {isSaving ? 'Saving...' : 'Save Settings'}
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
                  "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
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
                              <Input label="Default Interest Rate (%)" type="number" defaultValue="12.5" icon={Percent} />
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Type</label>
                                 <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner">
                                    <option>Reducing Balance</option>
                                    <option>Flat Rate</option>
                                 </select>
                              </div>
                              <Input label="Min Interest (%)" type="number" defaultValue="8" icon={TrendingUp} />
                              <Input label="Max Interest (%)" type="number" defaultValue="25" icon={TrendingUp} />
                           </div>
                        </SettingsSection>

                        <SettingsSection title="Processing Fee Settings" icon={DollarSign}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Type</label>
                                 <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner">
                                    <option>Fixed Amount</option>
                                    <option>Percentage</option>
                                 </select>
                              </div>
                              <Input label="Processing Fee Value (R)" defaultValue="250" icon={Landmark} />
                           </div>
                           <ToggleSwitch label="Auto Apply Processing Fee" description="Automatically add fee to new loan applications" checked />
                        </SettingsSection>

                        <SettingsSection title="Repayment Governance" icon={Clock}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <Input label="Grace Period Days" type="number" defaultValue="3" icon={Clock} />
                              <Input label="Late Fee Amount (R)" defaultValue="150" icon={AlertCircle} />
                           </div>
                           <div className="space-y-4">
                              <ToggleSwitch label="Allow Grace Period" description="Enable grace period for all loan repayments" checked />
                              <ToggleSwitch label="Auto Apply Late Fee" description="Charge fee immediately after grace expires" checked />
                              <ToggleSwitch label="Grace Reminders" description="Notify borrower 24h before grace expires" />
                           </div>
                        </SettingsSection>

                        <SettingsSection title="Loan Configuration" icon={Briefcase}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Input label="System Minimum Amount" defaultValue="R 1,000" icon={Wallet} />
                              <Input label="System Maximum Amount" defaultValue="R 100,000" icon={TrendingUp} />
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
                              <Input label="Minimum Age" type="number" defaultValue="18" icon={History} />
                              <Input label="Min. Monthly Income" type="number" defaultValue="5000" icon={DollarSign} />
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employment</label>
                                 <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner">
                                    <option>Employed / Self</option>
                                    <option>Any Income Source</option>
                                 </select>
                              </div>
                           </div>
                        </SettingsSection>

                        <SettingsSection title="Loan Scope Rules" icon={Wallet}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Input label="Eligible Min Principal" defaultValue="1000" icon={DollarSign} />
                              <Input label="Eligible Max Principal" defaultValue="50000" icon={TrendingUp} />
                              <div className="md:col-span-2">
                                 <Input label="Allowed Repayment Durations" defaultValue="3, 6, 12, 18, 24 Months" icon={CalendarRange} />
                              </div>
                           </div>
                        </SettingsSection>

                        <SettingsSection title="Documentation & Verification" icon={ShieldCheck}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                              <Checkbox label="ID Verification Required" checked />
                              <Checkbox label="Payslip Verification" checked />
                              <Checkbox label="Bank Statement Review" checked />
                              <Checkbox label="Proof of Address Audit" checked />
                              <Checkbox label="Credit Bureau Integration" />
                              <Checkbox label="Manual Staff Decision" checked />
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
                              <ToggleSwitch checked={false} />
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
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>

                  <div className="relative z-10 space-y-8">
                     {/* EMI Preview */}
                     <div className="text-center">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Monthly Repayment</p>
                        <h2 className="text-4xl font-black text-white tracking-tight">R 1,250</h2>
                        <p className="text-[9px] font-bold text-slate-600 mt-2 italic">Based on current General Settings</p>
                     </div>

                     {/* Breakdown */}
                     <div className="space-y-4 pt-6 border-t border-white/5">
                        <PreviewRow label="Min Principal" value="R 1,000" />
                        <PreviewRow label="Max Principal" value="R 50,000" />
                        <PreviewRow label="Base Interest" value="12.5%" />
                        <PreviewRow label="Processing Fee" value="+ R 250" />
                        <PreviewRow label="Penalty Grace" value="3 Days" />
                     </div>

                     {/* Borrower Eligibility Snapshot */}
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Borrower Eligibility Info</p>
                        <div className="flex flex-wrap gap-2">
                           <SnapshotBadge label="Age 18+" />
                           <SnapshotBadge label="Income R5k+" />
                           <SnapshotBadge label="ID Verified" />
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
                     <LogicItem label="Interest Basis" value="Reducing Balance" />
                     <LogicItem label="Fee Frequency" value="Once per loan" />
                     <LogicItem label="Penalty Basis" value="Fixed System Fee" />
                     <LogicItem label="Review Flow" value="Manual Staff Desk" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Success Toast */}
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
                  <p className="text-sm font-black tracking-tight">System Settings Updated!</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Centralized logic applied successfully</p>
               </div>
            </motion.div>
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

const ToggleSwitch = ({ label, description, checked }) => (
   <div className="flex items-center justify-between group cursor-pointer">
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

const Checkbox = ({ label, checked }) => (
   <label className="flex items-center gap-3 cursor-pointer group">
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
   <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60">
      {label}
   </div>
);

const LogicItem = ({ label, value }) => (
   <div className="flex justify-between items-center group">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
      <span className="text-[11px] font-black text-slate-900">{value}</span>
   </div>
);

// Helper for CalendarRange if missing
import { Calendar as CalendarRange } from 'lucide-react';

export default Settings;
