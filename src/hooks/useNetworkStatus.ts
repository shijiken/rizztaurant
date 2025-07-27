// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo'; // Make sure this package is installed!

/**
 * Custom hook to track the device's online/offline status.
 * @returns {boolean} isOnline - True if the device is connected to the internet and reachable, false otherwise.
 */
export const useNetworkStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(true); // Assume online initially

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const currentlyOnline = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(currentlyOnline);
    });

    // Initial check on mount
    NetInfo.fetch().then(state => {
      const currentlyOnline = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(currentlyOnline);
    });

    return () => {
      unsubscribe(); // Clean up the event listener when the component unmounts
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return isOnline;
};