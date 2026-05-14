import React from 'react';
import { cn } from '../../utils/cn';

const StepperNavigation = ({ steps, currentStep }) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium">
      <div className="flex items-center justify-between px-4">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-3 relative">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all z-10",
              currentStep >= step.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400"
            )}>
              <step.icon size={18} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              currentStep >= step.id ? "text-primary" : "text-slate-400"
            )}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepperNavigation;
