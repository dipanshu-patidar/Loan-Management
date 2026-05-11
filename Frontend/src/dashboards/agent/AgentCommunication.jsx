import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Paperclip, Search, 
  Filter, MoreVertical, Phone, Info,
  Check, CheckCheck, Clock, User,
  ShieldCheck, Headset, Crown, RefreshCw,
  Plus, Eye, Upload, FileText, X,
  ChevronRight, Bookmark, ArrowRight,
  Zap, MessageCircle, MoreHorizontal,
  Smile, CheckCircle2, ShieldAlert, UserCog,
  Users, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';

const AgentCommunication = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSnapshotDrawerOpen, setIsSnapshotDrawerOpen] = useState(false);
  const chatContainerRef = useRef(null);

  const chats = [
    { 
      id: 1, 
      name: 'System Admin', 
      role: 'Global Admin', 
      roleKey: 'Admin',
      lastMessage: 'Please follow up on the overdue EMI for LN-74291.', 
      time: '10:30 AM', 
      unread: 1, 
      status: 'online',
      avatar: 'AD'
    },
    { 
      id: 2, 
      name: 'Michael Chen', 
      role: 'Verified Borrower', 
      roleKey: 'Borrower',
      lastMessage: 'I have uploaded the payment proof for my May EMI.', 
      time: '09:15 AM', 
      unread: 2, 
      status: 'online',
      avatar: 'MC'
    },
    { 
      id: 3, 
      name: 'Sarah Williams', 
      role: 'Verified Borrower', 
      roleKey: 'Borrower',
      lastMessage: 'Can I extend my payment deadline by 3 days?', 
      time: 'Yesterday', 
      unread: 0, 
      status: 'away',
      avatar: 'SW'
    },
    { 
      id: 4, 
      name: 'Staff - Michael Nkosi', 
      role: 'Branch Staff', 
      roleKey: 'Staff',
      lastMessage: 'Application L-2938 has been approved for review.', 
      time: 'Yesterday', 
      unread: 0, 
      status: 'offline',
      avatar: 'MN'
    },
  ];

  const messages = [
    { id: 1, text: 'Hello Michael, I am checking your payment proof now.', sender: 'me', time: '10:00 AM', status: 'read' },
    { id: 2, text: 'Please ensure the receipt clearly shows the reference number.', sender: 'me', time: '10:02 AM', status: 'read' },
    { id: 3, text: 'Thank you Agent. I have re-uploaded a clearer copy.', sender: 'other', time: '10:15 AM', status: 'received' },
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedChat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessage('');
  };

  const filteredChats = activeFilter === 'All' 
    ? chats 
    : chats.filter(c => c.roleKey === activeFilter);

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 overflow-hidden -mt-6">
      {/* LEFT PANEL: CONVERSATION LIST */}
      <section className="w-full md:w-80 lg:w-96 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden shrink-0">
        <div className="p-8 border-b border-slate-50 space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Agent Hub</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Field & Support Communication</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-2xl">
            {['All', 'Borrower', 'Staff', 'Admin'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  activeFilter === filter ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "w-full p-5 rounded-[2rem] flex items-center gap-4 transition-all group relative border-l-4",
                selectedChat?.id === chat.id ? "bg-primary/5 border-primary shadow-sm" : "border-transparent hover:bg-slate-50"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-sm",
                  chat.roleKey === 'Borrower' ? "bg-blue-50 text-blue-600" :
                  chat.roleKey === 'Admin' ? "bg-slate-900 text-white" :
                  "bg-emerald-50 text-emerald-600"
                )}>
                  {chat.avatar}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                  chat.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                  chat.status === 'away' ? "bg-amber-500" : "bg-slate-300"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-sm font-black text-slate-900 truncate tracking-tight group-hover:text-primary transition-colors">{chat.name}</h4>
                  <span className="text-[9px] font-bold text-slate-400">{chat.time}</span>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{chat.role}</p>
                <p className="text-[11px] font-medium text-slate-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse shrink-0">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-slate-50">
           <Button onClick={() => setIsNewChatModalOpen(true)} className="w-full flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest py-4 shadow-lg shadow-primary/20">
              <Plus size={16} /> Start New Conversation
           </Button>
        </div>
      </section>

      {/* RIGHT PANEL: CHAT PANEL */}
      <section className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden relative">
        {selectedChat ? (
          <>
            {/* CHAT HEADER */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner",
                  selectedChat.roleKey === 'Borrower' ? "bg-blue-50 text-blue-600" :
                  selectedChat.roleKey === 'Admin' ? "bg-slate-900 text-white" :
                  "bg-emerald-50 text-emerald-600"
                )}>
                  {selectedChat.avatar}
                </div>
                <div>
                  <h3 className="text-md font-black text-slate-900 tracking-tight">{selectedChat.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", selectedChat.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedChat.role} • {selectedChat.status}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
                    <Zap size={14} /> Send Reminder
                </button>
                <button onClick={() => setIsSnapshotDrawerOpen(true)} className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all" title="View Profile Snapshot"><Eye size={18} /></button>
                <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* MESSAGES AREA */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 bg-slate-50/20">
              <div className="flex justify-center">
                <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Today, 10 May 2026</span>
              </div>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex flex-col gap-2 max-w-[80%]",
                    msg.sender === 'me' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                   {msg.sender !== 'me' && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{selectedChat.name}</span>}
                  <div className={cn(
                    "p-5 rounded-[2rem] text-sm font-medium shadow-sm leading-relaxed relative",
                    msg.sender === 'me' ? "bg-primary text-white rounded-tr-none shadow-primary/10" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</span>
                    {msg.sender === 'me' && <CheckCheck size={12} className={msg.status === 'read' ? "text-primary" : "text-slate-300"} />}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* MESSAGE INPUT */}
            <div className="p-8 border-t border-slate-50 bg-white shrink-0 space-y-6">
              <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
                <QuickTemplate label="EMI Reminder" onClick={() => setMessage("REMINDER: Your EMI payment of R1,200 is due on May 15th.")} />
                <QuickTemplate label="Payment Follow-up" onClick={() => setMessage("I have received your payment proof and am verifying it.")} />
                <QuickTemplate label="Document Request" onClick={() => setMessage("Please upload a clear copy of your latest payslip.")} />
                <QuickTemplate label="Loan Update" onClick={() => setMessage("Your loan application status has been updated.")} />
              </div>
              <form onSubmit={handleSendMessage} className="flex items-end gap-4">
                <div className="flex-1 relative flex items-center bg-slate-50 rounded-[2rem] px-2 shadow-inner border border-slate-100">
                  <button type="button" className="p-3 text-slate-400 hover:text-primary transition-colors"><Smile size={20} /></button>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type message or operational update..."
                    className="flex-1 bg-transparent border-none py-4 text-sm font-medium text-slate-700 outline-none transition-all resize-none min-h-[56px] max-h-32 custom-scrollbar"
                    rows={1}
                  />
                  <button type="button" onClick={() => setIsUploadModalOpen(true)} className="p-3 text-slate-400 hover:text-primary transition-colors">
                    <Paperclip size={20} />
                  </button>
                </div>
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shrink-0"
                >
                  <Send size={24} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <MessageSquare size={48} />
            </div>
            <div className="max-w-xs space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agent Communication</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Manage your field interactions and borrower support. Select a conversation to start collaborating.</p>
            </div>
            <Button onClick={() => setIsNewChatModalOpen(true)} className="font-black uppercase text-[10px] tracking-widest px-10 py-4 shadow-lg shadow-primary/20">
               New Message
            </Button>
          </div>
        )}
      </section>

      {/* MODALS & DRAWERS */}
      <AnimatePresence>
         {/* NEW CHAT MODAL */}
         {isNewChatModalOpen && (
            <Modal isOpen onClose={() => setIsNewChatModalOpen(false)} title="Start New Conversation" maxWidth="max-w-xl">
               <div className="space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Recipient Group</p>
                        <div className="grid grid-cols-3 gap-3">
                           {['Borrower', 'Staff', 'Admin'].map(role => (
                              <button key={role} className="p-4 rounded-2xl border-2 border-slate-50 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2 group">
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-white transition-all shadow-sm">
                                    {role === 'Admin' ? <ShieldCheck size={20} /> : role === 'Staff' ? <UserCog size={20} /> : <User size={20} />}
                                 </div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-primary">{role}</span>
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Recipient</p>
                        <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-inner">
                           <option>Michael Chen (Verified Borrower)</option>
                           <option>Sarah Williams (Verified Borrower)</option>
                           <option>Michael Nkosi (Branch Staff)</option>
                           <option>Global Admin Support</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Message</p>
                        <textarea placeholder="Type message or operational update..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none shadow-inner" />
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                     <Button variant="secondary" onClick={() => setIsNewChatModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => setIsNewChatModalOpen(false)} className="flex-1 font-black uppercase text-[10px] shadow-lg shadow-primary/20">Send Message</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* SNAPSHOT DRAWER */}
         {isSnapshotDrawerOpen && (
            <>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSnapshotDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Borrower Snapshot</h3>
                     <button onClick={() => setIsSnapshotDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                     <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center text-3xl font-black mx-auto shadow-inner">
                           {selectedChat?.avatar}
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-slate-900">{selectedChat?.name}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedChat?.role}</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2">Portfolio Details</h5>
                        <SummaryRow label="Active Loan" value="R12,500.00" />
                        <SummaryRow label="Outstanding" value="R1,200.00" color="text-rose-500" />
                        <SummaryRow label="Payment Health" value="Stable" color="text-emerald-500" />
                        <SummaryRow label="Next EMI" value="15 May 2026" />
                     </div>
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const QuickTemplate = ({ label, onClick }) => (
   <button 
      onClick={onClick}
      className="px-4 py-2 bg-slate-50 hover:bg-primary/5 hover:text-primary rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 transition-all whitespace-nowrap shadow-sm"
   >
      {label}
   </button>
);

const SummaryRow = ({ label, value, color }) => (
   <div className="flex items-center justify-between py-1 group">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
      <span className={cn("text-xs font-black", color || "text-slate-900")}>{value}</span>
   </div>
);

export default AgentCommunication;
