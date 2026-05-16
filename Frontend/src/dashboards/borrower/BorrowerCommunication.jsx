import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, Paperclip, Search,
  Filter, MoreVertical, Phone, Info,
  Check, CheckCheck, Clock, User,
  ShieldCheck, Headset, Crown, RefreshCw,
  Plus, Eye, Upload, FileText, X,
  ChevronRight, Bookmark, ArrowRight,
  Zap, MessageCircle, MoreHorizontal,
  Smile, CheckCircle2, ShieldAlert, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';

import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { format } from 'date-fns';
import api from '../../services/api';

const BorrowerCommunication = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoanDrawerOpen, setIsLoanDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typingStatus, setTypingStatus] = useState(null);
  const chatContainerRef = useRef(null);
  const { socket } = useSocket();
  const [currentUser, setCurrentUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  useEffect(() => {
    fetchConversations();
    fetchParticipants();
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (isNewChatModalOpen) {
      fetchParticipants();
    }
  }, [isNewChatModalOpen]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      if (socket) {
        socket.emit('join-conversation', selectedChat._id);
      }
    }
  }, [selectedChat, socket]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (newMessage) => {
        const convId = newMessage.conversationId?.toString();
        const selectedId = selectedChat?._id?.toString();

        if (selectedChat && convId === selectedId) {
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.find(m => m._id === newMessage._id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
          setTimeout(scrollToBottom, 100);
          markAsRead(selectedChat._id);
        }
        // Update conversation list for sidebar
        fetchConversations();
      };

      // Listen for all variants of message events for maximum compatibility
      socket.on('message-received', handleNewMessage);
      socket.on('message:received', handleNewMessage);
      socket.on('receiveMessage', handleNewMessage);
      socket.on('receive_message', handleNewMessage);

      socket.on('message-notification', (data) => {
        const convId = data.conversationId?.toString();
        const selectedId = selectedChat?._id?.toString();

        if (!selectedChat || convId !== selectedId) {
          toast.success(`New message from ${data.senderName}`, {
            icon: '💬',
            duration: 4000
          });
          fetchConversations();
        }
      });

      socket.on('conversation-updated', (data) => {
        fetchConversations();
      });

      socket.on('new-notification', (data) => {
        fetchConversations();
      });

      socket.on('typing-status', (data) => {
        const convId = data.conversationId?.toString();
        const selectedId = selectedChat?._id?.toString();
        const uid = currentUser?._id?.toString() || currentUser?.id?.toString();

        if (selectedChat && convId === selectedId && data.userId?.toString() !== uid) {
          setTypingStatus(data.isTyping ? data : null);
        }
      });

      socket.on('messages-read', (data) => {
        const convId = data.conversationId?.toString();
        const selectedId = selectedChat?._id?.toString();

        if (selectedChat && convId === selectedId) {
          setMessages(prev => prev.map(m => {
            const senderId = (m.senderId?._id || m.senderId)?.toString();
            return senderId !== data.userId?.toString() ? { ...m, isRead: true } : m;
          }));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('message-received');
        socket.off('message:received');
        socket.off('receiveMessage');
        socket.off('receive_message');
        socket.off('message-notification');
        socket.off('conversation-updated');
        socket.off('new-notification');
        socket.off('typing-status');
        socket.off('messages-read');
      }
    };
  }, [socket, selectedChat, currentUser]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/borrower/communications/conversations');
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      setLoading(true);
      const response = await api.get(`/borrower/communications/conversations/${convId}/messages`);
      if (response.data.success) {
        setMessages(response.data.data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (convId) => {
    try {
      await api.patch('/borrower/communications/messages/read', { conversationId: convId });
      if (socket) {
        socket.emit('mark-messages-read', { conversationId: convId, userId: currentUser?._id || currentUser?.id });
      }
      // Refresh sidebar to clear badges
      fetchConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const fetchParticipants = async () => {
    try {
      setParticipantsLoading(true);
      const response = await api.get('/borrower/communications/participants');
      if (response.data.success) {
        setParticipants(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleStartConversation = async (participantId) => {
    try {
      const response = await api.post('/borrower/communications/conversations/start', {
        participantId
      });
      if (response.data.success) {
        const newConv = response.data.data;
        setConversations(prev => {
          const exists = prev.find(c => c._id === newConv._id);
          if (exists) return prev;
          return [newConv, ...prev];
        });
        setSelectedChat(newConv);
        setIsNewChatModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const msgText = message;
    setMessage('');

    try {
      const response = await api.post('/borrower/communications/messages/send', {
        conversationId: selectedChat._id,
        message: msgText,
        messageType: 'text'
      });

      if (response.data.success) {
        const newMessage = response.data.data;
        // Optimistic update (with deduplication in socket listener)
        setMessages(prev => {
          const exists = prev.find(m => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        setTimeout(scrollToBottom, 100);
        fetchConversations(); // Update sidebar

        if (socket) {
          socket.emit('typing-stop', { conversationId: selectedChat._id, userId: currentUser?._id || currentUser?.id });
        }
      }
    } catch (error) {
      toast.error('Failed to send message');
      setMessage(msgText);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('conversationId', selectedChat._id);
      formData.append('attachment', file);
      formData.append('message', `Attached a file: ${file.name}`);

      toast.loading('Uploading file...');
      const response = await api.post('/borrower/communications/messages/send', formData);
      toast.dismiss();

      if (response.data.success) {
        setIsUploadModalOpen(false);
        toast.success('File sent');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Upload failed');
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (socket && selectedChat) {
      socket.emit('typing-start', {
        conversationId: selectedChat._id,
        userId: currentUser?._id,
        userName: currentUser?.fullName
      });

      // Stop typing after 3 seconds of inactivity
      if (window.typingTimeout) clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socket.emit('typing-stop', { conversationId: selectedChat._id, userId: currentUser?._id });
      }, 3000);
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(p => p._id?.toString() !== currentUser?._id?.toString());
  };

  // Unified contact list: 
  // 1. First, include everyone the borrower already has a conversation with
  const conversationPartners = conversations.map(c => {
    const partner = c.chatPartner || getOtherParticipant(c);
    if (!partner) return null;
    return {
      ...partner,
      conversation: c
    };
  }).filter(Boolean);

  // 2. Then, add authorized participants who don't have a conversation yet
  const potentialPartners = participants.filter(p =>
    !conversations.some(c => {
      const partner = c.chatPartner || getOtherParticipant(c);
      return partner?._id?.toString() === p._id?.toString();
    })
  ).map(p => ({
    ...p,
    conversation: null
  }));

  const mergedContacts = [...conversationPartners, ...potentialPartners];

  const filteredContacts = activeFilter === 'All'
    ? mergedContacts
    : mergedContacts.filter(c => c.role?.toLowerCase() === activeFilter.toLowerCase());

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
          {filteredContacts.length > 0 ? (
            filteredContacts.map(contact => {
              const conv = contact.conversation;
              const isSelected = conv && selectedChat?._id === conv._id;
              return (
                <button
                  key={contact._id}
                  onClick={() => conv ? setSelectedChat(conv) : handleStartConversation(contact._id)}
                  className={cn(
                    "w-full p-5 rounded-[2rem] flex items-center gap-4 transition-all group relative border-l-4 text-left",
                    isSelected ? "bg-primary/5 border-primary shadow-sm" : "border-transparent hover:bg-slate-50"
                  )}
                >
                  <div className="relative">
                    <UserAvatar user={contact} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-black text-slate-900 truncate tracking-tight group-hover:text-primary transition-colors">
                        {contact.fullName}
                      </h4>
                      {conv?.lastMessageAt && (
                        <span className="text-[9px] font-bold text-slate-400">
                          {format(new Date(conv.lastMessageAt), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{contact.role}</p>
                    <p className="text-[11px] font-medium text-slate-500 truncate">
                      {conv?.lastMessage || 'Tap to start conversation'}
                    </p>
                  </div>
                  {(() => {
                    const uid = currentUser?._id || currentUser?.id;
                    const unread = conv?.unreadCounts?.[uid] || 0;
                    if (unread > 0) {
                      return (
                        <div className="w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse shrink-0">
                          {unread}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </button>
              );
            })
          ) : (
            <div className="py-16 text-center space-y-2 px-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Contacts Yet</p>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                Your assigned agent and staff will appear here once your loan application is assigned.
              </p>
            </div>
          )}
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
                <UserAvatar user={getOtherParticipant(selectedChat)} textClass="text-xs" />
                <div>
                  <h3 className="text-md font-black text-slate-900 tracking-tight">{getOtherParticipant(selectedChat)?.fullName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{getOtherParticipant(selectedChat)?.role} • active</p>
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
                <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Today, {format(new Date(), 'dd MMM yyyy')}</span>
              </div>

              {messages.map((msg, i) => (
                <motion.div
                  key={msg._id || i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex flex-col gap-2 max-w-[80%]",
                    (() => {
                      const senderId = (msg.senderId?._id || msg.senderId)?.toString();
                      const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
                      return senderId === currentUserId;
                    })() ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-5 rounded-[2rem] text-sm font-medium shadow-sm leading-relaxed relative",
                    (() => {
                      const senderId = (msg.senderId?._id || msg.senderId)?.toString();
                      const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
                      return senderId === currentUserId;
                    })() ? "bg-primary text-white rounded-tr-none shadow-primary/10" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                  )}>
                    {msg.message}
                    {(msg.attachment || msg.attachmentUrl) && (
                      <div className={cn(
                        "mt-4 p-4 rounded-2xl flex items-center gap-4 border",
                        (() => {
                          const senderId = (msg.senderId?._id || msg.senderId)?.toString();
                          const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
                          return senderId === currentUserId;
                        })() ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileText size={18} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black truncate">{msg.attachmentName || 'Attachment'}</p>
                          <p className="text-[9px] font-bold uppercase opacity-60 tracking-widest">FILE</p>
                        </div>
                        <button
                          onClick={() => window.open(msg.attachment || msg.attachmentUrl, '_blank')}
                          className="p-2 hover:bg-black/5 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}</span>
                    {(() => {
                      const senderId = (msg.senderId?._id || msg.senderId)?.toString();
                      const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
                      return senderId === currentUserId;
                    })() && (
                      <CheckCheck size={12} className={msg.isRead ? "text-primary" : "text-slate-300"} />
                    )}
                  </div>
                </motion.div>
              ))}

              {typingStatus && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">{typingStatus.userName} is typing...</span>
                </div>
              )}
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
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Contacts</p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {participantsLoading ? (
                      <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
                    ) : participants.filter(p => p.fullName?.toLowerCase().includes(participantSearch.toLowerCase())).length > 0 ?
                      participants.filter(p => p.fullName?.toLowerCase().includes(participantSearch.toLowerCase())).map((user) => (
                        <button
                          key={user._id}
                          onClick={() => handleStartConversation(user._id)}
                          className="w-full p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-50 transition-all text-left border border-slate-100 group"
                        >
                          <UserAvatar user={user} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{user.fullName}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-all" />
                        </button>
                      )) : (
                        <p className="text-center py-10 text-slate-400 text-xs font-medium">No contacts found.</p>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <Button variant="secondary" onClick={() => setIsNewChatModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Close</Button>
              </div>
            </div>
          </Modal>
        )}

        {/* UPLOAD MODAL */}
        {isUploadModalOpen && (
          <Modal isOpen onClose={() => setIsUploadModalOpen(false)} title="Upload File Attachment">
            <div className="space-y-8">
              <div className="p-10 border-2 border-dashed border-slate-100 bg-slate-50/50 rounded-[2.5rem] text-center space-y-4 group hover:border-primary/20 transition-all cursor-pointer relative">
                <input
                  type="file"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
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

// Resolves profilePhoto regardless of whether it's stored as a string URL or {url} object
const getPhotoUrl = (user) => {
  if (!user?.profilePhoto) return null;
  if (typeof user.profilePhoto === 'string' && user.profilePhoto !== 'no-photo.jpg') return user.profilePhoto;
  if (user.profilePhoto?.url && user.profilePhoto.url !== 'no-photo.jpg') return user.profilePhoto.url;
  return null;
};

const ROLE_COLOR = {
  agent: 'bg-blue-50 text-blue-600',
  staff: 'bg-emerald-50 text-emerald-600',
  admin: 'bg-primary/5 text-primary',
};

const UserAvatar = ({ user, sizeClass = 'w-12 h-12', radiusClass = 'rounded-2xl', textClass = 'text-sm' }) => {
  const photoUrl = getPhotoUrl(user);
  const initials = (user?.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colorClass = ROLE_COLOR[user?.role] || 'bg-primary/5 text-primary';
  if (photoUrl) {
    return <img src={photoUrl} alt={user?.fullName || ''} className={cn(sizeClass, radiusClass, 'object-cover shrink-0')} />;
  }
  return (
    <div className={cn(sizeClass, radiusClass, 'flex items-center justify-center font-black shrink-0', textClass, colorClass)}>
      {initials}
    </div>
  );
};

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
