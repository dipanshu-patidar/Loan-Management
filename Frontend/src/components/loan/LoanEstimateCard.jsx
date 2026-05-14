import React from 'react';
import { Wallet } from 'lucide-react';
import { cn } from '../../utils/cn';

const LoanEstimateCard = ({ amount, processingFee, interestRate, monthlyEMI, totalRepayment }) => (
  <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 space-y-6">
    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-[0.15em] flex items-center gap-2">
      <Wallet size={14} /> Estimated Fees & Repayment
    </h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <ReadOnlyStat label="Loan Amount" value={`R${Number(amount).toLocaleString()}`} />
      <ReadOnlyStat label="Processing Fee" value={`R${Number(processingFee).toLocaleString()}`} />
      <ReadOnlyStat label="Interest Rate" value={`${interestRate}% p.a.`} />
      <ReadOnlyStat label="Monthly EMI" value={`R${Math.round(monthlyEMI).toLocaleString()}`} highlighted />
    </div>
    <div className="pt-4 border-t border-blue-100 flex justify-between items-center">
       <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Repayment Amount</span>
       <span className="text-lg font-black text-primary">R{Math.round(totalRepayment).toLocaleString()}</span>
    </div>
    <p className="text-[10px] font-bold text-blue-400 italic">Fees are automatically calculated based on admin settings and are subject to final credit assessment.</p>
  </div>
);

const ReadOnlyStat = ({ label, value, highlighted }) => (
  <div className={cn(
    "p-5 rounded-2xl border transition-all",
    highlighted ? "bg-white border-blue-200 shadow-sm" : "bg-transparent border-blue-100/50"
  )}>
    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={cn("font-black tracking-tight", highlighted ? "text-xl text-primary" : "text-lg text-blue-600")}>{value}</p>
  </div>
);

export default LoanEstimateCard;
