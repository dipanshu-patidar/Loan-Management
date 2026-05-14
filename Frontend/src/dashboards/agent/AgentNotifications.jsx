import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, AlertCircle, Clock, CheckCircle2, 
  Search, Filter, Eye, CheckCheck, Trash2,
  X, User, Briefcase, Wallet, ArrowRight,
  RefreshCw, MessageSquare, Phone, Info,
  ExternalLink, Calendar, Mail, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../ui/Modal';
import agentNotificationService from '../../services/agentNotificationService';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

const AgentNotifications = () => {
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({
    borrowerAlerts: 0,
    dueReminders: 0,
    loanApprovals: 0,
    unreadCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: '',
    search: '',
    page: 1
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isBorrowerDrawerOpen, setIsBorrowerDrawerOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('single'); // 'single' or 'all'

  // Follow-up state
  const [followUpData, setFollowUpData] = useState({ notes: '', nextFollowUpDate: '' });
  const [reminderData, setReminderData] = useState({ reminderType: 'SMS', message: '' });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await agentNotificationService.getNotifications(filters);
      if (res.success) {
        setNotifications(res.data.notifications);
        setAnalytics(res.data.analytics);
        setRecentActivity(res.data.recentActivity);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket Integration
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications(prev => [notif, ...prev.slice(0, 9)]);
      setAnalytics(prev => ({ ...prev, unreadCount: prev.unreadCount + 1 }));
      toast.success('New notification received', {
        icon: <Bell className="text-primary" />,
        duration: 4000
      });
    };

    const handleCountUpdate = ({ unreadCount }) => {
      setAnalytics(prev => ({ ...prev, unreadCount }));
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:count', handleCountUpdate);
    socket.on('unread:updated', handleCountUpdate);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:count', handleCountUpdate);
      socket.off('unread:updated', handleCountUpdate);
    };
  }, [socket]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await agentNotificationService.markAsRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'READ', isRead: true } : n));
        setAnalytics(prev => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await agentNotificationService.markAllAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'READ', isRead: true })));
        setAnalytics(prev => ({ ...prev, unreadCount: 0 }));
        toast.success('All marked as read');
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteTarget === 'all') {
        await agentNotificationService.clearAllNotifications();
        setNotifications([]);
        setAnalytics(prev => ({ ...prev, unreadCount: 0 }));
        toast.success('All notifications cleared');
      } else if (selectedNotification) {
        await agentNotificationService.deleteNotification(selectedNotification._id);
        setNotifications(prev => prev.filter(n => n._id !== selectedNotification._id));
        toast.success('Notification deleted');
      }
      setIsDeleteModalOpen(false);
      setIsDrawerOpen(false);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleSendReminder = async () => {
    try {
      const res = await agentNotificationService.sendReminder({
        borrowerId: selectedNotification?.borrowerId?._id,
        ...reminderData
      });
      if (res.success) {
        toast.success(`Reminder sent via ${reminderData.reminderType}`);
        setIsReminderModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to send reminder');
    }
  };

  const handleSaveFollowUp = async () => {
    try {
      const res = await agentNotificationService.saveFollowUp({
        borrowerId: selectedNotification?.borrowerId?._id,
        ...followUpData
      });
      if (res.success) {
        toast.success('Follow-up recorded');
        setIsFollowUpModalOpen(false);
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to save follow-up');
    }
  };

  const getPriorityColor = (priority) => {
    const p = priority?.toUpperCase();
    switch (p) {
      case 'URGENT': return 'rose';
      case 'IMPORTANT': return 'amber';
      default: return 'blue';
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'DUE_REMINDER': return <Clock size={18} />;
      case 'BORROWER_ALERT': return <AlertCircle size={18} />;
      case 'LOAN_APPROVAL': return <CheckCircle2 size={18} />;
      case 'OVERDUE_WARNING': return <AlertCircle size={18} />;
      case 'PAYMENT_UPDATE': return <Wallet size={18} />;
      case 'AdminMessage':
      case 'NewMessage': return <MessageSquare size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'DUE_REMINDER': return "bg-amber-50 text-amber-500";
      case 'BORROWER_ALERT': return "bg-rose-50 text-rose-500";
      case 'LOAN_APPROVAL': return "bg-emerald-50 text-emerald-500";
      case 'OVERDUE_WARNING': return "bg-rose-50 text-rose-500";
      case 'PAYMENT_UPDATE': return "bg-blue-50 text-blue-500";
      case 'AdminMessage':
      case 'NewMessage': return "bg-indigo-50 text-indigo-500";
      default: return "bg-slate-50 text-slate-500";
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
          <Button variant="secondary" className="flex items-center gap-2 font-bold border-slate-200 bg-white shadow-sm" onClick={handleMarkAllAsRead}>
            <CheckCheck size={18} /> Mark All As Read
          </Button>
          <Button variant="secondary" className="flex items-center gap-2 font-bold text-rose-500 border-rose-100 bg-rose-50/30 hover:bg-rose-50" onClick={() => { setDeleteTarget('all'); setIsDeleteModalOpen(true); }}>
            <Trash2 size={18} /> Clear All
          </Button>
        </div>
      </header>

      {/* 2. TOP ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Borrower Alerts" value={analytics.borrowerAlerts} icon={AlertCircle} color="rose" />
        <StatCard title="Due Reminders" value={analytics.dueReminders} icon={Clock} color="amber" />
        <StatCard title="Messages" value={analytics.messagesCount || 0} icon={MessageSquare} color="indigo" />
        <StatCard title="Unread" value={analytics.unreadCount} icon={Bell} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* 🔍 SEARCH & FILTER SECTION */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-premium">
             <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search alerts or borrowers..." 
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none" 
                />
             </div>
             <div className="flex items-center gap-3">
                <select 
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                  className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:ring-2 focus:ring-primary/10"
                >
                   <option value="">All Types</option>
                   <option value="BORROWER_ALERT">Alerts</option>
                   <option value="DUE_REMINDER">Reminders</option>
                   <option value="AdminMessage">Messages</option>
                   <option value="LOAN_APPROVAL">Approvals</option>
                   <option value="OVERDUE_WARNING">Overdue</option>
                </select>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:ring-2 focus:ring-primary/10"
                >
                   <option value="">All Status</option>
                   <option value="UNREAD">Unread</option>
                   <option value="READ">Read</option>
                </select>
             </div>
          </div>

          {/* 📋 NOTIFICATIONS LIST */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden min-h-[400px] relative">
             {loading && (
               <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                 <Loader2 className="animate-spin text-primary" size={32} />
               </div>
             )}
             
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
                      {notifications.length > 0 ? notifications.map((notif, i) => (
                         <motion.tr 
                           key={notif._id}
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.05 }}
                           className={cn(
                             "group hover:bg-slate-50/50 transition-all",
                             notif.status === 'UNREAD' && "bg-primary/5"
                           )}
                         >
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                    getNotifColor(notif.type)
                                  )}>
                                     {getNotifIcon(notif.type)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-900 leading-tight truncate max-w-[200px]">{notif.title}</p>
                                     <p className="text-[11px] font-medium text-slate-500 mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-900">{notif.borrowerId?.fullName || 'System Alert'}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{notif.notificationId}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <StatusBadge status={notif.status === 'READ' ? 'Read' : 'Unread'} />
                            </td>
                            <td className="px-8 py-6">
                               <div className={cn(
                                 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                 notif.priority?.toUpperCase() === 'URGENT' ? "bg-rose-50 text-rose-500 border-rose-100" :
                                 notif.priority?.toUpperCase() === 'IMPORTANT' ? "bg-amber-50 text-amber-500 border-amber-100" :
                                 "bg-blue-50 text-blue-500 border-blue-100"
                               )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", 
                                    notif.priority?.toUpperCase() === 'URGENT' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                                    notif.priority?.toUpperCase() === 'IMPORTANT' ? "bg-amber-500" : "bg-blue-500")} />
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
                                  {notif.status === 'UNREAD' && (
                                    <button 
                                      onClick={() => handleMarkAsRead(notif._id)}
                                      className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                                    >
                                       <CheckCheck size={18} />
                                    </button>
                                  )}
                               </div>
                            </td>
                         </motion.tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-400">
                              <Bell size={48} className="opacity-20" />
                              <p className="font-bold text-lg">All caught up!</p>
                              <p className="text-sm font-medium">No notifications found matching your filters.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
             
             {/* Pagination */}
             {pagination.pages > 1 && (
               <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                 <p className="text-xs font-bold text-slate-400">Showing {notifications.length} of {pagination.total} alerts</p>
                 <div className="flex gap-2">
                   <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={filters.page === 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                   >Prev</Button>
                   <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={filters.page === pagination.pages}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                   >Next</Button>
                 </div>
               </div>
             )}
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
                   <WorkflowItem icon={CheckCircle2} title="Follow-Up Completed" desc="Issue resolved by Agent" status="pending" />
                </div>
             </div>
           </section>

           {/* 📈 RECENT ACTIVITY SECTION */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
             <div className="flex items-center justify-between">
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
               <button onClick={fetchNotifications} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><RefreshCw size={18} /></button>
             </div>
             <div className="space-y-6">
                {recentActivity.map(activity => (
                   <div key={activity._id} className="flex gap-4 group">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white transition-transform group-hover:scale-110",
                        getNotifColor(activity.type)
                      )}>
                        {getNotifIcon(activity.type)}
                      </div>
                      <div className="min-w-0">
                         <h5 className="text-[11px] font-black text-slate-900 leading-none">{activity.title}</h5>
                         <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">{activity.message}</p>
                         <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{formatDistanceToNow(new Date(activity.createdAt))} ago</p>
                      </div>
                   </div>
                ))}
                {recentActivity.length === 0 && <p className="text-center text-xs text-slate-400 font-bold">No recent activity</p>}
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
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedNotification?.notificationId}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section className="space-y-6">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Bell size={64} className="text-primary rotate-12" />
                      </div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-3">{selectedNotification?.type?.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed relative z-10">{selectedNotification?.message}</p>
                   </div>
                </section>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <User size={14} className="text-primary" /> Borrower Snapshot
                   </h4>
                   <div className="grid grid-cols-1 gap-5">
                      <DrawerItem icon={User} label="Borrower Name" value={selectedNotification?.borrowerId?.fullName || 'N/A'} />
                      <DrawerItem icon={Briefcase} label="Loan Reference" value={selectedNotification?.metadata?.loanCode || 'N/A'} />
                      <DrawerItem icon={Wallet} label="Due Amount" value={selectedNotification?.dueAmount ? `R ${selectedNotification.dueAmount}` : 'N/A'} />
                      <DrawerItem icon={Clock} label="Timestamp" value={selectedNotification?.createdAt && formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })} />
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
                    Payment Follow-Up
                 </Button>
                 <Button variant="secondary" className="col-span-2 w-full font-black uppercase tracking-widest text-[9px] py-4 text-rose-500 border-rose-100 bg-white" onClick={() => { setDeleteTarget('single'); setIsDeleteModalOpen(true); }}>
                    Delete Notification
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 👤 BORROWER DRAWER - SIMPLIFIED MOCK AS IT NEEDS A SEPARATE SERVICE */}
      <AnimatePresence>
        {isBorrowerDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBorrowerDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[111] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Borrower Profile</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedNotification?.borrowerId?.fullName}</p>
                </div>
                <button onClick={() => setIsBorrowerDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar text-center">
                 <div className="w-24 h-24 rounded-[2.5rem] bg-primary/5 text-primary flex items-center justify-center font-black text-2xl mx-auto shadow-inner">
                    {selectedNotification?.borrowerId?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-slate-900">{selectedNotification?.borrowerId?.fullName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Premium Borrower</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-8 text-left">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                       <p className="text-sm font-black text-emerald-500">Active</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reputation</p>
                       <p className="text-sm font-black text-slate-900">98%</p>
                    </div>
                 </div>
                 <Button className="w-full font-black uppercase tracking-widest text-[10px] py-4">View Full History</Button>
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
                  <p className="text-sm font-medium text-slate-500">Send an automated payment notice to {selectedNotification?.borrowerId?.fullName}.</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <NotificationOption icon={MessageSquare} label="SMS" isSelected={reminderData.reminderType === 'SMS'} onClick={() => setReminderData(p => ({...p, reminderType: 'SMS'}))} />
               <NotificationOption icon={Mail} label="Email" isSelected={reminderData.reminderType === 'EMAIL'} onClick={() => setReminderData(p => ({...p, reminderType: 'EMAIL'}))} />
               <NotificationOption icon={Phone} label="WhatsApp" isSelected={reminderData.reminderType === 'WHATSAPP'} onClick={() => setReminderData(p => ({...p, reminderType: 'WHATSAPP'}))} />
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notice Content</label>
               <textarea 
                  value={reminderData.message}
                  onChange={(e) => setReminderData(p => ({ ...p, message: e.target.value }))}
                  placeholder="Enter reminder message..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none"
               />
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
               <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsReminderModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={handleSendReminder}>Send Reminder</Button>
            </div>
         </div>
      </Modal>

      {/* 📊 FOLLOW-UP MODAL */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Log Payment Follow-Up" maxWidth="max-w-xl">
         <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-Up Notes</label>
                  <textarea 
                    value={followUpData.notes}
                    onChange={(e) => setFollowUpData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Enter detailed notes about the borrower's response or payment commitment..." 
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none shadow-inner" 
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Follow-Up Date</label>
                  <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                      type="date" 
                      value={followUpData.nextFollowUpDate}
                      onChange={(e) => setFollowUpData(p => ({ ...p, nextFollowUpDate: e.target.value }))}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10" 
                     />
                  </div>
               </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
               <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={handleSaveFollowUp}>Save Follow-Up</Button>
            </div>
         </div>
      </Modal>

      {/* 🗑️ DELETE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={deleteTarget === 'all' ? "Clear All Notifications" : "Delete Notification"} maxWidth="max-w-md text-center">
         <div className="space-y-8 py-4">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm">
               <Trash2 size={36} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900 tracking-tight">Are you absolutely sure?</h4>
               <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">
                 {deleteTarget === 'all' 
                   ? "This action will permanently delete all your notifications. This cannot be undone."
                   : "This notification will be removed from your dashboard."
                 }
               </p>
            </div>
            <div className="flex gap-4 pt-4">
               <Button variant="secondary" className="flex-1 font-bold border-slate-200" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20" onClick={handleDelete}>Yes, Confirm</Button>
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

const NotificationOption = ({ icon: Icon, label, isSelected, onClick }) => (
   <button 
    onClick={onClick}
    className={cn(
     "flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all group flex-1",
     isSelected ? "bg-primary/5 border-primary/20 text-primary" : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-100"
   )}>
      <Icon size={24} className="group-hover:scale-110 transition-transform" />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
   </button>
);

export default AgentNotifications;

