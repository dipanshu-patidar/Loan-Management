import React, { useState } from 'react';
import { 
  Users, UserPlus, Download, Filter, Search, MoreVertical, 
  Eye, Pencil, ShieldCheck, ClipboardCheck, Trash2, CheckCircle2,
  Mail, Phone, MapPin, Building2, Wallet, Briefcase, 
  Calendar, Clock, CheckCircle, FileText, CreditCard, 
  Activity, ShieldAlert, DollarSign, ChevronRight,
  UserCheck, History, ArrowRight, X, Shield
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
const initialStaff = [
  { 
    id: 'STF-501', name: 'Zanele Khoza', email: 'zanele@point47.com', phone: '+27 82 555 1100',
    role: 'Senior Verification Officer', assignedReviews: 12, verificationTasks: 45, workload: 'High', status: 'Active'
  },
  { 
    id: 'STF-502', name: 'Kobus Marais', email: 'kobus@point47.com', phone: '+27 71 444 2200',
    role: 'Loan Reviewer', assignedReviews: 8, verificationTasks: 124, workload: 'Medium', status: 'Active'
  },
  { 
    id: 'STF-503', name: 'Ayanda Dlamini', email: 'ayanda@point47.com', phone: '+27 83 333 3300',
    role: 'Collections Staff', assignedReviews: 0, verificationTasks: 86, workload: 'Low', status: 'Active'
  },
  { 
    id: 'STF-504', name: 'Pieter van Zyl', email: 'pieter@point47.com', phone: '+27 61 222 4400',
    role: 'Verification Officer', assignedReviews: 24, verificationTasks: 12, workload: 'Medium', status: 'Suspended'
  },
  { 
    id: 'STF-505', name: 'Lerato Sebatane', email: 'lerato@point47.com', phone: '+27 72 111 5500',
    role: 'Operations Staff', assignedReviews: 5, verificationTasks: 32, workload: 'Low', status: 'Inactive'
  },
];

const Staff = () => {
  const [staffList] = useState(initialStaff);
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'permissions', 'export', 'delete'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view'
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [step, setStep] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

  const openModal = (type, staff = null) => {
    setSelectedStaff(staff);
    setActiveModal(type);
    if (type === 'add') setStep(1);
    setOpenMenuId(null);
  };

  const openDrawer = (type, staff) => {
    setSelectedStaff(staff);
    setActiveDrawer(type);
    setOpenMenuId(null);
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff</h1>
          <p className="text-slate-500 font-medium mt-1">Manage operational staff, roles, verification assignments, and workloads.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button onClick={() => openModal('add')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20">
             <UserPlus size={18} /> Add Staff
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Staff" value="86" icon={Users} color="navy" />
        <StatCard title="Active Staff" value="78" icon={UserCheck} color="blue" />
        <StatCard title="Pending Verifications" value="142" icon={Clock} color="navy" />
        <StatCard title="Assigned Reviews" value="56" icon={ClipboardCheck} color="blue" />
      </section>

      {/* 3. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search staff by name, email or phone..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Filter by Role</option>
              <option>Loan Reviewer</option>
              <option>Verification Officer</option>
              <option>Operations Staff</option>
              <option>Collections Staff</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Filter by Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
           </select>
        </div>
      </section>

      {/* 4. STAFF TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Assigned Reviews</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Verification Tasks</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Workload</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {staffList.map((staff) => (
                    <tr key={staff.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                {staff.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{staff.name}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{staff.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-tight">
                             {staff.role}
                          </span>
                       </td>
                       <td className="px-6 py-5 text-center font-black text-slate-700">
                          {staff.assignedReviews}
                       </td>
                       <td className="px-6 py-5 text-center font-black text-primary">
                          {staff.verificationTasks}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={staff.workload} />
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={staff.status} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', staff)} tooltip="View Staff" />
                             <TableAction icon={Pencil} color="text-primary hover:bg-primary/5" onClick={() => openModal('edit', staff)} tooltip="Edit Staff" />
                             <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', staff)} tooltip="Delete Staff" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === staff.id ? null : staff.id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === staff.id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === staff.id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={ShieldCheck} 
                                            label="Assign Permissions" 
                                            onClick={() => openModal('permissions', staff)} 
                                         />
                                         <DropdownItem 
                                            icon={History} 
                                            label="View Activity" 
                                            onClick={() => openDrawer('view', staff)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={ShieldAlert} 
                                            label="Suspend Account" 
                                            color="text-amber-600 hover:bg-amber-50"
                                            onClick={() => openModal('edit', staff)} 
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

      {/* ADD STAFF MODAL */}
      <Modal 
        isOpen={activeModal === 'add'} 
        onClose={closeModal} 
        title={`Add Staff - Step ${step} of 4`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-8">
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
                       <Input label="Full Name" placeholder="e.g. Samuel Jackson" />
                       <Input label="Email Address" type="email" placeholder="sam@point47.com" />
                       <Input label="Phone Number" placeholder="+27 00 000 0000" />
                       <Input label="ID Number" placeholder="850512..." />
                    </div>
                    <Input label="Residential Address" isTextArea placeholder="Street, City, Province, Code" />
                 </motion.div>
              )}

              {step === 2 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Employment Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Branch</label>
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm">
                             <option>Johannesburg HQ</option>
                             <option>Cape Town Office</option>
                          </select>
                       </div>
                       <Input label="Joining Date" type="date" />
                       <Input label="Employee ID" placeholder="STF-XXXX" disabled />
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employment Type</label>
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm">
                             <option>Full Time</option>
                             <option>Contract</option>
                          </select>
                       </div>
                    </div>
                 </motion.div>
              )}

              {step === 3 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Role & Permissions</h4>
                    <div className="space-y-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Role</label>
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm">
                             <option>Loan Reviewer</option>
                             <option>Verification Officer</option>
                             <option>Operations Staff</option>
                             <option>Collections Staff</option>
                          </select>
                       </div>
                       <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
                          <Checkbox label="Review Loans" />
                          <Checkbox label="Verify Payments" />
                          <Checkbox label="View Borrowers" />
                          <Checkbox label="Export Reports" />
                          <Checkbox label="Access Notifications" />
                       </div>
                    </div>
                 </motion.div>
              )}

              {step === 4 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Review & Submit</h4>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                       <ReviewRow label="Staff Member" value="Samuel Jackson" />
                       <ReviewRow label="Assigned Role" value="Loan Reviewer" />
                       <ReviewRow label="Branch" value="Johannesburg HQ" />
                       <ReviewRow label="Status" value="Active" />
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 flex items-center gap-3">
                       <CheckCircle2 size={20} />
                       <p className="text-[11px] font-bold uppercase">Staff onboarding is complete. Access credentials will be sent to the registered email.</p>
                    </div>
                 </motion.div>
              )}
           </div>

           <div className="flex gap-4 pt-6 border-t border-slate-50">
              {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1">Previous</Button>}
              <Button onClick={() => step < 4 ? setStep(step + 1) : closeModal()} className="flex-1 py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                 {step === 4 ? "Finalize Onboarding" : "Next Step"}
              </Button>
           </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={activeModal === 'edit'} onClose={closeModal} title="Edit Staff Profile" maxWidth="max-w-xl">
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <Input label="Full Name" defaultValue={selectedStaff?.name} />
               <Input label="Phone Number" defaultValue={selectedStaff?.phone} />
               <Input label="Email Address" defaultValue={selectedStaff?.email} />
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Role</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm" defaultValue={selectedStaff?.role}>
                     <option>Loan Reviewer</option>
                     <option>Verification Officer</option>
                     <option>Operations Staff</option>
                     <option>Collections Staff</option>
                  </select>
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status</label>
               <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm" defaultValue={selectedStaff?.status}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Suspended</option>
               </select>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-50">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 shadow-lg shadow-primary/20">Save Updates</Button>
            </div>
         </div>
      </Modal>

      {/* PERMISSIONS MODAL */}
      <Modal isOpen={activeModal === 'permissions'} onClose={closeModal} title="Assign Permissions" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black">{selectedStaff?.name.charAt(0)}</div>
               <div>
                  <p className="text-sm font-black text-slate-900">{selectedStaff?.name}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">{selectedStaff?.role}</p>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
               <Checkbox label="Review Loans" />
               <Checkbox label="Verify Payments" />
               <Checkbox label="View Borrowers" />
               <Checkbox label="Export Reports" />
               <Checkbox label="Access Notifications" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 shadow-lg shadow-primary/20">Save Permissions</Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Staff Records" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose the report format for operational staff records.</p>
            <div className="grid grid-cols-3 gap-3">
               <ExportCard label="PDF" icon={FileText} />
               <ExportCard label="CSV" icon={CreditCard} />
               <ExportCard label="Excel" icon={Activity} />
            </div>
            <Button className="w-full py-4 shadow-lg shadow-primary/20">Download Report</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Staff Member" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Delete Account?</h4>
               <p className="text-sm text-slate-500 mt-2">You are permanently deleting <span className="font-bold text-slate-900">{selectedStaff?.name}</span>'s access. This will remove all their active review assignments.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
               <Checkbox label="I understand this staff member will lose access" />
               <Checkbox label="I have reassigned all pending verification tasks" />
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
         title="Staff Profile"
         width="max-w-2xl"
      >
         {selectedStaff && (
            <div className="space-y-10">
               {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                     {selectedStaff.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedStaff.name}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Role: {selectedStaff.role}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedStaff.status} />
                        <StatusBadge status={selectedStaff.workload} />
                     </div>
                  </div>
               </div>

               {/* Workload Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Activity size={14} className="text-primary" /> Workload Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <SummaryCard title="Assigned Reviews" value={selectedStaff.assignedReviews} color="text-primary" />
                     <SummaryCard title="Verification Tasks" value={selectedStaff.verificationTasks} color="text-accent" />
                     <SummaryCard title="Completed (M)" value="124" color="text-emerald-600" />
                     <SummaryCard title="Pending" value={selectedStaff.assignedReviews + selectedStaff.verificationTasks} color="text-amber-500" />
                  </div>
               </div>

               {/* Recent Activity */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-slate-400" /> Recent Activity
                  </h4>
                  <div className="space-y-4">
                     <ActivityItem title="Loan Review Approved" date="10 Oct, 14:20" icon={CheckCircle} color="bg-emerald-500" />
                     <ActivityItem title="Payment Verified" date="09 Oct, 11:45" icon={CreditCard} color="bg-blue-500" />
                     <ActivityItem title="Document Verified" date="08 Oct, 09:30" icon={ShieldCheck} color="bg-primary" />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex gap-4">
                  <Button variant="ghost" className="flex-1">Operational History</Button>
                  <Button onClick={() => openModal('edit', selectedStaff)} className="flex-1 shadow-lg shadow-primary/20">Edit Staff</Button>
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

const SummaryCard = ({ title, value, color }) => (
   <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className={cn("text-xl font-black", color)}>{value}</p>
   </div>
);

const ActivityItem = ({ icon: Icon, title, date, color }) => (
   <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary transition-all group">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", color)}>
         <Icon size={18} />
      </div>
      <div>
         <p className="text-sm font-black text-slate-900">{title}</p>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
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

export default Staff;
