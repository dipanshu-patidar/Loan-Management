import React, { useState } from 'react';
import { 
  FileText, Plus, Download, Filter, Search, MoreVertical, 
  Eye, BadgeCheck, XCircle, PauseCircle, UserPlus, 
  Mail, Phone, MapPin, Building2, Wallet, Briefcase, 
  Calendar, Clock, CheckCircle, CreditCard, Activity, 
  Trash2, CheckCircle2, ShieldAlert, ChevronRight,
  ArrowRight, X, FileUp, Info, ShieldCheck, DownloadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

// --- Mock Data ---
const initialApplications = [
  { 
    id: 'APP-9901', borrower: 'Sipho Gumede', phone: '+27 82 444 5555', type: 'Personal Loan', 
    amount: 25000, affordability: 'Eligible', docs: 'Complete', status: 'Approved', submittedDate: '2024-05-08'
  },
  { 
    id: 'APP-9902', borrower: 'Lerato Molefe', phone: '+27 71 333 4444', type: 'Business Loan', 
    amount: 150000, affordability: 'Moderate', docs: 'Pending', status: 'Under Review', submittedDate: '2024-05-08'
  },
  { 
    id: 'APP-9903', borrower: 'David van Wyk', phone: '+27 83 222 3333', type: 'SME Loan', 
    amount: 45000, affordability: 'Risky', docs: 'Missing', status: 'Rejected', submittedDate: '2024-05-07'
  },
  { 
    id: 'APP-9904', borrower: 'Thabo Mbeki', phone: '+27 61 111 2222', type: 'Education Loan', 
    amount: 12000, affordability: 'Eligible', docs: 'Complete', status: 'New', submittedDate: '2024-05-07'
  },
  { 
    id: 'APP-9905', borrower: 'Sarah Jenkins', phone: '+27 72 999 8888', type: 'Vehicle Loan', 
    amount: 85000, affordability: 'Moderate', docs: 'Complete', status: 'Hold', submittedDate: '2024-05-06'
  },
];

const Applications = () => {
  const [applications] = useState(initialApplications);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'New', 'Approved', 'Rejected'
  const [activeModal, setActiveModal] = useState(null); // 'new', 'approve', 'reject', 'hold', 'reviewer', 'export', 'delete'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedApp, setSelectedApp] = useState(null);
  const [step, setStep] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

  const openModal = (type, app = null) => {
    setSelectedApp(app);
    setActiveModal(type);
    if (type === 'new') setStep(1);
    setOpenMenuId(null);
  };

  const openDrawer = (type, app) => {
    setSelectedApp(app);
    setActiveDrawer(type);
    setOpenMenuId(null);
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const tabs = [
    { id: 'All', label: 'All Applications', count: initialApplications.length },
    { id: 'New', label: 'New', count: initialApplications.filter(a => a.status === 'New').length },
    { id: 'Approved', label: 'Approved', count: initialApplications.filter(a => a.status === 'Approved').length },
    { id: 'Rejected', label: 'Rejected', count: initialApplications.filter(a => a.status === 'Rejected').length },
  ];

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loan Applications</h1>
          <p className="text-slate-500 font-medium mt-1">Manage borrower loan requests, approvals, uploaded documents, and reviews.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button onClick={() => openModal('new')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20">
             <Plus size={18} /> New Application
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="New Applications" value="12" icon={Plus} color="navy" />
        <StatCard title="Under Review" value="24" icon={Clock} color="blue" />
        <StatCard title="Approved Applications" value="846" icon={BadgeCheck} color="navy" />
        <StatCard title="Rejected Applications" value="124" icon={XCircle} color="rose" />
      </section>

      {/* 3. TABS SECTION */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap relative",
              activeTab === tab.id 
                ? "border-primary text-primary bg-primary/5" 
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === tab.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </section>

      {/* 4. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search borrower by name, ID or application ID..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Loan Type</option>
              <option>Personal Loan</option>
              <option>Business Loan</option>
              <option>SME Loan</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Status</option>
              <option>New</option>
              <option>Under Review</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Hold</option>
           </select>
        </div>
      </section>

      {/* 5. APPLICATIONS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Type</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Requested Amount</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Affordability</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Docs</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted Date</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {applications.map((app) => (
                    <tr key={app.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                {app.borrower.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{app.borrower}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{app.phone}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-tight">
                             {app.type}
                          </span>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-slate-900">
                          R {app.amount.toLocaleString()}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={app.affordability} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={app.docs} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={app.status} />
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{app.submittedDate}</p>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', app)} tooltip="Review Application" />
                             <TableAction icon={BadgeCheck} color="text-emerald-500 hover:bg-emerald-50" onClick={() => openModal('approve', app)} tooltip="Approve" />
                             <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', app)} tooltip="Delete Application" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === app.id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === app.id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={XCircle} 
                                            label="Reject Application" 
                                            color="text-rose-600 hover:bg-rose-50"
                                            onClick={() => openModal('reject', app)} 
                                         />
                                         <DropdownItem 
                                            icon={PauseCircle} 
                                            label="Hold Application" 
                                            color="text-amber-600 hover:bg-amber-50"
                                            onClick={() => openModal('hold', app)} 
                                         />
                                         <DropdownItem 
                                            icon={UserPlus} 
                                            label="Assign Reviewer" 
                                            onClick={() => openModal('reviewer', app)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={Download} 
                                            label="Export Report" 
                                            onClick={() => openModal('export', app)} 
                                         />
                                      </motion.div>
                                   )}
                                </AnimatePresence>
                             </div>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </section>

      {/* --- MODALS & DRAWERS --- */}

      {/* NEW APPLICATION MODAL */}
      <Modal 
        isOpen={activeModal === 'new'} 
        onClose={closeModal} 
        title={`New Application - Step ${step} of 5`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-8">
           <div className="flex gap-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              {[1, 2, 3, 4, 5].map(s => (
                 <div key={s} className={cn("h-full flex-1 transition-all duration-500", step >= s ? "bg-primary" : "bg-slate-200")} />
              ))}
           </div>

           <div className="min-h-[350px]">
              {step === 1 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Borrower Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Search Existing Borrower" placeholder="Name or ID..." />
                       <div className="flex items-end pb-1">
                          <Button variant="ghost" className="text-primary text-[10px] font-black uppercase">Or Add New</Button>
                       </div>
                       <Input label="Full Name" placeholder="e.g. Sipho Gumede" />
                       <Input label="ID Number" placeholder="YYMMDD SSSS CCC" />
                    </div>
                 </motion.div>
              )}

              {step === 2 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Loan Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loan Type</label>
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm">
                             <option>Personal Loan</option>
                             <option>Business Loan</option>
                             <option>SME Loan</option>
                          </select>
                       </div>
                       <Input label="Requested Amount" placeholder="R 0.00" />
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loan Tenure</label>
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm">
                             <option>6 Months</option>
                             <option>12 Months</option>
                             <option>24 Months</option>
                          </select>
                       </div>
                       <Input label="Purpose of Loan" placeholder="e.g. Home Improvement" />
                    </div>
                 </motion.div>
              )}

              {step === 3 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Affordability Analysis</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Monthly Net Income" placeholder="R" />
                       <Input label="Monthly Expenses" placeholder="R" />
                       <Input label="Existing Debt Repayments" placeholder="R" />
                       <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <p className="text-[10px] font-black text-primary uppercase mb-1">Calculated DTI</p>
                          <p className="text-2xl font-black text-primary">32.4%</p>
                       </div>
                    </div>
                 </motion.div>
              )}

              {step === 4 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Banking & Disbursement</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Bank Name" />
                       <Input label="Account Number" />
                       <Input label="Account Type" />
                       <Input label="Branch Code" />
                    </div>
                 </motion.div>
              )}

              {step === 5 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Review & Documents</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <UploadCardSimple label="South African ID" icon={ShieldCheck} />
                       <UploadCardSimple label="Last 3 Months Payslips" icon={FileText} />
                       <UploadCardSimple label="Bank Statement" icon={Wallet} />
                       <UploadCardSimple label="Proof of Residence" icon={MapPin} />
                    </div>
                    <div className="p-4 bg-slate-900 text-white rounded-[2rem] flex items-center justify-between">
                       <div>
                          <p className="text-sm font-black">Final Application Audit</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ready for Review Stage</p>
                       </div>
                       <CheckCircle size={24} className="text-accent" />
                    </div>
                 </motion.div>
              )}
           </div>

           <div className="flex gap-4 pt-6 border-t border-slate-50">
              {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1">Previous</Button>}
              <Button onClick={() => step < 5 ? setStep(step + 1) : closeModal()} className="flex-1 py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                 {step === 5 ? "Submit Application" : "Next Step"}
              </Button>
           </div>
        </div>
      </Modal>

      {/* APPROVAL MODAL */}
      <Modal isOpen={activeModal === 'approve'} onClose={closeModal} title="Approve Application" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
               <BadgeCheck size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Confirm Loan Approval?</h4>
               <p className="text-sm text-slate-500 mt-2">You are approving <span className="font-bold text-slate-900">{selectedApp?.borrower}</span>'s request for <span className="font-bold text-primary">R {selectedApp?.amount.toLocaleString()}</span>.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 text-left">
               <ReviewRow label="Approved Amount" value={`R ${selectedApp?.amount.toLocaleString()}`} />
               <ReviewRow label="Repayment Term" value="12 Months" />
               <ReviewRow label="Monthly EMI" value="R 2,450.00" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100">Confirm Approval</Button>
            </div>
         </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal isOpen={activeModal === 'reject'} onClose={closeModal} title="Reject Application" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="text-center">
               <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
                  <XCircle size={28} />
               </div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Decline Application?</h4>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rejection Reason</label>
               <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm">
                  <option>Poor Credit Score</option>
                  <option>Insufficient Income</option>
                  <option>Incomplete Documentation</option>
                  <option>High Debt-to-Income Ratio</option>
                  <option>Other</option>
               </select>
            </div>
            <Input label="Additional Notes" isTextArea placeholder="Enter internal notes for rejection..." />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 shadow-lg shadow-rose-200">Confirm Reject</Button>
            </div>
         </div>
      </Modal>

      {/* HOLD MODAL */}
      <Modal isOpen={activeModal === 'hold'} onClose={closeModal} title="Put Application on Hold" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="text-center">
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
                  <PauseCircle size={28} />
               </div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Suspend Review?</h4>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hold Category</label>
               <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm">
                  <option>Awaiting Client Documents</option>
                  <option>Further Income Investigation</option>
                  <option>Collateral Appraisal Pending</option>
                  <option>System Maintenance</option>
               </select>
            </div>
            <Input label="Notes for Borrower" isTextArea placeholder="This will be visible to the borrower..." />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100 border-none">Confirm Hold</Button>
            </div>
         </div>
      </Modal>

      {/* REVIEWER MODAL */}
      <Modal isOpen={activeModal === 'reviewer'} onClose={closeModal} title="Assign Reviewer" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="space-y-3">
               <ReviewerItem name="Zanele Khoza" role="Verification Officer" active="12" onClick={closeModal} />
               <ReviewerItem name="Kobus Marais" role="Loan Reviewer" active="8" onClick={closeModal} />
               <ReviewerItem name="Ayanda Dlamini" role="Collections Staff" active="5" onClick={closeModal} />
            </div>
            <Input label="Assignment Notes" isTextArea placeholder="Special instructions for the reviewer..." />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 shadow-lg shadow-primary/20">Assign Reviewer</Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Application Data" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose format for loan application batch export.</p>
            <div className="grid grid-cols-3 gap-3">
               <ExportCard label="PDF" icon={FileText} />
               <ExportCard label="CSV" icon={CreditCard} />
               <ExportCard label="Excel" icon={Activity} />
            </div>
            <Button className="w-full py-4 shadow-lg shadow-primary/20">Generate Export</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Application" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Discard Application?</h4>
               <p className="text-sm text-slate-500 mt-2">You are about to permanently remove <span className="font-bold text-slate-900">{selectedApp?.id}</span>. This action is irreversible.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
               <Checkbox label="I understand this will delete all uploaded docs" />
               <Checkbox label="I confirm this application was created in error" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 shadow-lg shadow-rose-200">Permanently Delete</Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Application Review"
         width="max-w-2xl"
      >
         {selectedApp && (
            <div className="space-y-10">
               {/* Header Card */}
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-3xl font-black">
                     {selectedApp.borrower.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black tracking-tight">{selectedApp.borrower}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">App ID: {selectedApp.id}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedApp.status} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xl font-black text-accent ml-2">R {selectedApp.amount.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               {/* Affordability Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Wallet size={14} className="text-primary" /> Affordability Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryCard title="Monthly Income" value="R 32,500" color="text-emerald-600" />
                     <SummaryCard title="Monthly Expenses" value="R 12,400" color="text-rose-500" />
                     <SummaryCard title="Estimated EMI" value="R 2,450" color="text-primary" />
                     <SummaryCard title="Status" value={selectedApp.affordability} color={selectedApp.affordability === 'Eligible' ? 'text-emerald-600' : 'text-amber-500'} />
                  </div>
               </div>

               {/* Documents Section */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <FileText size={14} className="text-accent" /> Uploaded Documents
                  </h4>
                  <div className="space-y-3">
                     <DocCard name="Borrower Identity (ID)" status="Verified" />
                     <DocCard name="Proof of Income (Payslip)" status="Verified" />
                     <DocCard name="Bank Statement (3 Months)" status="Under Review" />
                     <DocCard name="Proof of Residence" status="Verified" />
                  </div>
               </div>

               {/* Employment Info */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Briefcase size={14} className="text-slate-400" /> Employment Details
                  </h4>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                     <ReviewRow label="Employer" value="Global Tech Solutions" />
                     <ReviewRow label="Occupation" value="Senior Systems Analyst" />
                     <ReviewRow label="Years of Service" value="4 Years" />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="danger" onClick={() => openModal('reject', selectedApp)} className="flex-1">Decline</Button>
                  <Button onClick={() => openModal('approve', selectedApp)} className="flex-[2] shadow-lg shadow-primary/20">Finalize Approval</Button>
               </div>
            </div>
         )}
      </Drawer>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const TableAction = ({ icon: Icon, color, onClick, tooltip }) => (
  <button 
     onClick={onClick}
     className={cn("p-2 rounded-xl transition-all", color)}
     title={tooltip}
  >
     <Icon size={18} />
  </button>
);

const DropdownItem = ({ icon: Icon, label, onClick, color }) => (
   <button 
      onClick={(e) => {
         e.stopPropagation();
         onClick();
      }}
      className={cn(
         "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
         color || "text-slate-600 hover:bg-slate-50 hover:text-primary"
      )}
   >
      <Icon size={16} />
      {label}
   </button>
);

const ReviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-1">
     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-black text-slate-900">{value}</span>
  </div>
);

const SummaryCard = ({ title, value, color }) => (
   <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center group hover:border-primary transition-all">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className={cn("text-lg font-black", color)}>{value}</p>
   </div>
);

const DocCard = ({ name, status }) => (
   <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-primary transition-all">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><FileText size={18} /></div>
         <div>
            <p className="text-xs font-black text-slate-900">{name}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{status}</p>
         </div>
      </div>
      <div className="flex items-center gap-2">
         <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Eye size={16} /></button>
         <button className="p-2 text-slate-400 hover:text-primary transition-colors"><DownloadCloud size={16} /></button>
      </div>
   </div>
);

const ReviewerItem = ({ name, role, active, onClick }) => (
   <div 
      onClick={onClick}
      className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary transition-all cursor-pointer"
   >
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center font-black group-hover:bg-primary group-hover:text-white transition-all">{name.charAt(0)}</div>
         <div>
            <p className="text-sm font-black text-slate-900">{name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{role}</p>
         </div>
      </div>
      <div className="text-right">
         <p className="text-xs font-black text-primary">{active} Active</p>
         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Reviews</p>
      </div>
   </div>
);

const ExportCard = ({ label, icon: Icon }) => (
  <button className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
     <Icon size={24} className="text-slate-400 group-hover:text-primary mb-3" />
     <span className="text-[10px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">{label}</span>
  </button>
);

const Checkbox = ({ label }) => (
  <label className="flex items-center gap-3 group cursor-pointer">
    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center transition-all group-hover:border-primary">
      <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </label>
);

const UploadCardSimple = ({ label, icon: Icon }) => (
  <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary transition-all cursor-pointer">
     <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-primary group-hover:text-white transition-all"><Icon size={16} /></div>
        <span className="text-xs font-bold text-slate-700">{label}</span>
     </div>
     <FileUp size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
  </div>
);

export default Applications;
