import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'; // match backend PORT

let socket = null;

export const initiateSocketConnection = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  });

  // console.log('Connecting socket...');
  
  socket.on('connect_error', (err) => {
    // console.error('Socket Connection Error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    if (socket.connected) {
      socket.disconnect();
    } else {
      socket.close();
    }
    socket = null;
  }
};

export const getSocket = () => socket;
