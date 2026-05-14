import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Send, Paperclip, Search, 
  Filter, MoreVertical, Phone, Info,
  Check, CheckCheck, Clock, User,
  ShieldCheck, Headset, Crown, RefreshCw,
  Plus, Eye, Upload, FileText, X,
  ChevronRight, Bookmark, ArrowRight,
  Zap, MessageCircle, MoreHorizontal,
  Smile, CheckCircle2, ShieldAlert, UserCog,
  Users, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';
import agentCommunicationService from '../../services/agentCommunicationService';
import { toast } from 'react-hot-toast';
import { initiateSocketConnection, disconnectSocket } from '../../socket/socketClient';
import authService from '../../services/authService';

const AgentCommunication = () => {
  const user = authService.getCurrentUser();
  const [conversations, setConversations] = useState([]);
  const [assignedBorrowers, setAssignedBorrowers] = useState([]);
  const [relatedStaff, setRelatedStaff] = useState([]);
  const [adminSupport, setAdminSupport] = useState([]);
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSnapshotDrawerOpen, setIsSnapshotDrawerOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch Conversations & Groups
  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await agentCommunicationService.getConversations(activeFilter.toLowerCase());
      const resData = res.data;
      if (resData.success) {
        setConversations(resData.data.conversations || []);
        setAssignedBorrowers(resData.data.assignedBorrowers || []);
        setRelatedStaff(resData.data.relatedStaff || []);
        setAdminSupport(resData.data.adminSupport || []);
      }
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const res = await agentCommunicationService.searchConversations(searchQuery);
          if (res.data.success) setConversations(res.data.data);
        } catch (error) {}
      } else if (searchQuery.length === 0) {
        fetchConversations(true);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchConversations]);

  // 2. Real-time Socket Setup
  useEffect(() => {
    const socket = initiateSocketConnection();
    socketRef.current = socket;

    const handleMessageReceived = (newMessage) => {
      setSelectedChat(currentChat => {
        const currentChatId = currentChat?._id?.toString() || currentChat?.id?.toString();
        const incomingConvId = newMessage.conversationId?.toString();

        if (currentChatId && incomingConvId === currentChatId) {
          setMessages(prev => {
            if (prev.some(m => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
          
          // Aggressively clear unread locally
          setConversations(prev => prev.map(c => 
            (c._id === incomingConvId || c.id === incomingConvId) ? { ...c, unreadCount: 0 } : c
          ));
          
          // Update DB
          agentCommunicationService.markAsRead(incomingConvId);
        }
        return currentChat;
      });
      fetchConversations(true);
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('receiveMessage', handleMessageReceived);
    socket.on('receive_message', handleMessageReceived);
    socket.on(`receiveMessage_${user?._id}`, handleMessageReceived);
    socket.on(`receive_message_${user?._id}`, handleMessageReceived);

    socket.on('userTyping', ({ conversationId, isTyping }) => {
      setSelectedChat(currentChat => {
        if (currentChat && (conversationId === currentChat._id || conversationId === currentChat.id)) {
          setPeerTyping(isTyping);
        }
        return currentChat;
      });
    });

    socket.on(`unread:updated_${user?._id}`, ({ conversationId, unreadCount }) => {
      setConversations(prev => prev.map(c => 
        (c._id === conversationId || c.id === conversationId) ? { ...c, unreadCount } : c
      ));
    });

    return () => {
      // Only remove listeners, don't disconnect unless component unmounts
      socket.off('message:received');
      socket.off('receiveMessage');
      socket.off('userTyping');
      socket.off(`unread:updated_${user?._id}`);
    };
  }, [fetchConversations, user?._id]);

  // 2b. Join Room Logic
  useEffect(() => {
    if (selectedChat && socketRef.current) {
      const chatId = selectedChat._id || selectedChat.id;
      if (chatId) {
        socketRef.current.emit('joinConversation', chatId);
        socketRef.current.emit('join_room', chatId); // Double emit for safety
      }
    }
  }, [selectedChat]);

  // 3. Load Chat History
  const handleSelectChat = async (chat) => {
    if (!chat) return;
    
    // If selecting a virtual chat, peer is the other participant
    const peer = chat.participants.find(p => p._id !== user?._id);
    const chatId = chat._id || chat.id || peer?._id;

    setSelectedChat(chat);
    setChatLoading(true);
    setMessages([]); // Clear previous messages
    
    try {
      const res = await agentCommunicationService.getConversation(chatId);
      const resData = res.data;
      if (resData.success) {
        setMessages(resData.data.messages || []);
        
        // Join socket room
        const realChatId = resData.data.conversation?._id || chat._id || chat.id;
        if (realChatId && socketRef.current) {
          socketRef.current.emit('joinConversation', realChatId);
        }

        // If it was a virtual chat, the res.data.conversation will have the real ID now
        if (chat.isVirtual) {
          setSelectedChat(resData.data.conversation);
          fetchConversations(true);
        }
        // Mark as Read
        if (chat.unreadCount > 0) {
          // Optimistic UI update
          setConversations(prev => prev.map(c => 
            (c._id === chatId || c.id === chatId) ? { ...c, unreadCount: 0 } : c
          ));
          await agentCommunicationService.markAsRead(chatId);
          fetchConversations(true);
        }
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access Denied: You are not authorized to message this user');
        setSelectedChat(null);
      } else {
        toast.error('Failed to load conversation');
      }
    } finally {
      setChatLoading(false);
    }
  };

  // 4. Send Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const messageContent = message.trim();
    setMessage('');
    
    try {
      const peer = selectedChat.participants.find(p => p._id !== user?._id);
      const res = await agentCommunicationService.sendMessage({
        conversationId: selectedChat.isVirtual ? null : selectedChat._id,
        receiverId: selectedChat.isVirtual ? peer._id : peer._id,
        message: messageContent,
        messageType: 'text'
      });
      
      const resData = res.data;
      if (resData.success) {
        // Add message to state immediately
        const sentMessage = resData.data;
        setMessages(prev => [...prev, sentMessage]);

        if (selectedChat.isVirtual) {
          // Refresh list to convert virtual to real
          fetchConversations(true);
          setSelectedChat(resData.data.conversationId ? { ...selectedChat, _id: resData.data.conversationId, isVirtual: false } : selectedChat);
          // Join the new room
          if (resData.data.conversationId && socketRef.current) {
            socketRef.current.emit('joinConversation', resData.data.conversationId);
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Message failed to send');
      setMessage(messageContent);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (!socketRef.current || !selectedChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { conversationId: selectedChat._id, userId: user._id, userName: user.fullName });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('stopTyping', { conversationId: selectedChat._id, userId: user._id });
    }, 2000);
  };

  const handleReminder = async () => {
    if (!selectedChat) return;
    const peer = selectedChat.participants.find(p => p._id !== user._id);
    if (peer.role !== 'borrower') return toast.error('Reminders can only be sent to borrowers');

    try {
      await agentCommunicationService.createReminder({
        borrowerId: peer._id,
        reminderMessage: "Standard payment follow-up",
        followUpDate: new Date()
      });
      toast.success('Reminder sent');
    } catch (error) {
      toast.error('Failed to send reminder');
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, peerTyping]);

  const filteredConversations = conversations;

  const getParticipantInfo = (chat) => {
    if (!chat || !user) return { name: 'Unknown', role: 'N/A', avatar: '?' };
    const peer = chat.participants?.find(p => p._id !== user._id);
    if (!peer) return { name: 'Unknown', role: 'N/A', avatar: '?' };
    
    return {
      name: peer.fullName || 'Unknown User',
      role: peer.role ? (peer.role.charAt(0).toUpperCase() + peer.role.slice(1)) : 'User',
      roleKey: peer.role,
      avatar: (peer.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2),
      photo: peer.profilePhoto,
      status: peer.isActive ? 'online' : 'offline',
      id: peer._id
    };
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          {loading ? (
            <div className="space-y-4 p-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-2 bg-slate-50 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length > 0 ? filteredConversations.map(chat => {
            const info = getParticipantInfo(chat);
            const unread = chat.unreadCounts?.[user._id] || 0;
            return (
              <button
                key={chat._id || chat.id}
                onClick={() => handleSelectChat(chat)}
                className={cn(
                  "w-full p-5 rounded-[2rem] flex items-center gap-4 transition-all group relative border-l-4",
                  selectedChat?._id === chat._id ? "bg-primary/5 border-primary shadow-sm" : "border-transparent hover:bg-slate-50"
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-sm overflow-hidden",
                    info.role === 'Borrower' ? "bg-blue-50 text-blue-600" :
                    info.role === 'Admin' ? "bg-slate-900 text-white" :
                    "bg-emerald-50 text-emerald-600"
                  )}>
                    {info.photo ? <img src={info.photo} className="w-full h-full object-cover" /> : info.avatar}
                  </div>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                    info.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-300"
                  )} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-black text-slate-900 truncate tracking-tight group-hover:text-primary transition-colors">{info.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400">{formatTime(chat.lastMessageTime)}</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{info.role}</p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">{chat.lastMessage}</p>
                </div>
                {unread > 0 && (
                  <div className="w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse shrink-0">
                    {unread}
                  </div>
                )}
              </button>
            );
          }) : (
            <div className="text-center py-10 opacity-40">
              <MessageSquare size={32} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">No conversations</p>
            </div>
          )}
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
                  getParticipantInfo(selectedChat).roleKey === 'borrower' ? "bg-blue-50 text-blue-600" :
                  getParticipantInfo(selectedChat).roleKey === 'admin' ? "bg-slate-900 text-white" :
                  "bg-emerald-50 text-emerald-600"
                )}>
                  {getParticipantInfo(selectedChat).photo ? 
                    <img src={getParticipantInfo(selectedChat).photo} className="w-full h-full object-cover" /> : 
                    getParticipantInfo(selectedChat).avatar
                  }
                </div>
                <div>
                  <h3 className="text-md font-black text-slate-900 tracking-tight">{getParticipantInfo(selectedChat).name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", getParticipantInfo(selectedChat).status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{getParticipantInfo(selectedChat).role} • {getParticipantInfo(selectedChat).status}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getParticipantInfo(selectedChat).roleKey === 'borrower' && (
                  <button 
                    onClick={handleReminder}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                      <Zap size={14} /> Send Reminder
                  </button>
                )}
                <button onClick={() => setIsSnapshotDrawerOpen(true)} className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all" title="View Profile Snapshot"><Eye size={18} /></button>
              </div>
            </div>

            {/* MESSAGES AREA */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 bg-slate-50/20">
              {chatLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading history...</p>
                </div>
              ) : messages.length > 0 ? (
                <>
                  <div className="flex justify-center">
                    <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">CONVERSATION STARTED</span>
                  </div>
                  {messages.map((msg, i) => {
                    const isMe = msg.senderId?._id === user._id || msg.senderId === user._id;
                    return (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn(
                          "flex flex-col gap-2 max-w-[80%]",
                          isMe ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                         {!isMe && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{msg.senderId?.fullName || 'Participant'}</span>}
                        <div className={cn(
                          "p-5 rounded-[2rem] text-sm font-medium shadow-sm leading-relaxed relative",
                          isMe ? "bg-primary text-white rounded-tr-none shadow-primary/10" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                        )}>
                          {msg.message || msg.messageText}
                          {msg.messageType === 'reminder' && (
                             <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-2 opacity-80">
                                <Zap size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Operational Reminder</span>
                             </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 px-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatTime(msg.createdAt)}</span>
                          {isMe && <CheckCheck size={12} className={msg.isRead ? "text-primary" : "text-slate-300"} />}
                        </div>
                      </motion.div>
                    );
                  })}
                  {peerTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-400">
                       <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest">Typing...</span>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                  <MessageCircle size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No messages yet. Say hello!</p>
                </div>
              )}
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
                    onChange={handleTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type message or operational update..."
                    className="flex-1 bg-transparent border-none py-4 text-sm font-medium text-slate-700 outline-none transition-all resize-none min-h-[56px] max-h-32 custom-scrollbar"
                    rows={1}
                  />
                  <button type="button" className="p-3 text-slate-400 hover:text-primary transition-colors">
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
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Participant Type</p>
                        <div className="grid grid-cols-3 gap-3">
                           {['Borrower', 'Staff', 'Admin'].map(role => (
                              <button 
                                key={role} 
                                onClick={() => setActiveFilter(role)}
                                className={cn(
                                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group",
                                  activeFilter === role ? "border-primary bg-primary/5" : "border-slate-50 hover:border-slate-200 bg-slate-50/50"
                                )}
                              >
                                 <div className={cn(
                                   "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                   activeFilter === role ? "text-white bg-primary" : "bg-white text-slate-400 group-hover:text-primary"
                                 )}>
                                    {role === 'Admin' ? <ShieldCheck size={20} /> : role === 'Staff' ? <UserCog size={20} /> : <User size={20} />}
                                 </div>
                                 <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest transition-colors",
                                   activeFilter === role ? "text-primary" : "text-slate-500 group-hover:text-slate-700"
                                 )}>{role}</span>
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Recipient</p>
                        <select 
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-inner"
                          onChange={(e) => {
                            const userId = e.target.value;
                            if (!userId) return;
                            
                            // Find in conversations (real or virtual)
                            const chat = conversations.find(c => {
                              const peer = c.participants?.find(p => p._id !== user?._id);
                              return peer?._id === userId;
                            });
                            
                            if (chat) {
                              handleSelectChat(chat);
                            } else {
                              // This shouldn't happen as conversations list already includes virtuals for potential users
                              // But as a fallback:
                              const potentialUsers = [...assignedBorrowers, ...relatedStaff, ...adminSupport];
                              const userToChat = potentialUsers.find(u => u._id === userId);
                              if (userToChat) {
                                handleSelectChat({
                                  isVirtual: true,
                                  participants: [user, userToChat],
                                  participantType: 'direct',
                                  unreadCount: 0
                                });
                              }
                            }
                          }}
                        >
                           <option value="">Select a {activeFilter}...</option>
                           {(() => {
                             const list = activeFilter === 'Borrower' ? assignedBorrowers :
                                         activeFilter === 'Staff' ? relatedStaff :
                                         activeFilter === 'Admin' ? adminSupport :
                                         [...assignedBorrowers, ...relatedStaff, ...adminSupport];
                             
                             return list.map(u => (
                               <option key={u._id} value={u._id}>{u.fullName} ({u.role.toUpperCase()})</option>
                             ));
                           })()}
                        </select>
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                     <Button variant="secondary" onClick={() => setIsNewChatModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                     <Button 
                       disabled={!selectedChat}
                       onClick={() => {
                         setIsNewChatModalOpen(false);
                       }} 
                       className="flex-1 font-black uppercase text-[10px] shadow-lg shadow-primary/20"
                     >
                       Start Chat
                     </Button>
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
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Participant Snapshot</h3>
                     <button onClick={() => setIsSnapshotDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                     <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center text-3xl font-black mx-auto shadow-inner overflow-hidden">
                           {getParticipantInfo(selectedChat).photo ? 
                             <img src={getParticipantInfo(selectedChat).photo} className="w-full h-full object-cover" /> : 
                             getParticipantInfo(selectedChat).avatar
                           }
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-slate-900">{getParticipantInfo(selectedChat).name}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{getParticipantInfo(selectedChat).role}</p>
                        </div>
                     </div>

                     {getParticipantInfo(selectedChat).role === 'Borrower' && (
                       <div className="space-y-6">
                          <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2">Portfolio Details</h5>
                          <SummaryRow label="Active Loan" value="R --" />
                          <SummaryRow label="Outstanding" value="R --" color="text-rose-500" />
                          <SummaryRow label="Payment Health" value="Stable" color="text-emerald-500" />
                          <SummaryRow label="Status" value={getParticipantInfo(selectedChat).status} />
                       </div>
                     )}
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
