import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, CalendarCheck, Search, LayoutDashboard, Eye } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: 'Fast Approval',
      desc: 'Our automated verification system ensures you get a response in record time.',
      icon: Zap,
      color: 'bg-yellow-400/10 text-yellow-600',
    },
    {
      title: 'Secure Processing',
      desc: 'Bank-grade encryption protecting your personal and financial data at every step.',
      icon: Shield,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Flexible EMI',
      desc: 'Choose a repayment schedule that fits your monthly budget and lifestyle.',
      icon: CalendarCheck,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'Transparent Fees',
      desc: 'No hidden charges. See all costs upfront before you sign any agreement.',
      icon: Eye,
      color: 'bg-success/10 text-success',
    },
    {
      title: 'Payment Tracking',
      desc: 'Monitor your loan progress and repayment history in real-time from any device.',
      icon: Search,
      color: 'bg-purple-400/10 text-purple-600',
    },
    {
      title: 'Borrower Dashboard',
      desc: 'Access a dedicated portal to manage applications, payments, and notifications.',
      icon: LayoutDashboard,
      color: 'bg-slate-900/10 text-slate-900',
    },
  ];

  return (
    <section id="features" className="py-24 bg-soft">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Built for Modern Finance</h2>
          <p className="text-lg text-slate-500">
            Point.47 combines cutting-edge technology with user-centric design to deliver a premium lending experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
