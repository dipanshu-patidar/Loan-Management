import React, { useState, useEffect } from 'react';
import { Upload, X, Check, FileText, AlertCircle, ArrowRight, ShieldCheck, DollarSign, Percent, Scale, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BorrowerLoanService from '../../services/BorrowerLoanService';
import api from '../../services/api';
import { cn } from '../../utils/cn';

const AffordabilitySection = ({ affordability, setAffordability, documents, setDocuments, onNextStep, onPrevStep, eligibilitySettings }) => {
  const settings = eligibilitySettings;

  // Local state for numeric income/expense strings to make input typing comfortable
  const [inputs, setInputs] = useState({
    basicSalary: affordability.income?.basicSalary?.toString() || '',
    allowances: affordability.income?.allowances?.toString() || '',
    overtime: affordability.income?.overtime?.toString() || '',
    otherIncome: affordability.income?.otherIncome?.toString() || '',
    taxes: affordability.expenses?.taxes?.toString() || '',
    rentMortgage: affordability.expenses?.rentMortgage?.toString() || '',
    debtRepayments: affordability.expenses?.debtRepayments?.toString() || '',
    livingExpenses: affordability.expenses?.livingExpenses?.toString() || '',
  });

  // Upload state
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState({});
  const [uploadError, setUploadError] = useState('');

  // Calculations
  const basic = Number(inputs.basicSalary) || 0;
  const allowances = Number(inputs.allowances) || 0;
  const overtime = Number(inputs.overtime) || 0;
  const other = Number(inputs.otherIncome) || 0;
  const totalIncome = basic + allowances + overtime + other;

  const taxes = Number(inputs.taxes) || 0;
  const rent = Number(inputs.rentMortgage) || 0;
  const debt = Number(inputs.debtRepayments) || 0;
  const living = Number(inputs.livingExpenses) || 0;
  const totalExpenses = taxes + rent + debt + living;

  const disposableIncome = totalIncome - totalExpenses;
  const debtToIncomeRatio = totalIncome > 0 ? ((debt + rent) / totalIncome) * 100 : 0;

  // Build dynamic compliance checks from Settings
  const maxDti = Number(settings?.maxDtiPercentage ?? 40);
  const minDisposable = Number(settings?.minDisposableIncome ?? 2000);
  const minIncomeLimit = Number(settings?.minSalaryRequirement ?? settings?.minimumMonthlyIncome ?? 5000);

  const isDtiCompliant = debtToIncomeRatio <= maxDti;
  const isDisposableCompliant = disposableIncome >= minDisposable;
  const isIncomeCompliant = totalIncome >= minIncomeLimit;

  // Standard NCR living expenses minimum benchmark threshold
  let ncrBenchmark = 0;
  if (totalIncome > 0) {
    if (totalIncome <= 800) {
      ncrBenchmark = totalIncome;
    } else if (totalIncome <= 6250) {
      ncrBenchmark = 800 + (totalIncome - 800) * 0.067;
    } else {
      ncrBenchmark = 1165 + (totalIncome - 6250) * 0.09;
    }
  }

  const isNcrCompliant = totalIncome > 0 && living >= ncrBenchmark && isDtiCompliant && isDisposableCompliant && isIncomeCompliant;

  // Build dynamic REQUIRED_DOCS based on settings checklist
  const REQUIRED_DOCS = [];
  if (settings) {
    if (settings.idDocumentRequired ?? settings.idVerificationRequired ?? true) REQUIRED_DOCS.push('ID Document');
    if (settings.payslipRequired ?? settings.payslipVerification ?? true) REQUIRED_DOCS.push('Payslip');
    if (settings.bankStatementRequired ?? settings.bankStatementReview ?? true) REQUIRED_DOCS.push('Bank Statement');
    if (settings.proofOfAddressRequired ?? settings.proofOfAddressAudit ?? true) REQUIRED_DOCS.push('Proof Of Address');
  } else {
    // Default safe fallbacks
    REQUIRED_DOCS.push('ID Document', 'Payslip', 'Bank Statement', 'Proof Of Address');
  }

  const hasUploadedAllDocs = REQUIRED_DOCS.every(type => documents.some(d => d.type === type));

  // Sync calculations back to parent state when inputs change
  useEffect(() => {
    setAffordability({
      income: {
        basicSalary: basic,
        allowances,
        overtime,
        otherIncome: other,
        totalIncome
      },
      expenses: {
        taxes,
        rentMortgage: rent,
        debtRepayments: debt,
        livingExpenses: living,
        totalExpenses
      },
      disposableIncome,
      debtToIncomeRatio,
      isNcrCompliant
    });
  }, [inputs, isNcrCompliant]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  // Upload handler
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(prev => ({ ...prev, [type]: true }));
    setUploadProgress(prev => ({ ...prev, [type]: 10 }));
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await BorrowerLoanService.uploadDocumentOnly(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(prev => ({ ...prev, [type]: percentCompleted }));
      });

      if (res.success && res.data) {
        // Success
        setDocuments(prev => {
          // Remove existing of same type if present
          const filtered = prev.filter(doc => doc.type !== type);
          return [
            ...filtered,
            {
              type,
              url: res.data.url,
              fileId: res.data.fileId,
              fileName: res.data.fileName || file.name,
              fileSize: res.data.fileSize || file.size
            }
          ];
        });
      }
    } catch (err) {
      console.error('Upload Error:', err);
      setUploadError(`Failed to upload ${type}: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploadingDoc(prev => ({ ...prev, [type]: false }));
    }
  };

  const removeDocument = (type) => {
    setDocuments(prev => prev.filter(doc => doc.type !== type));
  };

  const getDocStatus = (type) => {
    const found = documents.find(d => d.type === type);
    if (found) return { status: 'uploaded', name: found.fileName };
    if (uploadingDoc[type]) return { status: 'uploading', progress: uploadProgress[type] };
    return { status: 'empty' };
  };

  return (
    <div className="space-y-8">
      {/* SECTION A: FINANCIAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INCOME FORM (LEFT SIDE, 4/12 grid span) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <DollarSign size={16} className="text-emerald-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Monthly Gross Income</h4>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Basic Salary (R)</label>
              <input
                type="number"
                name="basicSalary"
                value={inputs.basicSalary}
                onChange={handleInputChange}
                placeholder="25000"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none bg-slate-50/50",
                  totalIncome > 0 && !isIncomeCompliant
                    ? "border-rose-500 focus:border-rose-500 text-rose-950 focus:ring-rose-200"
                    : "border-slate-200 focus:border-primary"
                )}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Regular Allowances (R)</label>
              <input
                type="number"
                name="allowances"
                value={inputs.allowances}
                onChange={handleInputChange}
                placeholder="1500"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none bg-slate-50/50",
                  totalIncome > 0 && !isIncomeCompliant
                    ? "border-rose-500 focus:border-rose-500 text-rose-950 focus:ring-rose-200"
                    : "border-slate-200 focus:border-primary"
                )}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Overtime Earnings (R)</label>
              <input
                type="number"
                name="overtime"
                value={inputs.overtime}
                onChange={handleInputChange}
                placeholder="0"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none bg-slate-50/50",
                  totalIncome > 0 && !isIncomeCompliant
                    ? "border-rose-500 focus:border-rose-500 text-rose-950 focus:ring-rose-200"
                    : "border-slate-200 focus:border-primary"
                )}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Other Verified Income (R)</label>
              <input
                type="number"
                name="otherIncome"
                value={inputs.otherIncome}
                onChange={handleInputChange}
                placeholder="0"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none bg-slate-50/50",
                  totalIncome > 0 && !isIncomeCompliant
                    ? "border-rose-500 focus:border-rose-500 text-rose-950 focus:ring-rose-200"
                    : "border-slate-200 focus:border-primary"
                )}
              />
            </div>
            {!isIncomeCompliant && totalIncome > 0 && (
              <p className="text-[10px] font-bold text-rose-500 mt-2 flex items-start gap-1 leading-normal">
                <AlertCircle size={12} className="shrink-0 mt-0.5" /> Total income of R{totalIncome.toLocaleString()} is below the minimum requirement of R{minIncomeLimit.toLocaleString()}.
              </p>
            )}
          </div>
        </div>

        {/* EXPENSES FORM (MIDDLE SIDE, 4/12 grid span) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Scale size={16} className="text-rose-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Monthly Expenses</h4>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">PAYE & Taxes (R)</label>
              <input
                type="number"
                name="taxes"
                value={inputs.taxes}
                onChange={handleInputChange}
                placeholder="4500"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-primary bg-slate-50/50"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Rent / Mortgage (R)</label>
              <input
                type="number"
                name="rentMortgage"
                value={inputs.rentMortgage}
                onChange={handleInputChange}
                placeholder="6000"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none bg-slate-50/50",
                  totalIncome > 0 && !isDtiCompliant
                    ? "border-rose-500 focus:border-rose-500 text-rose-950 focus:ring-rose-200"
                    : "border-slate-200 focus:border-primary"
                )}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Existing Debt Repayments (R)</label>
              <input
                type="number"
                name="debtRepayments"
                value={inputs.debtRepayments}
                onChange={handleInputChange}
                placeholder="2000"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none bg-slate-50/50",
                  totalIncome > 0 && !isDtiCompliant
                    ? "border-rose-500 focus:border-rose-500 text-rose-950 focus:ring-rose-200"
                    : "border-slate-200 focus:border-primary"
                )}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Basic Living Expenses (NCR) (R)</label>
              <input
                type="number"
                name="livingExpenses"
                value={inputs.livingExpenses}
                onChange={handleInputChange}
                placeholder="3000"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none bg-slate-50/50",
                  totalIncome > 0 && (living < ncrBenchmark || !isDisposableCompliant)
                    ? "border-rose-500 focus:border-rose-500 text-rose-950 focus:ring-rose-200"
                    : "border-slate-200 focus:border-primary"
                )}
              />
            </div>
            {totalIncome > 0 && (!isDtiCompliant || !isDisposableCompliant || living < ncrBenchmark) && (
              <div className="space-y-1.5 mt-2">
                {!isDtiCompliant && (
                  <p className="text-[10px] font-bold text-rose-500 flex items-start gap-1 leading-normal">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" /> DTI ratio of {debtToIncomeRatio.toFixed(1)}% exceeds the limit of {maxDti}%.
                  </p>
                )}
                {!isDisposableCompliant && (
                  <p className="text-[10px] font-bold text-rose-500 flex items-start gap-1 leading-normal">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" /> Disposable income of R{disposableIncome.toLocaleString()} is below the required R{minDisposable.toLocaleString()}.
                  </p>
                )}
                {living < ncrBenchmark && (
                  <p className="text-[10px] font-bold text-rose-500 flex items-start gap-1 leading-normal">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" /> Living expenses fall below survival benchmark buffer of R{Math.round(ncrBenchmark)}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY & METRICS (RIGHT SIDE, 4/12 grid span) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Affordability Summary</p>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
                NCR Assessed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Income</p>
                <p className="text-base font-black text-white mt-0.5">R {totalIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Expenses</p>
                <p className="text-base font-black text-slate-300 mt-0.5">R {totalExpenses.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Disposable Income <HelpCircle size={10} className="text-slate-500" />
                </span>
                <span className={cn(
                  "text-xs font-black px-2 py-0.5 rounded",
                  disposableIncome >= minDisposable ? "text-emerald-400 bg-emerald-500/5" : "text-rose-400 bg-rose-500/5"
                )}>
                  R {disposableIncome.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Debt-to-Income (DTI) <Percent size={10} className="text-slate-500" />
                </span>
                <span className={cn(
                  "text-xs font-black",
                  isDtiCompliant ? "text-emerald-400" : debtToIncomeRatio < 60 ? "text-amber-400" : "text-rose-400"
                )}>
                  {debtToIncomeRatio.toFixed(1)}% / {maxDti}% limit
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            {/* NCR BENCHMARK RATING */}
            <div className={cn(
              "p-3.5 rounded-2xl border flex items-start gap-2.5 shadow-md transition-all",
              isNcrCompliant 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-200"
            )}>
              {isNcrCompliant ? (
                <>
                  <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider">NCR Compliant</p>
                    <p className="text-[9px] opacity-80 mt-0.5 font-semibold">Living expenses meet NCR R {Math.round(ncrBenchmark)} buffer.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-rose-300">Underwriting Warning</p>
                    <p className="text-[9px] opacity-90 mt-0.5 font-bold text-rose-200">
                      {!isIncomeCompliant ? `Minimum monthly income requirement is R${minIncomeLimit.toLocaleString()}.` : 
                       !isDtiCompliant ? `Debt-To-Income (DTI) ratio of ${debtToIncomeRatio.toFixed(1)}% exceeds regulatory max of ${maxDti}%.` :
                       !isDisposableCompliant ? `Disposable income is below the required minimum of R${minDisposable.toLocaleString()}.` :
                       `Living expenses of R${living} fall below NCR survival benchmark buffer of R${Math.round(ncrBenchmark)}.`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION B: DOCUMENT UPLOADS */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Affordability Verification Documents</h4>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {REQUIRED_DOCS.length} files required
          </span>
        </div>

        {uploadError && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-bold text-rose-700">
            {uploadError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REQUIRED_DOCS.map((type) => {
            const doc = getDocStatus(type);
            return (
              <div 
                key={type}
                className={cn(
                  "p-5 rounded-3xl border flex flex-col justify-between min-h-[160px] relative transition-all",
                  doc.status === 'uploaded' 
                    ? "bg-slate-50/50 border-slate-200/60 shadow-inner" 
                    : "bg-white border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50/30"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
                    {doc.status === 'uploaded' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-semibold">
                        <Check size={8} /> Saved
                      </span>
                    )}
                  </div>

                  {doc.status === 'uploaded' ? (
                    <div className="flex items-start gap-2 pt-2">
                      <FileText className="text-primary shrink-0 mt-0.5" size={16} />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-700 truncate max-w-[170px]">{doc.name}</p>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Successfully linked to application</p>
                      </div>
                    </div>
                  ) : doc.status === 'uploading' ? (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>Uploading...</span>
                        <span>{doc.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${doc.progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 text-center text-slate-400">
                      <Upload className="mx-auto mb-1 text-slate-300" size={20} />
                      <p className="text-[10px] font-bold">PDF, JPG, PNG formats permitted</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {doc.status === 'uploaded' ? (
                    <button
                      onClick={() => removeDocument(type)}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      <X size={10} /> Delete Document
                    </button>
                  ) : (
                    <label className={cn(
                      "w-full py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all text-center block cursor-pointer",
                      doc.status === 'uploading'
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}>
                      {doc.status === 'uploading' ? 'Uploading...' : 'Choose Document'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, type)}
                        disabled={doc.status === 'uploading'}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
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
          disabled={totalIncome <= 0 || !hasUploadedAllDocs || !isIncomeCompliant || !isDtiCompliant || !isDisposableCompliant || !isNcrCompliant}
          className={cn(
            "px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 cursor-pointer",
            totalIncome > 0 && hasUploadedAllDocs && isIncomeCompliant && isDtiCompliant && isDisposableCompliant && isNcrCompliant
              ? "bg-slate-900 text-white hover:bg-primary shadow-slate-900/15 hover:scale-[1.01]"
              : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
          )}
        >
          Proceed to Loan Config <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AffordabilitySection;
