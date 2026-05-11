import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Receipt, Building2, Home, UploadCloud } from 'lucide-react';

const DocumentRequirements = () => {
  const docs = [
    {
      title: 'ID Document',
      desc: 'National ID, Passport, or Driver\'s License',
      icon: CreditCard,
    },
    {
      title: 'Payslip',
      desc: 'Most recent 3 months of income proof',
      icon: Receipt,
    },
    {
      title: 'Bank Statement',
      desc: 'Official statements for the last 6 months',
      icon: Building2,
    },
    {
      title: 'Proof of Address',
      desc: 'Utility bill or lease agreement',
      icon: Home,
    },
  ];

  return (
    <section className="py-24 bg-soft">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">What You'll Need</h2>
          <p className="text-lg text-slate-500">
            To ensure a fast approval process, please have the following documents ready for digital upload.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {docs.map((doc, index) => (
            <motion.div
              key={doc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-accent/30 transition-all shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-soft flex items-center justify-center mb-6 group-hover:bg-accent/5 transition-colors">
                <doc.icon size={28} className="text-slate-400 group-hover:text-accent" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{doc.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">{doc.desc}</p>
              
              <div className="mt-auto w-full pt-4 border-t border-slate-50 flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <UploadCloud size={16} />
                Digital Upload
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DocumentRequirements;
