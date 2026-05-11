import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';

const CTA = ({ onApplyClick }) => {
  return (
    <section className="py-24 bg-white px-6">
      <div className="container mx-auto">
        <div className="bg-primary rounded-[48px] p-8 lg:p-20 text-center relative overflow-hidden">
          {/* Abstract Decorations */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -ml-48 -mt-48" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] -mr-32 -mb-32" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-3xl mx-auto"
          >
            <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 leading-tight">
              Ready to Apply for a Loan?
            </h2>
            <p className="text-xl text-slate-300 mb-12">
              Join thousands of borrowers who have successfully funded their projects with Point.47. 
              Get started today and take the first step towards your financial goals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={onApplyClick}
                className="w-full sm:w-auto bg-white text-primary px-10 py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
              >
                Apply Now
                <ArrowRight size={20} />
              </button>
              {/* <button className="w-full sm:w-auto bg-primary-light/20 text-white border border-white/20 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                <MessageCircle size={20} />
                Contact Support
              </button> */}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
