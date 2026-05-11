import React, { useState } from 'react';
import { 
  Users, UserPlus, Download, Filter, Search, MoreVertical, 
  Eye, Pencil, BadgePercent, Trash2, CheckCircle2,
  Mail, Phone, MapPin, Building2, Wallet, Briefcase, 
  Calendar, Clock, CheckCircle, FileText, CreditCard, 
  Activity, ShieldAlert, DollarSign, ChevronRight,
  UserCheck, History, ArrowRight, X
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
const initialAgents = [
  { 
    id: 'AGT-201', name: 'Thabo Mbeki', email: 'thabo@point47.com', phone: '+27 82 555 0101',
    assignedClients: 124, activeBorrowers: 86, commission: '8%', earnings: 'R 11,616', status: 'Active'
  },
  { 
    id: 'AGT-202', name: 'Nomvula Zulu', email: 'nomvula@point47.com', phone: '+27 71 444 0202',
    assignedClients: 98, activeBorrowers: 72, commission: '7.5%', earnings: 'R 6,937', status: 'Active'
  },
  { 
    id: 'AGT-203', name: 'Johan Smith', email: 'johan@point47.com', phone: '+27 83 333 0303',
    assignedClients: 156, activeBorrowers: 110, commission: '9%', earnings: 'R 17,820', status: 'Active'
  },
  { 
    id: 'AGT-204', name: 'Lerato Molefe', email: 'lerato@point47.com', phone: '+27 61 222 0404',
    assignedClients: 45, activeBorrowers: 30, commission: '6%', earnings: 'R 1,320', status: 'Suspended'
  },
  { 
    id: 'AGT-205', name: 'Fatima Isaacs', email: 'fatima@point47.com', phone: '+27 72 111 0505',
    assignedClients: 82, activeBorrowers: 55, commission: '7%', earnings: 'R 4,788', status: 'Inactive'
  },
];

const Agents = () => {
  const [agents] = useState(initialAgents);
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'commission', 'export', 'delete'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view', 'clients'
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [step, setStep] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

  const openModal = (type, agent = null) => {
    setSelectedAgent(agent);
    setActiveModal(type);
    if (type === 'add') setStep(1);
    setOpenMenuId(null);
  };

  const openDrawer = (type, agent) => {
    setSelectedAgent(agent);
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agents</h1>
          <p className="text-slate-500 font-medium mt-1">Manage field agents, assigned borrowers, commissions, and earnings.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => openModal('export')} className="flex items-center gap-2 font-bold px-6">
             <Download size={18} /> Export
           </Button>
           <Button onClick={() => openModal('add')} className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-primary/20">
             <UserPlus size={18} /> Add Agent
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Agents" value="124" icon={Users} color="navy" />
        <StatCard title="Active Agents" value="112" icon={UserCheck} color="blue" />
        <StatCard title="Assigned Clients" value="4,892" icon={Users} color="navy" />
        <StatCard title="Monthly Commissions" value="R 425k" icon={Wallet} color="blue" />
      </section>

      {/* 3. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search agent by name, email or phone..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Filter by Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Assigned Clients</option>
              <option>0-50</option>
              <option>51-150</option>
              <option>151+</option>
           </select>
        </div>
      </section>

      {/* 4. AGENTS TABLE */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="text-left border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Assigned Clients</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Active Borrowers</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Commission %</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Earnings</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {agents.map((agent) => (
                    <tr key={agent.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                                {agent.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{agent.name}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{agent.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-700">{agent.phone}</p>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <p className="text-sm font-black text-slate-900">{agent.assignedClients}</p>
                       </td>
                       <td className="px-6 py-5 text-center text-primary font-bold">
                          {agent.activeBorrowers}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">
                             {agent.commission}
                          </span>
                       </td>
                       <td className="px-6 py-5 text-right font-black text-emerald-600">
                          {agent.earnings}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge status={agent.status} />
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', agent)} tooltip="View Agent" />
                             <TableAction icon={Pencil} color="text-primary hover:bg-primary/5" onClick={() => openModal('edit', agent)} tooltip="Edit Agent" />
                             <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', agent)} tooltip="Delete Agent" />
                             
                             <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button 
                                   onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)}
                                   className={cn(
                                      "p-2 rounded-xl transition-all",
                                      openMenuId === agent.id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                   )}
                                >
                                   <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                   {openMenuId === agent.id && (
                                      <motion.div 
                                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                         className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                      >
                                         <DropdownItem 
                                            icon={Users} 
                                            label="View Clients" 
                                            onClick={() => openDrawer('clients', agent)} 
                                         />
                                         <DropdownItem 
                                            icon={BadgePercent} 
                                            label="Set Commission" 
                                            onClick={() => openModal('commission', agent)} 
                                         />
                                         <div className="my-1 border-t border-slate-50" />
                                         <DropdownItem 
                                            icon={ShieldAlert} 
                                            label="Suspend Agent" 
                                            color="text-amber-600 hover:bg-amber-50"
                                            onClick={() => openModal('edit', agent)} 
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

      {/* ADD AGENT MODAL */}
      <Modal 
        isOpen={activeModal === 'add'} 
        onClose={closeModal} 
        title={`Add Agent - Step ${step} of 4`}
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
                       <Input label="Full Name" placeholder="e.g. Samuel Jackson" />
                       <Input label="Email Address" type="email" placeholder="name@point47.com" />
                       <Input label="Phone Number" placeholder="+27 00 000 0000" />
                       <Input label="ID Number" placeholder="850512..." />
                    </div>
                    <Input label="Physical Address" isTextArea placeholder="Street, City, Province, Code" />
                 </motion.div>
              )}

              {step === 2 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Employment Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Region</label>
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10">
                             <option>Gauteng</option>
                             <option>Western Cape</option>
                             <option>KwaZulu-Natal</option>
                          </select>
                       </div>
                       <Input label="Joining Date" type="date" />
                       <Input label="Reporting Manager" placeholder="Search Manager..." />
                       <Input label="Employee ID" placeholder="AUTO-GENERATED" disabled />
                    </div>
                 </motion.div>
              )}

              {step === 3 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Commission Setup</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Base Commission (%)" type="number" placeholder="e.g. 8" />
                       <Input label="Recovery Bonus (%)" type="number" placeholder="e.g. 2" />
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Commission Tier</label>
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10">
                             <option>Standard</option>
                             <option>Senior</option>
                             <option>Recovery Specialist</option>
                          </select>
                       </div>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                       <p className="text-[11px] text-primary font-bold uppercase">Note: Commission is calculated based on successful monthly collections.</p>
                    </div>
                 </motion.div>
              )}

              {step === 4 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Review & Submit</h4>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                       <ReviewRow label="Agent Name" value="Samuel Jackson" />
                       <ReviewRow label="Base Commission" value="8%" />
                       <ReviewRow label="Region" value="Gauteng" />
                       <ReviewRow label="Role" value="Field Agent" />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                       <CheckCircle2 size={20} />
                       <p className="text-[11px] font-bold uppercase leading-tight">I verify all agent details and commission structures are approved as per policy.</p>
                    </div>
                 </motion.div>
              )}
           </div>

           <div className="flex gap-4 pt-6 border-t border-slate-50">
              {step > 1 && (
                 <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Previous</Button>
              )}
              <Button onClick={() => step < 4 ? setStep(step + 1) : closeModal()} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">
                 {step === 4 ? "Complete Onboarding" : "Next Step"}
              </Button>
           </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={activeModal === 'edit'} onClose={closeModal} title="Edit Agent" maxWidth="max-w-xl">
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <Input label="Full Name" defaultValue={selectedAgent?.name} />
               <Input label="Phone Number" defaultValue={selectedAgent?.phone} />
               <Input label="Email Address" defaultValue={selectedAgent?.email} />
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10" defaultValue={selectedAgent?.status}>
                     <option>Active</option>
                     <option>Inactive</option>
                     <option>Suspended</option>
                  </select>
               </div>
            </div>
            <Input label="Assigned Area" defaultValue="Sandton Central" />
            <div className="flex gap-3 pt-4 border-t border-slate-50">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Save Changes</Button>
            </div>
         </div>
      </Modal>

      {/* COMMISSION MODAL */}
      <Modal isOpen={activeModal === 'commission'} onClose={closeModal} title="Set Commission %" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black">{selectedAgent?.name.charAt(0)}</div>
               <div>
                  <p className="text-sm font-black text-slate-900">{selectedAgent?.name}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Current: {selectedAgent?.commission}</p>
               </div>
            </div>
            <Input label="New Commission Percentage (%)" type="number" placeholder="e.g. 8.5" />
            <Input label="Reason / Notes" isTextArea placeholder="e.g. Annual performance adjustment..." />
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Save Commission</Button>
            </div>
         </div>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Export Agent Data" maxWidth="max-w-md">
         <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium text-center px-4">Choose your preferred format for the agent report.</p>
            <div className="grid grid-cols-3 gap-3">
               <ExportCard label="PDF" icon={FileText} />
               <ExportCard label="CSV" icon={CreditCard} />
               <ExportCard label="Excel" icon={Activity} />
            </div>
            <Button className="w-full py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Generate Report</Button>
         </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Agent" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Delete Agent Account?</h4>
               <p className="text-sm text-slate-500 mt-2">You are about to permanently delete <span className="font-bold text-slate-900">{selectedAgent?.name}</span>. This action will unassign all their borrowers.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 text-left">
               <Checkbox label="I understand this agent will lose system access" />
               <Checkbox label="I have unassigned or reassigned all active clients" />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest">Cancel</Button>
               <Button variant="danger" onClick={closeModal} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-200">Permanently Delete</Button>
            </div>
         </div>
      </Modal>

      {/* VIEW DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'view'} 
         onClose={closeDrawer} 
         title="Agent Profile"
         width="max-w-2xl"
      >
         {selectedAgent && (
            <div className="space-y-10">
               {/* Header Info */}
               <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                     {selectedAgent.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedAgent.name}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Agent ID: {selectedAgent.id}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedAgent.status} />
                        <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-xs font-black text-slate-600">{selectedAgent.commission} Comm.</span>
                     </div>
                  </div>
               </div>

               {/* Stats Overview */}
               <div className="grid grid-cols-3 gap-6">
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Clients</p>
                     <p className="text-xl font-black text-slate-900">{selectedAgent.assignedClients}</p>
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Loans</p>
                     <p className="text-xl font-black text-primary">{selectedAgent.activeBorrowers}</p>
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Earnings</p>
                     <p className="text-xl font-black text-emerald-600">{selectedAgent.earnings}</p>
                  </div>
               </div>

               {/* Earnings Summary */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <DollarSign size={14} className="text-emerald-500" /> Earnings & Activity
                  </h4>
                  <div className="space-y-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <ReviewRow label="Monthly Base" value="R 8,500" />
                     <ReviewRow label="Comm. This Month" value="R 3,116" />
                     <ReviewRow label="Last Payout" value="28 Oct 2023" />
                     <div className="h-px bg-slate-200 my-2" />
                     <ReviewRow label="Assigned Area" value="Sandton Sector 4" />
                  </div>
               </div>

               {/* Recent Activity */}
               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Performance Activity</h4>
                  <div className="space-y-4">
                     <ActivityItem title="New Borrower Onboarded" date="12 Oct, 14:30" icon={UserPlus} color="bg-blue-500" />
                     <ActivityItem title="Payment Collected" date="11 Oct, 09:15" icon={Wallet} color="bg-emerald-500" />
                     <ActivityItem title="Commission Payout" date="28 Sep, 11:20" icon={DollarSign} color="bg-primary" />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex gap-4">
                  <Button variant="ghost" className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest border-slate-100">Performance Report</Button>
                  <Button onClick={() => openModal('edit', selectedAgent)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Edit Agent</Button>
               </div>
            </div>
         )}
      </Drawer>

      {/* CLIENTS DRAWER */}
      <Drawer 
         isOpen={activeDrawer === 'clients'} 
         onClose={closeDrawer} 
         title="Assigned Borrowers"
         width="max-w-2xl"
      >
         {selectedAgent && (
            <div className="space-y-8">
               <div className="flex items-center justify-between p-6 bg-primary text-white rounded-[2rem] shadow-xl shadow-primary/20">
                  <div>
                     <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Portfolio Manager</p>
                     <h4 className="text-xl font-black">{selectedAgent.name}</h4>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Active Portfolio</p>
                     <h4 className="text-xl font-black">{selectedAgent.activeBorrowers} Borrowers</h4>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="relative">
                     <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium" placeholder="Search within agent portfolio..." />
                  </div>
                  
                  <div className="space-y-3">
                     {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-primary transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black group-hover:bg-primary group-hover:text-white transition-all">B</div>
                              <div>
                                 <p className="text-sm font-black text-slate-900">Borrower Name {i}</p>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Loan: R 12,500</span>
                                    <StatusBadge status={i % 2 === 0 ? "Active" : "Overdue"} className="text-[8px] py-0 px-1.5" />
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Last Payment</p>
                              <p className="text-xs font-black text-slate-900">12 Oct 2023</p>
                           </div>
                        </div>
                     ))}
                  </div>
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

const ActivityItem = ({ icon: Icon, title, date, color }) => (
   <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", color)}>
         <Icon size={18} />
      </div>
      <div>
         <p className="text-sm font-black text-slate-900">{title}</p>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
      </div>
   </div>
);

const SummaryRowItem = ({ label, value, bold, color }) => (
   <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn("text-xs", bold ? "font-black text-slate-900" : "font-bold text-slate-600", color)}>{value}</span>
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

const UploadCard = ({ label, icon: Icon, className }) => (
  <div className={cn("p-5 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer text-center", className)}>
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
      <Icon size={20} className="text-slate-400 group-hover:text-primary" />
    </div>
    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Upload Required</p>
  </div>
);

const AgentReviewSection = ({ title, items }) => (
   <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">{title}</p>
      <div className="space-y-1">
         {items.map((item, i) => (
            <p key={i} className="text-xs font-black text-slate-900">{item}</p>
         ))}
      </div>
   </div>
);

export default Agents;
