import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Workflow, BadgeCheck, Headset, Search } from 'lucide-react';

const WhyChooseUs = () => {
  const points = [
    {
      title: 'Secure Process',
      desc: 'Top-tier encryption and security protocols for all transactions.',
      icon: ShieldCheck,
    },
    {
      title: 'Verified Workflow',
      desc: 'Systematic review process ensuring fairness and transparency.',
      icon: Workflow,
    },
    {
      title: 'Easy Repayment',
      desc: 'Automated reminders and multiple payment channels available.',
      icon: BadgeCheck,
    },
    {
      title: 'Professional Support',
      desc: 'Dedicated staff available to assist with any queries.',
      icon: Headset,
    },
    {
      title: 'Transparent Fees',
      desc: 'No hidden costs. Everything is clearly documented.',
      icon: Search,
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Why Thousands Trust Point.47</h2>
            <p className="text-lg text-slate-500 mb-10">
              We are committed to providing a reliable and professional lending platform that puts the borrower first.
            </p>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-4xl font-black text-primary mb-1">15k+</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Borrowers</p>
              </div>
              <div>
                <p className="text-4xl font-black text-accent mb-1">$50M+</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loans Disbursed</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {points.map((point, index) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 p-6 rounded-2xl border border-slate-50 hover:bg-soft transition-colors group"
              >
                <div className="bg-white shadow-sm p-3 h-fit rounded-xl group-hover:text-primary transition-colors">
                  <point.icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{point.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{point.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
