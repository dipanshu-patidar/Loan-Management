import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import Button from '../../ui/Button';
import StatusBadge from '../StatusBadge';

const SuccessScreen = ({ referenceNo, navigate }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-xl mx-auto py-20 text-center space-y-10"
  >
    <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30">
      <CheckCircle2 size={48} />
    </div>
    <div className="space-y-4">
      <h2 className="text-4xl font-black text-slate-900 tracking-tight">Application Submitted!</h2>
      <p className="text-slate-500 font-medium text-lg leading-relaxed">Your loan request has been received. Our team will review your application and get back to you shortly.</p>
    </div>
    
    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
      <div className="flex justify-between items-center text-left border-b border-slate-50 pb-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference No</p>
          <p className="text-xl font-black text-slate-900 mt-1">{referenceNo}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
          <StatusBadge status="Under Review" />
        </div>
      </div>
      <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">"You will receive real-time notifications via your dashboard as your application progresses."</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button className="font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20 h-14" onClick={() => navigate('/borrower/my-loans')}>
        View My Loans
      </Button>
      <Button variant="secondary" className="font-black uppercase tracking-widest text-[10px] py-4 bg-white border-slate-200 h-14" onClick={() => navigate('/borrower/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  </motion.div>
);

export default SuccessScreen;
