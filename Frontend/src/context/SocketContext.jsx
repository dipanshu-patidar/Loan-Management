import React, { createContext, useContext, useEffect, useState } from 'react';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../socket/socketClient';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socketInstance = initiateSocketConnection(token);
      setSocket(socketInstance);
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  // Listen for login/logout to re-initialize socket
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (token && !socket) {
        const socketInstance = initiateSocketConnection(token);
        setSocket(socketInstance);
      } else if (!token && socket) {
        disconnectSocket();
        setSocket(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
