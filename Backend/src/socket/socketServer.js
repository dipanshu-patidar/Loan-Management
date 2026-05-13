const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development. Adjust for production
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) return next(new Error('User not found'));
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // console.log(`User connected: ${socket.user.email} (${socket.user._id})`);
    
    // Broadcast user online status
    socket.broadcast.emit('online_status', { userId: socket.user._id, status: 'online' });

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('typing', ({ roomId, userId, userName }) => {
      socket.to(roomId).emit('typing', { userId, userName });
    });

    socket.on('stop_typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('stop_typing', { userId });
    });

    socket.on('mark_read', ({ roomId, userId }) => {
      socket.to(roomId).emit('mark_read', { userId });
    });

    socket.on('disconnect', () => {
      // console.log(`User disconnected: ${socket.user.email}`);
      socket.broadcast.emit('online_status', { userId: socket.user._id, status: 'offline' });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

module.exports = { initSocket, getIO };
