import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Paperclip, Search, 
  Filter, MoreVertical, Phone, Info,
  Check, CheckCheck, Clock, User,
  ShieldCheck, Headset, Crown, RefreshCw,
  Plus, Eye, Upload, FileText, X,
  ChevronRight, Bookmark, ArrowRight,
  Zap, MessageCircle, MoreHorizontal,
  Smile, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';

const BorrowerCommunication = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoanDrawerOpen, setIsLoanDrawerOpen] = useState(false);
  const chatContainerRef = useRef(null);

  const chats = [
    { 
      id: 1, 
      name: 'Agent Sarah', 
      role: 'Assigned Agent', 
      roleKey: 'Agent',
      lastMessage: 'I have received your payment proof. Checking now.', 
      time: '10:30 AM', 
      unread: 2, 
      status: 'online',
      avatar: 'AS'
    },
    { 
      id: 2, 
      name: 'Support Team', 
      role: 'Staff Support', 
      roleKey: 'Staff',
      lastMessage: 'Please upload your latest payslip for verification.', 
      time: '09:15 AM', 
      unread: 0, 
      status: 'away',
      avatar: 'ST'
    },
    { 
      id: 3, 
      name: 'Admin Desk', 
      role: 'Escalation Support', 
      roleKey: 'Admin',
      lastMessage: 'Your interest rate inquiry has been forwarded.', 
      time: 'Yesterday', 
      unread: 0, 
      status: 'offline',
      avatar: 'AD'
    },
  ];

  const messages = [
    { id: 1, text: 'Hi Sarah, I just made the EMI payment for May.', sender: 'me', time: '10:15 AM', status: 'read' },
    { id: 2, text: 'Here is the proof of payment.', sender: 'me', time: '10:16 AM', status: 'read', attachment: 'receipt.pdf' },
    { id: 3, text: 'Great! I have received your payment proof. Checking now.', sender: 'other', time: '10:30 AM', status: 'received' },
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Chat with support and agents</p>
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
            {['All', 'Agent', 'Staff', 'Admin'].map(filter => (
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
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all",
                  chat.roleKey === 'Agent' ? "bg-blue-50 text-blue-600" :
                  chat.roleKey === 'Staff' ? "bg-emerald-50 text-emerald-600" :
                  "bg-primary/5 text-primary"
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
              <Plus size={16} /> New Message
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
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black",
                  selectedChat.roleKey === 'Agent' ? "bg-blue-50 text-blue-600" :
                  selectedChat.roleKey === 'Staff' ? "bg-emerald-50 text-emerald-600" :
                  "bg-primary/5 text-primary"
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
                <button onClick={() => setIsLoanDrawerOpen(true)} className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all" title="View Loan Snapshot"><Eye size={18} /></button>
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
                  <div className={cn(
                    "p-5 rounded-[2rem] text-sm font-medium shadow-sm leading-relaxed relative",
                    msg.sender === 'me' ? "bg-primary text-white rounded-tr-none shadow-primary/10" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                  )}>
                    {msg.text}
                    {msg.attachment && (
                      <div className={cn(
                        "mt-4 p-4 rounded-2xl flex items-center gap-4 border",
                        msg.sender === 'me' ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileText size={18} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black truncate">{msg.attachment}</p>
                          <p className="text-[9px] font-bold uppercase opacity-60 tracking-widest">PDF • 1.2 MB</p>
                        </div>
                        <button className="p-2 hover:bg-black/5 rounded-lg transition-all"><Eye size={16} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</span>
                    {msg.sender === 'me' && (
                      <CheckCheck size={12} className={msg.status === 'read' ? "text-primary" : "text-slate-300"} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* MESSAGE INPUT */}
            <div className="p-8 border-t border-slate-50 bg-white shrink-0 space-y-6">
              <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
                <QuickTemplate label="EMI Help" onClick={() => setMessage("I need help with my upcoming EMI payment.")} />
                <QuickTemplate label="Payment Issue" onClick={() => setMessage("I'm having trouble verifying my payment.")} />
                <QuickTemplate label="Document Status" onClick={() => setMessage("What is the status of my uploaded documents?")} />
                <QuickTemplate label="Loan Inquiry" onClick={() => setMessage("I have a question about my loan balance.")} />
              </div>
              <form onSubmit={handleSendMessage} className="flex items-end gap-4">
                <div className="flex-1 relative flex items-center bg-slate-50 rounded-[2rem] px-2 shadow-inner border border-slate-100">
                  <button type="button" className="p-3 text-slate-400 hover:text-primary transition-colors"><Smile size={20} /></button>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
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
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Support Workspace</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Select a conversation from the sidebar to start discussing your loan or payments with your assigned agent or support staff.</p>
            </div>
            <Button onClick={() => setIsNewChatModalOpen(true)} className="font-black uppercase text-[10px] tracking-widest px-10 py-4 shadow-lg shadow-primary/20">
               Start New Chat
            </Button>
          </div>
        )}
      </section>

      {/* MODALS & DRAWERS */}
      <AnimatePresence>
         {/* NEW CHAT MODAL */}
         {isNewChatModalOpen && (
            <Modal isOpen onClose={() => setIsNewChatModalOpen(false)} title="Start New Support Conversation" maxWidth="max-w-xl">
               <div className="space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Group</p>
                        <div className="grid grid-cols-3 gap-3">
                           {['Agent', 'Staff', 'Admin'].map(role => (
                              <button key={role} className="p-4 rounded-2xl border-2 border-slate-50 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2 group">
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-white transition-all shadow-sm">
                                    {role === 'Admin' ? <ShieldAlert size={20} /> : role === 'Staff' ? <Headset size={20} /> : <User size={20} />}
                                 </div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-primary">{role}</span>
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Recipient</p>
                        <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-inner">
                           <option>Assigned Agent: Sarah Jones</option>
                           <option>Branch Staff: Michael Nkosi</option>
                           <option>System Admin Support</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Message</p>
                        <textarea placeholder="Type your message or operational update..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none shadow-inner" />
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                     <Button variant="secondary" onClick={() => setIsNewChatModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button onClick={() => setIsNewChatModalOpen(false)} className="flex-1 font-black uppercase text-[10px] shadow-lg shadow-primary/20">Send Message</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* UPLOAD MODAL */}
         {isUploadModalOpen && (
            <Modal isOpen onClose={() => setIsUploadModalOpen(false)} title="Upload File Attachment">
               <div className="space-y-8">
                  <div className="p-10 border-2 border-dashed border-slate-100 bg-slate-50/50 rounded-[2.5rem] text-center space-y-4 group hover:border-primary/20 transition-all cursor-pointer">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary mx-auto shadow-sm group-hover:scale-110 transition-transform">
                        <Upload size={32} />
                     </div>
                     <div>
                        <p className="text-sm font-black text-slate-900">Drag & drop files to attach</p>
                        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">PDF, JPG, PNG accepted</p>
                     </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button className="flex-1 font-black uppercase text-[10px]">Upload Now</Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* LOAN DRAWER */}
         {isLoanDrawerOpen && (
            <>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoanDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Loan Snapshot</h3>
                     <button onClick={() => setIsLoanDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                     <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Personal Loan (L-74291)</p>
                           <h2 className="text-3xl font-black tracking-tight mt-1">R8,450.00</h2>
                           <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mt-1">Remaining Balance</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                           <div>
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Due Date</p>
                              <p className="text-sm font-black">15 May 2026</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Last EMI</p>
                              <p className="text-sm font-black">R825.50</p>
                           </div>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <SummaryRow label="Loan Amount" value="R19,812.00" />
                        <SummaryRow label="Interest Rate" value="12.5% P.A" />
                        <SummaryRow label="Total Penalties" value="R150.00" color="text-rose-500" />
                        <SummaryRow label="Repayment Progress" value="58%" color="text-emerald-500" />
                     </div>

                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Repayment Track</span>
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">14 / 24 Paid</span>
                        </div>
                        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                           <div className="h-full bg-emerald-500 w-[58%]" />
                        </div>
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

const RecipientOption = ({ icon: Icon, title, desc }) => (
   <button className="w-full p-4 rounded-2xl bg-white border border-slate-100 flex items-center gap-4 text-left group hover:border-primary transition-all shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary flex items-center justify-center transition-all">
         <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
         <h5 className="text-xs font-black text-slate-900 tracking-tight">{title}</h5>
         <p className="text-[10px] font-medium text-slate-500 truncate">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
   </button>
);

const SummaryRow = ({ label, value, color }) => (
   <div className="flex items-center justify-between py-1 group">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
      <span className={cn("text-xs font-black", color || "text-slate-900")}>{value}</span>
   </div>
);

export default BorrowerCommunication;
