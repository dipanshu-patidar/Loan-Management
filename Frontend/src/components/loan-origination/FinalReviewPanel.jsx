import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Check, Info, FileText, User, Landmark, HelpCircle, ShieldAlert, Sparkles, Scale, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const FinalReviewPanel = ({ 
  activeBorrower, 
  affordability, 
  loanConfig, 
  documents, 
  onSubmit, 
  submitting, 
  onPrevStep,
  eligibilitySettings
}) => {
  const [popiaAccepted, setPopiaAccepted] = useState(false);
  const [creditConsentAccepted, setCreditConsentAccepted] = useState(false);

  const totalIncome = affordability.income?.totalIncome || 0;
  const totalExpenses = affordability.expenses?.totalExpenses || 0;
  const disposableIncome = affordability.disposableIncome || 0;
  const debtToIncomeRatio = affordability.debtToIncomeRatio || 0;

  const isFormReadyForSubmit = popiaAccepted && creditConsentAccepted && !submitting;

  return (
    <div className="space-y-8">
      
      {/* SUMMARY GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: BORROWER PROFILE */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-soft space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50 text-slate-400">
            <User size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest">Borrower Profile</span>
          </div>
          <div className="text-xs space-y-2">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
              <p className="font-bold text-slate-800 mt-0.5">{activeBorrower?.fullName}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ID / Passport Number</p>
              <p className="font-bold text-slate-800 mt-0.5">{activeBorrower?.idNumber}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</p>
              <p className="font-bold text-slate-800 mt-0.5">{activeBorrower?.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* CARD 2: AFFORDABILITY */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-soft space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50 text-slate-400">
            <Scale size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest">Affordability Desk</span>
          </div>
          <div className="text-xs space-y-2">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Gross Income</p>
              <p className="font-bold text-slate-800 mt-0.5">R {totalIncome.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Monthly Expenses</p>
              <p className="font-bold text-slate-800 mt-0.5">R {totalExpenses.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Net Disposable Income</p>
              <p className="font-bold text-emerald-600 mt-0.5">R {disposableIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* CARD 3: DISBURSEMENT BANKING */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-soft space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50 text-slate-400">
            <Landmark size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest">Disbursement Bank</span>
          </div>
          <div className="text-xs space-y-2">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bank Name</p>
              <p className="font-bold text-slate-800 mt-0.5">{loanConfig.banking?.bankName}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Account Number</p>
              <p className="font-bold text-slate-800 mt-0.5">{loanConfig.banking?.accountNumber}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Account Verification</p>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100 mt-0.5 inline-block">
                CDV Verified ✅
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: LOAN ESTIMATE */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-soft space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50 text-slate-400">
            <FileText size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest">Loan Cost Estimate</span>
          </div>
          <div className="text-xs space-y-2">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Requested Loan Amount</p>
              <p className="font-bold text-slate-800 mt-0.5">R {loanConfig.requestedAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tenure</p>
              <p className="font-bold text-slate-800 mt-0.5">{loanConfig.requestedDuration} Months</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Monthly EMI</p>
              <p className="font-black text-emerald-600 mt-0.5">R {loanConfig.estimatedMonthlyEMI?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m</p>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COMPLIANCE CONSENT CHECKBOXES (LEFT COLUMN, 7/12 grid span) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <ShieldCheck size={16} className="text-primary" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Compliance & Regulatory Consents</h4>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors border border-slate-100">
              <input
                type="checkbox"
                checked={popiaAccepted}
                onChange={(e) => setPopiaAccepted(e.target.checked)}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs font-bold text-slate-700">POPIA Privacy Act Compliance Acknowledgement</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  I certify that all borrower documents and biometric data are processed in accordance with the Protection of Personal Information Act (POPIA) of South Africa.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors border border-slate-100">
              <input
                type="checkbox"
                checked={creditConsentAccepted}
                onChange={(e) => setCreditConsentAccepted(e.target.checked)}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs font-bold text-slate-700">Bureau Credit Record Search Consent</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  The borrower has formally consented to a hard inquiry check against South African credit bureaus (TransUnion, Experian) to verify credit score and active debt.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* AUDIT TIMELINE AND RISK SCORE (RIGHT COLUMN, 5/12 grid span) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Rules Engine</span>
              <span className={cn(
                "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                debtToIncomeRatio <= 45 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              )}>
                {debtToIncomeRatio <= 45 ? "Compliant" : "High Risk Warning"}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* 1. Age Check */}
              {(() => {
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
                const age = activeBorrower?.dateOfBirth ? calculateAge(activeBorrower.dateOfBirth) : 30;
                const minAge = eligibilitySettings?.minimumAge || 18;
                const maxAge = eligibilitySettings?.maximumAge || 65;
                const isAgeOk = age >= minAge && age <= maxAge;
                return (
                  <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] font-black text-white", isAgeOk ? "bg-emerald-500" : "bg-rose-500")}>
                        {isAgeOk ? "✓" : "✗"}
                      </div>
                      <span>Age Rule ({minAge}-{maxAge} yrs)</span>
                    </span>
                    <span className={cn("font-bold", isAgeOk ? "text-emerald-400" : "text-rose-400")}>{age} years</span>
                  </div>
                );
              })()}

              {/* 2. Income Check */}
              {(() => {
                const minIncome = eligibilitySettings?.minSalaryRequirement || eligibilitySettings?.minimumMonthlyIncome || 5000;
                const isIncomeOk = totalIncome >= minIncome;
                return (
                  <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] font-black text-white", isIncomeOk ? "bg-emerald-500" : "bg-rose-500")}>
                        {isIncomeOk ? "✓" : "✗"}
                      </div>
                      <span>Gross Income (Min R{minIncome.toLocaleString()})</span>
                    </span>
                    <span className={cn("font-bold", isIncomeOk ? "text-emerald-400" : "text-rose-400")}>R {totalIncome.toLocaleString()}</span>
                  </div>
                );
              })()}

              {/* 3. Debt-To-Income Check */}
              {(() => {
                const maxDti = eligibilitySettings?.maxDebtToIncomeRatio || 45;
                const isDtiOk = debtToIncomeRatio <= maxDti;
                return (
                  <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] font-black text-white", isDtiOk ? "bg-emerald-500" : "bg-rose-500")}>
                        {isDtiOk ? "✓" : "✗"}
                      </div>
                      <span>Max DTI Allowed ({maxDti}%)</span>
                    </span>
                    <span className={cn("font-bold", isDtiOk ? "text-emerald-400" : "text-rose-400")}>{debtToIncomeRatio.toFixed(1)}%</span>
                  </div>
                );
              })()}

              {/* 4. Employment Sector Check */}
              {(() => {
                const allowedCategories = eligibilitySettings?.employmentCategories || ['Permanently Employed', 'Contract Worker', 'Self Employed', 'Government Employee'];
                const status = activeBorrower?.employmentStatus || 'Employed';
                const isCategoryOk = allowedCategories.some(cat => 
                  cat.toLowerCase().replace(/[^a-z]/g, '').includes(status.toLowerCase().replace(/[^a-z]/g, '')) ||
                  status.toLowerCase().replace(/[^a-z]/g, '').includes(cat.toLowerCase().replace(/[^a-z]/g, ''))
                );
                return (
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] font-black text-white", isCategoryOk ? "bg-emerald-500" : "bg-rose-500")}>
                        {isCategoryOk ? "✓" : "✗"}
                      </div>
                      <span>Employment Sector</span>
                    </span>
                    <span className={cn("font-bold truncate max-w-[120px]", isCategoryOk ? "text-emerald-400" : "text-rose-400")}>{status}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* DYNAMIC RISK & RECOMMENDATION FOOTER */}
          <div className="pt-4 border-t border-white/10 space-y-3.5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Risk Profile Rating</p>
                <p className={cn(
                  "text-[9px] font-black uppercase tracking-wider mt-1 px-2.5 py-0.5 rounded-full border inline-block",
                  debtToIncomeRatio <= 30 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : debtToIncomeRatio <= 45 
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  {debtToIncomeRatio <= 30 ? "Low Risk Profile ✅" : debtToIncomeRatio <= 45 ? "Moderate Risk ⚠️" : "High Risk Profile 🚨"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dynamic Approval Recommendation</p>
                <p className="text-[11px] font-black text-white mt-1">
                  {totalIncome >= (eligibilitySettings?.minSalaryRequirement || eligibilitySettings?.minimumMonthlyIncome || 5000) && debtToIncomeRatio <= (eligibilitySettings?.maxDebtToIncomeRatio || 45)
                    ? "Auto-Review: Recommended ✅" 
                    : "Manual Underwrite Required"}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER NAV BUTTONS */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={onPrevStep}
          className="px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 transition-colors"
        >
          Previous Step
        </button>
        <button
          onClick={onSubmit}
          disabled={!isFormReadyForSubmit || submitting}
          className={cn(
            "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2",
            isFormReadyForSubmit
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/15 hover:scale-[1.01]"
              : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
          )}
        >
          {submitting ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Submitting Application...
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> Submit Loan Application
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FinalReviewPanel;
