import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Paperclip, Search, 
  MoreVertical, Headset, Crown, RefreshCw,
  Plus, Eye, Upload, FileText, X,
  ChevronRight, ArrowRight, Smile, 
  CheckCircle2, ShieldAlert, UserCog,
  Users, AlertCircle, CheckCheck, Mail, ShieldCheck, User, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';
import apiClient from '../../services/apiClient';
import staffCommunicationService from '../../services/staffCommunicationService';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../../socket/socketClient';

// Clean Fintech Timestamp Utility: Handles 'Today', 'Yesterday', and formatted dates
const formatChatTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  
  if (date >= startOfToday) {
    return timeStr;
  } else if (date >= startOfYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  }
};

const formatDetailedDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
};

const popularEmojis = ['😊', '👍', '🙏', '✅', '⚠️', '🚨', '⏰', '🔥', '💼', '💳', '💵', '💹', '📣', '❤️', '😂', '🤔', '👏', '🤝', '🎉', '🚀'];

const CommunicationLogs = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // User lists & Loading States
  const [onlinePeers, setOnlinePeers] = useState([]); 
  const [usersList, setUsersList] = useState([]); // Full peers directory for new chat
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Modal States
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSnapshotDrawerOpen, setIsSnapshotDrawerOpen] = useState(false);
  
  // Target role and user for new chat creation
  const [newChatRole, setNewChatRole] = useState('Borrower');
  const [newChatTargetId, setNewChatTargetId] = useState('');
  const [newChatInitialMsg, setNewChatInitialMsg] = useState('');

  // Typing state tracked locally
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [typingTimeoutRef, setTypingTimeoutRef] = useState(null);

  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [socket, setSocket] = useState(null);

  // Global listener to hide emoji picker on external clicks
  useEffect(() => {
    const closeMenu = () => {
      setShowEmojiPicker(false);
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // 1. Fetch conversations index on load or on filter/search adjustments
  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoadingConversations(true);
      const res = await staffCommunicationService.getConversations({
        search: searchQuery,
        conversationType: activeFilter === 'All' ? null : activeFilter
      });
      
      if (res.success) {
        // Merge with live online statuses from state
        const updated = res.data.map(c => ({
          ...c,
          onlineStatus: onlinePeers.includes(c.participantId) ? 'online' : 'offline'
        }));
        setConversations(updated);
      }
    } catch (err) {
      console.error('Conversations load error:', err);
      if (!silent) toast.error('Failed to load conversation workspace.');
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  // 2. Fetch specific messages when a conversation is selected
  const fetchMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      const res = await staffCommunicationService.getConversationMessages(conversationId);
      if (res.success) {
        setMessages(res.data.messages);
        
        // Clear unread counts locally and in backend
        await staffCommunicationService.markConversationRead(conversationId);
        
        // Emit Read signal via Socket
        if (socket) {
          socket.emit('markRead', { conversationId, userId: currentUser._id });
        }

        // Reflect updated status locally on the sidebar without refetching all
        setConversations(prev => prev.map(c => 
          c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch (err) {
      console.error('Messages stream error:', err);
      toast.error('Failed to hydrate message history.');
    } finally {
      setLoadingMessages(false);
      scrollToBottom();
    }
  };

  // 3. Load available peers for creating new chats
  const fetchPeersDirectory = async () => {
    try {
      const res = await staffCommunicationService.getOnlineUsers();
      if (res.success) {
        setUsersList(res.data);
      }
    } catch (err) {
      console.error('Directory error:', err);
    }
  };

  // Auto-scroll Chat Area
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  // Debounced fetch on query or tab selection
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchConversations();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, activeFilter]);

  // Refresh when active chat changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.conversationId);
      
      // Join Socket Room
      if (socket) {
        socket.emit('joinConversation', selectedChat.conversationId);
      }
    } else {
      setMessages([]);
    }
    setIsPeerTyping(false);
  }, [selectedChat?.conversationId, socket]);

  // 0. Bootstrap & Establish Socket.IO Connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const sock = initiateSocketConnection(token);
      setSocket(sock);
    }
    
    return () => {
      const activeSocket = getSocket();
      if (activeSocket) {
        activeSocket.off('userOnline');
        activeSocket.off('userOffline');
        activeSocket.off('userTyping');
        activeSocket.off('receiveMessage');
        activeSocket.off('receive_message');
        activeSocket.off('conversationUpdated');
      }
      disconnectSocket();
    };
  }, []);

  // Hydrate directories on mounts
  useEffect(() => {
    fetchPeersDirectory();
  }, []);

  // Initialize socket hooks and live syncing listeners
  useEffect(() => {
    if (!socket) return;

    // Broadcast user online
    socket.emit('userOnline', { userId: currentUser._id });

    // Listen to user connection states
    const handleUserOnline = (payload) => {
      if (payload?.userId) {
        setOnlinePeers(prev => prev.includes(payload.userId) ? prev : [...prev, payload.userId]);
        setConversations(prev => prev.map(c => 
          c.participantId === payload.userId ? { ...c, onlineStatus: 'online' } : c
        ));
      }
    };

    const handleUserOffline = (payload) => {
      if (payload?.userId) {
        setOnlinePeers(prev => prev.filter(id => id !== payload.userId));
        setConversations(prev => prev.map(c => 
          c.participantId === payload.userId ? { ...c, onlineStatus: 'offline' } : c
        ));
      }
    };

    // Listen to Typing Indications
    const handleTyping = (payload) => {
      if (selectedChat && payload.conversationId === selectedChat.conversationId && payload.userId !== currentUser._id) {
        setIsPeerTyping(payload.isTyping);
      }
    };

    // Listen to New Messages arriving in real-time
    const handleReceiveMessage = (payload) => {
      if (!payload) return;

      // Bridge normalization between Staff DTO format and Raw Mongo objects from pre-existing Admin emitters
      const normalizedMsg = {
        messageId: payload.messageId || payload._id,
        conversationId: payload.conversationId,
        senderId: typeof payload.senderId === 'object' ? payload.senderId?._id : (payload.senderId || payload.senderId),
        senderName: payload.senderName || (payload.senderId?.fullName) || 'Platform Admin',
        senderPhoto: payload.senderPhoto || (payload.senderId?.profilePhoto) || 'no-photo.jpg',
        message: payload.message || payload.messageText || '',
        attachments: payload.attachments || (payload.attachmentUrl ? [payload.attachmentUrl] : []),
        createdAt: payload.createdAt || new Date()
      };

      const targetConvId = normalizedMsg.conversationId?.toString();
      const activeConvId = selectedChat?.conversationId?.toString();

      // If inside current opened chat, append and scroll
      if (activeConvId && targetConvId === activeConvId) {
        setMessages(prev => {
          // Strict De-duplication — use toString() to safely handle ObjectID vs String type differences
          if (prev.some(m => m.messageId?.toString() === normalizedMsg.messageId?.toString())) return prev;
          return [...prev, normalizedMsg];
        });
        scrollToBottom();
        
        // Immediate Mark Read since user is in room
        staffCommunicationService.markConversationRead(activeConvId).catch(() => {});
      }

      // In all cases, trigger a silent refresh of the list to update order and last messages
      fetchConversations(true);
    };

    // Generic conversations and reads broadcasts
    const handleConversationUpdated = () => {
      fetchConversations(true);
    };

    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('userTyping', handleTyping);
    
    // Support both camelCase (Staff standard) and snake_case (Admin standard) events
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('conversationUpdated', handleConversationUpdated);

    // Dynamic custom targeted hooks emitted to this User directly
    socket.on(`receiveMessage_${currentUser._id}`, handleReceiveMessage);
    socket.on(`receive_message_${currentUser._id}`, handleReceiveMessage);
    socket.on(`conversationUpdated_${currentUser._id}`, handleConversationUpdated);

    return () => {
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('userTyping', handleTyping);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('conversationUpdated', handleConversationUpdated);
      socket.off(`receiveMessage_${currentUser._id}`, handleReceiveMessage);
      socket.off(`receive_message_${currentUser._id}`, handleReceiveMessage);
      socket.off(`conversationUpdated_${currentUser._id}`, handleConversationUpdated);
    };
  }, [socket, selectedChat, onlinePeers]);

  // Handle Dispatch Message Execution
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;

    try {
      setSendingMessage(true);
      const payload = { message: messageText };
      
      // Optimistic append (optional, but let's rely on the server response which appends perfectly)
      const res = await staffCommunicationService.sendMessage(selectedChat.conversationId, payload);
      
      if (res.success) {
        setMessageText('');
        // Do NOT manually append here — the socket broadcast 'receiveMessage'
        // will deliver it back to this client, and handleReceiveMessage will append
        // it exactly once (guarded by the de-duplication check).
        scrollToBottom();

        // Force stop typing broadcast
        if (socket) {
          socket.emit('stopTyping', { conversationId: selectedChat.conversationId, userId: currentUser._id });
        }

        // Refresh left bar
        fetchConversations(true);
      }
    } catch (err) {
      toast.error('Message failed to send.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Typing broadcast logic with debounce
  const handleInputKeyPress = () => {
    if (!socket || !selectedChat) return;

    // Emit typing
    socket.emit('typing', { 
      conversationId: selectedChat.conversationId, 
      userId: currentUser._id, 
      userName: currentUser.fullName 
    });

    // Clear previous stop timeout
    if (typingTimeoutRef) clearTimeout(typingTimeoutRef);

    // Set stop timeout to 2 seconds after last keypress
    const timeout = setTimeout(() => {
      socket.emit('stopTyping', { conversationId: selectedChat.conversationId, userId: currentUser._id });
    }, 2000);
    setTypingTimeoutRef(timeout);
  };

  // Handle generic Attachment Upload through standard /upload route
  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Attachment must be PNG, JPG, or PDF format.');
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      // Call direct system upload endpoint
      const uploadRes = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data && uploadRes.data.success) {
        const fileUrl = uploadRes.data.data.url;
        
        // Immediately send a message containing this attachment link
        const msgPayload = { 
          message: `Sent an attachment: ${file.name}`, 
          attachment: fileUrl 
        };

        const res = await staffCommunicationService.sendMessage(selectedChat.conversationId, msgPayload);
        if (res.success) {
          setMessages(prev => [...prev, res.data]);
          scrollToBottom();
          toast.success('Attachment sent.');
          fetchConversations(true);
        }
      }
    } catch (err) {
      toast.error('Failed to upload file.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Start New Chat Thread Action Execution
  const handleStartNewChat = async () => {
    if (!newChatTargetId) {
      toast.error('Please select a recipient.');
      return;
    }
    if (!newChatInitialMsg.trim()) {
      toast.error('Initial message is required to start a thread.');
      return;
    }

    try {
      const res = await staffCommunicationService.createConversation({
        targetUserId: newChatTargetId,
        targetRole: newChatRole,
        initialMessage: newChatInitialMsg
      });

      if (res.success) {
        setIsNewChatModalOpen(false);
        setNewChatInitialMsg('');
        setNewChatTargetId('');
        toast.success('Workspace initialized.');
        
        // Force conversation reload and find the new one to set active
        const listRes = await staffCommunicationService.getConversations();
        if (listRes.success) {
          setConversations(listRes.data);
          const found = listRes.data.find(c => c.conversationId === res.data.conversationId);
          if (found) {
            setSelectedChat(found);
          }
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create conversation.');
    }
  };

  // Computed list of available target users filtered by selected Group in Modal
  const filteredAvailableUsers = usersList.filter(u => 
    u.role.toLowerCase() === newChatRole.toLowerCase()
  );

  // Fallback avatar initial parser
  const getAvatarInitials = (name) => {
    if (!name) return '?';
    const split = name.trim().split(/\s+/);
    if (split.length > 1) {
      return `${split[0][0]}${split[split.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 overflow-hidden -mt-6">
      {/* LEFT PANEL: CONVERSATION LIST */}
      <section className="w-full md:w-80 lg:w-96 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden shrink-0">
        <div className="p-8 border-b border-slate-50 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Staff Logs</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational & Borrower Chats</p>
            </div>
            <button 
              onClick={() => fetchConversations()} 
              title="Sync inbox"
              className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all active:rotate-180 duration-300"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..." 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-2xl overflow-x-auto no-scrollbar">
            {['All', 'Borrower', 'Agent', 'Admin', 'Staff'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeFilter === filter ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Cards Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-slate-50/30">
          {loadingConversations ? (
            // Skeleton loader for Conversations
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] flex gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between"><div className="h-3 w-24 bg-slate-100 rounded" /><div className="h-2 w-8 bg-slate-50 rounded" /></div>
                  <div className="h-2 w-16 bg-slate-50 rounded" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded" />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-3 p-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                <MessageSquare size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No discussions found</p>
            </div>
          ) : (
            conversations.map(chat => (
              <button
                key={chat.conversationId}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "w-full p-5 rounded-[2rem] flex items-center gap-4 transition-all group relative border-l-4 bg-white border border-slate-100/60 shadow-sm",
                  selectedChat?.conversationId === chat.conversationId 
                    ? "border-l-primary bg-primary/[0.02] shadow" 
                    : "border-l-transparent hover:bg-slate-50"
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-sm text-white overflow-hidden bg-gradient-to-br",
                    chat.conversationType === 'Borrower' ? "from-blue-500 to-indigo-600" :
                    chat.conversationType === 'Admin' ? "from-slate-800 to-slate-950" :
                    chat.conversationType === 'Agent' ? "from-amber-500 to-orange-600" :
                    "from-emerald-500 to-teal-600"
                  )}>
                    {chat.participantPhoto && chat.participantPhoto !== 'no-photo.jpg' && !chat.participantPhoto.includes('placeholder') ? (
                      <img src={chat.participantPhoto} alt={chat.participantName} className="w-full h-full object-cover" />
                    ) : (
                      getAvatarInitials(chat.participantName)
                    )}
                  </div>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                    chat.onlineStatus === 'online' 
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                      : "bg-slate-300"
                  )} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-black text-slate-900 truncate tracking-tight group-hover:text-primary transition-colors">{chat.participantName}</h4>
                    <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-2">{formatChatTime(chat.lastMessageTime)}</span>
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{chat.participantRole}</p>
                  <p className={cn(
                    "text-[11px] truncate leading-relaxed",
                    chat.unreadCount > 0 ? "font-extrabold text-slate-900" : "font-medium text-slate-500"
                  )}>
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse shrink-0">
                    {chat.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
        
        <div className="p-6 border-t border-slate-50">
           <Button 
             onClick={() => setIsNewChatModalOpen(true)} 
             className="w-full flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest py-4 shadow-lg shadow-primary/20"
           >
              <Plus size={16} /> New Conversation
           </Button>
        </div>
      </section>

      {/* RIGHT PANEL: CHAT WORKSPACE */}
      <section className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden relative">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAttachmentUpload} 
          className="hidden"
          accept=".pdf, image/png, image/jpeg, image/jpg" 
        />

        {selectedChat ? (
          <>
            {/* CHAT PANEL HEADER */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner text-white overflow-hidden bg-gradient-to-br",
                  selectedChat.conversationType === 'Borrower' ? "from-blue-500 to-indigo-600" :
                  selectedChat.conversationType === 'Admin' ? "from-slate-800 to-slate-950" :
                  selectedChat.conversationType === 'Agent' ? "from-amber-500 to-orange-600" :
                  "from-emerald-500 to-teal-600"
                )}>
                  {selectedChat.participantPhoto && selectedChat.participantPhoto !== 'no-photo.jpg' ? (
                    <img src={selectedChat.participantPhoto} alt={selectedChat.participantName} className="w-full h-full object-cover" />
                  ) : (
                    getAvatarInitials(selectedChat.participantName)
                  )}
                </div>
                <div>
                  <h3 className="text-md font-black text-slate-900 tracking-tight">{selectedChat.participantName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", selectedChat.onlineStatus === 'online' ? "bg-emerald-500" : "bg-slate-300")} />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedChat.participantRole} • {selectedChat.onlineStatus === 'online' ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSnapshotDrawerOpen(true)} 
                  className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all" 
                  title="View Quick Snapshot"
                >
                  <Eye size={18} />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* MESSAGES AREA */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-6 bg-slate-50/20 flex flex-col">
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading Stream...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8 space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Start of conversation history</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isOutgoing = msg.senderId === currentUser._id;
                    const showDateDivider = i === 0 || formatDetailedDate(messages[i - 1].createdAt) !== formatDetailedDate(msg.createdAt);
                    const hasAttachments = msg.attachments && msg.attachments.length > 0;

                    return (
                      <React.Fragment key={msg.messageId || i}>
                        {showDateDivider && (
                          <div className="flex justify-center my-6">
                            <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                              {formatDetailedDate(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <motion.div 
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={cn(
                            "flex flex-col gap-1 max-w-[70%]",
                            isOutgoing ? "ml-auto items-end" : "mr-auto items-start"
                          )}
                        >
                          {!isOutgoing && (
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1.5 flex items-center gap-1">
                              {msg.senderName}
                            </span>
                          )}
                          
                          <div className={cn(
                            "p-4.5 px-5 rounded-[1.8rem] text-sm font-medium leading-relaxed shadow-sm break-words relative",
                            isOutgoing 
                              ? "bg-primary text-white rounded-tr-none shadow-primary/5" 
                              : "bg-white text-slate-700 border border-slate-100/80 rounded-tl-none"
                          )}>
                            {msg.message}

                            {/* Embed Attachment Preview */}
                            {hasAttachments && (
                              <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                                {msg.attachments.map((att, attIdx) => {
                                  const isPdf = att.toLowerCase().includes('.pdf');
                                  return (
                                    <a 
                                      key={attIdx}
                                      href={att} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={cn(
                                        "flex items-center gap-3 p-2 rounded-xl border hover:scale-[1.02] transition-transform",
                                        isOutgoing 
                                          ? "bg-white/10 border-white/20 text-white" 
                                          : "bg-slate-50 border-slate-100 text-slate-700"
                                      )}
                                    >
                                      <FileText size={16} className={isOutgoing ? "text-white" : "text-primary"} />
                                      <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[10px] font-bold truncate">Attached Asset #{attIdx+1}</p>
                                        <p className="text-[8px] opacity-80 uppercase tracking-widest font-black">{isPdf ? 'PDF DOCUMENT' : 'IMAGE ATTACHMENT'}</p>
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 px-1">
                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            {isOutgoing && (
                              <CheckCheck 
                                size={12} 
                                className={msg.readBy?.length > 0 || msg.isRead ? "text-primary" : "text-slate-300"} 
                                title={msg.readBy?.length > 0 || msg.isRead ? 'Read' : 'Delivered'}
                              />
                            )}
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </>
              )}
              
              {/* Typing Indicator */}
              <AnimatePresence>
                {isPeerTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-white/80 border border-slate-100 p-3 px-4.5 rounded-[1.25rem] w-fit self-start shadow-sm mt-2 ml-1"
                  >
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      {selectedChat.participantName} is typing
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                      </span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MESSAGE INPUT REGION */}
            <div className="p-8 border-t border-slate-50 bg-white shrink-0 space-y-6">
              {/* Pre-built templates for rapid fintech operation feedback */}
              <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
                <QuickTemplate label="Document Request" onClick={() => setMessageText("SYSTEM NOTICE: Please upload your latest bank statement for review.")} />
                <QuickTemplate label="Verification Done" onClick={() => setMessageText("SUCCESS: Your payment verification is complete.")} />
                <QuickTemplate label="EMI Reminder" onClick={() => setMessageText("REMINDER: Your EMI payment is due within 48 hours.")} />
                <QuickTemplate label="Staff Update" onClick={() => setMessageText("OPERATIONAL: Application status updated for internal review.")} />
              </div>

              <form onSubmit={handleSendMessage} className="flex items-end gap-4">
                <div className="flex-1 relative flex items-center bg-slate-50 rounded-[2rem] px-2 shadow-inner border border-slate-100">
                  
                  {/* Custom Floating Emoji Picker */}
                  {showEmojiPicker && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="absolute bottom-full left-4 mb-4 bg-white border border-slate-100 rounded-2xl shadow-premium p-3.5 grid grid-cols-5 gap-2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200 w-64 border-solid border"
                    >
                      <div className="col-span-5 pb-2 border-b border-slate-50 mb-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-left">Quick Reaction Toolkit</p>
                      </div>
                      {popularEmojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setMessageText(prev => prev + emoji);
                          }}
                          className="w-9 h-9 flex items-center justify-center text-lg hover:bg-slate-50 active:scale-90 rounded-xl transition-all cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className="p-3 text-slate-400 hover:text-primary transition-colors shrink-0 cursor-pointer"
                  >
                    <Smile size={20} />
                  </button>
                  
                  <textarea 
                    value={messageText}
                    onKeyDown={handleInputKeyPress}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type operational instruction or message..."
                    disabled={sendingMessage || uploadingFile}
                    className="flex-1 bg-transparent border-none py-4 text-sm font-medium text-slate-700 outline-none transition-all resize-none min-h-[56px] max-h-32 custom-scrollbar placeholder-slate-400"
                    rows={1}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!messageText.trim() || sendingMessage || uploadingFile}
                  className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shrink-0"
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={22} />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Blank state illustration */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 bg-slate-50/10">
            <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <Headset size={48} />
            </div>
            <div className="max-w-xs space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Staff Support Logs</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Collaborate with the team and assist borrowers. Select an active thread to start.</p>
            </div>
            <Button 
              onClick={() => setIsNewChatModalOpen(true)} 
              className="font-black uppercase text-[10px] tracking-widest px-10 py-4 shadow-lg shadow-primary/20"
            >
               New Message
            </Button>
          </div>
        )}
      </section>

      {/* MODAL DIALOGS & SLIDE DRAWERS */}
      <AnimatePresence>
         {/* NEW CHAT INITIATOR MODAL */}
         {isNewChatModalOpen && (
            <Modal isOpen onClose={() => setIsNewChatModalOpen(false)} title="Start New Operational Chat" maxWidth="max-w-xl">
               <div className="space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Recipient Group</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           {['Borrower', 'Agent', 'Staff', 'Admin'].map(role => (
                              <button 
                                key={role} 
                                onClick={() => {
                                  setNewChatRole(role);
                                  setNewChatTargetId('');
                                }}
                                className={cn(
                                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group",
                                  newChatRole === role 
                                    ? "border-primary bg-primary/5 shadow-sm" 
                                    : "border-slate-50 hover:border-slate-200 hover:bg-slate-50/50"
                                )}
                              >
                                 <div className={cn(
                                   "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors",
                                   newChatRole === role ? "bg-white text-primary" : "bg-slate-50 text-slate-400 group-hover:text-slate-700"
                                 )}>
                                    {role === 'Admin' ? <ShieldCheck size={20} /> : role === 'Staff' ? <UserCog size={20} /> : role === 'Agent' ? <Headset size={20} /> : <User size={20} />}
                                 </div>
                                 <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest",
                                   newChatRole === role ? "text-primary" : "text-slate-600"
                                 )}>{role}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Recipient</p>
                        <select 
                          value={newChatTargetId}
                          onChange={(e) => setNewChatTargetId(e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-inner"
                        >
                           <option value="">Select a user...</option>
                           {filteredAvailableUsers.map(u => (
                             <option key={u.userId} value={u.userId}>{u.name} ({u.role})</option>
                           ))}
                        </select>
                     </div>

                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Message</p>
                        <textarea 
                          value={newChatInitialMsg}
                          onChange={(e) => setNewChatInitialMsg(e.target.value)}
                          placeholder="Type your instruction or borrower update..." 
                          className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none shadow-inner placeholder-slate-400" 
                        />
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                     <Button variant="secondary" onClick={() => setIsNewChatModalOpen(false)} className="flex-1 font-black uppercase text-[10px] border border-slate-200">Cancel</Button>
                     <Button 
                       onClick={handleStartNewChat}
                       disabled={!newChatTargetId || !newChatInitialMsg.trim()}
                       className="flex-1 font-black uppercase text-[10px] shadow-lg shadow-primary/20"
                     >
                       Send Message
                     </Button>
                  </div>
               </div>
            </Modal>
         )}

         {/* SIDEBAR SNAPSHOT DRAWER */}
         {isSnapshotDrawerOpen && selectedChat && (
            <>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSnapshotDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Support Snapshot</h3>
                     <button onClick={() => setIsSnapshotDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                     <div className="text-center space-y-4 pb-6 border-b border-slate-50">
                        <div className={cn(
                          "w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-3xl font-black mx-auto shadow-xl border-4 border-white text-white overflow-hidden bg-gradient-to-br",
                          selectedChat.conversationType === 'Borrower' ? "from-blue-500 to-indigo-600" :
                          selectedChat.conversationType === 'Admin' ? "from-slate-800 to-slate-950" :
                          selectedChat.conversationType === 'Agent' ? "from-amber-500 to-orange-600" :
                          "from-emerald-500 to-teal-600"
                        )}>
                           {selectedChat.participantPhoto && selectedChat.participantPhoto !== 'no-photo.jpg' ? (
                             <img src={selectedChat.participantPhoto} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                             getAvatarInitials(selectedChat.participantName)
                           )}
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-slate-900 tracking-tight">{selectedChat.participantName}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedChat.participantRole}</p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-slate-600 shadow-inner">
                          <div className={cn("w-1.5 h-1.5 rounded-full", selectedChat.onlineStatus === 'online' ? "bg-emerald-500 animate-ping" : "bg-slate-400")} />
                          {selectedChat.onlineStatus === 'online' ? 'Active' : 'Disconnected'}
                        </div>
                     </div>

                     {/* Interaction Logs & Audit timeline mockup */}
                     <div className="space-y-6">
                        <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2">Interaction Timeline</h5>
                        <TimelineItem icon={Mail} title="Workspace Established" date="Operational Log" type="System" />
                        <TimelineItem icon={ShieldCheck} title="Identity Verified" date="Verified Record" type="Staff" />
                        <TimelineItem icon={Clock} title="Real-Time Connection Active" date="Monitoring" type="Operational" color="amber" />
                     </div>
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- AUXILIARY COMPONENTS ---

const QuickTemplate = ({ label, onClick }) => (
   <button 
      type="button"
      onClick={onClick}
      className="px-4 py-2 bg-slate-50 hover:bg-primary/5 hover:text-primary rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 transition-all whitespace-nowrap shadow-sm active:scale-95"
   >
      {label}
   </button>
);

const TimelineItem = ({ icon: Icon, title, date, type, color = "navy" }) => (
  <div className="flex gap-5 relative group">
    <div className={cn(
      "w-7 h-7 rounded-xl flex items-center justify-center relative z-10 shadow-sm",
      color === 'amber' ? "bg-amber-50 text-amber-500" : "bg-white text-primary border border-slate-100"
    )}>
      <Icon size={14} />
    </div>
    <div className="flex-1 min-w-0 text-left">
      <h5 className="text-[11px] font-black text-slate-900 leading-tight truncate">{title}</h5>
      <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{date}</p>
      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest shadow-inner">
        <div className="w-1 h-1 rounded-full bg-slate-300" />
        {type}
      </div>
    </div>
  </div>
);

export default CommunicationLogs;
