import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, MessageSquare, ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const BorrowerNotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new-notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Play notification sound if needed
      });
      
      socket.on('message-notification', (data) => {
        // Specifically for chat messages if they don't create a separate notification
        setUnreadCount(prev => prev + 1);
      });
    }
    return () => {
      if (socket) {
        socket.off('new-notification');
        socket.off('message-notification');
      }
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/borrower/communications/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // API call to mark all as read would be better, but for now individual or local
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'NewMessage': return MessageSquare;
      case 'LOAN_APPROVAL': return ShieldCheck;
      case 'DUE_REMINDER': return Clock;
      case 'PAYMENT_UPDATE': return CheckCircle2;
      case 'DOCUMENT_REQUEST': return FileText;
      default: return Bell;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-slate-50 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all relative group"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[2rem] border border-slate-100 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">Notifications</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{unreadCount} unread alerts</p>
                </div>
                <button 
                  onClick={handleMarkAllRead}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const Icon = getIcon(notif.type);
                    return (
                      <button
                        key={notif._id}
                        onClick={() => {
                          navigate('/borrower/notifications');
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full p-4 rounded-2xl flex items-start gap-4 transition-all text-left group",
                          !notif.isRead ? "bg-primary/[0.02] hover:bg-primary/[0.05]" : "hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                          !notif.isRead ? "bg-primary/10 text-primary" : "bg-slate-50 text-slate-400"
                        )}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{notif.type}</span>
                            <span className="text-[8px] font-bold text-slate-300 uppercase">{format(new Date(notif.createdAt), 'HH:mm')}</span>
                          </div>
                          <p className={cn("text-xs leading-snug", !notif.isRead ? "font-black text-slate-900" : "font-medium text-slate-500")}>
                            {notif.message}
                          </p>
                        </div>
                        {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full mt-2" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                      <Bell size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-900">No Notifications</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">We'll alert you when something happens.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  navigate('/borrower/notifications');
                  setIsOpen(false);
                }}
                className="w-full p-4 text-[10px] font-black text-primary uppercase tracking-widest border-t border-slate-50 hover:bg-slate-50 transition-all"
              >
                View All Notifications
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BorrowerNotificationDropdown;
