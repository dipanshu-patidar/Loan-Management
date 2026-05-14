import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, FileText, DollarSign, AlertTriangle, 
  CheckCircle2, Info, Trash2, CheckCheck, AlertCircle,
  Clock, MessageSquare, Phone, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import agentNotificationService from '../services/agentNotificationService';
import { useSocket } from '../context/SocketContext';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';

const getIconByType = (type) => {
  switch (type) {
    case 'BORROWER_ALERT':
      return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' };
    case 'DUE_REMINDER':
      return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' };
    case 'LOAN_APPROVAL':
      return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    case 'PAYMENT_UPDATE':
    case 'PAYMENT_RECEIVED':
      return { icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'OVERDUE_WARNING':
      return { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' };
    case 'FOLLOWUP_REMINDER':
      return { icon: Phone, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    case 'ADMIN_ALERT':
      return { icon: Info, color: 'text-slate-700', bg: 'bg-slate-100' };
    case 'AdminMessage':
    case 'NewMessage':
      return { icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    default:
      return { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-50' };
  }
};

const AgentNotificationDropdown = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
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

  const initializeData = async () => {
    try {
      setLoading(true);
      const res = await agentNotificationService.getNotifications({ limit: 10 });
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.analytics.unreadCount || 0);
      }
    } catch (err) {
      console.error('Agent notifications fetch failure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  // Socket IO Integration
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
      setUnreadCount(prev => prev + 1);
      toast.success(`New Alert: ${newNotif.title}`, {
        icon: '🔔',
        position: 'top-right'
      });
    };

    const handleCountUpdate = ({ unreadCount }) => {
      setUnreadCount(unreadCount);
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

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    if (notif.status === 'UNREAD') {
      try {
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, status: 'READ' } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await agentNotificationService.markAsRead(notif._id);
      } catch (err) {
        console.error('Mark read failure:', err);
      }
    }
    navigate('/agent/notifications');
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
      setUnreadCount(0);
      await agentNotificationService.markAllAsRead();
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2.5 hover:bg-slate-50 rounded-2xl text-slate-500 relative transition-all duration-200",
          isOpen && "bg-slate-50 text-slate-900 scale-95"
        )}
      >
        <Bell size={20} className={cn(unreadCount > 0 && "animate-[pulse_2s_infinite]")} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 rounded-full border-2 border-white text-[9px] font-black text-white shadow-md animate-bounce">
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
            className="absolute right-0 mt-3 w-[22rem] bg-white rounded-3xl shadow-premium border border-slate-100 z-50 overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-base">Agent Alerts</h3>
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
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                    <Bell size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">No new alerts</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">We'll notify you of borrower activity</p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const { icon: Icon, color, bg } = getIconByType(notif.type);
                  const isUnread = notif.status === 'UNREAD';
                  
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
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        bg, color
                      )}>
                        <Icon size={18} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <p className={cn("text-[13px] leading-tight truncate", isUnread ? "font-black text-slate-900" : "font-bold text-slate-700")}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap mt-0.5">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: false })}
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

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => { setIsOpen(false); navigate('/agent/notifications'); }}
                className="text-[11px] font-black text-slate-500 uppercase tracking-wider hover:text-primary transition-colors w-full py-1"
              >
                View Notifications Page
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentNotificationDropdown;
