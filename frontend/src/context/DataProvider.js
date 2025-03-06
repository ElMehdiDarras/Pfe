// src/context/DataProvider.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import mongoDBService from "../services/MongoDBService";

// Update this to port 5001 where your backend is running
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
  
  // Track if initial data has been loaded
  const initialDataLoaded = useRef(false);
  
  // Fetch all data function - now uses the ref to prevent infinite loops
  const fetchAllData = useCallback(async (force = false) => {
    // Only set loading to true if this is the initial load or a forced refresh
    if (!initialDataLoaded.current || force) {
      setLoading(true);
    }
    
    try {
      console.log('Fetching all data from MongoDB API');
      // Use the mongoDbService instead of direct fetch calls
      const data = await mongoDBService.fetchAllData();
      
      setSites(data.sites);
      setAlarms(data.alarms);
      setActiveAlarms(data.activeAlarms);
      setStatistics(data.statistics);
      setLast24HoursData(data.last24HoursData);
      
      setError(null);
      // Mark that initial data has been loaded
      initialDataLoaded.current = true;
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Socket setup reference to prevent recreating
  const socketRef = useRef(null);

  // Socket.IO connection - only set up once
  useEffect(() => {
    // Only set up socket once
    if (socketRef.current) return;
    
    console.log('Setting up socket connection');
    const newSocket = io(SOCKET_URL);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    newSocket.on('alarm-status-change', (data) => {
      console.log('Received alarm status change:', data);
      // Update alarms when receiving real-time updates
      fetchAllData(true);
    });

    newSocket.on('alarm-acknowledged', (data) => {
      console.log('Alarm acknowledged:', data);
      // Update alarms when an alarm is acknowledged
      fetchAllData(true);
    });

    return () => {
      // Clean up socket only when component unmounts
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [fetchAllData]); // Empty dependency array - this runs only once

  // Initial data load - only once
  // eslint-disable-next-line
  useEffect(() => {
    // Only fetch initial data once
    if (!initialDataLoaded.current) {
      console.log('Initial data load');
      fetchAllData();
    }
  }, [fetchAllData]); // Empty dependency array, run only once on mount

  // These methods are now using the mongoDbService
  const fetchSiteAlarms = async (siteId) => {
    try {
      return await mongoDBService.fetchSiteAlarms(siteId);
    } catch (error) {
      console.error(`Error fetching alarms for site ${siteId}:`, error);
      return [];
    }
  };

  const fetchFilteredAlarms = async (filters) => {
    try {
      return await mongoDBService.fetchFilteredAlarms(filters);
    } catch (error) {
      console.error('Error fetching filtered alarms:', error);
      return [];
    }
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