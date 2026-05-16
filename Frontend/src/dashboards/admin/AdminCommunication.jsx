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
  Users, Loader2, AlertCircle, Trash2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import StatusBadge from '../../components/StatusBadge';
import communicationService from '../../services/communicationService';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../../socket/socketClient';
import { toast } from 'react-hot-toast';
import api from '../../services/api'; // To fetch users for individual dropdown

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

const AdminCommunication = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Broadcast / New Chat modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [targetGroup, setTargetGroup] = useState('Borrower');
  const [individualUsers, setIndividualUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [broadcastText, setBroadcastText] = useState('');

  const [isSnapshotDrawerOpen, setIsSnapshotDrawerOpen] = useState(false);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Retract / Context States
  const [contextMenu, setContextMenu] = useState(null); // { x: 0, y: 0, message: {} }
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const popularEmojis = ['😊', '👍', '🙏', '✅', '⚠️', '🚨', '⏰', '🔥', '💼', '💳', '💵', '💹', '📣', '❤️', '😂', '🤔', '👏', '🤝', '🎉', '🚀'];

  // Global handler to intercept click outside and hide context menus
  useEffect(() => {
    const closeMenu = () => {
      setContextMenu(null);
      setShowEmojiPicker(false);
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Get Current Admin User Info (usually from localstorage decode or similar)
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // 1. Establish Socket Connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initiateSocketConnection(token);

      // Normalise message payloads from both Admin controller (raw Mongo schema)
      // and Staff controller (formatted DTO with messageId/message fields).
      const handleIncomingMessage = (payload) => {
        if (!payload) return;

        // Bridge between the two schema formats
        const normalizedMessage = {
          _id: payload._id || payload.messageId,
          messageId: payload.messageId || payload._id,
          conversationId: payload.conversationId?.toString() || payload.conversationId,
          senderId: typeof payload.senderId === 'object'
            ? payload.senderId
            : { _id: payload.senderId, fullName: payload.senderName || 'User' },
          messageText: payload.messageText || payload.message || '',
          message: payload.messageText || payload.message || '',
          messageType: payload.messageType || 'text',
          isRead: false,
          createdAt: payload.createdAt || new Date()
        };

        setSelectedChat((currentSelected) => {
          if (currentSelected) {
            // Robust ID comparison for both real and virtual chats
            const selectedId = (currentSelected._id || currentSelected.conversationId)?.toString();
            const incomingId = normalizedMessage.conversationId?.toString();

            // If the current selected chat is virtual, its _id is the peer's ID.
            // We should also check if the incoming message is from that peer.
            const peer = currentSelected.participants?.find(p => p._id?.toString() !== currentUser?._id?.toString());
            const peerId = peer?._id?.toString();
            const senderId = (normalizedMessage.senderId?._id || normalizedMessage.senderId)?.toString();

            if ((selectedId && incomingId && selectedId === incomingId) || (currentSelected.isVirtual && senderId === peerId)) {
              setMessages((prev) => {
                const incomingKey = normalizedMessage._id?.toString() || normalizedMessage.messageId?.toString();
                if (prev.some(msg => {
                  const existingKey = msg._id?.toString() || msg.messageId?.toString();
                  return existingKey && incomingKey && existingKey === incomingKey;
                })) return prev;
                return [...prev, normalizedMessage];
              });
              communicationService.markAsRead(normalizedMessage.conversationId);
            }
          }
          return currentSelected;
        });

        fetchConversations();
      };

       // Listen to all possible naming conventions
      socket.on('message-received', handleIncomingMessage);
      socket.on('message:received', handleIncomingMessage);
      socket.on('receive_message', handleIncomingMessage);
      socket.on('receiveMessage', handleIncomingMessage);

      // Also listen for targeted personal events (emitted by staff controller)
      if (currentUser?._id) {
        socket.on(`message-received_${currentUser._id}`, handleIncomingMessage);
        socket.on(`receive_message_${currentUser._id}`, handleIncomingMessage);
        socket.on(`receiveMessage_${currentUser._id}`, handleIncomingMessage);
      }

      socket.on('online_status', ({ userId, status }) => {
        setOnlineUsers((prev) => {
          const updated = new Map(prev);
          updated.set(userId, status);
          return updated;
        });
      });

      socket.on('typing', ({ userId, userName }) => {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.set(userId, userName);
          return updated;
        });
      });

      socket.on('stop_typing', ({ userId }) => {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.delete(userId);
          return updated;
        });
      });

      socket.on('messages_read', ({ conversationId, userId }) => {
        setMessages(prev => prev.map(msg => {
          if (msg.conversationId === conversationId && msg.senderId._id === currentUser?._id) {
            return { ...msg, isRead: true };
          }
          return msg;
        }));
      });

      socket.on('message_deleted', ({ conversationId, messageId }) => {
        setMessages((prev) => prev.filter(msg => msg._id !== messageId));
        fetchConversations();
      });
    }

    return () => {
      const activeSocket = getSocket();
      if (activeSocket) {
        activeSocket.off('message-received');
        activeSocket.off('message:received');
        activeSocket.off('receive_message');
        activeSocket.off('receiveMessage');
        activeSocket.off('online_status');
        activeSocket.off('typing');
        activeSocket.off('stop_typing');
        activeSocket.off('messages_read');
        activeSocket.off('message_deleted');
      }
      disconnectSocket();
    };
  }, []);

  // 2. Fetch Conversations List
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const mapRole = activeFilter === 'All' ? 'all' : activeFilter.toLowerCase();
      const res = await communicationService.getAllConversations(mapRole);
      setConversations(res.data.data);
    } catch (error) {
      toast.error('Unable to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeFilter]);

  // 3. Handle Chat Select
  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const res = await communicationService.getSingleConversation(chat._id);
      const conversation = res.data.data.conversation;
      setSelectedChat(conversation); // Upgrade virtual chat state to fully-fledged MongoDB schema
      setMessages(res.data.data.messages);

      // Join secure room via Socket stream
      const socket = getSocket();
      if (socket) {
        socket.emit('join_room', conversation._id);
      }

      // Mark as Read
      await communicationService.markAsRead(conversation._id);
      fetchConversations(); // Repopulate statistics
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 4. Handling Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;

    const receiver = selectedChat.participants.find(p => p._id !== currentUser?._id);
    const tempText = messageText;
    const tempType = messageType;
    setMessageText('');
    setMessageType('text');

    try {
      const res = await communicationService.sendMessage({
        conversationId: selectedChat._id,
        receiverId: receiver?._id,
        messageType: tempType,
        messageText: tempText
      });

      setMessages((prev) => {
        if (prev.some(msg => msg._id === res.data.data.message._id)) return prev;
        return [...prev, res.data.data.message];
      });

      // Refresh conversations to update last message on left panel
      fetchConversations();

      // Stop typing emitter
      const socket = getSocket();
      if (socket) {
        socket.emit('stop_typing', { roomId: selectedChat._id, userId: currentUser?._id });
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // 4b. Message Deletion Handlers
  const handleRightClick = (e, msg) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: msg
    });
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await communicationService.deleteMessage(messageToDelete._id);
      setMessages(prev => prev.filter(m => m._id !== messageToDelete._id));
      toast.success('Message retracted from global streams.');
    } catch (err) {
      toast.error('Fail to retract secured packet.');
    } finally {
      setMessageToDelete(null);
    }
  };

  // Typing indicator logic
  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!selectedChat || !currentUser) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing', {
      roomId: selectedChat._id,
      userId: currentUser._id,
      userName: currentUser.fullName || 'Admin'
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId: selectedChat._id, userId: currentUser._id });
    }, 2000);
  };

  // 5. Broadcast logic & Fetch users for selection
  useEffect(() => {
    if (isNewChatModalOpen) {
      fetchTargetUsers();
    }
  }, [targetGroup, isNewChatModalOpen]);

  const fetchTargetUsers = async () => {
    try {
      // Relying on specific role queries
      const role = targetGroup.toLowerCase();
      // Query existing endpoints. Borrowers/Agents/Staff might live under user api or specific controllers.
      // We can generically fetch from /admin/communications/search?query=role
      const res = await communicationService.searchConversations(role);
      // Actually communicationService.searchConversations returns conversations.
      // Let's just get all users with this role.
      // If no endpoint exists, fetch simple list
      const response = await api.get(`/admin/reports/borrower-overview`); // Using an existing placeholder or standard route to list users
      // Safely mock fallback users if backend filter is not specific, or search users by query
      const usersRes = await api.get(`/admin/communications/search?query=${role}`);
      // Mapping participants out
      const userList = [];
      usersRes.data.data.forEach(conv => {
        conv.participants.forEach(p => {
          if (p.role === role && !userList.find(u => u._id === p._id)) {
            userList.push(p);
          }
        });
      });
      setIndividualUsers(userList);
    } catch (err) {
      // Slient fail, will allow manual typing
    }
  };

  const handleExecuteBroadcast = async () => {
    if (!broadcastText.trim()) return toast.error('Message content cannot be empty');
    setIsSubmitting(true);
    try {
      if (selectedUserId) {
        // Send individual direct message instead of full group
        const conversationRes = await communicationService.getSingleConversation(selectedUserId);
        const conv = conversationRes.data.data.conversation;
        await communicationService.sendMessage({
          conversationId: conv._id,
          receiverId: selectedUserId,
          messageType: 'operational_update',
          messageText: broadcastText
        });
      } else {
        await communicationService.broadcastMessage({
          targetGroup,
          messageText: broadcastText
        });
      }
      toast.success('Message delivered instantly via real-time socket stream.');
      setBroadcastText('');
      setSelectedUserId('');
      setIsNewChatModalOpen(false);
      fetchConversations();
    } catch (error) {
      toast.error('Broadcast transmission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatter functions
  const getChatDetails = (chat) => {
    if (!currentUser) return { name: 'Unknown', role: 'N/A', avatar: '?' };
    const peer = chat.participants.find(p => p._id !== currentUser._id);
    if (!peer) return { name: 'System Broadcast', role: 'Public', avatar: '📢', status: 'offline' };

    const initials = peer.fullName
      ? peer.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : '??';

    const isUserOnline = onlineUsers.get(peer._id) === 'online' || peer.accountStatus === 'Active';

    return {
      _id: peer._id,
      name: peer.fullName || 'Unknown User',
      role: peer.role === 'borrower' ? 'Borrower' : peer.role === 'agent' ? 'Agent' : 'Staff',
      avatar: initials,
      profilePhoto: typeof peer.profilePhoto === 'object' ? peer.profilePhoto?.url : peer.profilePhoto,
      status: isUserOnline ? 'online' : 'offline',
      raw: peer
    };
  };

  const filteredConversations = conversations.filter(c => {
    const details = getChatDetails(c);
    const matchesQuery = details.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesQuery;
  });

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 overflow-hidden -mt-6">
      {/* LEFT PANEL: CONVERSATION LIST */}
      <section className="w-full md:w-80 lg:w-96 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden shrink-0">
        <div className="p-8 border-b border-slate-50 space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Admin Hub</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global Communication Center</p>
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
            {['All', 'Borrower', 'Staff', 'Agent'].map(filter => (
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
          {loadingConversations ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="animate-spin text-primary w-6 h-6 mb-2" />
              <span className="text-xs font-bold text-slate-400 uppercase">Syncing conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">No conversations available</span>
            </div>
          ) : filteredConversations.map(chat => {
            const details = getChatDetails(chat);
            const unreadCount = chat.unreadCounts[currentUser?._id] || 0;

            return (
              <button
                key={chat._id}
                onClick={() => handleSelectChat(chat)}
                className={cn(
                  "w-full p-5 rounded-[2rem] flex items-center gap-4 transition-all group relative border-l-4 text-left",
                  selectedChat?._id === chat._id ? "bg-primary/5 border-primary shadow-sm" : "border-transparent hover:bg-slate-50"
                )}
              >
                <div className="relative">
                  <UserAvatar name={details.name} photo={details.profilePhoto} role={details.role} size="md" />

                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                    details.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-300"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-black text-slate-900 truncate tracking-tight group-hover:text-primary transition-colors">{details.name}</h4>
                    {chat.lastMessageTime && (
                      <span className="text-[9px] font-bold text-slate-400">{new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{details.role}</p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">{chat.lastMessage || 'Direct message chain'}</p>
                </div>
                {unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse shrink-0">
                    {unreadCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t border-slate-50">
          <Button onClick={() => setIsNewChatModalOpen(true)} className="w-full flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest py-4 shadow-lg shadow-primary/20">
            <Plus size={16} /> New Broadcast/Message
          </Button>
        </div>
      </section>

      {/* RIGHT PANEL: CHAT PANEL */}
      <section className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden relative">
        {selectedChat ? (
          <>
            {/* CHAT HEADER */}
            {(() => {
              const details = getChatDetails(selectedChat);
              const isPeerTyping = typingUsers.has(details._id);

              return (
                <>
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      <UserAvatar name={details.name} photo={details.profilePhoto} role={details.role} size="md" />

                      <div>
                        <h3 className="text-md font-black text-slate-900 tracking-tight">{details.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isPeerTyping ? "bg-primary animate-bounce" : details.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {isPeerTyping ? 'Typing...' : `${details.role} • ${details.status}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsSnapshotDrawerOpen(true)} className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all cursor-pointer" title="View Profile Snapshot"><Eye size={18} /></button>
                    </div>
                  </div>

                  {/* MESSAGES AREA */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 bg-slate-50/20">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-primary w-8 h-8" />
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, i) => {
                          const isMe = msg.senderId?._id === currentUser?._id;
                          const showDateDivider = i === 0 || formatDetailedDate(messages[i - 1].createdAt) !== formatDetailedDate(msg.createdAt);

                          return (
                            <React.Fragment key={msg._id || i}>
                              {showDateDivider && (
                                <div className="flex justify-center my-6">
                                  <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                                    {formatDetailedDate(msg.createdAt)}
                                  </span>
                                </div>
                              )}
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={cn(
                                  "flex flex-col gap-2 max-w-[80%]",
                                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                              >
                                {!isMe && (
                                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                                    <UserAvatar name={msg.senderId?.fullName} photo={typeof msg.senderId?.profilePhoto === 'object' ? msg.senderId.profilePhoto?.url : msg.senderId?.profilePhoto} role={msg.senderId?.role} size="xs" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                      {msg.senderId?.fullName || 'Unknown Sender'}
                                    </span>
                                  </div>
                                )}

                                <div
                                  onContextMenu={(e) => {
                                    if (isMe) handleRightClick(e, msg);
                                  }}
                                  className={cn(
                                    "p-5 rounded-[2rem] text-sm font-medium shadow-sm leading-relaxed relative select-none cursor-pointer",
                                    isMe
                                      ? "bg-primary text-white rounded-tr-none shadow-primary/10"
                                      : "bg-white text-slate-700 border border-slate-100 rounded-tl-none",
                                    msg.messageType === 'compliance_notice' && "border-2 border-rose-300 bg-rose-50 text-rose-900",
                                    msg.messageType === 'reminder' && "border-2 border-amber-300 bg-amber-50 text-amber-900"
                                  )}
                                  title={isMe ? "Right-click to retract message" : ""}
                                >
                                  {msg.messageText || msg.message}
                                </div>

                                <div className="flex items-center gap-2 mt-2 px-1">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isMe && (
                                    msg.isRead ? (
                                      <CheckCheck size={12} className="text-primary" />
                                    ) : (
                                      <Check size={12} className="text-slate-300" />
                                    )
                                  )}
                                </div>
                              </motion.div>
                            </React.Fragment>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* MESSAGE INPUT */}
                  <div className="p-8 border-t border-slate-50 bg-white shrink-0 space-y-6">
                    <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
                      <QuickTemplate
                        label="Operational Update"
                        onClick={() => { setMessageType('operational_update'); setMessageText("SYSTEM UPDATE: Verification protocol check sequence complete."); }}
                      />
                      <QuickTemplate
                        label="Collection Reminder"
                        onClick={() => { setMessageType('reminder'); setMessageText("REMINDER: Standard collection processing required immediately."); }}
                      />
                      <QuickTemplate
                        label="Approval Escalation"
                        onClick={() => { setMessageType('escalation'); setMessageText("ESCALATION NOTIFICATION: Admin clearance requested."); }}
                      />
                      <QuickTemplate
                        label="Compliance Notice"
                        onClick={() => { setMessageType('compliance_notice'); setMessageText("COMPLIANCE ALERT: Portfolio review pending documentation."); }}
                      />
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-end gap-4">
                      <div className="flex-1 relative flex items-center bg-slate-50 rounded-[2rem] px-2 shadow-inner border border-slate-100">

                        {/* Custom Floating Emoji Tray */}
                        {showEmojiPicker && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-full left-4 mb-4 bg-white border border-slate-100 rounded-2xl shadow-premium p-3.5 grid grid-cols-5 gap-2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200 w-64 border-solid"
                          >
                            <div className="col-span-5 pb-2 border-b border-slate-50 mb-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Quick Reaction Toolkit</p>
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
                          className="p-3 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Smile size={20} />
                        </button>
                        <textarea
                          value={messageText}
                          onChange={handleTyping}
                          placeholder="Type administrative instruction or message..."
                          className="flex-1 bg-transparent border-none py-4 text-sm font-medium text-slate-700 outline-none transition-all resize-none min-h-[56px] max-h-32 custom-scrollbar"
                          rows={1}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shrink-0"
                      >
                        <Send size={24} />
                      </button>
                    </form>
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <ShieldCheck size={48} />
            </div>
            <div className="max-w-xs space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Admin Communication Hub</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Oversee and manage communication across the entire platform. Select a thread to intervene or provide guidance.</p>
            </div>
            <Button onClick={() => setIsNewChatModalOpen(true)} className="font-black uppercase text-[10px] tracking-widest px-10 py-4 shadow-lg shadow-primary/20">
              New Broadcast
            </Button>
          </div>
        )}
      </section>

      {/* MODALS & DRAWERS */}
      <AnimatePresence>
        {/* NEW CHAT MODAL */}
        {isNewChatModalOpen && (
          <Modal isOpen onClose={() => setIsNewChatModalOpen(false)} title="New Administrative Broadcast" maxWidth="max-w-xl">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Recipient Group</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['Borrower', 'Agent', 'Staff'].map(role => (
                      <button
                        key={role}
                        onClick={() => { setTargetGroup(role); setSelectedUserId(''); }}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group",
                          targetGroup === role ? "border-primary bg-primary/5" : "border-slate-50 hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                          targetGroup === role ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-white"
                        )}>
                          {role === 'Borrower' ? <Users size={20} /> : role === 'Staff' ? <UserCog size={20} /> : <User size={20} />}
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", targetGroup === role ? "text-primary" : "text-slate-600 group-hover:text-primary")}>{role}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Individual (Optional)</p>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 shadow-inner"
                  >
                    <option value="">Broadcast to All Selected Group</option>
                    {individualUsers.map(u => (
                      <option key={u._id} value={u._id}>{targetGroup}: {u.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instruction / Message</p>
                  <textarea
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Type administrative broadcast or private message..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-medium text-slate-700 min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none shadow-inner"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <Button variant="secondary" onClick={() => setIsNewChatModalOpen(false)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                <Button
                  onClick={handleExecuteBroadcast}
                  disabled={isSubmitting}
                  className="flex-1 font-black uppercase text-[10px] shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Execute Broadcast'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* SNAPSHOT DRAWER */}
        {isSnapshotDrawerOpen && selectedChat && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSnapshotDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Entity Snapshot</h3>
                <button onClick={() => setIsSnapshotDrawerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>
              {(() => {
                const details = getChatDetails(selectedChat);
                return (
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    <div className="text-center space-y-4">
                      <UserAvatar name={details.name} photo={details.profilePhoto} role={details.role} size="xl" />
                      <div>
                        <h4 className="text-xl font-black text-slate-900">{details.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{details.role}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2">Operational Context</h5>
                      <SummaryRow label="Email Record" value={details.raw?.email} />
                      <SummaryRow label="Account Health" value={details.raw?.accountStatus || details.raw?.status || 'N/A'} color="text-emerald-500" />
                      <SummaryRow label="Real-Time Sync" value={details.status} color={details.status === 'online' ? 'text-primary' : 'text-slate-400'} />
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}

        {/* Message Context Dropdown */}
        {contextMenu && (
          <div
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              transform: contextMenu.x > window.innerWidth - 220 ? 'translateX(-100%)' : 'none',
              transformOrigin: contextMenu.x > window.innerWidth - 220 ? 'top right' : 'top left'
            }}
            className="fixed z-[9999] bg-white border border-slate-200/60 rounded-2xl shadow-premium py-2 px-1.5 min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-100 border-solid border"
          >
            <button
              onClick={() => {
                setMessageToDelete(contextMenu.message);
                setContextMenu(null);
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 size={14} /> Retract Message
            </button>
          </div>
        )}

        {/* Message Delete Confirmation Modal */}
        {messageToDelete && (
          <Modal
            isOpen
            onClose={() => setMessageToDelete(null)}
            title="Retract Transaction Message"
            maxWidth="max-w-md"
          >
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">Delete for Everyone?</h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  This will permanently purge the selected message transmission from MongoDB servers for all active recipients.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 font-medium text-left border border-slate-100 line-clamp-3 mt-4 max-h-24 overflow-hidden italic">
                  "{messageToDelete.messageText}"
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <Button variant="secondary" onClick={() => setMessageToDelete(null)} className="flex-1 font-black uppercase text-[10px]">Cancel</Button>
                <Button onClick={handleDeleteMessage} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] shadow-lg shadow-rose-600/20 py-4">Retract Data</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const roleColors = {
  Borrower: { bg: 'bg-blue-50', text: 'text-blue-600' },
  Agent: { bg: 'bg-amber-50', text: 'text-amber-600' },
  Staff: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  default: { bg: 'bg-primary/5', text: 'text-primary' },
};

const sizeCls = {
  xs: { wrap: 'w-5 h-5 rounded-lg text-[7px] border border-slate-100', txt: 'text-[7px]' },
  md: { wrap: 'w-12 h-12 rounded-2xl text-sm shadow-sm', txt: 'text-sm' },
  xl: { wrap: 'w-24 h-24 rounded-[2.5rem] text-3xl shadow-inner mx-auto', txt: 'text-3xl' },
};

const UserAvatar = ({ name, photo, role, size = 'md' }) => {
  const [imgError, setImgError] = React.useState(false);
  const colors = roleColors[role] || roleColors.default;
  const sz = sizeCls[size] || sizeCls.md;
  const firstLetter = name ? name.trim()[0].toUpperCase() : '?';

  if (photo && !imgError) {
    return (
      <div className={`${sz.wrap} flex items-center justify-center overflow-hidden shrink-0`}>
        <img
          src={photo}
          alt={name || ''}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${sz.wrap} ${colors.bg} ${colors.text} flex items-center justify-center font-black shrink-0`}>
      {firstLetter}
    </div>
  );
};

const QuickTemplate = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-4 py-2 bg-slate-50 hover:bg-primary/5 hover:text-primary rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 transition-all whitespace-nowrap shadow-sm"
  >
    {label}
  </button>
);

const SummaryRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between py-1 group">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
    <span className={cn("text-xs font-black truncate max-w-[160px]", color || "text-slate-900")}>{value}</span>
  </div>
);

export default AdminCommunication;
