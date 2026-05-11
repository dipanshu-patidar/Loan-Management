import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Calendar, Percent, Landmark } from 'lucide-react';

const EMICalculator = ({ onApplyClick }) => {
  const [amount, setAmount] = useState(5000);
  const [duration, setDuration] = useState(12);
  const [interest, setInterest] = useState(4.7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple UI-only calculation
  const monthlyInterest = (interest / 100) / 12;
  const emi = amount * monthlyInterest * Math.pow(1 + monthlyInterest, duration) / (Math.pow(1 + monthlyInterest, duration) - 1);
  const totalRepayment = emi * duration;

  const handleApply = () => {
    setIsSubmitting(true);
    // Simulate a small loading state
    setTimeout(() => {
      onApplyClick?.(amount, duration);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <section id="calculator" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="bg-primary rounded-[40px] p-8 lg:p-16 flex flex-col lg:flex-row gap-16 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] -ml-20 -mb-20" />

          <div className="flex-1 relative z-10">
            <h2 className="text-4xl font-extrabold text-white mb-6">Plan Your Future</h2>
            <p className="text-slate-200 text-lg mb-10 max-w-lg">
              Use our simple calculator to estimate your monthly repayments. 
              Find the perfect loan balance that fits your budget.
            </p>

            <div className="space-y-8">
              {/* Amount Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white">
                  <label className="font-bold flex items-center gap-2">
                    <Landmark size={18} className="text-accent" />
                    Loan Amount
                  </label>
                  <span className="text-2xl font-black">${amount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              {/* Duration Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white">
                  <label className="font-bold flex items-center gap-2">
                    <Calendar size={18} className="text-accent" />
                    Duration (Months)
                  </label>
                  <span className="text-2xl font-black">{duration} Mo</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="36"
                  step="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
            </div>
          </div>

          <div className="lg:w-[400px] relative z-10">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 h-full flex flex-col justify-between"
            >
              <div className="space-y-8">
                <div>
                  <p className="text-accent font-bold uppercase tracking-widest text-[10px] mb-2">Estimated Monthly EMI</p>
                  <div className="flex items-end gap-2 text-white">
                    <span className="text-5xl font-black">${Math.round(emi).toLocaleString()}</span>
                    <span className="text-lg font-bold mb-1 opacity-60">/ mo</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-slate-300">Interest Rate</span>
                    <span className="text-white font-bold">{interest}% p.a.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Total Repayment</span>
                    <span className="text-white font-bold">${Math.round(totalRepayment).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <button 
                  onClick={handleApply}
                  disabled={isSubmitting}
                  className="w-full bg-accent text-white py-4 rounded-2xl font-bold hover:bg-white hover:text-primary transition-all shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </button>
                <p className="text-[10px] text-slate-300 text-center mt-4 italic">
                  *Calculations are estimates. Final rates determined during approval.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EMICalculator;
