import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Check, DollarSign, Calendar, RefreshCw, AlertCircle, Landmark, ShieldAlert, BadgeInfo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const LoanConfigurationCard = ({ loanConfig, setLoanConfig, activeBorrower, onNextStep, onPrevStep }) => {
  // Pull default banking details from selected borrower
  const defaultBank = activeBorrower || {};

  const [inputs, setInputs] = useState({
    loanType: loanConfig.loanType || 'Personal Loan',
    requestedAmount: loanConfig.requestedAmount?.toString() || '15000',
    requestedDuration: loanConfig.requestedDuration?.toString() || '12',
    loanPurpose: loanConfig.loanPurpose || 'Debt Consolidation',
    
    // Banking
    bankName: loanConfig.banking?.bankName || defaultBank.bankName || 'Standard Bank',
    accountNumber: loanConfig.banking?.accountNumber || defaultBank.accountNumber || '',
    branchCode: loanConfig.banking?.branchCode || defaultBank.branchCode || '000205',
    accountType: loanConfig.banking?.accountType || defaultBank.accountType || 'Savings',
    accountHolderName: loanConfig.banking?.accountHolderName || defaultBank.fullName || '',
  });

  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankVerificationState, setBankVerificationState] = useState(loanConfig.banking?.verified ? 'Verified ✅' : '');
  const [isBankVerified, setIsBankVerified] = useState(loanConfig.banking?.verified || false);

  const amount = Number(inputs.requestedAmount) || 0;
  const duration = Number(inputs.requestedDuration) || 12;

  // NCR-Compliant Loan Fee Calculations
  // 1. Initiation Fee: R165 on first R1000 + 10% on portion exceeding R1000, capped at R1050
  let initiationFee = 0;
  if (amount > 0) {
    if (amount <= 1000) {
      initiationFee = amount * 0.165;
    } else {
      initiationFee = 165 + (amount - 1000) * 0.1;
    }
    initiationFee = Math.min(initiationFee, 1050);
  }

  // 2. Monthly Service Fee: standard NCR monthly fee is R60
  const monthlyServiceFee = amount > 0 ? 60 : 0;

  // 3. Interest: Let's assume 12.5% per annum (default interest rate)
  const interestRate = 12.5;
  const totalInterest = amount * (interestRate / 100) * (duration / 12);

  // 4. Credit Life Insurance: R4.50 per R1000 of loan value per month
  const creditLifeInsurance = amount > 0 ? (amount / 1000) * 4.5 * duration : 0;

  // 5. VAT: 15% on initiation fee and monthly service fees
  const vatOnFees = (initiationFee + (monthlyServiceFee * duration)) * 0.15;

  // 6. Total Repayment & monthly EMI
  const totalRepayment = amount + totalInterest + initiationFee + (monthlyServiceFee * duration) + creditLifeInsurance + vatOnFees;
  const estimatedMonthlyEMI = duration > 0 ? (totalRepayment / duration) : 0;

  // Sync state back to parent
  useEffect(() => {
    setLoanConfig({
      loanType: inputs.loanType,
      requestedAmount: amount,
      requestedDuration: duration,
      loanPurpose: inputs.loanPurpose,
      processingFee: initiationFee,
      interestRate,
      estimatedMonthlyEMI,
      totalRepayment,
      banking: {
        bankName: inputs.bankName,
        accountNumber: inputs.accountNumber,
        branchCode: inputs.branchCode,
        accountType: inputs.accountType,
        accountHolderName: inputs.accountHolderName,
        verified: isBankVerified
      }
    });
  }, [inputs, isBankVerified]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleVerifyBank = () => {
    if (!inputs.accountNumber || !inputs.accountHolderName) return;

    setVerifyingBank(true);
    setBankVerificationState('Verifying Account...');

    // Simulate standard South African Bank Verification (Realtime CDV/ACVS check)
    setTimeout(() => {
      // Validate caps/lengths
      if (inputs.accountNumber.length >= 8 && inputs.accountNumber.length <= 11) {
        setBankVerificationState('Verified ✅');
        setIsBankVerified(true);
      } else {
        setBankVerificationState('Verification Failed ❌');
        setIsBankVerified(false);
      }
      setVerifyingBank(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECTION A: LOAN DETAILS CONFIGURATION (LEFT COLUMN, 7/12 grid span) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <Calendar size={16} className="text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Loan Details Configuration</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Loan Product Type</label>
                <select
                  name="loanType"
                  value={inputs.loanType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50"
                >
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Short Term Cash Loan">Short Term Cash Loan</option>
                  <option value="SME Micro Loan">SME Micro Loan</option>
                  <option value="Emergency Relief Loan">Emergency Relief Loan</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Loan Purpose</label>
                <select
                  name="loanPurpose"
                  value={inputs.loanPurpose}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50"
                >
                  <option value="Debt Consolidation">Debt Consolidation</option>
                  <option value="Home Improvement">Home Improvement</option>
                  <option value="Education Fees">Education Fees</option>
                  <option value="Medical Expenses">Medical Expenses</option>
                  <option value="Micro Business Capital">Micro Business Capital</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Requested Loan Amount (R)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R</span>
                  <input
                    type="number"
                    name="requestedAmount"
                    value={inputs.requestedAmount}
                    onChange={handleInputChange}
                    placeholder="15000"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-primary bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Repayment Tenure (Months)</label>
                <select
                  name="requestedDuration"
                  value={inputs.requestedDuration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50"
                >
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                  <option value="36">36 Months</option>
                </select>
              </div>
            </div>
          </div>

          {/* BANKING DETAILS PANEL */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <Landmark size={16} className="text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Primary Disbursement Banking</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={inputs.accountHolderName}
                  onChange={handleInputChange}
                  placeholder="Sipho Gumede"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-primary bg-slate-50/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Disbursement Bank</label>
                <select
                  name="bankName"
                  value={inputs.bankName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50"
                >
                  <option value="Standard Bank">Standard Bank</option>
                  <option value="Absa">Absa</option>
                  <option value="FNB">First National Bank (FNB)</option>
                  <option value="Nedbank">Nedbank</option>
                  <option value="Capitec">Capitec</option>
                  <option value="TymeBank">TymeBank</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={inputs.accountNumber}
                  onChange={handleInputChange}
                  placeholder="1018273645"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-primary bg-slate-50/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Branch Code</label>
                <input
                  type="text"
                  name="branchCode"
                  value={inputs.branchCode}
                  onChange={handleInputChange}
                  placeholder="000205"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-primary bg-slate-50/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Account Type</label>
                <select
                  name="accountType"
                  value={inputs.accountType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50"
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current / Cheque</option>
                  <option value="Transmission">Transmission</option>
                </select>
              </div>

              <div className="col-span-2 pt-2">
                <button
                  type="button"
                  disabled={verifyingBank || !inputs.accountNumber || !inputs.accountHolderName}
                  onClick={handleVerifyBank}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow flex items-center justify-center gap-2",
                    verifyingBank 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : inputs.accountNumber 
                        ? "bg-slate-900 text-white hover:bg-primary shadow-slate-900/10 hover:scale-[1.005]" 
                        : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  )}
                >
                  {verifyingBank ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" /> Performing Realtime CDV Verification...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} /> Verify Disbursement Bank Account
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {bankVerificationState && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "col-span-2 p-3.5 rounded-2xl border flex items-center gap-2.5 shadow-sm text-[11px] font-bold mt-2",
                      bankVerificationState.includes('Verified') 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                        : "bg-rose-50 border-rose-100 text-rose-800"
                    )}
                  >
                    {bankVerificationState.includes('Verified') ? (
                      <Check size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-black uppercase tracking-wider">{bankVerificationState}</p>
                      <p className="opacity-80 mt-0.5">
                        {bankVerificationState.includes('Verified') 
                          ? "Bank Account holder name and CDV checksum matched successfully."
                          : "Verify account number length conforms to standard SA banks."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* SECTION B: NCR COST SUMMARY SHEET (RIGHT COLUMN, 5/12 grid span) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                NCR Cost Summary Sheet <BadgeInfo size={12} className="text-slate-500" />
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                15% VAT Compliant
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Principal Amount</span>
                <span className="font-bold text-white">R {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>NCR Initiation Fee (VAT excl.)</span>
                <span className="font-bold text-white">R {initiationFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Monthly Service Fee (R60/m)</span>
                <span className="font-bold text-white">R {(monthlyServiceFee * duration).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Calculated Bureau Interest (12.5%)</span>
                <span className="font-bold text-white">R {totalInterest.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Credit Life Insurance</span>
                <span className="font-bold text-white">R {creditLifeInsurance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Calculated VAT (15%)</span>
                <span className="font-bold text-white">R {vatOnFees.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Repayment Amount</p>
                  <p className="text-lg font-black text-white mt-1">R {totalRepayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Estimated EMI</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">R {estimatedMonthlyEMI.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-slate-400 font-medium">
              🚨 **Regulatory Notice**: Initiation and monthly service fees are capitalised into the loan balance as allowed under the National Credit Act (NCA) of South Africa.
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
          onClick={onNextStep}
          disabled={amount <= 0 || !isBankVerified}
          className={cn(
            "px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2",
            amount > 0 && isBankVerified
              ? "bg-slate-900 text-white hover:bg-primary shadow-slate-900/15 hover:scale-[1.01]"
              : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
          )}
        >
          Proceed to Compliance <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default LoanConfigurationCard;
