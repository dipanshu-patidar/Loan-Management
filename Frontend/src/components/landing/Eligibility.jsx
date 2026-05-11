import React from 'react';
import { motion } from 'framer-motion';
import { User, DollarSign, FileText, Calendar, TrendingUp, Info } from 'lucide-react';

const Eligibility = () => {
  const criteria = [
    {
      title: 'Minimum Age',
      value: '18 - 65 Years',
      icon: User,
      desc: 'Valid government ID required'
    },
    {
      title: 'Minimum Income',
      value: '$2,000 / Month',
      icon: DollarSign,
      desc: 'Stable source of income'
    },
    {
      title: 'Required Documents',
      value: 'KYC & Income',
      icon: FileText,
      desc: 'ID, Payslip & Bank Statements'
    },
    {
      title: 'Repayment Duration',
      value: '3 - 36 Months',
      icon: Calendar,
      desc: 'Flexible tenure options'
    },
    {
      title: 'Loan Limits',
      value: '$500 - $50,000',
      icon: TrendingUp,
      desc: 'Based on credit profile'
    }
  ];

  return (
    <section id="eligibility" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Am I Eligible?</h2>
            <p className="text-lg text-slate-500 mb-8 max-w-lg">
              We aim to make credit accessible to everyone. Check our standard eligibility requirements below to see if you qualify for a loan.
            </p>
            
            <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl flex gap-4">
              <div className="bg-primary/10 p-3 h-fit rounded-xl">
                <Info size={24} className="text-primary" />
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Eligibility requirements are managed securely by system administration. Each application is reviewed individually based on our internal credit scoring system.
              </p>
            </div>
          </div>

          <div className="flex-[1.5] grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {criteria.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-soft p-3 rounded-xl group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <item.icon size={24} className="text-slate-400 group-hover:text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{item.title}</h3>
                    <p className="text-xl font-bold text-slate-900">{item.value}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Eligibility;
