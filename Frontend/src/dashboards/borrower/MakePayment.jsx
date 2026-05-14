import React, { useState } from 'react';
import { 
  Wallet, Calendar, Clock, 
  CheckCircle2, ArrowRight, Download, Upload, 
  FileText, History, Info, AlertCircle,
  X, Image as ImageIcon, Search, ShieldCheck,
  ChevronRight, CreditCard, Landmark, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';

const MakePayment = () => {
  const [step, setStep] = useState('form'); // 'form', 'confirmation', 'success'
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    loanId: 'L-74291',
    amount: '825.50',
    method: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  const activeLoan = {
    id: 'L-74291',
    amount: 'R825.50',
    dueDate: '2026-05-15',
    balance: 'R8,450',
    status: 'Pending'
  };

  const pendingPayments = [
    { id: 'PAY-882', amount: 'R825.50', date: '2026-04-14', status: 'Pending Verification' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep('confirmation');
  };

  const confirmSubmission = () => {
    setStep('success');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Make Payment</h1>
          <p className="text-slate-500 font-medium mt-1">Submit EMI payments and upload payment proof for verification.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-6 border-slate-200 bg-white"
          >
            <History size={16} /> View Payment History
          </Button>
          <Button 
            variant="secondary"
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-6 border-slate-200 bg-white"
          >
            <Download size={16} /> EMI Schedule
          </Button>
        </div>
      </header>

      {/* 2. SIMPLE PAYMENT FLOW */}
      <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium">
         <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto gap-8 md:gap-4">
            <WorkflowStep label="Pay EMI" status="active" icon={Wallet} />
            <WorkflowArrow active />
            <WorkflowStep label="Proof Uploaded" status="pending" icon={Upload} />
            <WorkflowArrow />
            <WorkflowStep label="Staff Verification" status="pending" icon={ShieldCheck} />
            <WorkflowArrow />
            <WorkflowStep label="Confirmed" status="pending" icon={CheckCircle2} />
         </div>
      </section>

      {/* 3. TOP ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Next EMI Amount" value={activeLoan.amount} icon={Wallet} color="navy" />
        <StatCard title="Due Date" value={activeLoan.dueDate} icon={Calendar} color="blue" />
        <StatCard title="Remaining Balance" value={activeLoan.balance} icon={Wallet} color="accent" />
        <StatCard title="Pending Verification" value="01" icon={Clock} color="rose" />
      </section>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            {/* PAYMENT FORM */}
            <div className="lg:col-span-8 space-y-8">
              <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Payment Submission Form</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Loan Account</label>
                      <select 
                        value={formData.loanId}
                        onChange={(e) => setFormData({...formData, loanId: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                      >
                        <option value="L-74291">Personal Loan (L-74291)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EMI Amount (R)</label>
                      <input 
                        type="number"
                        value={formData.amount}
                        readOnly
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-900 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                      <select 
                        value={formData.method}
                        onChange={(e) => setFormData({...formData, method: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                      >
                        <option>Bank Transfer</option>
                        <option>Mobile Payment</option>
                        <option>Cash Deposit</option>
                        <option>EFT</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</label>
                      <input 
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Reference</label>
                      <input 
                        type="text"
                        placeholder="Enter bank reference or transaction ID"
                        value={formData.reference}
                        onChange={(e) => setFormData({...formData, reference: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* UPLOAD AREA */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Payment Proof</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={cn(
                        "p-10 border-2 border-dashed rounded-[2rem] text-center transition-all",
                        selectedFile ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50 group-hover:border-primary/20 group-hover:bg-primary/5"
                      )}>
                        {selectedFile ? (
                          <div className="space-y-4">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 mx-auto shadow-sm">
                                <FileText size={32} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900">{selectedFile.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to submit</p>
                             </div>
                             <div className="max-w-xs mx-auto space-y-2">
                                <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${uploadProgress}%` }} />
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary mx-auto shadow-sm group-hover:scale-110 transition-transform">
                              <Upload size={32} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">Drag & drop payment receipt</p>
                              <p className="text-xs font-medium text-slate-500 mt-1">or click to browse from your device</p>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF, JPG, PNG accepted • Max 5MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <Button type="submit" className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20">
                      Submit Payment
                    </Button>
                    <Button type="button" variant="secondary" className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 border-slate-200">
                      Save Draft
                    </Button>
                  </div>
                </form>
              </section>
            </div>

            {/* SIDEBAR: PENDING & SUMMARY */}
            <div className="lg:col-span-4 space-y-8">
              {/* PAYMENT SUMMARY CARD */}
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <h3 className="text-md font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Info size={18} className="text-primary" /> Active Payment Summary
                </h3>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Due</span>
                      <span className="text-lg font-black text-primary">{activeLoan.amount}</span>
                   </div>
                   <div className="h-[1px] w-full bg-slate-200/50" />
                   <div className="grid grid-cols-1 gap-4">
                      <SummaryItem label="Due Date" value={activeLoan.dueDate} />
                      <SummaryItem label="Loan ID" value={activeLoan.id} />
                      <SummaryItem label="Status" value="Pending" color="text-amber-500" />
                   </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                   <AlertCircle size={16} className="text-amber-500 shrink-0" />
                   <p className="text-[10px] font-bold text-amber-700 leading-relaxed">Ensure the transaction reference matches exactly for faster verification.</p>
                </div>
              </section>

              {/* PENDING VERIFICATION SECTION */}
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
                <h3 className="text-md font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock size={18} className="text-primary" /> Pending Verifications
                </h3>
                <div className="space-y-4">
                   {pendingPayments.map((pay, i) => (
                      <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 transition-all group">
                         <div className="flex justify-between items-start mb-3">
                            <div>
                               <p className="text-sm font-black text-slate-900">{pay.amount}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{pay.id}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                         </div>
                         <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                            <span>Submitted: {pay.date}</span>
                            <button className="text-primary hover:underline">View Proof</button>
                         </div>
                      </div>
                   ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {/* CONFIRMATION STEP (MODAL style but as page transition) */}
        {step === 'confirmation' && (
          <motion.div 
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium text-center space-y-8">
              <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Confirm Submission</h2>
                <p className="text-slate-500 font-medium">Please review your payment details before final submission.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Amount</p>
                   <p className="text-xl font-black text-slate-900">R{formData.amount}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                   <p className="text-lg font-black text-slate-900">{formData.method}</p>
                </div>
                <div className="md:col-span-2 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proof of Payment</p>
                      <p className="text-sm font-black text-slate-900">{selectedFile?.name || 'No file selected'}</p>
                   </div>
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                      <ImageIcon size={20} />
                   </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                 <Button variant="secondary" onClick={() => setStep('form')} className="flex-1 font-black uppercase text-[10px] py-4 border-slate-200">Back to Form</Button>
                 <Button onClick={confirmSubmission} className="flex-1 font-black uppercase text-[10px] py-4 shadow-lg shadow-primary/20">Confirm & Submit</Button>
              </div>
            </section>
          </motion.div>
        )}

        {/* SUCCESS STEP */}
        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto"
          >
            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-premium text-center space-y-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
               <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30"
               >
                  <CheckCircle2 size={48} />
               </motion.div>
               
               <div className="space-y-3">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Submitted!</h2>
                  <p className="text-slate-500 font-medium px-8 leading-relaxed">Your payment has been successfully recorded and is now waiting for staff verification.</p>
               </div>

               <div className="p-8 bg-white/50 rounded-[2.5rem] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Reference Number</span>
                     <span className="font-black text-slate-900">#PAY-883912</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Verification Status</span>
                     <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">Pending Review</span>
                  </div>
               </div>

               <div className="flex flex-col gap-3 pt-4">
                  <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4" onClick={() => setIsHistoryDrawerOpen(true)}>View Payment History</Button>
                  <Button variant="ghost" className="w-full font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-primary">Back to Dashboard</Button>
               </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAYMENT HISTORY DRAWER (Quick view) */}
      <AnimatePresence>
         {isHistoryDrawerOpen && (
            <>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment History</h3>
                     <button onClick={() => setIsHistoryDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6">
                     <ActivityItem icon={CheckCircle2} title="EMI #14 Confirmed" date="14 Apr, 2026" amount="R825.50" status="verified" />
                     <ActivityItem icon={Clock} title="EMI #15 Submitted" date="09 May, 2026" amount="R825.50" status="pending" />
                     <ActivityItem icon={AlertCircle} title="Late Fee Applied" date="18 Mar, 2026" amount="R150.00" status="rejected" />
                     <ActivityItem icon={CheckCircle2} title="EMI #13 Confirmed" date="15 Mar, 2026" amount="R825.50" status="verified" />
                  </div>
                  <div className="p-8 border-t border-slate-100">
                     <Button variant="secondary" className="w-full font-black uppercase text-[10px] py-4 border-slate-200">View Full Statement</Button>
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const WorkflowStep = ({ label, status, icon: Icon }) => (
   <div className="flex flex-col items-center gap-3">
      <div className={cn(
         "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm",
         status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
         status === 'active' ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 animate-pulse" :
         "bg-white border-slate-200 text-slate-300"
      )}>
         <Icon size={20} />
      </div>
      <span className={cn(
         "text-[9px] font-black uppercase tracking-widest text-center",
         status === 'pending' ? "text-slate-400" : "text-slate-900"
      )}>{label}</span>
   </div>
);

const WorkflowArrow = ({ active }) => (
   <div className="hidden md:flex flex-1 h-[2px] bg-slate-100 mx-2 relative -mt-6">
      {active && (
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            className="h-full bg-emerald-500"
         />
      )}
   </div>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium group hover:border-primary transition-all cursor-default">
      <div className="flex items-center justify-between mb-4">
         <div className={cn(
            "p-3 rounded-2xl transition-all group-hover:scale-110",
            color === 'navy' ? "bg-primary/5 text-primary" :
            color === 'blue' ? "bg-blue-50 text-blue-600" :
            "bg-primary/5 text-primary"
         )}>
            <Icon size={20} />
         </div>
         <ChevronRight size={16} className="text-slate-200 group-hover:text-primary transition-all" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
   </div>
);

const SummaryItem = ({ label, value, color }) => (
   <div className="flex items-center justify-between">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn("text-xs font-black", color || "text-slate-900")}>{value}</span>
   </div>
);

const ActivityItem = ({ icon: Icon, title, date, amount, status }) => (
   <div className="flex items-center gap-4 group p-1">
      <div className={cn(
         "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-50 transition-all",
         status === 'verified' ? "bg-emerald-50 text-emerald-500" :
         status === 'pending' ? "bg-amber-50 text-amber-500" :
         "bg-rose-50 text-rose-500"
      )}>
         <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
         <div className="flex justify-between items-start">
            <p className="text-xs font-black text-slate-900 truncate">{title}</p>
            <span className="text-xs font-black text-slate-900">{amount}</span>
         </div>
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{date}</p>
      </div>
   </div>
);

export default MakePayment;
