import React, { useState, useEffect } from 'react';
import { 
  Wallet, Calendar, Clock, 
  CheckCircle2, ArrowRight, Download, Upload, 
  FileText, History, Info, AlertCircle,
  X, Image as ImageIcon, Search, ShieldCheck,
  ChevronRight, CreditCard, Landmark, Send, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useSocket } from '../../context/SocketContext';

const MakePayment = () => {
  const [step, setStep] = useState('form'); // 'form', 'confirmation', 'success'
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const { socket } = useSocket();
  
  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    loanId: '',
    amount: '',
    method: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      socket.on('payment-verified', (data) => {
        toast.success(`Your payment of R${data.amount} has been verified!`);
        fetchDashboardData();
      });

      socket.on('payment-rejected', (data) => {
        toast.error(`Your payment of R${data.amount} was rejected. Reason: ${data.reason}`);
        fetchDashboardData();
      });
    }

    return () => {
      if (socket) {
        socket.off('payment-verified');
        socket.off('payment-rejected');
      }
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/borrower/payment-dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
        if (response.data.data.loan) {
          setFormData(prev => ({
            ...prev,
            loanId: response.data.data.loan._id,
            amount: response.data.data.nextEmi?.amount || response.data.data.loan.remainingBalance || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching payment dashboard:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please upload payment proof');
      return;
    }
    setStep('confirmation');
  };

  const confirmSubmission = async () => {
    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('loanId', formData.loanId);
      data.append('emiId', dashboardData.nextEmi?._id || '');
      data.append('paymentAmount', formData.amount);
      data.append('paymentMethod', formData.method);
      data.append('paymentDate', formData.date);
      data.append('transactionReference', formData.reference);
      data.append('paymentProof', selectedFile);

      const response = await api.post('/borrower/submit-payment', data);
      
      if (response.data.success) {
        setSubmissionResult(response.data.data);
        setStep('success');
        toast.success('Payment submitted for verification');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
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
        <StatCard title="Next EMI Amount" value={loading ? "..." : (dashboardData?.nextEmi ? `R${dashboardData.nextEmi.amount?.toLocaleString()}` : "R0")} icon={Wallet} color="navy" />
        <StatCard title="Due Date" value={loading ? "..." : (dashboardData?.nextEmi ? format(new Date(dashboardData.nextEmi.dueDate), 'dd MMM yyyy') : "N/A")} icon={Calendar} color="blue" />
        <StatCard title="Remaining Balance" value={loading ? "..." : `R${(dashboardData?.remainingBalance || 0).toLocaleString()}`} icon={Wallet} color="accent" />
        <StatCard title="Pending Verification" value={loading ? "..." : (dashboardData?.pendingVerificationCount || "0")} icon={Clock} color="rose" />
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
                {loading ? (
                  <div className="p-20 flex justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                ) : !dashboardData?.loan ? (
                  <div className="p-20 text-center space-y-4">
                     <AlertCircle size={40} className="mx-auto text-slate-300" />
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Loan Found</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Loan Account</label>
                        <select 
                          value={formData.loanId}
                          onChange={(e) => setFormData({...formData, loanId: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                        >
                          <option value={dashboardData.loan._id}>{dashboardData.loan.loanType} ({dashboardData.loan.loanCode})</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Amount (R)</label>
                        <input 
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                        <select 
                          value={formData.method}
                          onChange={(e) => setFormData({...formData, method: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Mobile Payment">Mobile Payment</option>
                          <option value="Cash Deposit">Cash Deposit</option>
                          <option value="EFT">EFT</option>
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
                          placeholder="Enter bank reference or transaction ID (Min 5 chars)"
                          value={formData.reference}
                          onChange={(e) => setFormData({...formData, reference: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                          required
                          minLength={5}
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
                        Proceed to Confirm
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => window.history.back()} className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 border-slate-200">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
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
                {dashboardData?.loan ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Due</span>
                        <span className="text-lg font-black text-primary">R{(dashboardData.nextEmi?.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-[1px] w-full bg-slate-200/50" />
                    <div className="grid grid-cols-1 gap-4">
                        <SummaryItem label="Due Date" value={dashboardData.nextEmi ? format(new Date(dashboardData.nextEmi.dueDate), 'dd MMM yyyy') : 'N/A'} />
                        <SummaryItem label="Loan Code" value={dashboardData.loan.loanCode} />
                        <SummaryItem label="Status" value={dashboardData.nextEmi?.status || 'Active'} color={dashboardData.nextEmi?.status === 'Overdue' ? 'text-rose-500' : 'text-amber-500'} />
                        <SummaryItem label="Remaining" value={`R${dashboardData.loan.remainingBalance?.toLocaleString()}`} />
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No loan data</p>
                )}
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
                   {dashboardData?.pendingPayments?.length > 0 ? dashboardData.pendingPayments.map((pay, i) => (
                      <div key={pay._id} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 transition-all group">
                         <div className="flex justify-between items-start mb-3">
                            <div>
                               <p className="text-sm font-black text-slate-900">R{pay.paymentAmount?.toLocaleString()}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{pay.transactionId}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                         </div>
                         <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                            <span>Submitted: {format(new Date(pay.createdAt), 'dd MMM yyyy')}</span>
                            <a href={pay.receiptImage} target="_blank" rel="noreferrer" className="text-primary hover:underline">View Proof</a>
                         </div>
                      </div>
                   )) : (
                      <p className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No pending verifications</p>
                   )}
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
                  <Button variant="secondary" onClick={() => setStep('form')} disabled={submitting} className="flex-1 font-black uppercase text-[10px] py-4 border-slate-200">Back to Form</Button>
                  <Button onClick={confirmSubmission} disabled={submitting} className="flex-1 font-black uppercase text-[10px] py-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {submitting ? 'Submitting...' : 'Confirm & Submit'}
                  </Button>
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
                     <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Transaction Reference</span>
                     <span className="font-black text-slate-900">{submissionResult?.transactionId}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Verification Status</span>
                     <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">{submissionResult?.status}</span>
                  </div>
               </div>

               <div className="flex flex-col gap-3 pt-4">
                  <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4" onClick={() => { setIsHistoryDrawerOpen(true); setStep('form'); }}>View Payment History</Button>
                  <Button variant="ghost" className="w-full font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-primary" onClick={() => window.history.back()}>Back to Dashboard</Button>
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
                     {dashboardData?.recentPayments?.length > 0 ? dashboardData.recentPayments.map((pay) => (
                        <ActivityItem 
                           key={pay._id}
                           icon={pay.paymentStatus === 'Verified' ? CheckCircle2 : AlertCircle} 
                           title={pay.paymentStatus === 'Verified' ? "Payment Verified" : "Payment Rejected"} 
                           date={format(new Date(pay.updatedAt), 'dd MMM, yyyy')} 
                           amount={`R${pay.paymentAmount?.toLocaleString()}`} 
                           status={pay.paymentStatus === 'Verified' ? 'verified' : 'rejected'} 
                        />
                     )) : (
                        <p className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent payments</p>
                     )}
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
