import React from 'react';
import { motion } from 'framer-motion';
import { 
  FeatureBadge, 
  HeroButtons, 
  TrustIndicators 
} from './HeroComponents';

const Hero = ({ onApplyClick }) => {
  return (
    <section 
      id="home" 
      className="relative pt-24 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-white"
    >
      {/* --- BACKGROUND DESIGN --- */}
      {/* Soft abstract gradients & mesh blur */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -ml-64 -mb-64" />
      
      {/* Subtle circles */}
      <div className="absolute top-1/4 left-10 w-64 h-64 border border-slate-100 rounded-full -z-0 opacity-50" />
      <div className="absolute bottom-1/4 right-20 w-96 h-96 border border-slate-50 rounded-full -z-0 opacity-30" />

      {/* Soft floating dots (Fintech pattern) */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'radial-gradient(#2E3A74 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 xl:gap-24">
          
          {/* --- LEFT SIDE (CONTENT AREA) --- */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Badge */}
              <FeatureBadge text="Fintech Excellence" />

              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-8 leading-[1.1] tracking-tight">
                Fast & Secure <br />
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  Loan Solutions
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Apply for loans easily, track repayments, and manage your finances with Point.47. 
                The smarter way to handle your personal and business credit.
              </p>

              {/* CTA Buttons */}
              <HeroButtons onApplyClick={onApplyClick} />

              {/* Trust Features */}
              <TrustIndicators />
            </motion.div>
          </div>

          {/* --- RIGHT SIDE (VISUAL AREA) --- */}
          <div className="flex-1 w-full lg:w-auto mt-12 lg:mt-0 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-2xl"
            >
              <img 
                src="/images/HeroSection.png" 
                alt="Point.47 Loan Management System" 
                className="w-full h-auto drop-shadow-[0_20px_50px_rgba(46,58,116,0.15)] rounded-[2rem]"
              />
              
              {/* Optional: Add a subtle decorative element behind the image to keep the "premium" feel */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-accent/5 rounded-full blur-[80px] -z-10" />
            </motion.div>
          </div>

        </div>
      </div>
      
      {/* Bottom fade for smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-soft to-transparent -z-10" />
    </section>
  );
};

export default Hero;
