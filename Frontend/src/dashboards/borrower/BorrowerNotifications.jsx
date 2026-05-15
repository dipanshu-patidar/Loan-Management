import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCheck, Trash2, Eye, 
  Clock, AlertCircle, CheckCircle2, 
  Info, ArrowRight, Search, Filter,
  Calendar, CreditCard, FileText, Upload,
  X, ShieldCheck, Mail, Send, ExternalLink,
  ChevronRight, Bookmark, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';

import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

const BorrowerNotifications = () => {
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new-notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        toast.success(notif.title, {
          icon: '🔔',
          duration: 5000
        });
      });
    }
    return () => {
      if (socket) socket.off('new-notification');
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/borrower/communications/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/borrower/communications/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true, status: 'READ' } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async () => {
    // API endpoint for delete not requested in prompt, but I can implement if needed.
    // For now, local delete
    setNotifications(prev => prev.filter(n => n._id !== selectedNotification._id));
    setIsDeleteModalOpen(false);
    setIsDrawerOpen(false);
  };

  const handleView = (notif) => {
    setSelectedNotification(notif);
    setIsDrawerOpen(true);
    if (!notif.isRead) handleMarkAsRead(notif._id);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'NewMessage': return Mail;
      case 'LOAN_APPROVAL': return ShieldCheck;
      case 'DUE_REMINDER': return Clock;
      case 'PAYMENT_UPDATE': return CheckCircle2;
      case 'DOCUMENT_REQUEST': return FileText;
      default: return Bell;
    }
  };

  const getColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return 'text-rose-500';
      case 'IMPORTANT': return 'text-primary';
      default: return 'text-slate-400';
    }
  };

  const filteredNotifications = filterType === 'All' 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  return (
    <div className="space-y-10 pb-20">
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 font-medium mt-1">View EMI reminders, payment updates, and important loan alerts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button 
            variant="secondary" 
            onClick={() => setNotifications(notifications.map(n => ({...n, status: 'Read'})))}
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-6 border-slate-200 bg-white"
          >
            <CheckCheck size={16} /> Mark All As Read
          </Button>
          <Button 
            variant="secondary"
            onClick={() => setNotifications([])}
            className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-6 border-slate-200 bg-white text-rose-500 hover:bg-rose-50 hover:border-rose-100"
          >
            <Trash2 size={16} /> Clear Notifications
          </Button>
        </div>
      </header>

      {/* 2. SIMPLE NOTIFICATION FLOW */}
      <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium">
         <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto gap-8 md:gap-4">
            <WorkflowStep label="System Alert" status="completed" icon={Bell} />
            <WorkflowArrow active />
            <WorkflowStep label="Borrower Notified" status="active" icon={Mail} />
            <WorkflowArrow />
            <WorkflowStep label="Action Taken" status="pending" icon={CheckCircle2} />
         </div>
      </section>

      {/* 3. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="EMI Reminders" value={notifications.filter(n => n.type === 'DUE_REMINDER').length} icon={Clock} color="amber" />
        <StatCard title="Payment Updates" value={notifications.filter(n => n.type === 'PAYMENT_UPDATE').length} icon={CheckCircle2} color="green" />
        <StatCard title="Loan Alerts" value={notifications.filter(n => n.type === 'LOAN_APPROVAL').length} icon={ShieldCheck} color="navy" />
        <StatCard title="Unread" value={notifications.filter(n => !n.isRead).length} icon={Bell} color="rose" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: NOTIFICATIONS LIST */}
        <div className="lg:col-span-8 space-y-8">
           {/* SEARCH & FILTERS */}
           <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="relative flex-1 min-w-[200px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                  type="text" 
                  placeholder="Search notifications..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                 />
              </div>
              <div className="flex items-center gap-3">
                 <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-primary/10"
                 >
                    <option>All</option>
                    <option>EMI Reminder</option>
                    <option>Payment Verified</option>
                    <option>Loan Approved</option>
                    <option>Document Request</option>
                 </select>
                 <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-primary transition-all shadow-sm"><Filter size={18} /></button>
              </div>
           </div>

           {/* LIST */}
           <section className="space-y-4">
              {filteredNotifications.length > 0 ? filteredNotifications.map((notif) => {
                 const Icon = getIcon(notif.type);
                 return (
                   <motion.div 
                    layout
                    key={notif._id}
                    onClick={() => handleView(notif)}
                    className={cn(
                      "group relative bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer",
                      !notif.isRead ? "border-primary/20 shadow-lg shadow-primary/5 bg-primary/[0.01]" : "border-slate-100 shadow-premium hover:border-primary/20"
                    )}
                   >
                      <div className="flex items-start gap-6">
                         <div className={cn("w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110", !notif.isRead ? "bg-primary/5 text-primary" : "bg-slate-50 text-slate-400")}>
                            <Icon size={24} />
                         </div>
                         <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <span className={cn("text-[10px] font-black uppercase tracking-[0.15em]", getColor(notif.priority))}>{notif.type}</span>
                                  <span className={cn(
                                     "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                     notif.priority?.toUpperCase() === 'URGENT' ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                  )}>{notif.priority}</span>
                               </div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(notif.createdAt), 'dd MMM')}</p>
                            </div>
                            <p className={cn("text-sm leading-relaxed", !notif.isRead ? "font-black text-slate-900" : "font-medium text-slate-500")}>
                               {notif.message}
                            </p>
                            <div className="flex items-center gap-4 pt-1">
                               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  <Clock size={12} /> {format(new Date(notif.createdAt), 'HH:mm')}
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-col gap-2">
                            {!notif.isRead && (
                              <button 
                               onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif._id); }}
                               className="p-2.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                               title="Mark as Read"
                              >
                                 <CheckCheck size={18} />
                              </button>
                            )}
                            <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedNotification(notif); setIsDeleteModalOpen(true); }}
                             className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                             title="Delete"
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </div>
                   </motion.div>
                 );
              }) : (
                <div className="bg-white p-20 rounded-[3rem] border border-slate-100 shadow-premium text-center space-y-6">
                   <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                      <Bell size={40} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">No Notifications Found</h3>
                      <p className="text-slate-400 font-medium">You're all caught up! There are no new alerts for you.</p>
                   </div>
                </div>
              )}
           </section>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITIES TIMELINE */}
        <div className="lg:col-span-4 space-y-10">
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
              <h3 className="text-md font-black text-slate-900 tracking-tight flex items-center gap-2">
                 <Activity size={18} className="text-primary" /> Activity Pulse
              </h3>
              <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                 <ActivityItem title="Payment Verified" desc="EMI #14 verified successfully" time="2 hours ago" status="verified" />
                 <ActivityItem title="EMI Reminder" desc="Sent for Personal Loan L-74291" time="5 hours ago" status="pending" />
                 <ActivityItem title="Loan Status" desc="Loan application moved to active" time="1 day ago" status="active" />
                 <ActivityItem title="New Message" desc="Support team replied to your query" time="2 days ago" status="unread" />
              </div>
           </section>

           <div className="p-8 bg-slate-900 rounded-[3rem] text-white space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-4">
                 <h4 className="text-sm font-black uppercase tracking-widest text-white/50">Next EMI Deadline</h4>
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight">15 May 2026</h2>
                    <p className="text-xs font-bold text-accent uppercase tracking-widest">In 6 Days</p>
                 </div>
                 <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black uppercase text-[10px] py-4 rounded-2xl" onClick={() => navigate('/borrower/make-payment')}>
                    Pay Now <ArrowRight size={14} className="ml-2 inline" />
                 </Button>
              </div>
           </div>
        </div>
      </div>

      {/* NOTIFICATION DRAWER */}
      <AnimatePresence>
         {isDrawerOpen && selectedNotification && (
            <>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Alert Details</h3>
                     <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                     <div className="space-y-6">
                        <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg bg-primary/5 text-primary")}>
                           {selectedNotification && React.createElement(getIcon(selectedNotification.type), { size: 32 })}
                        </div>
                        <div className="space-y-2">
                           <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedNotification.type}</h2>
                           <p className="text-sm font-medium text-slate-500 leading-relaxed">{selectedNotification.message}</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <DrawerRow label="Time Sent" value={selectedNotification.createdAt ? format(new Date(selectedNotification.createdAt), 'dd MMM yyyy HH:mm') : ''} />
                        <DrawerRow label="Priority" value={selectedNotification.priority} color={getColor(selectedNotification.priority)} />
                     </div>

                     <div className="pt-8 space-y-3">
                        {selectedNotification.type.includes('EMI') && (
                           <Button className="w-full font-black uppercase text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => navigate('/borrower/make-payment')}>
                              Make Payment
                           </Button>
                        )}
                        {selectedNotification.type.includes('Document') && (
                           <Button className="w-full font-black uppercase text-[10px] py-4 shadow-lg shadow-primary/20" onClick={() => setIsUploadModalOpen(true)}>
                              Upload Documents
                           </Button>
                        )}
                        <Button variant="secondary" className="w-full font-black uppercase text-[10px] py-4 border-slate-200" onClick={() => navigate('/borrower/my-loans')}>
                           View Loan Details
                        </Button>
                     </div>
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Notification">
         <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
               <Trash2 size={32} />
            </div>
            <p className="text-slate-500 font-medium px-6 leading-relaxed">Are you sure you want to delete this notification? This action cannot be undone.</p>
            <div className="flex gap-3 pt-4">
               <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
               <Button onClick={handleDelete} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] shadow-lg shadow-rose-500/20">Delete Now</Button>
            </div>
         </div>
      </Modal>

      {/* UPLOAD MODAL */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Required Documents">
         <div className="space-y-8">
            <div className="p-10 border-2 border-dashed border-slate-100 bg-slate-50/50 rounded-[2.5rem] text-center space-y-4 group hover:border-primary/20 transition-all cursor-pointer">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary mx-auto shadow-sm group-hover:scale-110 transition-transform">
                  <Upload size={32} />
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900">Drag & drop your files</p>
                  <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">PDF, JPG, PNG accepted</p>
               </div>
            </div>
            <div className="flex gap-3 pt-4">
               <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
               <Button className="flex-1 font-black uppercase text-[10px]" onClick={() => setIsUploadModalOpen(false)}>Upload Now</Button>
            </div>
         </div>
      </Modal>

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
            color === 'amber' ? "bg-amber-50 text-amber-500" :
            color === 'green' ? "bg-emerald-50 text-emerald-500" :
            color === 'rose' ? "bg-rose-50 text-rose-500" :
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

const DrawerRow = ({ label, value, color }) => (
   <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn("text-xs font-black", color || "text-slate-900")}>{value}</span>
   </div>
);

const ActivityItem = ({ title, desc, time, status }) => {
   const icons = {
      verified: CheckCircle2,
      pending: Clock,
      active: ShieldCheck,
      unread: Bell
   };
   const colors = {
      verified: 'text-emerald-500',
      pending: 'text-amber-500',
      active: 'text-primary',
      unread: 'text-rose-500'
   };
   const Icon = icons[status] || Bell;
   return (
      <div className="relative pl-10 space-y-1">
         <div className={cn(
            "absolute left-0 top-0 w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm z-10",
            colors[status]
         )}>
            <Icon size={14} />
         </div>
         <p className="text-xs font-black text-slate-900">{title}</p>
         <p className="text-[11px] font-medium text-slate-500">{desc}</p>
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1">{time}</p>
      </div>
   );
};

export default BorrowerNotifications;
