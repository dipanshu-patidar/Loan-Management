import React from 'react';
import { cn } from '../utils/cn';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'navy' }) => {
  const iconColors = {
    navy: 'bg-primary/10 text-primary',
    blue: 'bg-accent/10 text-accent',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-300 group"
    >
      <div className="flex justify-between items-start">
        <div className={cn(
          "p-3 rounded-xl transition-all duration-300 group-hover:scale-110", 
          iconColors[color] || iconColors.navy
        )}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg",
            trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}%
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
};

export default StatCard;
