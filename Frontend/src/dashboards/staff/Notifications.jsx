import React, { useState, useEffect } from 'react';
import { 
  Bell, Search, Filter, Trash2, CheckCheck, 
  ChevronLeft, ChevronRight, Clock, Info,
  AlertTriangle, FileText, CreditCard, MessageCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import staffNotificationService from '../../services/staffNotificationService';
import { cn } from '../../utils/cn';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

const getIconByType = (type) => {
  switch (type) {
    case 'NewLoanRequest':
    case 'ReviewAssigned':
      return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
    case 'PaymentVerification':
      return { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'PaymentRejected':
      return { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' };
    case 'NewMessage':
    case 'BorrowerReply':
    case 'AdminMessage':
      return { icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    case 'OverdueAlert':
      return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' };
    case 'LoanApproved':
      return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' };
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
      return null;
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        isRead: filter === 'unread' ? 'false' : undefined
      };
      const res = await staffNotificationService.getNotifications(params);
      setNotifications(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const handleMarkRead = async (id) => {
    try {
      await staffNotificationService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await staffNotificationService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleDelete = async (id) => {
    try {
      await staffNotificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    try {
      await staffNotificationService.clearAllNotifications();
      setNotifications([]);
      setTotal(0);
      setShowClearConfirm(false);
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

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read if not already
    if (!notif.isRead) {
      try {
        await staffNotificationService.markNotificationRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }

    // 2. Redirect
    const route = getRouteByNotificationType(notif.notificationType, notif.relatedId);
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Notifications Center</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">Manage your operational alerts and system updates</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <CheckCheck size={16} className="text-emerald-500" />
            Mark All Read
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-100 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
          <button 
            onClick={() => { setFilter('all'); setPage(1); }}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-black transition-all",
              filter === 'all' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            All Alerts
          </button>
          <button 
            onClick={() => { setFilter('unread'); setPage(1); }}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-black transition-all",
              filter === 'unread' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            Unread Only
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-12 space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center animate-pulse">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-50 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                <Bell size={40} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">No Notifications Found</h3>
                <p className="text-sm text-slate-400 font-bold mt-1 max-w-xs mx-auto">
                  {filter === 'unread' ? "You're all caught up! No unread messages." : "You don't have any notifications yet."}
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => {
              const { icon: Icon, color, bg } = getIconByType(notif.notificationType);
              return (
                <motion.div 
                  key={notif._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "p-6 flex flex-col sm:flex-row gap-4 items-start transition-all group cursor-pointer",
                    !notif.isRead ? "bg-blue-50/10" : "bg-white",
                    "hover:bg-slate-50/50"
                  )}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                    bg, color
                  )}>
                    <Icon size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className={cn("text-base truncate", !notif.isRead ? "font-black text-slate-900" : "font-bold text-slate-700")}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/40" />
                        )}
                        {notif.priority !== 'normal' && (
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                            notif.priority === 'urgent' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {notif.priority}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className={cn("text-sm leading-relaxed mb-4", !notif.isRead ? "font-bold text-slate-600" : "font-medium text-slate-500")}>
                      {notif.message}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkRead(notif._id)}
                          className="text-[11px] font-black text-primary hover:text-primary-dark uppercase tracking-wider flex items-center gap-1"
                        >
                          <CheckCheck size={14} /> Mark Read
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notif._id);
                        }}
                        className="text-[11px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-wider flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs font-bold text-slate-400">
              Showing {notifications.length} of {total} results
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all shadow-sm"
              >
                <ChevronLeft size={18} className="text-slate-600" />
              </button>
              <div className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-700 shadow-sm">
                Page {page}
              </div>
              <button 
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all shadow-sm"
              >
                <ChevronRight size={18} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
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
              This will permanently delete all your notifications. This action cannot be undone.
            </p>
          </div>
          
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex gap-3 text-left">
            <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-600/80 font-bold leading-relaxed uppercase">
              This action is irreversible. All associated notifications will be purged.
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
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Notifications;
