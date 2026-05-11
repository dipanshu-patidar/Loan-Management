import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, Zap, BarChart3, ArrowRight, CheckCircle2, Shield, Layout, Smartphone } from 'lucide-react';

export const FeatureBadge = ({ text }) => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6"
  >
    <Zap size={14} className="text-accent fill-accent/20" />
    <span className="text-xs font-bold text-accent uppercase tracking-wider">{text}</span>
  </motion.div>
);

export const HeroButtons = ({ onApplyClick }) => (
  <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-12">
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onApplyClick}
      className="group w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:bg-primary-dark"
    >
      Apply Loan
      <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full sm:w-auto bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg border border-primary/20 transition-all hover:bg-slate-50"
    >
      Learn More
    </motion.button>
  </div>
);

export const TrustIndicators = () => {
  const features = [
    { icon: ShieldCheck, text: "Secure Verification" },
    { icon: Zap, text: "Fast Approval" },
    { icon: BarChart3, text: "EMI Tracking" }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
      {features.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
            <item.icon size={18} className="text-accent" />
          </div>
          <span className="text-sm font-medium text-slate-600">{item.text}</span>
        </div>
      ))}
    </div>
  );
};

export const FloatingFeatureCard = ({ icon: Icon, title, desc, delay, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -5 }}
    className={`absolute z-30 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-premium border border-white/50 ${className}`}
  >
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl bg-accent/10">
        <Icon size={20} className="text-accent" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-[10px] text-slate-500 leading-tight">{desc}</p>
      </div>
    </div>
  </motion.div>
);

export const MobileLoanCard = () => (
  <motion.div
    initial={{ opacity: 0, x: 20, rotate: 2 }}
    animate={{ opacity: 1, x: 0, rotate: -2 }}
    transition={{ duration: 0.8, delay: 0.4 }}
    className="absolute -bottom-10 -right-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 z-40 hidden sm:block overflow-hidden"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Smartphone size={16} className="text-primary" />
      </div>
      <div className="px-2 py-0.5 bg-success/10 rounded-full">
        <span className="text-[8px] font-bold text-success uppercase">Active Flow</span>
      </div>
    </div>
    <p className="text-sm font-bold text-slate-900 mb-4">Apply for Loan</p>
    
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
          <span>Amount</span>
          <span className="text-primary">$25,000</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-[65%]" />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
          <span>Duration</span>
          <span className="text-primary">24 Months</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-accent w-[45%]" />
        </div>
      </div>

      <div className="bg-soft p-3 rounded-xl border border-slate-50">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase">Est. EMI</p>
            <p className="text-lg font-extrabold text-slate-900 leading-none">$1,150</p>
          </div>
          <button className="bg-primary text-white p-1.5 rounded-lg shadow-lg shadow-primary/20">
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

export const DashboardMockup = () => (
  <div className="relative w-full max-w-2xl mx-auto lg:mx-0">
    {/* Main Window */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 overflow-hidden relative z-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">P</div>
          <div>
            <p className="text-sm font-bold text-slate-900">Dashboard</p>
            <p className="text-[10px] text-slate-400">Point.47 LMS</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-2 bg-slate-100 rounded-full" />
          <div className="w-4 h-2 bg-accent/30 rounded-full" />
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-soft p-4 rounded-2xl border border-slate-50 hover:border-accent/30 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Loan</p>
          <p className="text-2xl font-extrabold text-primary">$12,500.00</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[9px] font-bold text-success">Good Standing</span>
          </div>
        </div>
        <div className="bg-soft p-4 rounded-2xl border border-slate-50 hover:border-accent/30 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Next Payment</p>
          <p className="text-2xl font-extrabold text-accent">$450.00</p>
          <p className="text-[9px] text-slate-500 mt-2 font-medium">Due in 5 days</p>
        </div>
      </div>

      {/* History/Chart Placeholder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-900">Payment History</p>
          <p className="text-[10px] font-bold text-accent cursor-pointer">View All</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${i === 1 ? 'bg-success/10' : 'bg-slate-100'} flex items-center justify-center`}>
                  <CheckCircle2 size={16} className={i === 1 ? 'text-success' : 'text-slate-300'} />
                </div>
                <div className="space-y-1">
                  <div className={`h-2 rounded-full ${i === 1 ? 'w-24 bg-slate-200' : 'w-20 bg-slate-100'}`} />
                  <div className={`h-1.5 rounded-full ${i === 1 ? 'w-16 bg-slate-100' : 'w-12 bg-slate-50'}`} />
                </div>
              </div>
              <div className="h-2 w-12 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>

    {/* Security Shield */}
    <motion.div
      animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-12 -right-8 z-30 hidden lg:block"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl">
        <div className="w-full h-full bg-white/10 backdrop-blur-xl rounded-[14px] flex items-center justify-center border border-white/20">
          <Shield size={32} className="text-white drop-shadow-lg" />
        </div>
      </div>
    </motion.div>

    <FloatingFeatureCard 
      icon={Zap}
      title="Quick Approval"
      desc="Get funds in 24h"
      delay={0.6}
      className="-top-6 -left-12"
    />

    <FloatingFeatureCard 
      icon={Layout}
      title="Simple Process"
      desc="3 steps only"
      delay={0.8}
      className="top-1/2 -left-20"
    />

    <FloatingFeatureCard 
      icon={ShieldCheck}
      title="Secure & Safe"
      desc="Bank-grade security"
      delay={1.0}
      className="-bottom-16 left-1/4"
    />

    <MobileLoanCard />

    {/* Background Decorative Blur */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-accent/5 rounded-full blur-[100px] -z-10" />
  </div>
);
