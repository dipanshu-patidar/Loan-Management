import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Business Owner',
      feedback: 'Point.47 made it incredibly easy to get the working capital I needed for my expansion. The process was fast and completely digital.',
      rating: 5,
      avatar: 'https://i.pravatar.cc/150?u=sarah',
    },
    {
      name: 'Michael Chen',
      role: 'Software Engineer',
      feedback: 'I appreciate the transparency of the fees. The borrower dashboard is clean and makes it easy to keep track of my monthly EMIs.',
      rating: 5,
      avatar: 'https://i.pravatar.cc/150?u=michael',
    },
    {
      name: 'Jessica Williams',
      role: 'Freelancer',
      feedback: 'The customer support was professional and helpful when I had questions about my documentation. Highly recommend for personal loans.',
      rating: 4,
      avatar: 'https://i.pravatar.cc/150?u=jessica',
    },
  ];

  return (
    <section className="py-24 bg-soft">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6">What Borrowers Say</h2>
          <p className="text-lg text-slate-500">
            Real feedback from people who have grown their finances with Point.47.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative"
            >
              <Quote className="absolute top-8 right-8 text-slate-100" size={40} />
              
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < t.rating ? 'text-warning fill-warning' : 'text-slate-200'}
                  />
                ))}
              </div>

              <p className="text-slate-600 leading-relaxed mb-8 relative z-10 italic">
                "{t.feedback}"
              </p>

              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
