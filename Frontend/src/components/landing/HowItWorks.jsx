import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardEdit, Search, CheckCircle2, Wallet, RefreshCw, ChevronRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: 'Apply Loan',
      desc: 'Complete our simple online application in minutes.',
      icon: ClipboardEdit,
      color: 'bg-accent/10 text-accent',
    },
    {
      id: 2,
      title: 'Verification',
      desc: 'Our system verifies your details automatically.',
      icon: Search,
      color: 'bg-primary/10 text-primary',
    },
    {
      id: 3,
      title: 'Approval',
      desc: 'Get instant feedback on your loan status.',
      icon: CheckCircle2,
      color: 'bg-success/10 text-success',
    },
    {
      id: 4,
      title: 'Receive Funds',
      desc: 'Funds are disbursed directly to your account.',
      icon: Wallet,
      color: 'bg-primary/10 text-primary',
    },
    {
      id: 5,
      title: 'Repay EMI',
      desc: 'Manage easy repayments via your dashboard.',
      icon: RefreshCw,
      color: 'bg-accent/10 text-accent',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-soft">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Simple Loan Process</h2>
          <p className="text-lg text-slate-500">
            We've streamlined the lending experience to be as simple as possible. 
            From application to disbursement, everything happens digitally.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-6 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`w-20 h-20 rounded-[28px] ${step.color} flex items-center justify-center mb-6 shadow-sm border border-white group-hover:scale-110 transition-transform duration-300 relative`}>
                  <step.icon size={32} />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-sm font-bold text-slate-400">
                    {step.id}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed px-4">
                  {step.desc}
                </p>
                {index < steps.length - 1 && (
                  <div className="lg:hidden mt-8 flex justify-center">
                    <ChevronRight size={24} className="text-slate-300 rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
