import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';

interface BiometricContextType {
  isBiometricEnabled: boolean;
  isBiometricLocked: boolean;
  setBiometricLocked: (locked: boolean) => void;
  checkBiometricStatus: () => Promise<void>;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

export const useBiometric = (): BiometricContextType => {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometric must be used within a BiometricProvider');
  }
  return context;
};

interface BiometricProviderProps {
  children: ReactNode;
}

export const BiometricProvider: React.FC<BiometricProviderProps> = ({ children }) => {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const rnBiometrics = new ReactNativeBiometrics();

  useEffect(() => {
    checkBiometricStatus();

    // Listen for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Lock the app when it goes to background
        if (isBiometricEnabled) {
          setIsBiometricLocked(true);
          console.log('App moved to background - biometric lock activated');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isBiometricEnabled]);

  const checkBiometricStatus = async () => {
    try {
      console.log('Checking biometric status...');

      // Check if biometrics are enabled by user
      const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');
      console.log('Biometric enabled setting:', biometricEnabled);

      if (biometricEnabled === 'true') {
        // Check if device supports biometrics
        const { available, biometryType } = await rnBiometrics.isSensorAvailable();
        console.log('Device biometric available:', available);
        console.log('Device biometric type:', biometryType);

        if (available) {
          setIsBiometricEnabled(true);
          // Lock on app start if biometrics are enabled
          setIsBiometricLocked(true);
          console.log(`Biometric authentication required on app start (Type: ${biometryType})`);
        } else {
          setIsBiometricEnabled(false);
          setIsBiometricLocked(false);
          console.log('Biometrics not available on device');
        }
      } else {
        setIsBiometricEnabled(false);
        setIsBiometricLocked(false);
        console.log('Biometric authentication not enabled by user');
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setIsBiometricEnabled(false);
      setIsBiometricLocked(false);
    }
  };

  const setBiometricLocked = (locked: boolean) => {
    console.log('Setting biometric lock state:', locked);
    setIsBiometricLocked(locked);
  };

  const value: BiometricContextType = {
    isBiometricEnabled,
    isBiometricLocked,
    setBiometricLocked,
    checkBiometricStatus,
  };

  return (
    <BiometricContext.Provider value={value}>
      {children}
    </BiometricContext.Provider>
  );
};