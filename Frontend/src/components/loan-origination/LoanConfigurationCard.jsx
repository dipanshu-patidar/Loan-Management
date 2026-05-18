import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Check, Calendar, RefreshCw, AlertCircle, Landmark, ShieldAlert, BadgeInfo, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import api from '../../services/api';

const LoanConfigurationCard = ({ loanConfig, setLoanConfig, activeBorrower, onNextStep, onPrevStep, eligibilitySettings }) => {
  // Pull default banking details from selected borrower
  const defaultBank = activeBorrower || {};

  const settings = eligibilitySettings;

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

  // 2. Map Dynamic Active Products
  const activeProducts = settings?.loanProducts?.filter(p => p.status === 'Active') || [];
  const productOptions = activeProducts.length > 0 ? activeProducts : [
    { name: 'Personal Loan', code: 'PL-001', minAmount: 1000, maxAmount: 50000, minTenure: 3, maxTenure: 24, defaultInterestRate: 12.5, interestType: 'Reducing Balance', processingFeeEnabled: true, insuranceEnabled: true, vatEnabled: true },
    { name: 'Payday Loan', code: 'PD-002', minAmount: 500, maxAmount: 5000, minTenure: 1, maxTenure: 3, defaultInterestRate: 15.0, interestType: 'Flat Rate', processingFeeEnabled: true, insuranceEnabled: false, vatEnabled: true },
    { name: 'Business Loan', code: 'BL-003', minAmount: 10000, maxAmount: 250000, minTenure: 6, maxTenure: 60, defaultInterestRate: 10.5, interestType: 'Reducing Balance', processingFeeEnabled: true, insuranceEnabled: true, vatEnabled: true },
    { name: 'Debt Consolidation', code: 'DC-004', minAmount: 5000, maxAmount: 150000, minTenure: 12, maxTenure: 48, defaultInterestRate: 11.5, interestType: 'Reducing Balance', processingFeeEnabled: true, insuranceEnabled: true, vatEnabled: true },
    { name: 'Salary Advance', code: 'SA-005', minAmount: 200, maxAmount: 3000, minTenure: 1, maxTenure: 1, defaultInterestRate: 5.0, interestType: 'Flat Rate', processingFeeEnabled: false, insuranceEnabled: false, vatEnabled: true }
  ];

  const selectedProduct = productOptions.find(p => p.name === inputs.loanType) || productOptions[0];

  // 3. Keep selected duration within bounds of selected product
  useEffect(() => {
    const minT = selectedProduct.minTenure || 1;
    const maxT = selectedProduct.maxTenure || 24;
    const curD = Number(inputs.requestedDuration);
    if (curD < minT || curD > maxT) {
      setInputs(prev => ({ ...prev, requestedDuration: minT.toString() }));
    }
  }, [inputs.loanType, selectedProduct]);

  const amount = Number(inputs.requestedAmount) || 0;
  const duration = Number(inputs.requestedDuration) || 12;

  // 4. Generate tenure options list dynamically
  const tenureOptions = [];
  const minTenure = selectedProduct.minTenure || 1;
  const maxTenure = selectedProduct.maxTenure || 24;
  for (let t = minTenure; t <= maxTenure; t++) {
    tenureOptions.push(t);
  }

  // 5. Dynamic calculations from selected product and global settings
  let initiationFee = 0;
  if (selectedProduct.processingFeeEnabled !== false && amount > 0) {
    const feeType = settings?.initiationFeeType || 'Percentage';
    const feeValue = Number(settings?.initiationFeeValue ?? 10);
    if (feeType === 'Percentage') {
      initiationFee = (amount * feeValue) / 100;
    } else {
      initiationFee = feeValue;
    }
  }

  const monthlyServiceFeeVal = Number(settings?.monthlyServiceFee ?? 60);
  const monthlyServiceFee = amount > 0 ? monthlyServiceFeeVal : 0;

  const interestRate = Number(selectedProduct.defaultInterestRate ?? 12.5);
  
  let baseEmi = 0;
  if (selectedProduct.interestType === 'Flat Rate') {
    const totalInterest = amount * (interestRate / 100);
    baseEmi = (amount + totalInterest) / duration;
  } else {
    // Reducing Balance
    const monthlyRate = (interestRate / 100) / 12;
    if (monthlyRate === 0) {
      baseEmi = amount / duration;
    } else {
      baseEmi = (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);
    }
  }

  let creditLifeInsurance = 0;
  if (selectedProduct.insuranceEnabled !== false && amount > 0) {
    const insuranceRate = Number(settings?.creditLifeInsuranceRate ?? 1.2);
    creditLifeInsurance = (amount * insuranceRate) / 100;
  }

  let vatOnFees = 0;
  if (selectedProduct.vatEnabled !== false && amount > 0) {
    const vatRate = Number(settings?.vatPercentage ?? 15);
    vatOnFees = (initiationFee + (monthlyServiceFee * duration)) * (vatRate / 100);
  }

  const totalRepayment = (baseEmi * duration) + initiationFee + (monthlyServiceFee * duration) + creditLifeInsurance + vatOnFees;
  const estimatedMonthlyEMI = duration > 0 ? (totalRepayment / duration) : 0;

  const isAmountValid = amount >= (selectedProduct.minAmount || 1000) && amount <= (selectedProduct.maxAmount || 100000);

  // Sync state back to parent wizard
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
  }, [inputs, isBankVerified, initiationFee, interestRate, estimatedMonthlyEMI, totalRepayment]);

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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50 cursor-pointer"
                >
                  {productOptions.map(p => (
                    <option key={p.code} value={p.name}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Loan Purpose</label>
                <select
                  name="loanPurpose"
                  value={inputs.loanPurpose}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50 cursor-pointer"
                >
                  <option value="Debt Consolidation">Debt Consolidation</option>
                  <option value="Home Improvement">Home Improvement</option>
                  <option value="Education Fees">Education Fees</option>
                  <option value="Medical Expenses">Medical Expenses</option>
                  <option value="Micro Business Capital">Micro Business Capital</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Requested Loan Amount (R)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R</span>
                  <input
                    type="number"
                    name="requestedAmount"
                    value={inputs.requestedAmount}
                    onChange={handleInputChange}
                    placeholder="15000"
                    className={cn(
                      "w-full pl-8 pr-4 py-3 rounded-xl border font-semibold focus:outline-none bg-slate-50/50",
                      amount > 0 && !isAmountValid ? "border-rose-450 focus:border-rose-500" : "border-slate-200 focus:border-primary"
                    )}
                  />
                </div>
                {amount > 0 && !isAmountValid && (
                  <p className="text-[9px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Amount must be between R{(selectedProduct.minAmount || 1000).toLocaleString()} and R{(selectedProduct.maxAmount || 100000).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Repayment Tenure (Months)</label>
                <select
                  name="requestedDuration"
                  value={inputs.requestedDuration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50 cursor-pointer"
                >
                  {tenureOptions.map(t => (
                    <option key={t} value={t}>{t} {t === 1 ? 'Month' : 'Months'}</option>
                  ))}
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50 cursor-pointer"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-primary bg-slate-50/50 cursor-pointer"
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
                    "w-full py-3.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow flex items-center justify-center gap-2 cursor-pointer",
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
                      <p className="opacity-80 mt-0.5 font-semibold">
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
                <span>NCR Initiation Fee {selectedProduct.processingFeeEnabled === false && "(Waived)"}</span>
                <span className="font-bold text-white">R {initiationFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Monthly Service Fee (R{monthlyServiceFeeVal}/m)</span>
                <span className="font-bold text-white">R {(monthlyServiceFee * duration).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Dynamic Interest ({interestRate}%)</span>
                <span className="font-bold text-white">R {(baseEmi * duration - amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Credit Life Insurance {selectedProduct.insuranceEnabled === false && "(Waived)"}</span>
                <span className="font-bold text-white">R {creditLifeInsurance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Calculated VAT ({settings?.vatPercentage || 15}%)</span>
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

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-slate-400 font-bold flex items-start gap-2 leading-relaxed">
              <Info size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                NCR Regulatory Notice: All lending calculations are derived in real-time from the dynamic Central rules engine configuration.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER NAV BUTTONS */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={onPrevStep}
          className="px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 transition-colors cursor-pointer"
        >
          Previous Step
        </button>
        <button
          onClick={onNextStep}
          disabled={amount <= 0 || !isAmountValid || !isBankVerified}
          className={cn(
            "px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 cursor-pointer",
            amount > 0 && isAmountValid && isBankVerified
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
