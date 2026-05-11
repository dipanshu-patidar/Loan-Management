import React, { useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import Eligibility from '../components/landing/Eligibility';
import Features from '../components/landing/Features';
import EMICalculator from '../components/landing/EMICalculator';
import DocumentRequirements from '../components/landing/DocumentRequirements';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import Testimonials from '../components/landing/Testimonials';
import FAQ from '../components/landing/FAQ';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import { AuthModal } from '../components/landing/AuthModals';

const LandingPage = () => {
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });
  const [selectedLoan, setSelectedLoan] = useState(null);

  const openAuth = (tab = 'login', loanData = null) => {
    setSelectedLoan(loanData);
    setAuthModal({ isOpen: true, tab });
  };

  const handleEMIApply = (amount, duration) => {
    openAuth('register', { amount, duration });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLoginClick={() => openAuth('login')} onRegisterClick={() => openAuth('register')} />
      
      <main>
        <Hero onApplyClick={() => openAuth('register')} />
        <HowItWorks />
        <Eligibility />
        <Features />
        <EMICalculator onApplyClick={handleEMIApply} />
        <DocumentRequirements />
        <WhyChooseUs />
        <Testimonials />
        <FAQ />
        <CTA onApplyClick={() => openAuth('register')} />
      </main>

      <Footer />

      {/* Unified Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        initialTab={authModal.tab}
        loanData={selectedLoan}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
      />
    </div>
  );
};

export default LandingPage;
