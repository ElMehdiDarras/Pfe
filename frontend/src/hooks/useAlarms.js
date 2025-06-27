// Updated useAlarms.js with site filtering
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import alarmService from '../api/services/alarmService';
import { useAuth } from '../context/AuthContext';

// Get all alarms - Updated with site filtering
export const useAlarms = (options = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['alarms', user?.role, user?.sites],
    queryFn: async () => {
      // Get alarms from service
      const alarms = await alarmService.getAllAlarms();
      
      // If user is an agent, filter alarms by their assigned sites
      if (user && user.role === 'agent' && user.sites && user.sites.length > 0) {
        return alarms.filter(alarm => user.sites.includes(alarm.siteId));
      }
      
      // Admin and supervisor see all alarms
      return alarms;
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: options.live ? 10000 : undefined, // Auto-refresh every 10 seconds if live mode
    enabled: !!user, // Only run query if user is logged in
    ...options
  });
};

// Get active alarms - Updated with site filtering
export const useActiveAlarms = (options = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['alarms', 'active', user?.role, user?.sites],
    queryFn: async () => {
      // Get active alarms from service
      const activeAlarms = await alarmService.getActiveAlarms();
      
      // If user is an agent, filter alarms by their assigned sites
      if (user && user.role === 'agent' && user.sites && user.sites.length > 0) {
        return activeAlarms.filter(alarm => user.sites.includes(alarm.siteId));
      }
      
      // Admin and supervisor see all alarms
      return activeAlarms;
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: options.live ? 10000 : 30000, // Refresh every 10 or 30 seconds
    refetchOnMount: true, // Always fetch when component mounts
    refetchOnWindowFocus: true, // Fetch when window regains focus
    enabled: !!user, // Only run query if user is logged in
    ...options
  });
};

// Get alarms by site
export const useAlarmsBySite = (siteId, options = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['alarms', 'site', siteId, user?.role],
    queryFn: async () => {
      // Agent access check
      if (user && user.role === 'agent' && user.sites && !user.sites.includes(siteId)) {
        console.warn('Agent tried to access site they don\'t have permission for:', siteId);
        return []; // Return empty array if agent doesn't have access
      }
      
      return await alarmService.getAlarmsBySite(siteId);
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: options.live ? 10000 : 30000, // Refresh every 10 or 30 seconds
    refetchOnMount: true, // Always fetch when component mounts
    refetchOnWindowFocus: true, // Fetch when window regains focus
    enabled: !!siteId && !!user, // Only run if siteId is provided and user is logged in
    ...options
  });
};

// Get alarm statistics with time range support - Updated with site filtering
export const useAlarmStatistics = (timeRange = '24h', options = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['alarms', 'statistics', timeRange, user?.role, user?.sites],
    queryFn: async () => {
      const stats = await alarmService.getAlarmStatistics(timeRange);
      
      // If user is an agent, filter site statistics to only show their sites
      if (user && user.role === 'agent' && user.sites && user.sites.length > 0 && stats.siteStats) {
        stats.siteStats = stats.siteStats.filter(site => user.sites.includes(site.name));
      }
      
      return stats;
    },
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: timeRange === 'live' ? 10000 : 60000, // Auto-refresh according to mode
    enabled: !!user, // Only run query if user is logged in
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