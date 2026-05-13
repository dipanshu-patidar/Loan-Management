import React from 'react';
import { cn } from '../utils/cn';

const StatusBadge = ({ status, className }) => {
  const styles = {
    // Loan / General
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100',
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    overdue: 'bg-red-50 text-red-600 border-red-100',
    verified: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    settled: 'bg-teal-50 text-teal-600 border-teal-100',
    
    // Risk / Priority
    high: 'bg-rose-100 text-rose-700 border-rose-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    
    // Agent Performance
    excellent: 'bg-emerald-500 text-white border-emerald-600',
    good: 'bg-blue-500 text-white border-blue-600',
    average: 'bg-amber-500 text-white border-amber-600',
    poor: 'bg-rose-500 text-white border-rose-600',
    
    // Agent / Account Status
    suspended: 'bg-rose-50 text-rose-600 border-rose-100',
    inactive: 'bg-amber-50 text-amber-600 border-amber-100',
    'on leave': 'bg-indigo-50 text-indigo-500 border-indigo-100',
    blacklisted: 'bg-black text-white border-black',
    frozen: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    underreview: 'bg-blue-50 text-blue-600 border-blue-100',
    new: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const currentStyle = styles[status.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-bold border capitalize whitespace-nowrap",
      currentStyle,
      className
    )}>
      {status}
    </span>
  );
};

export default StatusBadge;
