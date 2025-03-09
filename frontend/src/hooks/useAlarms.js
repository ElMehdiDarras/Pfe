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

// Get alarm statistics
export const useAlarmStatistics = () => {
  return useQuery({
    queryKey: ['alarms', 'statistics'],
    queryFn: async () => {
      return await alarmService.getAlarmStatistics();
    }
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