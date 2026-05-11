import React, { useState } from 'react';
import { 
  Bell, CheckCheck, Trash2, Eye, Search, 
  Filter, MoreVertical, Clock, AlertTriangle, 
  DollarSign, Activity, FileText, CheckCircle2,
  ArrowRight, X, Mail, Phone, Calendar, 
  ShieldCheck, UserCheck, MessageSquare, Briefcase,
  Zap, Smartphone, ChevronRight, UserPlus, History,
  User, Building2, FileCheck, FileX, Info,
  ExternalLink, Download, Printer, UserMinus, ShieldAlert,
  Smartphone as WhatsApp, MessageCircle, PhoneCall, Wallet, AlertCircle
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
const initialNotifications = [
  { 
    id: 'NOT-001', type: 'New Application', priority: 'Important', 
    message: 'New loan application received from Lerato Molefe for R 15,000.',
    borrower: 'Lerato Molefe', time: '10 mins ago', status: 'Unread', icon: FileText, color: 'text-blue-500'
  },
  { 
    id: 'NOT-002', type: 'Overdue Alert', priority: 'Urgent', 
    message: 'EMI repayment for Sipho Nkosi is 3 days overdue. Action required.',
    borrower: 'Sipho Nkosi', time: '2 hours ago', status: 'Unread', icon: AlertTriangle, color: 'text-rose-500'
  },
  { 
    id: 'NOT-003', type: 'Payment Notification', priority: 'Normal', 
    message: 'Payment of R 4,500 received and pending verification from David van Wyk.',
    borrower: 'David van Wyk', time: '5 hours ago', status: 'Read', icon: DollarSign, color: 'text-emerald-500'
  },
  { 
    id: 'NOT-004', type: 'Approval Alert', priority: 'Normal', 
    message: 'Loan application for Amara Okafor has been approved by Staff Sarah.',
    borrower: 'Amara Okafor', time: '1 day ago', status: 'Read', icon: CheckCircle2, color: 'text-blue-600'
  },
  { 
    id: 'NOT-005', type: 'New Application', priority: 'Important', 
    message: 'New loan application received from Kgotso Motaung for R 25,000.',
    borrower: 'Kgotso Motaung', time: '1 day ago', status: 'Read', icon: FileText, color: 'text-blue-500'
  },
];

const reviewers = [
  { id: 1, name: 'Sarah Jenkins', reviews: 4, role: 'Senior Auditor' },
  { id: 2, name: 'Michael Chen', reviews: 2, role: 'Loan Officer' },
  { id: 3, name: 'Amanda Zulu', reviews: 7, role: 'Risk Manager' },
  { id: 4, name: 'Thabo Ndlovu', reviews: 1, role: 'Junior Reviewer' },
];

const NotificationsModule = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeModal, setActiveModal] = useState(null); // 'delete', 'assign', 'reminder', 'contact', 'verify'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view', 'application', 'borrower'
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showToast, setShowToast] = useState(null);

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const openModal = (type, notif = null) => {
    if (notif) setSelectedNotification(notif);
    setActiveModal(type);
    setOpenMenuId(null);
  };

  const openDrawer = (type, notif) => {
    setSelectedNotification(notif);
    setActiveDrawer(type);
    setOpenMenuId(null);
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'Read' } : n));
  };

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 font-medium mt-1">Track system alerts, loan updates, overdue reminders, and payment notifications.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" className="flex items-center gap-2 font-bold px-6 border-slate-200">
             <CheckCheck size={18} /> Mark All Read
           </Button>
           <Button onClick={() => openModal('clear-all')} variant="danger" className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-rose-100 border-none">
             <Trash2 size={18} /> Clear All
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="New Applications" value="12" icon={FileText} color="blue" />
        <StatCard title="Overdue Alerts" value="42" icon={AlertTriangle} color="rose" />
        <StatCard title="Payment Alerts" value="28" icon={DollarSign} color="emerald" />
        <StatCard title="Approval Alerts" value="15" icon={CheckCircle2} color="navy" />
      </section>

      {/* 3. NOTIFICATION FLOW SECTION */}
      <section className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
         <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
            <FlowStep label="System Event" desc="Trigger Event" icon={Zap} status="active" />
            <ArrowRight size={24} className="text-slate-300 hidden md:block" />
            <FlowStep label="Notification" desc="Admin Alert" icon={Bell} status="active" />
            <ArrowRight size={24} className="text-slate-300 hidden md:block" />
            <FlowStep label="Admin Action" desc="Action Taken" icon={ShieldCheck} status="pending" />
         </div>
      </section>

      {/* 4. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center sticky top-0 z-10">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search notifications, borrowers or events..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Alert Type</option>
              <option>New Application</option>
              <option>Overdue Alert</option>
              <option>Payment Notification</option>
           </select>
           <select className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0">
              <option>Status</option>
              <option>Unread</option>
              <option>Read</option>
           </select>
        </div>
      </section>

      {/* 5. NOTIFICATIONS LIST & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-4">
            {notifications.map((notif) => (
               <motion.div 
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                     "bg-white p-6 rounded-3xl border transition-all hover:shadow-xl hover:shadow-slate-200/50 flex items-start gap-5 group relative overflow-hidden",
                     notif.status === 'Unread' ? "border-primary/20 shadow-soft" : "border-slate-100 opacity-80"
                  )}
               >
                  {notif.status === 'Unread' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                  
                  <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                     notif.status === 'Unread' ? "bg-primary/5 text-primary" : "bg-slate-50 text-slate-400"
                  )}>
                     <notif.icon size={22} />
                  </div>

                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                           <StatusBadge status={notif.type} className="text-[9px] px-2 py-0" />
                           <StatusBadge status={notif.priority} className="text-[9px] px-2 py-0" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">{notif.time}</span>
                     </div>
                     <p className={cn(
                        "text-sm leading-relaxed mb-1",
                        notif.status === 'Unread' ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
                     )}>
                        {notif.message}
                     </p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{notif.borrower}</p>
                  </div>

                  <div className="flex items-center gap-2 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', notif)} tooltip="View Details" />
                     {notif.status === 'Unread' && (
                        <TableAction icon={CheckCheck} color="text-emerald-500 hover:bg-emerald-50" onClick={() => markAsRead(notif.id)} tooltip="Mark Read" />
                     )}
                     <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', notif)} tooltip="Delete" />
                  </div>
               </motion.div>
            ))}
         </div>

         <div className="space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft">
               <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Activity size={18} className="text-primary" /> Recent Activity
               </h3>
               <div className="space-y-6">
                  <ActivityItem label="Loan Approval" desc="P47-882 approved" time="45m ago" icon={ShieldCheck} color="blue" />
                  <ActivityItem label="Direct Deposit" desc="R 12,000 via EFT" time="1h ago" icon={DollarSign} color="emerald" />
                  <ActivityItem label="New Borrower" desc="Thabo Mokoena joined" time="3h ago" icon={UserPlus} color="navy" />
               </div>
               <Button variant="ghost" className="w-full mt-6 text-primary font-bold text-xs uppercase tracking-widest border-t border-slate-50 pt-6 rounded-none">
                  View Full Audit Log
               </Button>
            </section>
         </div>
      </div>

      {/* --- NOTIFICATION PREVIEW DRAWER (MAIN) --- */}
      <Drawer isOpen={activeDrawer === 'view'} onClose={closeDrawer} title="Alert Details" width="max-w-2xl">
         {selectedNotification && (
            <div className="space-y-10">
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                  <div className={cn(
                     "w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black shadow-lg relative z-10",
                     selectedNotification.status === 'Unread' ? "bg-primary text-white" : "bg-slate-800 text-slate-400"
                  )}>
                     <selectedNotification.icon size={40} />
                  </div>
                  <div className="flex-1 relative z-10">
                     <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{selectedNotification.type}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedNotification.id}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedNotification.priority} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xs font-bold text-slate-400 ml-2">{selectedNotification.time}</span>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Notification Message</h4>
                  <p className="text-lg font-bold text-slate-900 leading-relaxed">"{selectedNotification.message}"</p>
               </div>

               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Zap size={14} className="text-accent" /> Recommended Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     {selectedNotification.type === 'Overdue Alert' ? (
                        <>
                           <ActionCard label="View Borrower" icon={UserCheck} color="text-primary" onClick={() => openDrawer('borrower', selectedNotification)} />
                           <ActionCard label="Send Reminder" icon={Bell} color="text-rose-500" onClick={() => openModal('reminder', selectedNotification)} />
                        </>
                     ) : selectedNotification.type === 'New Application' ? (
                        <>
                           <ActionCard label="Open Application" icon={FileText} color="text-blue-500" onClick={() => openDrawer('application', selectedNotification)} />
                           <ActionCard label="Assign Reviewer" icon={UserPlus} color="text-navy" onClick={() => openModal('assign', selectedNotification)} />
                        </>
                     ) : (
                        <>
                           <ActionCard label="Verify Payment" icon={ShieldCheck} color="text-emerald-500" onClick={() => openModal('verify', selectedNotification)} />
                           <ActionCard label="Contact Borrower" icon={MessageSquare} color="text-primary" onClick={() => openModal('contact', selectedNotification)} />
                        </>
                     )}
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  {selectedNotification.status === 'Unread' && (
                     <Button variant="ghost" className="flex-1" onClick={() => { markAsRead(selectedNotification.id); closeDrawer(); }}>Mark as Read</Button>
                  )}
                  <Button onClick={closeDrawer} className="flex-1 shadow-lg shadow-primary/20 bg-primary">Close Drawer</Button>
               </div>
            </div>
         )}
      </Drawer>

      {/* --- DELETE MODAL --- */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Delete Notification" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Remove Alert?</h4>
               <p className="text-sm text-slate-500 mt-2">Are you sure you want to delete this notification? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={() => { triggerToast('Notification Deleted'); closeModal(); }} className="flex-1 shadow-lg shadow-rose-200">Delete Forever</Button>
            </div>
         </div>
      </Modal>

      {/* --- CLEAR ALL MODAL --- */}
      <Modal isOpen={activeModal === 'clear-all'} onClose={closeModal} title="Clear All Notifications" maxWidth="max-w-md">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
               <Trash2 size={28} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Clear Inbox?</h4>
               <p className="text-sm text-slate-500 mt-2">Are you sure you want to clear all notifications? This will permanently remove all alerts from your dashboard.</p>
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={() => { triggerToast('All Notifications Cleared'); closeModal(); }} className="flex-1 shadow-lg shadow-rose-200">Yes, Clear All</Button>
            </div>
         </div>
      </Modal>

      {/* --- 1. ASSIGN REVIEWER MODAL --- */}
      <Modal isOpen={activeModal === 'assign'} onClose={closeModal} title="Assign Staff Reviewer" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
               <ReviewRow label="Borrower" value={selectedNotification?.borrower} />
               <ReviewRow label="Loan Amount" value="R 15,000" />
               <ReviewRow label="App ID" value="APP-0042" />
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Reviewer</label>
               <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-1">
                  {reviewers.map(r => (
                     <button key={r.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary transition-all text-left group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                              <User size={20} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900">{r.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{r.role}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-primary">{r.reviews} Active</p>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
            
            <Input label="Internal Assignment Notes" isTextArea placeholder="Specific focus areas for review..." />
            
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={() => { triggerToast('Reviewer Assigned Successfully'); closeModal(); }} className="flex-1 shadow-lg shadow-primary/20">Assign Reviewer</Button>
            </div>
         </div>
      </Modal>

      {/* --- 2. OPEN APPLICATION DRAWER --- */}
      <Drawer isOpen={activeDrawer === 'application'} onClose={closeDrawer} title="Loan Application Details" width="max-w-3xl">
         {selectedNotification && (
            <div className="space-y-10 pb-10">
               <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <FileText size={28} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">APP-0042</h3>
                        <p className="text-xs font-bold text-slate-500">Requested: <span className="text-primary font-black">R 15,000</span></p>
                     </div>
                  </div>
                  <StatusBadge status="Under Review" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><User size={14} /> Borrower Info</h4>
                     <div className="space-y-3">
                        <SummaryRow label="Name" value={selectedNotification.borrower} icon={User} />
                        <SummaryRow label="ID Number" value="920405 5543 088" icon={ShieldCheck} />
                        <SummaryRow label="Employment" value="Manager at RetailCo" icon={Building2} />
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14} /> Affordability</h4>
                     <div className="space-y-3">
                        <SummaryRow label="Monthly Income" value="R 24,500" icon={DollarSign} />
                        <SummaryRow label="Expenses" value="R 12,800" icon={Activity} />
                        <SummaryRow label="Disposable" value="R 11,700" icon={Wallet} />
                     </div>
                  </div>
               </div>

               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><FileCheck size={14} /> Uploaded Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <DocCard name="Proof of Identity" />
                     <DocCard name="Payslip (3 Months)" />
                     <DocCard name="Bank Statement" />
                     <DocCard name="Utility Bill" />
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="danger" className="flex-1">Reject</Button>
                  <Button variant="secondary" className="flex-1">Hold</Button>
                  <Button className="flex-1 shadow-lg shadow-primary/20">Approve Application</Button>
               </div>
            </div>
         )}
      </Drawer>

      {/* --- 3. VIEW BORROWER DRAWER --- */}
      <Drawer isOpen={activeDrawer === 'borrower'} onClose={closeDrawer} title="Borrower Profile" width="max-w-2xl">
         {selectedNotification && (
            <div className="space-y-10 pb-10">
               <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl font-black">
                     {selectedNotification.borrower.charAt(0)}
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900">{selectedNotification.borrower}</h2>
                     <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Client since Jan 2023</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                     <StatusBadge status="Active" />
                     <StatusBadge status="Premium" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <StatCard title="Active Loans" value="1" icon={Briefcase} color="navy" />
                  <StatCard title="Overdue Total" value="R 4,200" icon={AlertCircle} color="rose" />
               </div>

               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Phone size={14} /> Contact Details</h4>
                  <div className="space-y-3">
                     <SummaryRow label="Phone Number" value="+27 71 888 4444" icon={Phone} />
                     <SummaryRow label="Email Address" value="lerato.m@example.com" icon={Mail} />
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                  <Button variant="danger" className="flex-1 flex items-center gap-2 justify-center"><UserMinus size={18} /> Freeze Account</Button>
                  <Button onClick={() => openModal('contact')} className="flex-1 flex items-center gap-2 justify-center"><MessageSquare size={18} /> Contact Borrower</Button>
               </div>
            </div>
         )}
      </Drawer>

      {/* --- 4. SEND REMINDER MODAL --- */}
      <Modal isOpen={activeModal === 'reminder'} onClose={closeModal} title="Send Payment Reminder" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 text-center">
               <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Due Amount</p>
               <h3 className="text-3xl font-black text-rose-600 tracking-tight">R 4,200</h3>
               <p className="text-xs font-bold text-slate-500 mt-2">Due Date: <span className="font-black text-slate-900">May 15, 2024</span></p>
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Channel</label>
               <div className="grid grid-cols-3 gap-3">
                  <ChannelButton icon={Phone} label="SMS" />
                  <ChannelButton icon={Mail} label="Email" active />
                  <ChannelButton icon={WhatsApp} label="WhatsApp" />
               </div>
            </div>

            <Input label="Reminder Message" isTextArea placeholder="Your EMI of R 4,200 is due. Please ensure funds are available..." />
            
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={() => { triggerToast('Reminder Sent Successfully'); closeModal(); }} className="flex-1 shadow-lg shadow-rose-100 bg-rose-600 border-none">Send Reminder</Button>
            </div>
         </div>
      </Modal>

      {/* --- 5. CONTACT MODAL --- */}
      <Modal isOpen={activeModal === 'contact'} onClose={closeModal} title="Quick Contact" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                  <UserCheck size={24} />
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900">{selectedNotification?.borrower}</p>
                  <p className="text-xs font-bold text-slate-400">+27 71 888 4444</p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
               <CommunicationOption icon={PhoneCall} label="Call Borrower" color="text-emerald-600" />
               <CommunicationOption icon={Mail} label="Email Official Link" color="text-primary" />
               <CommunicationOption icon={MessageCircle} label="WhatsApp Business" color="text-green-500" />
            </div>

            <Input label="Quick Message" isTextArea placeholder="Type your message here..." />

            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button onClick={() => { triggerToast('Message Sent Successfully'); closeModal(); }} className="flex-1 shadow-lg shadow-primary/20">Send Message</Button>
            </div>
         </div>
      </Modal>

      {/* --- 6. VERIFY PAYMENT MODAL --- */}
      <Modal isOpen={activeModal === 'verify'} onClose={closeModal} title="Verify Payment Proof" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 text-center">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Payment Received</p>
               <h3 className="text-3xl font-black text-emerald-600 tracking-tight">R 4,500</h3>
               <p className="text-xs font-bold text-slate-500 mt-2">Ref: <span className="font-black text-slate-900">TRX-88021</span></p>
            </div>

            <div className="aspect-video bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group cursor-pointer hover:border-primary transition-all">
               <History size={32} className="mb-2 opacity-50 group-hover:scale-110 transition-all" />
               <p className="text-[10px] font-black uppercase tracking-widest">Click to Preview Receipt</p>
            </div>

            <Input label="Verification Notes" isTextArea placeholder="Add bank clearance notes..." />

            <div className="flex flex-col gap-3 pt-2">
               <div className="flex gap-3">
                  <Button variant="danger" className="flex-1">Reject Receipt</Button>
                  <Button onClick={() => { triggerToast('Payment Verified Successfully'); closeModal(); }} className="flex-1 bg-emerald-600 border-none shadow-lg shadow-emerald-100">Verify Payment</Button>
               </div>
               <Button variant="ghost" onClick={closeModal} className="w-full">Cancel</Button>
            </div>
         </div>
      </Modal>

      {/* SUCCESS TOAST */}
      <AnimatePresence>
         {showToast && (
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 border border-white/10">
               <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-white" />
               </div>
               <div>
                  <p className="text-sm font-black tracking-tight">{showToast}</p>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const FlowStep = ({ label, desc, icon: Icon, status }) => (
   <div className="flex flex-col items-center text-center">
      <div className={cn(
         "w-16 h-16 rounded-3xl flex items-center justify-center mb-3 transition-all",
         status === 'active' ? "bg-primary text-white shadow-xl shadow-primary/20 scale-110" : "bg-white text-slate-400 border border-slate-200"
      )}>
         <Icon size={24} />
      </div>
      <p className={cn("text-xs font-black uppercase tracking-widest", status === 'active' ? "text-slate-900" : "text-slate-400")}>{label}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{desc}</p>
   </div>
);

const ActivityItem = ({ label, desc, time, icon: Icon, color }) => (
   <div className="flex items-center gap-4 group cursor-pointer">
      <div className={cn(
         "w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
         color === 'blue' ? "bg-blue-50 text-blue-600" :
         color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
         "bg-primary/5 text-primary"
      )}>
         <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
         <p className="text-xs font-black text-slate-900 group-hover:text-primary transition-colors truncate">{label}</p>
         <p className="text-[10px] font-bold text-slate-400 truncate">{desc}</p>
      </div>
      <span className="text-[9px] font-bold text-slate-300">{time}</span>
   </div>
);

const SummaryRow = ({ label, value, icon: Icon }) => (
   <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3">
         <Icon size={16} className="text-primary" />
         <span className="text-xs font-bold text-slate-500">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900">{value}</span>
   </div>
);

const ActionCard = ({ label, icon: Icon, color, onClick }) => (
   <button onClick={onClick} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-primary hover:shadow-xl hover:shadow-slate-100 transition-all group">
      <Icon size={24} className={cn("mb-2 group-hover:scale-110 transition-transform", color)} />
      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{label}</span>
   </button>
);

const TableAction = ({ icon: Icon, color, onClick, tooltip }) => (
  <button onClick={onClick} className={cn("p-2 rounded-xl transition-all", color)} title={tooltip}>
     <Icon size={18} />
  </button>
);

const ReviewRow = ({ label, value }) => (
   <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-black text-slate-900">{value}</span>
   </div>
);

const DocCard = ({ name }) => (
   <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary transition-all cursor-pointer">
      <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary">
            <FileText size={16} />
         </div>
         <span className="text-xs font-bold text-slate-700 group-hover:text-primary">{name}</span>
      </div>
      <ExternalLink size={14} className="text-slate-300 group-hover:text-primary" />
   </div>
);

const ChannelButton = ({ icon: Icon, label, active }) => (
   <button className={cn(
      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group",
      active ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
   )}>
      <Icon size={20} className="mb-2" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
   </button>
);

const CommunicationOption = ({ icon: Icon, label, color }) => (
   <button className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-primary transition-all">
      <div className="flex items-center gap-3">
         <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", color.replace('text', 'bg').replace('600', '50').replace('500', '50'))}>
            <Icon size={18} className={color} />
         </div>
         <span className="text-sm font-bold text-slate-700 group-hover:text-primary">{label}</span>
      </div>
      <ChevronRight size={16} className="text-slate-200 group-hover:text-primary transition-colors" />
   </button>
);

export default NotificationsModule;
