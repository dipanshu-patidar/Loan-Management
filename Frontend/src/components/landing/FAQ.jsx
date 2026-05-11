import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQ = () => {
  const faqs = [
    {
      question: 'How long does the loan approval process take?',
      answer: 'Our automated system provides initial feedback instantly. Final verification and approval by our staff typically takes between 24 to 48 business hours.',
    },
    {
      question: 'Which documents are required for application?',
      answer: 'You will need a valid government ID (Passport/ID), proof of income (recent payslips), bank statements for the last 6 months, and proof of residence.',
    },
    {
      question: 'How do EMI payments work?',
      answer: 'EMIs are scheduled monthly based on your loan terms. You can track your payment schedule and make payments directly through your borrower dashboard.',
    },
    {
      question: 'How does payment verification work?',
      answer: 'Once you submit a repayment, our staff verifies the transaction. Upon verification, your loan balance is updated automatically in the system.',
    },
    {
      question: 'Can I track the status of my loan application?',
      answer: 'Yes! Once you register and submit your application, you can log in to your dashboard to see the real-time status of your request.',
    },
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <p className="text-lg text-slate-500">
            Everything you need to know about our loan process and platform.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border rounded-2xl transition-all duration-300 ${isOpen ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-primary' : 'text-slate-900'}`}>
          {faq.question}
        </span>
        <div className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-primary/10">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQ;
