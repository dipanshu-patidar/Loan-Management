import React, { useState, useEffect } from 'react';
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
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import Drawer from '../../ui/Drawer';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import notificationService from '../../services/notificationService';
import { initiateSocketConnection, getSocket } from '../../socket/socketClient';

// Helper to get proper icons mapped to types
const getIconByType = (type) => {
  switch (type) {
    case 'New Application':
      return FileText;
    case 'Overdue Alert':
      return AlertTriangle;
    case 'Payment Notification':
      return DollarSign;
    case 'Approval Alert':
    case 'Loan Approved':
      return CheckCircle2;
    case 'Loan Rejected':
      return FileX;
    case 'Borrower Registered':
      return UserPlus;
    case 'NewMessage':
    case 'BorrowerReply':
    case 'AdminMessage':
      return MessageSquare;
    default:
      return Bell;
  }
};

// Format date to timeago string style
const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval}y ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval}mo ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  return 'just now';
};

const reviewers = [
  { id: 1, name: 'Sarah Jenkins', reviews: 4, role: 'Senior Auditor' },
  { id: 2, name: 'Michael Chen', reviews: 2, role: 'Loan Officer' },
  { id: 3, name: 'Amanda Zulu', reviews: 7, role: 'Risk Manager' },
  { id: 4, name: 'Thabo Ndlovu', reviews: 1, role: 'Junior Reviewer' },
];

const NotificationsModule = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    newApplications: 0,
    overdueAlerts: 0,
    paymentNotifications: 0,
    approvalAlerts: 0
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Status');
  const [typeFilter, setTypeFilter] = useState('Alert Type');

  const [activeModal, setActiveModal] = useState(null);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // 1. FETCH DATA
  const fetchData = async () => {
    try {
      const [dataRes, statsRes] = await Promise.all([
        notificationService.getNotifications({
          search: search || undefined,
          status: statusFilter !== 'Status' ? statusFilter : undefined,
          type: typeFilter !== 'Alert Type' ? typeFilter : undefined
        }),
        notificationService.getUnreadCount()
      ]);

      setNotifications(dataRes.data.notifications || []);
      if (statsRes.data.analytics) {
        setStats(statsRes.data.analytics);
      }
    } catch (err) {
      console.error('Failed notification fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run fetch on filter changes
  useEffect(() => {
    fetchData();
  }, [search, statusFilter, typeFilter]);

  // 2. SOCKET.IO INTEGRATION
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketInstance = initiateSocketConnection(token);

    if (socketInstance) {
      // Live event: New Notification Created
      socketInstance.on('notification:new', (newNotif) => {
        // Prepend to live registry
        setNotifications((prev) => [newNotif, ...prev]);
        
        // Update live analytical breakdown counters
        setStats((prev) => {
          const updated = { ...prev };
          if (newNotif.notificationType === 'NewLoanRequest') updated.newApplications += 1;
          if (newNotif.notificationType === 'OverdueAlert') updated.overdueAlerts += 1;
          if (newNotif.notificationType === 'PaymentVerification') updated.paymentNotifications += 1;
          if (newNotif.notificationType === 'ReviewAssigned') updated.approvalAlerts += 1;
          return updated;
        });

        // Fire premium UI indicator
        toast(
          (t) => (
            <span className="flex items-center gap-3 font-bold text-sm tracking-tight">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              New alert: {newNotif.title}
            </span>
          ),
          { icon: '🔔' }
        );
      });

      // Live event: Notification Flagged Read
      socketInstance.on('notification:read', (payload) => {
        if (payload.scope === 'all') {
          setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
        } else if (payload.id) {
          setNotifications((prev) =>
            prev.map((n) => (n._id === payload.id ? { ...n, isRead: true } : n))
          );
        }
      });

      // Live event: Notification Deleted
      socketInstance.on('notification:delete', (payload) => {
        if (payload.scope === 'all') {
          setNotifications([]);
        } else if (payload.id) {
          setNotifications((prev) => prev.filter((n) => n._id !== payload.id));
        }
      });
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('notification:new');
        socketInstance.off('notification:read');
        socketInstance.off('notification:delete');
      }
    };
  }, []);

  // --- UI ACTIONS ---
  const openModal = (type, notif = null) => {
    if (notif) setSelectedNotification(notif);
    setActiveModal(type);
    setOpenMenuId(null);
  };

  const openDrawer = async (type, notif) => {
    setDrawerLoading(true);
    setActiveDrawer(type);
    setOpenMenuId(null);
    try {
      const res = await notificationService.getNotificationById(notif._id);
      setSelectedNotification(res.data);
    } catch (err) {
      setSelectedNotification(notif); // fallback
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeModal = () => setActiveModal(null);
  const closeDrawer = () => setActiveDrawer(null);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      toast.success('Alert dismissed');
      // Local updates fired instantly via Socket but we optimize:
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      toast.error('Action stalled');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('All alerts cleared');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      toast.error('Action stalled');
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;
    try {
      await notificationService.deleteNotification(selectedNotification._id);
      toast.success('Alert removed permanently');
      setNotifications((prev) => prev.filter(n => n._id !== selectedNotification._id));
      closeModal();
    } catch (err) {
      toast.error('Failed to remove alert');
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      toast.success('Notification archives purged');
      setNotifications([]);
      setStats({ newApplications: 0, overdueAlerts: 0, paymentNotifications: 0, approvalAlerts: 0 });
      closeModal();
    } catch (err) {
      toast.error('Clear request failed');
    }
  };

  return (
    <div className="space-y-8 pb-10" onClick={() => setOpenMenuId(null)}>
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 font-medium mt-1">Track system alerts, loan updates, overdue reminders, and payment notifications in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={handleMarkAllAsRead} variant="secondary" className="flex items-center gap-2 font-bold px-6 border-slate-200">
             <CheckCheck size={18} /> Mark All Read
           </Button>
           <Button onClick={() => openModal('clear-all')} variant="danger" className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-rose-100 border-none">
             <Trash2 size={18} /> Clear All
           </Button>
        </div>
      </header>

      {/* 2. ANALYTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="New Applications" value={stats.newApplications} icon={FileText} color="blue" />
        <StatCard title="Overdue Alerts" value={stats.overdueAlerts} icon={AlertTriangle} color="rose" />
        <StatCard title="Payment Alerts" value={stats.paymentNotifications} icon={DollarSign} color="emerald" />
        <StatCard title="Approval Alerts" value={stats.approvalAlerts} icon={CheckCircle2} color="navy" />
      </section>

      {/* 3. SEARCH & FILTER SECTION */}
      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4 items-center sticky top-0 z-10">
        <div className="relative flex-1 w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications, borrowers or events..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
           />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select 
             value={typeFilter}
             onChange={(e) => setTypeFilter(e.target.value)}
             className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0 cursor-pointer"
           >
              <option>Alert Type</option>
              <option value="NewLoanRequest">New Loan Request</option>
              <option value="OverdueAlert">Overdue Alert</option>
              <option value="PaymentVerification">Payment Verification</option>
              <option value="ReviewAssigned">Review Assigned</option>
              <option value="NewMessage">New Message</option>
           </select>
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="flex-1 md:flex-none bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 focus:ring-0 cursor-pointer"
           >
              <option>Status</option>
              <option>Unread</option>
              <option>Read</option>
           </select>
        </div>
      </section>

      {/* 4. NOTIFICATIONS LIST & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-4">
            {loading ? (
               <div className="p-12 text-center font-bold text-slate-400 animate-pulse">Scanning realtime notification node...</div>
            ) : notifications.length === 0 ? (
               <div className="bg-white border border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center space-y-4 shadow-premium">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
                     <Bell size={32} />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-slate-900">All caught up!</h4>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">No new active alerts found in registry</p>
                  </div>
               </div>
            ) : (
               notifications.map((notif) => {
                  const Icon = getIconByType(notif.notificationType);
                  return (
                     <motion.div 
                        key={notif._id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                           "bg-white p-6 rounded-3xl border transition-all hover:shadow-xl hover:shadow-slate-200/50 flex items-start gap-5 group relative overflow-hidden",
                           !notif.isRead ? "border-primary/20 shadow-soft" : "border-slate-100 opacity-80"
                        )}
                     >
                        {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                        
                        <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                           !notif.isRead ? "bg-primary/5 text-primary" : "bg-slate-50 text-slate-400"
                        )}>
                           <Icon size={22} />
                        </div>

                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                 <StatusBadge status={notif.notificationType} className="text-[9px] px-2 py-0" />
                                 <StatusBadge status={notif.priority} className="text-[9px] px-2 py-0" />
                              </div>
                              <span className="text-[11px] font-bold text-slate-400">{timeAgo(notif.createdAt)}</span>
                           </div>
                           <p className={cn(
                              "text-sm leading-relaxed mb-1",
                               !notif.isRead ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
                           )}>
                              {notif.message}
                           </p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {notif.senderId?.fullName || 'System Notification'}
                           </p>
                        </div>

                        <div className="flex items-center gap-2 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <TableAction icon={Eye} color="text-blue-500 hover:bg-blue-50" onClick={() => openDrawer('view', notif)} tooltip="View Details" />
                           {!notif.isRead && (
                              <TableAction icon={CheckCheck} color="text-emerald-500 hover:bg-emerald-50" onClick={() => handleMarkAsRead(notif._id)} tooltip="Mark Read" />
                           )}
                           <TableAction icon={Trash2} color="text-rose-500 hover:bg-rose-50" onClick={() => openModal('delete', notif)} tooltip="Delete" />
                        </div>
                     </motion.div>
                  );
               })
            )}
         </div>

         <div className="space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft">
               <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Activity size={18} className="text-primary" /> Realtime Timeline
               </h3>
               <div className="space-y-6">
                  {notifications.slice(0, 3).map((n) => (
                     <ActivityItem 
                       key={n._id} 
                       label={n.title} 
                       desc={n.message} 
                       time={timeAgo(n.createdAt)} 
                       icon={getIconByType(n.notificationType)} 
                       color={n.priority === 'Urgent' ? 'rose' : 'blue'} 
                     />
                  ))}
                  {notifications.length === 0 && (
                     <p className="text-xs text-slate-400 font-bold text-center">No recent operations</p>
                  )}
               </div>
               <Button variant="ghost" className="w-full mt-6 text-primary font-bold text-xs uppercase tracking-widest border-t border-slate-50 pt-6 rounded-none">
                  Active Core Watchdog
               </Button>
            </section>
         </div>
      </div>

      {/* --- NOTIFICATION PREVIEW DRAWER (MAIN) --- */}
      <Drawer isOpen={activeDrawer === 'view'} onClose={closeDrawer} title="Alert Details" width="max-w-2xl">
         {drawerLoading ? (
            <div className="p-12 text-center text-slate-400 font-black animate-pulse">Fetching link payloads...</div>
         ) : selectedNotification && (
            <div className="space-y-10">
               <div className="flex items-center gap-6 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                  <div className={cn(
                     "w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black shadow-lg relative z-10 bg-primary text-white"
                  )}>
                     {React.createElement(getIconByType(selectedNotification.notificationType), { size: 40 })}
                  </div>
                  <div className="flex-1 relative z-10">
                     <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{selectedNotification.notificationType}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">REF ID: {selectedNotification._id}</p>
                     <div className="flex items-center gap-2 mt-4">
                        <StatusBadge status={selectedNotification.priority} className="bg-white/10 text-white border-white/20" />
                        <span className="text-xs font-bold text-slate-400 ml-2">{timeAgo(selectedNotification.createdAt)}</span>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Broadcast Payload</h4>
                  <p className="text-lg font-bold text-slate-900 leading-relaxed">"{selectedNotification.message}"</p>
               </div>

               {/* Conditional Relations UI Linkages */}
               {selectedNotification.senderId && (
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Linked User Info</h4>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-600">
                           {selectedNotification.senderId?.fullName?.charAt(0) || 'B'}
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900">{selectedNotification.senderId?.fullName}</p>
                           <p className="text-[11px] font-bold text-slate-400">{selectedNotification.senderId?.email}</p>
                        </div>
                     </div>
                  </div>
               )}

               <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Zap size={14} className="text-accent" /> Recommended Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     {selectedNotification.notificationType === 'Overdue Alert' ? (
                        <>
                           <ActionCard label="View Borrower" icon={UserCheck} color="text-primary" onClick={() => openDrawer('borrower', selectedNotification)} />
                           <ActionCard label="Send Reminder" icon={Bell} color="text-rose-500" onClick={() => openModal('reminder', selectedNotification)} />
                        </>
                     ) : selectedNotification.notificationType === 'New Application' ? (
                        <>
                           <ActionCard label="Open Application" icon={FileText} color="text-blue-500" onClick={() => openDrawer('application', selectedNotification)} />
                           <ActionCard label="Assign Reviewer" icon={UserPlus} color="text-navy" onClick={() => openModal('assign', selectedNotification)} />
                        </>
                     ) : (
                        <>
                           <ActionCard label="System Check" icon={ShieldCheck} color="text-emerald-500" onClick={() => toast.success('Diagnostics online')} />
                           <ActionCard label="Contact Node" icon={MessageSquare} color="text-primary" onClick={() => openModal('contact', selectedNotification)} />
                        </>
                     )}
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white">
                   {!selectedNotification.isRead && (
                     <Button variant="ghost" className="flex-1" onClick={() => { handleMarkAsRead(selectedNotification._id); closeDrawer(); }}>Dismiss Alert</Button>
                  )}
                  <Button onClick={closeDrawer} className="flex-1 shadow-lg shadow-primary/20 bg-primary">Close Details</Button>
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
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Archive Alert?</h4>
               <p className="text-sm text-slate-500 mt-2">Are you sure you want to wipe this notification? This will remove it from your main active feed.</p>
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
               <Button variant="danger" onClick={handleDelete} className="flex-1 shadow-lg shadow-rose-200">Confirm Archive</Button>
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
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Wipe Registry?</h4>
               <p className="text-sm text-slate-500 mt-2">This locks your notification feed to zero. System activity log will remain intact. Proceed?</p>
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Abort</Button>
               <Button variant="danger" onClick={handleClearAll} className="flex-1 shadow-lg shadow-rose-200">Yes, Purge All</Button>
            </div>
         </div>
      </Modal>

      {/* --- 1. ASSIGN REVIEWER MODAL --- */}
      <Modal isOpen={activeModal === 'assign'} onClose={closeModal} title="Assign Staff Reviewer" maxWidth="max-w-md">
         <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
               <ReviewRow label="Borrower" value={selectedNotification?.borrowerId?.fullName || 'TBD'} />
               <ReviewRow label="App ID" value={selectedNotification?.applicationId?.applicationId || 'APP-PENDING'} />
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Reviewer</label>
               <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-1">
                  {reviewers.map(r => (
                     <button key={r.id} onClick={() => { toast.success(`Successfully assigned to ${r.name}`); closeModal(); }} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary transition-all text-left group w-full">
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
            
            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
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
                  <p className="text-sm font-black text-slate-900">{selectedNotification?.borrowerId?.fullName || 'Customer support'}</p>
                  <p className="text-xs font-bold text-slate-400">{selectedNotification?.borrowerId?.email || 'admin@point47.com'}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
               <CommunicationOption icon={PhoneCall} label="Initiate VOIP" color="text-emerald-600" onClick={() => toast('Feature pending telephony setup')} />
               <CommunicationOption icon={Mail} label="Dispatch Official Mail" color="text-primary" onClick={() => toast.success('Redirecting to mail client')} />
            </div>

            <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const ActivityItem = ({ label, desc, time, icon: Icon, color }) => (
   <div className="flex items-center gap-4 group cursor-pointer">
      <div className={cn(
         "w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
         color === 'rose' ? "bg-rose-50 text-rose-600" :
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

const CommunicationOption = ({ icon: Icon, label, color, onClick }) => (
   <button onClick={onClick} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-primary transition-all w-full">
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
