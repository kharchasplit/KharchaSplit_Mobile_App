import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationOption = {
  id: number;
  title: string;
  isEnabled: boolean;
};

type NotificationsProps = {
  onClose: () => void;
};

export const Notifications: React.FC<NotificationsProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [notifymeOptions, setNotifyMeOptions] = useState<NotificationOption[]>([
    { id: 1, title: 'When I am added to a group', isEnabled: false },
    { id: 2, title: 'When an expense is added', isEnabled: false },
    { id: 3, title: 'When a payment is Settled', isEnabled: false },
  ]);

  const toggleSwitch = () => setIsEnabled(prev => !prev);

  const toggleNotifyMeSwitch = (id: number) => {
    setNotifyMeOptions(prevOptions =>
      prevOptions.map(item =>
        item.id === id ? { ...item, isEnabled: !item.isEnabled } : item,
      ),
    );
  };

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
