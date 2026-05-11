import React, { useState } from 'react';
import { 
  Users, UserPlus, Download, Filter, Search, MoreVertical, 
  Eye, ShieldX, Lock, Pencil, Mail, Phone, MapPin, 
  Building2, Wallet, Briefcase, Calendar, Clock, 
  CheckCircle, FileText, CreditCard, Activity, 
  ChevronRight, ArrowRight, ShieldAlert, CheckCircle2,
  Trash2, X
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
const initialBorrowers = [
  { 
    id: 'B-2041', name: 'Sipho Nkosi', email: 'sipho@example.com', phone: '+27 82 123 4567', 
    activeLoans: 1, paymentStatus: 'Paid', accountStatus: 'Active', lastActivity: '2 hours ago' 
  },
  { 
    id: 'B-2042', name: 'Amara Okafor', email: 'amara@example.com', phone: '+27 71 987 6543', 
    activeLoans: 0, paymentStatus: 'Pending', accountStatus: 'Active', lastActivity: '1 day ago' 
  },
  { 
    id: 'B-2043', name: 'David van Wyk', email: 'david@example.com', phone: '+27 83 555 0192', 
    activeLoans: 2, paymentStatus: 'Overdue', accountStatus: 'Frozen', lastActivity: '3 hours ago' 
  },
  { 
    id: 'B-2044', name: 'Lindiwe Zulu', email: 'lindi@example.com', phone: '+27 61 234 5678', 
    activeLoans: 1, paymentStatus: 'Paid', accountStatus: 'Active', lastActivity: '5 hours ago' 
  },
  { 
    id: 'B-2045', name: 'Kgotso Motaung', email: 'kgotso@example.com', phone: '+27 72 888 1234', 
    activeLoans: 0, paymentStatus: 'Pending', accountStatus: 'Blacklisted', lastActivity: '2 days ago' 
  },
];

const Borrowers = () => {
  const [borrowers] = useState(initialBorrowers);
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'freeze', 'blacklist', 'export', 'delete'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [step, setStep] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

  const openDrawer = (borrower) => {
    setSelectedBorrower(borrower);
    setIsDrawerOpen(true);
    setOpenMenuId(null);
  };

  const openModal = (type, borrower = null) => {
    setSelectedBorrower(borrower);
    setActiveModal(type);
    if (type === 'add') setStep(1);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Borrowers</h1>
          <p className="text-slate-500 font-medium mt-1">Manage borrowers, active loans, payment status, and account details.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button onClick={() => openModal('add')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20">
             <UserPlus size={18} /> Add Borrower
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Borrowers" value="2,450" icon={Users} color="navy" />
        <StatCard title="Active Borrowers" value="1,890" icon={CheckCircle} color="blue" />
        <StatCard title="Frozen Accounts" value="34" icon={Lock} color="rose" />
        <StatCard title="Blacklisted Borrowers" value="12" icon={ShieldX} color="rose" />
      </section>

      {/* 3. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search borrower by name, email or phone..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Account Status</option>
              <option>Active</option>
              <option>Frozen</option>
              <option>Blacklisted</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Active Loans</option>
              <option>0 Loans</option>
              <option>1+ Loans</option>
           </select>
        </div>
      </section>

      {/* 4. BORROWERS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Loans</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {borrowers.map((borrower) => (
                    <tr key={borrower.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                {borrower.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{borrower.name}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{borrower.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-700">{borrower.phone}</p>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-xs font-black text-slate-600">
                             {borrower.activeLoans}
                          </span>
                       </td>
                       <td className="px-6 py-5">
                          <StatusBadge status={borrower.paymentStatus} />
                       </td>
                       <td className="px-6 py-5">
                          <StatusBadge status={borrower.accountStatus} />
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{borrower.lastActivity}</p>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer(borrower)} tooltip="View Details" />
                             <TableAction icon={Pencil} color="text-primary hover:bg-primary/5" onClick={() => openModal('edit', borrower)} tooltip="Edit Profile" />
                             <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', borrower)} tooltip="Delete Borrower" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === borrower.id ? null : borrower.id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === borrower.id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === borrower.id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={Lock} 
                                            label="Freeze Account" 
                                            onClick={() => openModal('freeze', borrower)} 
                                         />
                                         <DropdownItem 
                                            icon={ShieldX} 
                                            label="Blacklist" 
                                            color="text-rose-600 hover:bg-rose-50"
                                            onClick={() => openModal('blacklist', borrower)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={Download} 
                                            label="Export Data" 
                                            onClick={() => openModal('export', borrower)} 
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

      {/* ADD BORROWER MODAL */}
      <Modal 
        isOpen={activeModal === 'add'} 
        onClose={closeModal} 
        title={`Add Borrower - Step ${step} of 4`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-8">
           {/* Progress Line */}
           <div className="flex gap-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              {[1, 2, 3, 4].map(s => (
                 <div key={s} className={cn("h-full flex-1 transition-all duration-500", step >= s ? "bg-primary" : "bg-slate-200")} />
              ))}
           </div>

           <div className="min-h-[300px]">
              {step === 1 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Personal Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Full Name" placeholder="e.g. Sipho Nkosi" />
                       <Input label="ID Number" placeholder="8505125432081" />
                       <Input label="Email Address" placeholder="name@example.com" />
                       <Input label="Phone Number" placeholder="+27 00 000 0000" />
                    </div>
                    <Input label="Physical Address" placeholder="Unit, Street, Suburb, City" isTextArea />
                 </motion.div>
              )}

              {step === 2 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Employment Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Employer Name" />
                       <Input label="Occupation" />
                       <Input label="Monthly Net Salary" placeholder="R" />
                       <Input label="Years of Service" />
                    </div>
                 </motion.div>
              )}

              {step === 3 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Banking Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Bank Name" />
                       <Input label="Account Number" />
                       <Input label="Branch Code" />
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Type</label>
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10">
                             <option>Savings</option>
                             <option>Current</option>
                             <option>Cheque</option>
                          </select>
                       </div>
                    </div>
                 </motion.div>
              )}

              {step === 4 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Review & Submit</h4>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                       <ReviewRow label="Full Name" value="Sipho Nkosi" />
                       <ReviewRow label="ID Number" value="8505125432081" />
                       <ReviewRow label="Net Salary" value="R 24,500" />
                       <ReviewRow label="Bank" value="Standard Bank" />
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                       <ShieldAlert size={20} className="text-primary shrink-0 mt-0.5" />
                       <p className="text-[11px] text-primary/80 font-bold leading-relaxed uppercase">
                          By clicking submit, you confirm that all information provided is accurate and you have borrower consent to conduct credit checks.
                       </p>
                    </div>
                 </motion.div>
              )}
           </div>

           <div className="flex gap-4 pt-6 border-t border-slate-50">
              {step > 1 && (
                 <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Previous</Button>
              )}
              <Button onClick={() => step < 4 ? setStep(step + 1) : closeModal()} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">
                 {step === 4 ? "Submit Borrower" : "Next Step"}
              </Button>
           </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={activeModal === 'edit'} onClose={closeModal} title="Edit Borrower Profile" maxWidth="max-w-xl">
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input label="Full Name" defaultValue={selectedBorrower?.name} />
               <Input label="Phone Number" defaultValue={selectedBorrower?.phone} />
               <Input label="Email Address" defaultValue={selectedBorrower?.email} />
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10" defaultValue={selectedBorrower?.accountStatus}>
                     <option>Active</option>
                     <option>Frozen</option>
                     <option>Blacklisted</option>
                  </select>
               </div>
            </div>
            <Input label="Physical Address" isTextArea defaultValue="42 Baker Street, Sandton, 2196" />
            <div className="flex gap-3 pt-4 border-t border-slate-50">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Save Changes</Button>
            </div>
         </div>
      </Modal>

      {/* FREEZE MODAL */}
      <Modal isOpen={activeModal === 'freeze'} onClose={closeModal} title="Freeze Borrower Account" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
               <Lock size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Freeze Account?</h4>
               <p className="text-sm text-slate-500 mt-2">You are freezing <span className="font-bold text-slate-900">{selectedBorrower?.name}</span>'s access. They will be unable to apply for new loans or withdraw funds.</p>
            </div>
            <Input label="Reason for Freeze" placeholder="e.g. Investigation pending, suspicious activity..." isTextArea />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest bg-amber-600 border-amber-600 shadow-lg shadow-amber-200">Confirm Freeze</Button>
            </div>
         </div>
      </Modal>

      {/* BLACKLIST MODAL */}
      <Modal isOpen={activeModal === 'blacklist'} onClose={closeModal} title="Blacklist Borrower" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <ShieldX size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-rose-900 tracking-tight uppercase">Confirm Blacklist</h4>
               <p className="text-sm text-slate-500 mt-2">This is a PERMANENT action. This borrower will be globally flagged for fraud or serious default.</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2 text-left">
               <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Borrower Impact</p>
               <ul className="text-xs text-rose-600 list-disc list-inside font-medium space-y-1">
                  <li>Zero future lending eligibility</li>
                  <li>Account permanently disabled</li>
                  <li>Flagged in external bureau reports</li>
               </ul>
            </div>
            <Input label="Blacklist Reason Code" placeholder="e.g. FRAUD-01, DEBT-99" />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-200">Confirm Blacklist</Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Data" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium">Choose your export format for the current filtered list.</p>
            <div className="grid grid-cols-3 gap-3">
               <ExportCard label="PDF Report" icon={FileText} />
               <ExportCard label="CSV Data" icon={CreditCard} />
               <ExportCard label="Excel Sheet" icon={Activity} />
            </div>
            <Button className="w-full py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Download Export</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Borrower" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Delete Borrower Profile?</h4>
               <p className="text-sm text-slate-500 mt-2">You are permanently deleting <span className="font-bold text-slate-900">{selectedBorrower?.name}</span>'s records. This action cannot be undone.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
               <Checkbox label="I understand this will delete all loan history" />
               <Checkbox label="I confirm there are no active loans for this borrower" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-200">Permanently Delete</Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={isDrawerOpen} 
         onClose={() => setIsDrawerOpen(false)} 
         title="Borrower Details"
         width="max-w-2xl"
      >
         {selectedBorrower && (
            <div className="space-y-10">
               {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                     {selectedBorrower.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedBorrower.name}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {selectedBorrower.id}</p>
                     <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <StatusBadge status={selectedBorrower.accountStatus} />
                        <StatusBadge status={selectedBorrower.paymentStatus} />
                     </div>
                  </div>
               </div>

               {/* Contact & Portfolio */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Phone size={14} className="text-primary" /> Contact Information
                     </h4>
                     <div className="space-y-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <ReviewRow label="Email" value={selectedBorrower.email} />
                        <ReviewRow label="Mobile" value={selectedBorrower.phone} />
                        <ReviewRow label="Address" value="42 Baker St, Sandton" />
                     </div>
                  </div>
                  <div className="space-y-5">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-accent" /> Active Portfolio
                     </h4>
                     <div className="space-y-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <ReviewRow label="Active Loans" value={selectedBorrower.activeLoans} />
                        <ReviewRow label="Total Value" value="R 45,000" />
                        <ReviewRow label="Last Payment" value="12 Oct 2023" />
                     </div>
                  </div>
               </div>

               {/* RECENT LOANS & PAYMENTS HISTORY */}
               <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Borrower Activity History</h4>
                  <div className="space-y-4">
                     <HistoryItem 
                        icon={FileText} 
                        title="Personal Loan Approved" 
                        amount="R 12,500" 
                        date="15 Oct 2023" 
                        status="Active" 
                     />
                     <HistoryItem 
                        icon={Wallet} 
                        title="Monthly Repayment" 
                        amount="R 1,200" 
                        date="12 Oct 2023" 
                        status="Verified" 
                     />
                     <HistoryItem 
                        icon={Clock} 
                        title="Loan Application" 
                        amount="R 5,000" 
                        date="01 Oct 2023" 
                        status="Rejected" 
                     />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex gap-4">
                  <Button variant="ghost" className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest border-slate-100">Print Statement</Button>
                  <Button onClick={() => openModal('edit', selectedBorrower)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Edit Profile</Button>
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

const ExportCard = ({ label, icon: Icon }) => (
  <button className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group">
     <Icon size={24} className="text-slate-400 group-hover:text-primary mb-3" />
     <span className="text-[10px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">{label}</span>
  </button>
);

const HistoryItem = ({ icon: Icon, title, amount, date, status }) => (
   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
      <div className="flex items-center gap-4">
         <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
            <Icon size={18} />
         </div>
         <div>
            <p className="text-sm font-black text-slate-900">{title}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
         </div>
      </div>
      <div className="text-right">
         <p className="text-sm font-black text-slate-900">{amount}</p>
         <StatusBadge status={status} className="text-[9px] py-0 mt-1" />
      </div>
   </div>
);

const SummaryRow = ({ title, items }) => (
  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">{title}</p>
    <div className="space-y-1">
      {items.map((item, i) => (
        <p key={i} className="text-xs font-bold text-slate-700">{item}</p>
      ))}
    </div>
  </div>
);

const Checkbox = ({ label }) => (
  <label className="flex items-center gap-3 group cursor-pointer">
    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center transition-all group-hover:border-primary">
      <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
  </label>
);

const UploadCard = ({ label, icon: Icon }) => (
  <div className="p-5 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer text-center">
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
      <Icon size={24} className="text-slate-400 group-hover:text-primary" />
    </div>
    <p className="text-xs font-bold text-slate-900 mb-1">{label}</p>
    <p className="text-[10px] text-slate-400 font-medium">Click or Drag to Upload</p>
  </div>
);

export default Borrowers;
