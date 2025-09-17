import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FingerprintProps {
  onClose: () => void;
}

export const Fingerprint: React.FC<FingerprintProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const rnBiometrics = new ReactNativeBiometrics();

  // Load saved fingerprint toggle state on mount
  useEffect(() => {
    const loadState = async () => {
      const stored = await AsyncStorage.getItem('appLockEnabled');
      if (stored === 'true') {
        setIsEnabled(true);
      }
    };
    loadState();
  }, []);

  const handleToggle = async () => {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    console.log('Available:', available, 'Type:', biometryType);

    if (!available || biometryType !== BiometryTypes.TouchID) {
      Alert.alert('Fingerprint not available on this device');
      return;
    }

    if (!isEnabled) {
      try {
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Authenticate with fingerprint',
        });

        if (success) {
          setIsEnabled(true);
          await AsyncStorage.setItem('appLockEnabled', 'true');
          Alert.alert('Fingerprint authentication enabled');
        } else {
          Alert.alert('Authentication cancelled');
        }
      } catch (error) {
        Alert.alert('Authentication failed');
      }
    } else {
      setIsEnabled(false);
      await AsyncStorage.setItem('appLockEnabled', 'false');
      Alert.alert('Fingerprint authentication disabled');
    }
  };

  const styles = createStyles(colors); // ✅ theme-aware styles

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fingerprint</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="finger-print" size={64} color={colors.primaryButton} />
        </View>

        <Text style={styles.title}>Enable Fingerprint</Text>
        <Text style={styles.description}>
          Use your fingerprint to quickly and securely access your account.
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable Fingerprint</Text>
          <Switch
            trackColor={{ false: colors.inactiveIcon, true: colors.activeIcon }}
            thumbColor={isEnabled ? colors.primaryButton : '#f4f3f4'}
            ios_backgroundColor={colors.cardBackground}
            onValueChange={handleToggle}
            value={isEnabled}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 🎨 Theme-aware styles
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0,
      borderBottomColor: colors.secondaryText,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
    },
    placeholder: {
      width: 40,
    },
    scrollContent: {
      padding: 20,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 24,
      textAlign: 'center',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      borderColor: colors.secondaryText,
      borderWidth: 1,
    },
    toggleLabel: {
      fontSize: 16,
      color: colors.primaryText,
      fontWeight: '500',
    },
  });
