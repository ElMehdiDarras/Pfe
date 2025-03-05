// src/context/DataProvider.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import mongoDBService from "../services/MongoDBService";

// Update this to port 5001 where your backend is running
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [statistics, setStatistics] = useState({
    critical: 0,
    major: 0,
    warning: 0,
    ok: 0
  });
  const [last24HoursData, setLast24HoursData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch all initial data using MongoDB service
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Use the mongoDbService instead of direct fetch calls
      const data = await mongoDBService.fetchAllData();
      
      setSites(data.sites);
      setAlarms(data.alarms);
      setActiveAlarms(data.activeAlarms);
      setStatistics(data.statistics);
      setLast24HoursData(data.last24HoursData);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket.IO connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    newSocket.on('alarm-status-change', (data) => {
      console.log('Received alarm status change:', data);
      // Update alarms when receiving real-time updates
      fetchAllData();
    });

    newSocket.on('alarm-acknowledged', (data) => {
      console.log('Alarm acknowledged:', data);
      // Update alarms when an alarm is acknowledged
      fetchAllData();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [fetchAllData]);

  // These methods are now using the mongoDbService
  const fetchSiteAlarms = async (siteId) => {
    return await mongoDBService.fetchSiteAlarms(siteId);
  };

  const fetchFilteredAlarms = async (filters) => {
    return await mongoDBService.fetchFilteredAlarms(filters);
  };

  const acknowledgeAlarm = async (alarmId) => {
    try {
      const success = await mongoDBService.acknowledgeAlarm(alarmId);
      
      if (success) {
        // Refresh active alarms after acknowledgment
        const updatedActiveAlarms = await mongoDBService.fetchActiveAlarms();
        setActiveAlarms(updatedActiveAlarms);
      }
      
      return success;
    } catch (error) {
      console.error('Error acknowledging alarm:', error);
      return false;
    }
  };

  // Load initial data
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <DataContext.Provider
      value={{
        sites,
        alarms,
        activeAlarms,
        statistics,
        last24HoursData,
        loading,
        error,
        fetchAllData,
        fetchSiteAlarms,
        fetchFilteredAlarms,
        acknowledgeAlarm
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}