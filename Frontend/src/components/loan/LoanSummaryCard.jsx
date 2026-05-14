import React from 'react';

const LoanSummaryCard = ({ title, data }) => (
  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-5">
    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] border-b border-slate-200 pb-3">{title} Details</h5>
    <div className="space-y-4">
      {data.map((item, i) => (
        <div key={i} className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
          <span className="text-xs font-black text-slate-700">{item.value || 'N/A'}</span>
        </div>
      ))}
    </div>
  </div>
);

export default LoanSummaryCard;
