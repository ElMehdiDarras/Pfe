// src/hooks/useAlarms.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import alarmService from '../api/services/alarmService';

// Get all alarms
export const useAlarms = () => {
  return useQuery({
    queryKey: ['alarms'],
    queryFn: async () => {
      return await alarmService.getAllAlarms();
    }
  });
};

// Get active alarms
export const useActiveAlarms = () => {
  return useQuery({
    queryKey: ['alarms', 'active'],
    queryFn: async () => {
      return await alarmService.getActiveAlarms();
    }
  });
};

// Get alarms by site
export const useAlarmsBySite = (siteId) => {
  return useQuery({
    queryKey: ['alarms', 'site', siteId],
    queryFn: async () => {
      return await alarmService.getAlarmsBySite(siteId);
    },
    enabled: !!siteId
  });
};

// Get alarm statistics with time range support
export const useAlarmStatistics = (timeRange = '24h') => {
  return useQuery({
    queryKey: ['alarms', 'statistics', timeRange],
    queryFn: async () => {
      return await alarmService.getAlarmStatistics(timeRange);
    },
    refetchInterval: timeRange === 'live' ? 10000 : false // Auto-refresh every 10 seconds in live mode
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
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    }
  });
};

// Get recent notifications
export const useNotifications = (limit = 10) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await alarmService.getNotifications(limit);
    },
    refetchInterval: 30000 // Refresh every 30 seconds
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