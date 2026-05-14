import React from 'react';
import { Loader2 } from 'lucide-react';

const DashboardSkeleton = () => {
  return (
    <div className="relative min-h-[60vh] w-full flex items-center justify-center">
      {/* Simple Centered Loader */}
      <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>

      {/* Background Skeleton Content with Pulse */}
      <div className="w-full space-y-6 pb-10 animate-pulse opacity-20 select-none">
        {/* Welcome Section Skeleton */}
        <div className="bg-slate-100 h-64 rounded-[2.5rem] border border-slate-50" />
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-100 h-32 rounded-3xl border border-slate-50" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table Skeleton */}
          <div className="lg:col-span-2 bg-slate-100 h-[500px] rounded-[2.5rem] border border-slate-50" />
          
          {/* Sidebar Skeleton */}
          <div className="space-y-8">
            <div className="bg-slate-100 h-96 rounded-[2.5rem] border border-slate-50" />
            <div className="bg-slate-100 h-64 rounded-[2.5rem] border border-slate-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;


