import React, { useState } from 'react';
import { 
  Bell, AlertCircle, Clock, CheckCircle2, 
  Search, Filter, Eye, CheckCheck, Trash2,
  X, User, Briefcase, DollarSign, ArrowRight,
  RefreshCw, MessageSquare, Phone, Info,
  ExternalLink, Calendar, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';

const AgentNotifications = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isBorrowerDrawerOpen, setIsBorrowerDrawerOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const notificationsData = [
    { 
      id: 1, 
      type: 'Due Reminder', 
      borrower: 'Michael Chen', 
      message: 'EMI of R1,200 is due in 2 days.', 
      time: '10 mins ago', 
      status: 'Unread', 
      priority: 'Urgent',
      loanId: 'LN-101',
      dueAmount: 'R1,200'
    },
    { 
      id: 2, 
      type: 'Borrower Alert', 
      borrower: 'Sarah Williams', 
      message: 'Borrower has missed the payment deadline.', 
      time: '2 hours ago', 
      status: 'Unread', 
      priority: 'Important',
      loanId: 'LN-102',
      dueAmount: 'R850'
    },
    { 
      id: 3, 
      type: 'Loan Approval', 
      borrower: 'David Gumede', 
      message: 'Loan application APP-552 has been approved.', 
      time: 'Yesterday', 
      status: 'Read', 
      priority: 'Normal',
      loanId: 'LN-103',
      dueAmount: 'R0'
    },
    { 
      id: 4, 
      type: 'Payment Update', 
      borrower: 'Linda Mbeki', 
      message: 'Payment of R2,500 verified for May 2026.', 
      time: '2 days ago', 
      status: 'Read', 
      priority: 'Normal',
      loanId: 'LN-104',
      dueAmount: 'R0'
    },
  ];

  const recentActivities = [
    { id: 1, title: 'Payment Received', desc: 'Sarah Williams paid R850.', time: '1 hour ago', icon: DollarSign, color: 'emerald' },
    { id: 2, title: 'Approval Alert', desc: 'APP-991 approved by Admin.', time: '3 hours ago', icon: CheckCircle2, color: 'blue' },
    { id: 3, title: 'Overdue Warning', desc: 'Michael Chen is 2 days late.', time: 'Yesterday', icon: AlertCircle, color: 'rose' },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'rose';
      case 'Important': return 'amber';
      default: return 'blue';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 font-medium mt-1">Track borrower alerts, due payment reminders, and loan approval updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white shadow-sm">
            <CheckCheck size={18} /> Mark All As Read
          </Button>
          <Button variant="secondary" className="flex items-center gap-2 font-bold text-rose-500 border-rose-100 bg-rose-50/30 hover:bg-rose-50" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 size={18} /> Clear All
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Borrower Alerts" value="08" icon={AlertCircle} color="rose" />
        <StatCard title="Due Reminders" value="12" icon={Clock} color="amber" />
        <StatCard title="Loan Approvals" value="05" icon={CheckCircle2} color="emerald" />
        <StatCard title="Unread" value="03" icon={Bell} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* 🔍 SEARCH & FILTER SECTION */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium">
             <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search alerts or borrowers..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none" />
             </div>
             <div className="flex items-center gap-3">
                <select className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:ring-2 focus:ring-primary/10">
                   <option>All Types</option>
                   <option>Alerts</option>
                   <option>Reminders</option>
                   <option>Approvals</option>
                </select>
                <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
                   <Filter size={18} />
                </button>
             </div>
          </div>

          {/* 📋 NOTIFICATIONS LIST */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50/50">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="px-8 py-6 border-b border-slate-100">Notification</th>
                         <th className="px-8 py-6 border-b border-slate-100">Borrower</th>
                         <th className="px-8 py-6 border-b border-slate-100">Status</th>
                         <th className="px-8 py-6 border-b border-slate-100">Priority</th>
                         <th className="px-8 py-6 border-b border-slate-100 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {notificationsData.map((notif, i) => (
                         <motion.tr 
                           key={notif.id}
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.05 }}
                           className={cn(
                             "group hover:bg-slate-50/50 transition-all",
                             notif.status === 'Unread' && "bg-primary/5"
                           )}
                         >
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                    notif.type === 'Due Reminder' ? "bg-amber-50 text-amber-500" :
                                    notif.type === 'Borrower Alert' ? "bg-rose-50 text-rose-500" :
                                    notif.type === 'Loan Approval' ? "bg-emerald-50 text-emerald-500" :
                                    "bg-blue-50 text-blue-500"
                                  )}>
                                     {notif.type === 'Due Reminder' ? <Clock size={18} /> : 
                                      notif.type === 'Borrower Alert' ? <AlertCircle size={18} /> : 
                                      notif.type === 'Loan Approval' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-900 leading-tight">{notif.type}</p>
                                     <p className="text-[11px] font-medium text-slate-500 mt-1">{notif.time}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-900">{notif.borrower}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{notif.loanId}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <StatusBadge status={notif.status} />
                            </td>
                            <td className="px-8 py-6">
                               <div className={cn(
                                 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                 notif.priority === 'Urgent' ? "bg-rose-50 text-rose-500 border-rose-100" :
                                 notif.priority === 'Important' ? "bg-amber-50 text-amber-500 border-amber-100" :
                                 "bg-blue-50 text-blue-500 border-blue-100"
                               )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", 
                                    notif.priority === 'Urgent' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                                    notif.priority === 'Important' ? "bg-amber-500" : "bg-blue-500")} />
                                  {notif.priority}
                               </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => { setSelectedNotification(notif); setIsDrawerOpen(true); }}
                                    className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                                  >
                                     <Eye size={18} />
                                  </button>
                                  <button className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm">
                                     <CheckCheck size={18} />
                                  </button>
                               </div>
                            </td>
                         </motion.tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="space-y-8">
           {/* 📌 SIMPLE NOTIFICATION FLOW */}
           <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10 space-y-6">
                <div>
                   <h4 className="text-lg font-black tracking-tight">Notification Workflow</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smart alert resolution</p>
                </div>
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                   <WorkflowItem icon={Info} title="System Alert" desc="Triggered by LMS Core" status="completed" />
                   <WorkflowItem icon={Bell} title="Agent Notified" desc="Real-time dashboard alert" status="active" />
                   <WorkflowItem icon={CheckCircle2} title="Follow-Up Taken" desc="Issue resolved by Agent" status="pending" />
                </div>
             </div>
           </section>

           {/* 📈 RECENT ACTIVITY SECTION */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
             <div className="flex items-center justify-between">
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
               <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><RefreshCw size={18} /></button>
             </div>
             <div className="space-y-6">
                {recentActivities.map(activity => (
                   <div key={activity.id} className="flex gap-4 group">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white transition-transform group-hover:scale-110",
                        activity.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                        activity.color === 'blue' ? "bg-blue-50 text-blue-500" :
                        "bg-rose-50 text-rose-500"
                      )}>
                        <activity.icon size={18} />
                      </div>
                      <div className="min-w-0">
                         <h5 className="text-[11px] font-black text-slate-900 leading-none">{activity.title}</h5>
                         <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">{activity.desc}</p>
                         <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{activity.time}</p>
                      </div>
                   </div>
                ))}
             </div>
             <Button variant="secondary" className="w-full font-bold text-[10px] uppercase tracking-widest border-slate-100">
               View Activity Log
             </Button>
           </section>
        </div>
      </div>

      {/* 🔔 NOTIFICATION DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Notification Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedNotification?.id}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section className="space-y-6">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Bell size={64} className="text-primary rotate-12" />
                      </div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-3">System Message</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed relative z-10">{selectedNotification?.message}</p>
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <User size={14} className="text-primary" /> Borrower Snapshot
                   </h4>
                   <div className="grid grid-cols-1 gap-5">
                      <DrawerItem icon={User} label="Borrower Name" value={selectedNotification?.borrower} />
                      <DrawerItem icon={Briefcase} label="Loan Reference" value={selectedNotification?.loanId} />
                      <DrawerItem icon={DollarSign} label="Due Amount" value={selectedNotification?.dueAmount} />
                      <DrawerItem icon={Clock} label="Timestamp" value={selectedNotification?.time} />
                   </div>
                </section>

                <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center gap-4">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                      <Info size={18} />
                   </div>
                   <p className="text-[11px] font-bold text-blue-700 leading-relaxed">Please take immediate action to ensure portfolio health and timely repayment.</p>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-3 shrink-0">
                 <Button className="w-full font-black uppercase tracking-widest text-[9px] py-4 shadow-lg shadow-primary/20" onClick={() => setIsBorrowerDrawerOpen(true)}>
                    View Borrower
                 </Button>
                 <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[9px] py-4 border-slate-200 bg-white" onClick={() => setIsReminderModalOpen(true)}>
                    Send Reminder
                 </Button>
                 <Button variant="secondary" className="col-span-2 w-full font-black uppercase tracking-widest text-[9px] py-4 border-slate-200 bg-white" onClick={() => setIsFollowUpModalOpen(true)}>
                    Log Payment Follow-Up
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 👤 BORROWER DRAWER */}
      <AnimatePresence>
        {isBorrowerDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBorrowerDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[111] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Borrower Profile</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedNotification?.loanId}</p>
                </div>
                <button onClick={() => setIsBorrowerDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section className="space-y-6 text-center">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-primary/5 text-primary flex items-center justify-center font-black text-2xl mx-auto shadow-inner">
                      {selectedNotification?.borrower.split(' ').map(n => n[0]).join('')}
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900">{selectedNotification?.borrower}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Premium Borrower</p>
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Briefcase size={14} className="text-primary" /> Loan Portfolio
                   </h4>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-8 shadow-inner">
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Loan</p>
                         <p className="text-lg font-black text-slate-900">R15,000</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                         <p className="text-lg font-black text-rose-500">2 Days Left</p>
                      </div>
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Clock size={14} className="text-primary" /> Interaction History
                   </h4>
                   <div className="space-y-4">
                      <HistoryItem icon={DollarSign} label="Last Payment: R1,200" date="15 Apr 2026" />
                      <HistoryItem icon={Bell} label="SMS Reminder Sent" date="Yesterday" />
                   </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 grid grid-cols-1 gap-3 shrink-0">
                 <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-primary/20">
                    Contact Borrower
                 </Button>
                 <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] py-4 border-slate-200 bg-white" onClick={() => { setIsBorrowerDrawerOpen(false); setIsFollowUpModalOpen(true); }}>
                    Follow Up Now
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🔔 REMINDER MODAL */}
      <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title="Send Payment Reminder" maxWidth="max-w-xl">
         <div className="space-y-8">
            <div className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex items-center gap-6">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-50">
                  <Bell size={28} />
               </div>
               <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">Broadcast Reminder</h4>
                  <p className="text-sm font-medium text-slate-500">Send an automated payment notice to {selectedNotification?.borrower}.</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <NotificationOption icon={MessageSquare} label="System Chat" color="primary" isSelected />
               <NotificationOption icon={Mail} label="Email Alert" color="blue" />
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notice Content</label>
               <textarea 
                  defaultValue={`Hello ${selectedNotification?.borrower}, your payment of ${selectedNotification?.dueAmount} is due soon. Please ensure timely repayment.`}
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none"
               />
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
               <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsReminderModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => setIsReminderModalOpen(false)}>Send Reminder</Button>
            </div>
         </div>
      </Modal>

      {/* 📊 FOLLOW-UP MODAL */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Log Payment Follow-Up" maxWidth="max-w-xl">
         <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-Up Notes</label>
                  <textarea placeholder="Enter detailed notes about the borrower's response or payment commitment..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Follow-Up Date</label>
                  <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input type="date" className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10" />
                  </div>
               </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
               <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={() => setIsFollowUpModalOpen(false)}>Save Follow-Up</Button>
            </div>
         </div>
      </Modal>

      {/* 🗑️ DELETE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Clear Notifications" maxWidth="max-w-md text-center">
         <div className="space-y-8 py-4">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm">
               <Trash2 size={36} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Are you absolutely sure?</h4>
               <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">This action will permanently delete all your notifications. This cannot be undone.</p>
            </div>
            <div className="flex gap-4 pt-4">
               <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20" onClick={() => setIsDeleteModalOpen(false)}>Yes, Clear All</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const WorkflowItem = ({ icon: Icon, title, desc, status }) => (
  <div className="flex gap-5 relative group">
    <div className={cn(
      "w-6 h-6 rounded-lg flex items-center justify-center relative z-10 border-2 transition-all shadow-sm",
      status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" :
      status === 'active' ? "bg-primary border-primary text-white shadow-[0_0_12px_rgba(73,182,255,0.4)]" :
      "bg-white/5 border-white/10 text-white/40"
    )}>
      <Icon size={12} />
    </div>
    <div className="flex-1 min-w-0">
      <h5 className={cn("text-[11px] font-black leading-none", status === 'active' ? "text-white" : "text-white/80")}>{title}</h5>
      <p className="text-[9px] font-medium text-white/40 mt-1 truncate">{desc}</p>
    </div>
  </div>
);

const DrawerItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

const HistoryItem = ({ icon: Icon, label, date }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
     <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
           <Icon size={14} />
        </div>
        <span className="text-xs font-black text-slate-700">{label}</span>
     </div>
     <span className="text-[9px] font-bold text-slate-400 uppercase">{date}</span>
  </div>
);

const NotificationOption = ({ icon: Icon, label, color, isSelected }) => (
   <button className={cn(
     "flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all group flex-1",
     isSelected ? "bg-primary/5 border-primary/20 text-primary" : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-100"
   )}>
      <Icon size={24} className="group-hover:scale-110 transition-transform" />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
   </button>
);

export default AgentNotifications;
