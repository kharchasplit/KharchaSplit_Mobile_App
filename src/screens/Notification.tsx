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
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationOption = {
  id: number;
  title: string;
  isEnabled: boolean;
  key: string;
};

type NotificationsProps = {
  onClose: () => void;
};

const NOTIFICATION_PREFS_KEY = '@notification_preferences';

export const Notifications: React.FC<NotificationsProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [notifymeOptions, setNotifyMeOptions] = useState<NotificationOption[]>([
    { id: 1, title: 'When I am added to a group', isEnabled: true, key: 'groupAdded' },
    { id: 2, title: 'When an expense is added', isEnabled: true, key: 'expenseAdded' },
    { id: 3, title: 'When a payment is Settled', isEnabled: true, key: 'paymentSettled' },
  ]);

  // Check system notification permission
  const checkNotificationPermission = React.useCallback(async () => {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  }, []);

  // Load saved notification preferences
  const loadNotificationPreferences = React.useCallback(async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setNotifyMeOptions(prevOptions =>
          prevOptions.map(item => ({
            ...item,
            isEnabled: prefs[item.key] ?? item.isEnabled,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }, []);

  // Load notification permission status and preferences on mount
  useEffect(() => {
    checkNotificationPermission();
    loadNotificationPreferences();
  }, [checkNotificationPermission, loadNotificationPreferences]);

  // Save notification preferences
  const saveNotificationPreferences = async (options: NotificationOption[]) => {
    try {
      const prefs: Record<string, boolean> = {};
      options.forEach(option => {
        prefs[option.key] = option.isEnabled;
      });
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const toggleSwitch = async () => {
    if (!isEnabled) {
      // Try to request permission
      try {
        const authStatus = await messaging().requestPermission();
        const granted =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (granted) {
          setIsEnabled(true);
        } else {
          // Permission denied, show alert to go to settings
          Alert.alert(
            'Notification Permission Required',
            'Please enable notifications in your device settings to receive updates.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        Alert.alert('Error', 'Failed to request notification permission');
      }
    } else {
      // Disable notifications - show alert to go to settings
      Alert.alert(
        'Disable Notifications',
        'To disable notifications, please go to your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  };

  const toggleNotifyMeSwitch = (id: number) => {
    const updatedOptions = notifymeOptions.map(item =>
      item.id === id ? { ...item, isEnabled: !item.isEnabled } : item,
    );
    setNotifyMeOptions(updatedOptions);
    // Save preferences to AsyncStorage
    saveNotificationPreferences(updatedOptions);
  };

  // Re-check permission when screen gains focus
  useEffect(() => {
    const interval = setInterval(() => {
      checkNotificationPermission();
    }, 1000); // Check every second while screen is open

    return () => clearInterval(interval);
  }, [checkNotificationPermission]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    backButton: { padding: 8 },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
    },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
    },
    switch: { transform: [{ scaleX: 1 }, { scaleY: 1 }] },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 12,
    },
    Subtext: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.inputBackground,
      shadowColor: colors.primaryText,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    SubtextTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      flex: 1,
      paddingRight: 8,
    },
    SubtextSwitch: { padding: 4 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Global Notification Toggle */}
        <View style={styles.row}>
          <Text style={styles.text}>Enable Notifications</Text>
          <Switch
            style={styles.switch}
            trackColor={{ false: '#767577', true: colors.activeIcon }}
            thumbColor={isEnabled ? '#f4f3f3' : '#f4f3f3'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        <Text style={styles.sectionTitle}>Notify Me</Text>

        {/* Per-notification Toggles */}
        {notifymeOptions.map(item => (
          <View key={item.id} style={styles.Subtext}>
            <Text
              style={[
                styles.SubtextTitle,
                !isEnabled && { color: colors.inactiveIcon },
              ]}
            >
              {item.title}
            </Text>
            <Switch
              style={styles.SubtextSwitch}
              trackColor={{ false: '#767577', true: colors.activeIcon }}
              thumbColor={item.isEnabled ? '#f4f3f3' : '#f4f3f3'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleNotifyMeSwitch(item.id)}
              value={item.isEnabled}
              disabled={!isEnabled}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
