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
import ReactNativeBiometrics from 'react-native-biometrics';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FaceIDProps {
  onClose: () => void;
}

export const FaceID: React.FC<FaceIDProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const rnBiometrics = new ReactNativeBiometrics();
  const [isFaceIdAvailable, setIsFaceIdAvailable] = useState(false);

  useEffect(() => {
    const checkFaceIdAvailability = async () => {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      setIsFaceIdAvailable(available && biometryType === 'FaceID');
    };

    checkFaceIdAvailability();
  }, []);

  const handleToggle = async () => {
    if (!isFaceIdAvailable) {
      Alert.alert('Face ID not available on this device');
      return;
    }

    if (!isEnabled) {
      try {
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Authenticate with Face ID',
        });

        if (success) {
          setIsEnabled(true);
          await AsyncStorage.setItem('appLockEnabled', 'true');
          Alert.alert('Face ID authentication enabled');
        } else {
          Alert.alert('Authentication cancelled');
        }
      } catch (error) {
        Alert.alert('Authentication failed');
      }
    } else {
      setIsEnabled(false);
      await AsyncStorage.setItem('appLockEnabled', 'false');
      Alert.alert('Face ID authentication disabled');
    }
  };

  useEffect(() => {
    const loadState = async () => {
      const stored = await AsyncStorage.getItem('appLockEnabled');
      if (stored === 'true') {
        setIsEnabled(true);
      }
    };
    loadState();
  }, []);

  const styles = createStyles(colors); // generate theme-aware styles

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face ID</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="eye" size={64} color={colors.primaryButton} />
        </View>

        <Text style={styles.title}>Enable Face ID</Text>
        <Text style={styles.description}>
          Use your Face ID to quickly and securely access your account.
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable Face ID</Text>
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
