import React from 'react';
import { FileCheck, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const StatusTracker = ({ status }) => {
  const getStatusIndex = (s) => {
    const statuses = ['Submitted', 'Under Review', 'Approved', 'Disbursed'];
    return statuses.indexOf(s);
  };

  const currentIndex = getStatusIndex(status) || 0;

  return (
    <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
      <div className="flex flex-wrap items-center justify-between gap-8 max-w-4xl mx-auto">
        <WorkflowItem icon={FileCheck} title="Submitted" active={currentIndex >= 0} />
        <div className={cn("hidden sm:block flex-1 h-px", currentIndex > 0 ? "bg-primary" : "bg-white/10")} />
        <WorkflowItem icon={Clock} title="Under Review" active={currentIndex >= 1} />
        <div className={cn("hidden sm:block flex-1 h-px", currentIndex > 1 ? "bg-primary" : "bg-white/10")} />
        <WorkflowItem icon={CheckCircle2} title="Final Status" active={currentIndex >= 2} />
      </div>
    </section>
  );
};

const WorkflowItem = ({ icon: Icon, title, active }) => (
  <div className="flex flex-col items-center gap-4">
    <div className={cn(
      "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg",
      active ? "bg-primary border-primary text-white shadow-primary/40 scale-110" : "bg-white/5 border-white/10 text-white/40"
    )}>
      <Icon size={24} />
    </div>
    <span className={cn(
      "text-[11px] font-black uppercase tracking-widest",
      active ? "text-white" : "text-white/40"
    )}>{title}</span>
  </div>
);

export default StatusTracker;
