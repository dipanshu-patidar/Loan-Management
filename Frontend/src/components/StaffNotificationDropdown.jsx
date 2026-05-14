import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, FileText, DollarSign, AlertTriangle, 
  CheckCircle2, ShieldAlert, UserPlus, 
  MessageSquare, Info, Trash2, CheckCheck, AlertCircle,
  CreditCard, UserCheck, MessageCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import staffNotificationService from '../services/staffNotificationService';
import { initiateSocketConnection } from '../socket/socketClient';
import { cn } from '../utils/cn';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const getIconByType = (type) => {
  switch (type) {
    case 'NewLoanRequest':
    case 'ReviewAssigned':
      return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
    case 'PaymentVerification':
      return { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'PaymentRejected':
      return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' };
    case 'NewMessage':
    case 'BorrowerReply':
    case 'AdminMessage':
      return { icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    case 'OverdueAlert':
      return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' };
    case 'LoanApproved':
      return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' };
    case 'LoanRejected':
      return { icon: Trash2, color: 'text-slate-600', bg: 'bg-slate-50' };
    default:
      return { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-50' };
  }
};

const getRouteByNotificationType = (type, relatedId) => {
  switch (type) {
    case 'NewLoanRequest':
      return `/staff/loan-requests`;
    case 'ReviewAssigned':
      return `/staff/loan-review`;
    case 'PaymentVerification':
    case 'PaymentRejected':
      return `/staff/payment-verification`;
    case 'NewMessage':
    case 'BorrowerReply':
    case 'AdminMessage':
      return `/staff/communications`;
    case 'OverdueAlert':
      return `/staff/loan-requests`;
    default:
      return '/staff/notifications';
  }
};

const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'urgent':
      return "border-l-4 border-rose-500 bg-rose-50/30";
    case 'important':
      return "border-l-4 border-amber-500 bg-amber-50/30";
    case 'normal':
    default:
      return "border-l-4 border-transparent";
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

const StaffNotificationDropdown = () => {
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

  // 1. Initial REST Hydration
  const initializeData = async () => {
    try {
      setLoading(true);
      const [notifRes, countRes] = await Promise.all([
        staffNotificationService.getNotifications({ limit: 10 }),
        staffNotificationService.getUnreadCount()
      ]);
      setNotifications(notifRes.data || []);
      setUnreadCount(countRes.unreadCount || 0);
    } catch (err) {
      console.error('Staff notifications fetch failure:', err);
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
    if (user.role?.toLowerCase() !== 'staff') return;

    const token = localStorage.getItem('token');
    const socketInstance = initiateSocketConnection(token);

    if (socketInstance) {
      // Listen for new notifications
      socketInstance.on('notification:new', (newNotif) => {
        console.log('[Socket] Staff received notification:new:', newNotif);
        setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
        
        // Visual indicator / Toast
        toast.success(`Alert: ${newNotif.title}`, {
          icon: '🔔',
          duration: 4000,
          position: 'top-right'
        });
      });

      // Listen for unread count updates
      socketInstance.on('unread:updated', (payload) => {
        console.log('[Socket] Staff unread:updated:', payload);
        if (payload && typeof payload.unreadCount === 'number') {
          setUnreadCount(payload.unreadCount);
        }
      });

      // Handle real-time updates (marking as read elsewhere)
      socketInstance.on('notification:read', (payload) => {
        console.log('[Socket] Staff notification:read:', payload);
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

      socketInstance.on('notification:updated', (updatedNotif) => {
        setNotifications(prev => 
          prev.map(n => n._id === updatedNotif._id ? updatedNotif : n)
        );
      });

      socketInstance.on('notification:deleted', (notifId) => {
        setNotifications(prev => prev.filter(n => n._id !== notifId));
      });
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('notification:new');
        socketInstance.off('unread:updated');
        socketInstance.off('notification:read');
        socketInstance.off('notification:updated');
        socketInstance.off('notification:deleted');
      }
    };
  }, []);

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    
    if (!notif.isRead) {
      try {
        // Optimistic update
        setNotifications(prev => 
          prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        await staffNotificationService.markNotificationRead(notif._id);
      } catch (err) {
        console.error('Mark read failure:', err);
      }
    }
    
    const redirectRoute = getRouteByNotificationType(notif.notificationType, notif.relatedId);
    navigate(redirectRoute);
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await staffNotificationService.markAllNotificationsRead();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      setShowClearConfirm(false);
      await staffNotificationService.clearAllNotifications();
      toast.success('All notifications cleared', {
        icon: '🗑️',
        style: {
          borderRadius: '16px',
          background: '#333',
          color: '#fff',
          fontWeight: 'bold'
        }
      });
    } catch (err) {
      toast.error('Failed to clear notifications');
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
      >
        <Bell size={20} className={cn("transition-all duration-300", unreadCount > 0 && "animate-[pulse_2s_infinite]")} />
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 rounded-full border-2 border-white text-[9px] font-black text-white shadow-md shadow-rose-200 animate-bounce">
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
            className="absolute right-0 mt-3 w-[24rem] bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-base">Notifications</h3>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Realtime Operational Stream</p>
                </div>
              </div>
              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-primary font-black uppercase tracking-wider flex items-center gap-1 hover:text-primary-dark transition-colors"
                    title="Mark All Read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[11px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1 hover:text-rose-500 transition-colors"
                  title="Clear All"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="max-h-[28rem] overflow-y-auto py-0 scrollbar-thin">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 items-center animate-pulse">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                        <div className="h-2 bg-slate-50 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                    <Bell size={32} />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-800">All caught up!</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">No pending operational alerts at the moment.</p>
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
                        "px-6 py-5 flex gap-4 items-start hover:bg-slate-50/80 transition-all cursor-pointer border-b border-slate-50 last:border-0 group relative",
                        isUnread ? "bg-blue-50/5" : "opacity-70 hover:opacity-100",
                        getPriorityStyles(notif.priority)
                      )}
                    >
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                        bg, color
                      )}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className={cn("text-[14px] leading-tight truncate", isUnread ? "font-black text-slate-900" : "font-bold text-slate-700")}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap mt-0.5 flex items-center gap-1">
                            <Clock size={10} />
                            {getRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className={cn("text-[12px] leading-relaxed line-clamp-2 mb-2", isUnread ? "font-bold text-slate-600" : "font-medium text-slate-500")}>
                          {notif.message}
                        </p>
                        
                        {isUnread && (
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>
                             {notif.priority !== 'normal' && (
                               <span className={cn(
                                 "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                 notif.priority === 'urgent' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                               )}>
                                 {notif.priority}
                               </span>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
              <button 
                onClick={() => { setIsOpen(false); navigate('/staff/notifications'); }}
                className="text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-all flex items-center justify-center gap-2 w-full py-1 group"
              >
                View Full Alert Panel
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                   →
                </motion.span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Modal 
        isOpen={showClearConfirm} 
        onClose={() => setShowClearConfirm(false)} 
        title="Clear All Notifications"
        maxWidth="max-w-md"
      >
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
            <Trash2 size={28} />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight">Clear Registry?</h4>
            <p className="text-sm text-slate-500 mt-2">
              This will permanently delete all notifications.
            </p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              onClick={() => setShowClearConfirm(false)} 
              className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleClearAll} 
              className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-200"
            >
              Confirm Clear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffNotificationDropdown;
