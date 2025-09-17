import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  AppState,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BiometricUtils, BiometricInfo } from '../utils/BiometricUtils';

interface BiometricAuthScreenProps {
  onAuthenticated: () => void;
  onSkip?: () => void;
}

export const BiometricAuthScreen: React.FC<BiometricAuthScreenProps> = ({
  onAuthenticated,
  onSkip,
}) => {
  const { colors } = useTheme();
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    available: false,
    type: 'none',
    displayName: 'Biometric Authentication',
    icon: 'shield-checkmark',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeBiometrics();

    // Listen for app state changes to re-prompt when app becomes active
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Small delay to ensure the app is fully active
        setTimeout(() => {
          handleBiometricAuth();
        }, 100);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializeBiometrics = async () => {
    try {
      const info = await BiometricUtils.getBiometricInfo();
      console.log('BiometricAuthScreen - Initialized with biometric info:', info);
      setBiometricInfo(info);

      // Auto-prompt if biometrics are available
      if (info.available) {
        handleBiometricAuth();
      }
    } catch (error) {
      console.error('BiometricAuthScreen - Error initializing biometrics:', error);
    }
  };

  const handleBiometricAuth = async () => {
    if (isLoading) return; // Prevent multiple simultaneous prompts
    if (!biometricInfo.available) return;

    setIsLoading(true);
    try {
      console.log('BiometricAuthScreen - Attempting authentication with:', biometricInfo);

      const result = await BiometricUtils.authenticateWithBiometrics(
        `Unlock with ${biometricInfo.displayName}`
      );

      console.log('BiometricAuthScreen - Authentication result:', result);

      if (result.success) {
        console.log('BiometricAuthScreen - Authentication successful');
        onAuthenticated();
      } else {
        console.log('BiometricAuthScreen - Authentication failed:', result.error);
        setIsLoading(false);
        // Don't call onAuthenticated - keep the lock screen
      }
    } catch (error) {
      console.error('BiometricAuthScreen - Authentication error:', error);
      setIsLoading(false);
      Alert.alert(
        'Authentication Error',
        'Unable to authenticate. Please try again.',
        [{ text: 'Retry', onPress: handleBiometricAuth }]
      );
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <View style={styles.lockContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.primaryButton} />
          <Text style={styles.title}>App Locked</Text>
          <Text style={styles.subtitle}>
            Use {biometricInfo.displayName} to unlock
          </Text>
        </View>

        <View style={styles.biometricContainer}>
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
            disabled={isLoading || !biometricInfo.available}
            activeOpacity={0.7}
          >
            <Ionicons
              name={biometricInfo.icon}
              size={48}
              color={colors.primaryButton}
            />
            <Text style={styles.biometricText}>
              {isLoading ? 'Authenticating...' : `Use ${biometricInfo.displayName}`}
            </Text>
          </TouchableOpacity>
        </View>

        {onSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    lockContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primaryText,
      marginTop: 24,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondaryText,
      textAlign: 'center',
      lineHeight: 22,
    },
    biometricContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    biometricButton: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primaryButton,
      minWidth: 200,
    },
    biometricText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: 12,
      textAlign: 'center',
    },
    skipButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    skipText: {
      fontSize: 16,
      color: colors.secondaryText,
      textAlign: 'center',
    },
  });