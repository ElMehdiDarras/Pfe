// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    let socketInstance = null;

    // Only connect to socket if user is authenticated
    if (user) {
      try {
        const token = localStorage.getItem('token');
        
        // Make sure we're using the correct URL without trailing slashes
        let socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
        
        // Remove any trailing slashes to avoid namespace issues
        socketUrl = socketUrl.replace(/\/+$/, '');
        
        console.log('Connecting to Socket.IO at:', socketUrl);
        
        // Initialize socket connection with explicit path and no namespace
        socketInstance = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          path: '/socket.io',  // Make sure this matches your server configuration
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          autoConnect: true
        });

        // Handle connection events
        socketInstance.on('connect', () => {
          console.log('Socket.IO connected successfully');
          setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log(`Socket.IO disconnected: ${reason}`);
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket.IO connection error details:', error.message);
          setIsConnected(false);
        });

        // Listen for alarm updates
        socketInstance.on('alarm-status-change', (data) => {
          console.log('Received alarm status change:', data);
          setLastMessage({ type: 'alarm-status-change', data });
        });

        socketInstance.on('box-status-change', (data) => {
          setLastMessage({ type: 'box-status-change', data });
        });

        socketInstance.on('site-status-updated', (data) => {
          setLastMessage({ type: 'site-status-updated', data });
        });

        socketInstance.on('alarm-acknowledged', (data) => {
          setLastMessage({ type: 'alarm-acknowledged', data });
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error('Error initializing Socket.IO:', error);
      }
    }

    // Cleanup function
    return () => {
      if (socketInstance) {
        console.log('Cleaning up Socket.IO connection');
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user]);

  const value = {
    socket,
    isConnected,
    lastMessage
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};