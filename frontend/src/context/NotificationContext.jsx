// In src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import alarmService from '../api/services/alarmService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, lastMessage } = useSocket();
  
  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Set up interval to refresh counts
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Listen for new notifications via socket
  useEffect(() => {
    
    if (lastMessage && lastMessage.type === 'notification') {
      console.log('NotificationContext processing message:', lastMessage);
        // Add new notification to the list
      const newNotification = lastMessage.data;
      console.log('Processing new notification:', newNotification);
      
      // Check if it's not already in the list
      setNotifications(prev => {
        if (!prev.some(n => n.id === newNotification.id)) {
          console.log('Adding new notification to state');
          return [newNotification, ...prev];
        }
        console.log('Notification already exists, not adding');
        return prev;
      });
      
      // Update unread count
      fetchUnreadCount();
    }
  }, [lastMessage]);
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      // Check if the function exists before calling it
      if (typeof alarmService.getNotifications === 'function') {
        const data = await alarmService.getNotifications(20);
        setNotifications(data || []);
      } else {
        console.error('getNotifications function is not defined in alarmService');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      // Check if the function exists before calling it
      if (typeof alarmService.getNotificationCount === 'function') {
        const data = await alarmService.getNotificationCount();
        setUnreadCount(data?.count || 0);
      } else {
        console.error('getNotificationCount function is not defined in alarmService');
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await alarmService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await alarmService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        refreshNotifications: fetchNotifications,
        refreshUnreadCount: fetchUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);