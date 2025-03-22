// src/hooks/useAlarms.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import alarmService from '../api/services/alarmService';

// Get all alarms
export const useAlarms = (options = {}) => {
  return useQuery({
    queryKey: ['alarms'],
    queryFn: async () => {
      return await alarmService.getAllAlarms();
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: options.live ? 10000 : undefined, // Auto-refresh every 10 seconds if live mode
    ...options
  });
};

// Get active alarms
export const useActiveAlarms = (options = {}) => {
  return useQuery({
    queryKey: ['alarms', 'active'],
    queryFn: async () => {
      return await alarmService.getActiveAlarms();
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: options.live ? 10000 : 30000, // Refresh every 10 or 30 seconds
    refetchOnMount: true, // Always fetch when component mounts
    refetchOnWindowFocus: true, // Fetch when window regains focus
    ...options
  });
};

// Get alarms by site
export const useAlarmsBySite = (siteId, options = {}) => {
  return useQuery({
    queryKey: ['alarms', 'site', siteId],
    queryFn: async () => {
      return await alarmService.getAlarmsBySite(siteId);
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: options.live ? 10000 : 30000, // Refresh every 10 or 30 seconds
    refetchOnMount: true, // Always fetch when component mounts
    refetchOnWindowFocus: true, // Fetch when window regains focus
    enabled: !!siteId, // Only run if siteId is provided
    ...options
  });
};

// Get alarm statistics with time range support
export const useAlarmStatistics = (timeRange = '24h', options = {}) => {
  return useQuery({
    queryKey: ['alarms', 'statistics', timeRange],
    queryFn: async () => {
      return await alarmService.getAlarmStatistics(timeRange);
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: timeRange === 'live' ? 10000 : 60000, // Auto-refresh according to mode
    ...options
  });
};

// Mutation to acknowledge an alarm
export const useAcknowledgeAlarm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ alarmId, userId }) => {
      return await alarmService.acknowledgeAlarm(alarmId, userId);
    },
    onSuccess: () => {
      // Invalidate all alarm-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    }
  });
};

// Get recent notifications
export const useNotifications = (limit = 10, options = {}) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await alarmService.getNotifications(limit);
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnMount: true, // Always fetch when component mounts
    refetchOnWindowFocus: true, // Fetch when window regains focus
    ...options
  });
};

// Mark a notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId) => {
      return await alarmService.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

// Mark all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return await alarmService.markAllNotificationsAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};