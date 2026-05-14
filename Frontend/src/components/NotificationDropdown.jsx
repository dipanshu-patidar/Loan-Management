import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, FileText, Wallet, AlertTriangle, 
  CheckCircle2, ShieldAlert, UserPlus, 
  MessageSquare, Info, Trash2, CheckCheck, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import navbarNotificationService from '../services/navbarNotificationService';
import { initiateSocketConnection } from '../socket/socketClient';
import { cn } from '../utils/cn';

const getIconByType = (type) => {
  switch (type) {
    case 'New Application':
      return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'Payment Notification':
      return { icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    case 'Overdue Alert':
      return { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' };
    case 'Approval Alert':
    case 'Loan Approved':
      return { icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    case 'System Alert':
    case 'Shield Alert':
      return { icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-50' };
    case 'Borrower Registered':
      return { icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-50' };
    case 'NewMessage':
    case 'BorrowerReply':
    case 'AdminMessage':
      return { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    default:
      return { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-50' };
  }
};

const getRouteByNotificationType = (type) => {
  switch (type) {
    case 'New Application':
    case 'Approval Alert':
    case 'Loan Approved':
    case 'Loan Rejected':
      return '/admin/applications';
    case 'Overdue Alert':
      return '/admin/due-payments';
    case 'Payment Notification':
      return '/admin/payment-history';
    case 'Borrower Registered':
      return '/admin/borrowers';
    case 'NewMessage':
    case 'BorrowerReply':
    case 'AdminMessage':
      return '/admin/communication';
    default:
      return '/admin/notifications';
  }
};

// Relative timestamp utility
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Click Outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Initial Rest Hydration
  const initializeData = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [notifRes, countRes] = await Promise.all([
        navbarNotificationService.getLatest(),
        navbarNotificationService.getUnreadCount()
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(countRes.data.unreadCount || 0);
    } catch (err) {
      console.error('Navbar notifications REST connection stalled:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  // 2. Socket IO Integration
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role?.toLowerCase() !== 'admin') return;

    const token = localStorage.getItem('token');
    const socketInstance = initiateSocketConnection(token);

    if (socketInstance) {
      socketInstance.on('notification:new', (newNotif) => {
        // Append to dropdown top
        setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
        
        // Visual indicator
        toast.success(`Alert: ${newNotif.title}`, {
          icon: '🔔',
          duration: 4000,
          position: 'top-right'
        });
      });

      // Synchronize unread count from server-side source of truth
      socketInstance.on('unread:updated', (payload) => {
        if (payload && typeof payload.unreadCount === 'number') {
          setUnreadCount(payload.unreadCount);
        }
      });

      // Handle real-time updates (marking as read elsewhere)
      socketInstance.on('notification:updated', (updatedNotif) => {
        setNotifications(prev => 
          prev.map(n => n._id === updatedNotif._id ? updatedNotif : n)
        );
      });

      socketInstance.on('notification:read', (payload) => {
        console.log('[Socket] Received notification:read:', payload);
        if (payload.scope === 'all') {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          setUnreadCount(0);
        } else if (payload.id) {
          setNotifications(prev => 
            prev.map(n => n._id === payload.id ? { ...n, isRead: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      });

      socketInstance.on('notification:update', (payload) => {
        if (payload.scope === 'all' && payload.field === 'status' && payload.value === 'Read') {
          setNotifications(prev => prev.map(n => ({ ...n, status: 'Read', isRead: true })));
          setUnreadCount(0);
        }
      });
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('notification:new');
        socketInstance.off('unread:updated');
        socketInstance.off('notification:updated');
        socketInstance.off('notification:read');
        socketInstance.off('notification:update');
      }
    };
  }, []);

  // Actions
  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    const redirectRoute = getRouteByNotificationType(notif.notificationType);

    if (!notif.isRead) {
      try {
        // Instantly mutate local state
        setNotifications(prev => 
          prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Trigger API
        await navbarNotificationService.markAsRead(notif._id);
      } catch (err) {
        console.error('Mark single read failure:', err);
      }
    }
    
    navigate(redirectRoute);
  };

  const handleMarkAllRead = async () => {
    try {
      // Optimistic local update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      await navbarNotificationService.markAllAsRead();
      toast.success('All navbar notifications marked read');
    } catch (err) {
      toast.error('Action halted');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Ring Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2.5 hover:bg-slate-50 rounded-2xl text-slate-500 relative transition-all duration-200",
          isOpen && "bg-slate-50 text-slate-900 scale-95"
        )}
        aria-label="View Notifications"
      >
        <Bell size={20} className={cn("transition-all duration-300", unreadCount > 0 && "animate-[pulse_2s_infinite]")} />
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 rounded-full border-2 border-white text-[9px] font-black text-white animate-[bounce_0.5s_ease_1] shadow-md shadow-rose-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="absolute right-0 mt-3 w-[22rem] bg-white rounded-3xl shadow-[0_15px_40px_-12px_rgba(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-base">Alerts Registry</h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Realtime Stream</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-primary font-black uppercase tracking-wider flex items-center gap-1 hover:text-primary-dark transition-colors"
                >
                  <CheckCheck size={14} /> Mark Read
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="max-h-[26rem] overflow-y-auto py-2 scrollbar-thin">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 items-center animate-pulse">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                        <div className="h-2 bg-slate-50 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center shadow-inner">
                    <Bell size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">No new notifications</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">We will ping you on core actions</p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const { icon: Icon, color, bg } = getIconByType(notif.notificationType);
                  const isUnread = !notif.isRead;
                  
                  return (
                    <div 
                      key={notif._id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "px-5 py-4 flex gap-4 items-start hover:bg-slate-50 transition-all cursor-pointer border-b border-slate-50 last:border-0 group relative",
                        isUnread ? "bg-blue-50/10" : "opacity-75 hover:opacity-100"
                      )}
                    >
                      {isUnread && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow shadow-primary/40" />
                      )}
                      
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105",
                        bg, color
                      )}>
                        <Icon size={18} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <p className={cn("text-[13px] leading-tight truncate", isUnread ? "font-black text-slate-900" : "font-bold text-slate-700")}>
                            {notif.title || notif.notificationType}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap mt-0.5">
                            {getRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className={cn("text-[11px] leading-relaxed line-clamp-2", isUnread ? "font-bold text-slate-600" : "font-medium text-slate-500")}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => { setIsOpen(false); navigate('/admin/notifications'); }}
                className="text-[11px] font-black text-slate-500 uppercase tracking-wider hover:text-primary transition-colors w-full py-1"
              >
                Explore Full Panel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
