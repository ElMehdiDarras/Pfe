// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import alarmService from '../api/services/alarmService';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

// Create context
const NotificationContext = createContext(null);

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { lastMessage } = useSocket();
  const { user } = useAuth();

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await alarmService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notification count
  const fetchNotificationCount = async () => {
    if (!user) return;
    
    try {
      const data = await alarmService.getNotificationCount();
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await alarmService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await alarmService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up refresh interval
      const intervalId = setInterval(fetchNotificationCount, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);

  // Handle real-time notifications
  useEffect(() => {
    if (lastMessage?.type === 'notification') {
      const newNotification = lastMessage.data;
      
      // Add to notifications list if not already present
      setNotifications(prev => {
        if (!prev.some(n => n.id === newNotification.id)) {
          return [newNotification, ...prev];
        }
        return prev;
      });
      
      // Update unread count
      if (!newNotification.read) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [lastMessage]);

  // Context value
  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};