import React, { useState } from 'react';
import { 
  ShieldCheck, User, Search, Filter, 
  Eye, CheckCircle2, XCircle, Download,
  Calendar, DollarSign, Receipt, CreditCard,
  RefreshCw, ArrowRight, X, ZoomIn, 
  Wallet, AlertCircle, FileText, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import StatCard from '../../components/StatCard';

const PaymentVerification = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const verifications = [
    { 
      id: 'PAY-881', 
      borrower: 'Alice Johnson', 
      phone: '+27 71 888 4444',
      loanId: 'LN-0012',
      amount: 'R1,200', 
      method: 'EFT', 
      date: '2026-05-09', 
      status: 'Pending',
      proofType: 'Receipt Uploaded',
      txnId: 'TXN-992211',
      balance: 'R8,800',
      overdue: 'R0'
    },
    { 
      id: 'PAY-882', 
      borrower: 'Bob Smith', 
      phone: '+27 82 555 1234',
      loanId: 'LN-0045',
      amount: 'R850', 
      method: 'Cash Deposit', 
      date: '2026-05-09', 
      status: 'Verified',
      proofType: 'Screenshot Uploaded',
      txnId: 'TXN-992212',
      balance: 'R2,400',
      overdue: 'R0'
    },
    { 
      id: 'PAY-883', 
      borrower: 'Charlie Davis', 
      phone: '+27 61 222 9999',
      loanId: 'LN-0098',
      amount: 'R3,000', 
      method: 'EFT', 
      date: '2026-05-08', 
      status: 'Rejected',
      proofType: 'Missing Proof',
      txnId: 'N/A',
      balance: 'R12,000',
      overdue: 'R3,000'
    },
  ];

  const handleOpenDrawer = (payment) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Verification</h1>
          <p className="text-slate-500 font-medium mt-1">Verify borrower payment proofs, uploaded receipts, and transfer confirmations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white">
            <RefreshCw size={18} /> Refresh Payments
          </Button>
          <Button className="flex items-center gap-2 font-bold shadow-lg shadow-primary/20">
            <Filter size={18} /> Filter Verifications
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pending Verifications" value="18" icon={Clock} color="navy" />
        <StatCard title="Verified Payments" value="124" icon={CheckCircle2} color="green" />
        <StatCard title="Rejected Proofs" value="09" icon={XCircle} color="rose" />
        <StatCard title="Verified Today" value="15" icon={ShieldCheck} color="blue" />
      </div>


      {/* 4. SEARCH & FILTER SECTION */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search borrower or transaction ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm"
          />
        </div>
        <select className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]">
          <option>All Statuses</option>
          <option>Pending</option>
          <option>Verified</option>
          <option>Rejected</option>
        </select>
        <select className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[180px]">
          <option>All Methods</option>
          <option>EFT</option>
          <option>Cash Deposit</option>
          <option>Card Payment</option>
        </select>
      </div>

      {/* 5. PAYMENT VERIFICATION TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                <th className="px-8 py-6 border-b border-slate-100">Loan ID</th>
                <th className="px-8 py-6 border-b border-slate-100">Amount</th>
                <th className="px-8 py-6 border-b border-slate-100">Proof Status</th>
                <th className="px-8 py-6 border-b border-slate-100">Verification</th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {verifications.map((item, i) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs uppercase">
                        {item.borrower.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">{item.borrower}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{item.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.loanId}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">{item.amount}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <CreditCard size={10} /> {item.method}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <ProofBadge status={item.proofType} />
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenDrawer(item)}
                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedPayment(item); setIsVerifyModalOpen(true); }}
                        className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👤 VERIFICATION DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Verification</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedPayment?.id}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* BORROWER & LOAN INFO */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <User size={14} className="text-primary" /> Payment Details
                  </h4>
                  <div className="grid grid-cols-1 gap-5">
                    <DrawerItem icon={User} label="Borrower Name" value={selectedPayment?.borrower} />
                    <DrawerItem icon={FileText} label="Loan Identification" value={selectedPayment?.loanId} />
                    <DrawerItem icon={CreditCard} label="Payment Method" value={selectedPayment?.method} />
                    <DrawerItem icon={Calendar} label="Payment Date" value={selectedPayment?.date} />
                  </div>
                </section>

                {/* PAYMENT SUMMARY */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <DollarSign size={14} className="text-primary" /> Account Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <SummaryCard label="Payment Amount" value={selectedPayment?.amount} color="emerald" />
                    <SummaryCard label="Remaining Balance" value={selectedPayment?.balance} color="navy" />
                    <SummaryCard label="Overdue Amount" value={selectedPayment?.overdue} color="rose" />
                    <SummaryCard label="Current Status" value={selectedPayment?.status} color="accent" />
                  </div>
                </section>

                {/* PAYMENT PROOF SECTION */}
                <section className="space-y-6 pb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <Receipt size={14} className="text-primary" /> Uploaded Proof
                  </h4>
                  <div className="space-y-4">
                    <div className="aspect-video bg-slate-50 rounded-[2rem] border-4 border-slate-100 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                        <button className="p-4 bg-white rounded-full text-primary shadow-xl hover:scale-110 transition-transform">
                          <ZoomIn size={24} />
                        </button>
                      </div>
                      <Receipt size={48} className="text-slate-300" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">payment_receipt.pdf</p>
                    </div>
                    <div className="flex gap-2">
                      <ProofActionCard name="EFT Receipt" status="Attached" />
                      <ProofActionCard name="Bank Confirm" status="Verified" />
                    </div>
                  </div>
                </section>
                
                {/* NOTES */}
                <section className="space-y-3">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Borrower Notes</h4>
                   <div className="p-5 bg-slate-50 rounded-2xl text-[11px] font-medium text-slate-600 leading-relaxed italic border border-slate-100">
                     "Monthly repayment for May 2026. Paid via EFT from Standard Bank account. Transaction reference: LN0012-MAY"
                   </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" onClick={() => setIsVerifyModalOpen(true)}>
                  Verify Payment
                </Button>
                <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-rose-100 text-rose-500" onClick={() => setIsRejectionModalOpen(true)}>
                  Reject Proof
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ VERIFICATION MODAL */}
      <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} title="Confirm Payment Verification" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verifying Payment For</p>
              <p className="text-lg font-black text-emerald-900">{selectedPayment?.borrower}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Amount</p>
              <p className="text-lg font-black text-emerald-900">{selectedPayment?.amount}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Notes</label>
            <textarea placeholder="Add any notes regarding this payment verification..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[100px] focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsVerifyModalOpen(false)}>Cancel</Button>
            <Button className="flex-1 font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600" onClick={() => setIsVerifyModalOpen(false)}>Confirm Verification</Button>
          </div>
        </div>
      </Modal>

      {/* ❌ REJECTION MODAL */}
      <Modal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} title="Reject Payment Proof" maxWidth="max-w-xl">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Reason</label>
              <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10">
                <option>Invalid Receipt/Screenshot</option>
                <option>Transaction ID Not Found</option>
                <option>Amount Mismatch</option>
                <option>Blurry/Unreadable Document</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes to Borrower</label>
              <textarea placeholder="Explain why the proof was rejected and what to re-upload..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none" />
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
            <Button className="flex-1 font-bold shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600" onClick={() => setIsRejectionModalOpen(false)}>Reject Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const FlowStep = ({ icon: Icon, label, status }) => (
  <div className="flex flex-col items-center gap-3 relative">
    <div className={cn(
      "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm",
      status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
      status === 'active' ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" :
      "bg-white border-slate-100 text-slate-300"
    )}>
      <Icon size={20} />
    </div>
    <span className={cn(
      "text-[9px] font-black uppercase tracking-widest text-center max-w-[80px]",
      status === 'active' ? "text-primary" : "text-slate-400"
    )}>{label}</span>
  </div>
);

const FlowArrow = () => <div className="hidden md:block text-slate-100"><ArrowRight size={20} /></div>;

const ProofBadge = ({ status }) => (
  <div className={cn(
    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
    status === 'Receipt Uploaded' || status === 'Screenshot Uploaded' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
    "bg-rose-50 text-rose-600 border-rose-100"
  )}>
    <div className={cn("w-1.5 h-1.5 rounded-full", status.includes('Uploaded') ? "bg-emerald-500" : "bg-rose-500")} />
    {status}
  </div>
);

const DrawerItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors"><Icon size={16} /></div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs font-black text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

const SummaryCard = ({ label, value, color }) => (
  <div className={cn(
    "p-4 rounded-xl border flex flex-col gap-1 transition-all hover:scale-105",
    color === 'emerald' ? "bg-emerald-50 border-emerald-100" :
    color === 'rose' ? "bg-rose-50 border-rose-100" :
    color === 'navy' ? "bg-slate-900 border-slate-800 text-white" :
    "bg-primary/5 border-primary/10"
  )}>
    <p className={cn("text-[7px] font-black uppercase tracking-widest", color === 'navy' ? "text-slate-500" : "text-slate-400")}>{label}</p>
    <p className={cn("text-xs font-black", color === 'navy' ? "text-white" : "text-slate-900")}>{value}</p>
  </div>
);

const ProofActionCard = ({ name, status }) => (
  <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm font-black text-[8px] uppercase">PDF</div>
      <div>
        <p className="text-[9px] font-black text-slate-900 truncate max-w-[80px]">{name}</p>
        <p className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest">{status}</p>
      </div>
    </div>
    <button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><Download size={12} /></button>
  </div>
);

const Clock = ({ size, className }) => <RefreshCw size={size} className={className} />;

export default PaymentVerification;
