import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Notifications } from './Notification';
import { Biometrics } from './AccountPrivacy';
import { DevicePermission } from './DevicePermission';
import { CurrencyPreference } from './CurrencyPreference';
import { DeleteAccount } from './DeleteAccount';

interface SettingsProps {
  navigation?: any;
  onClose?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [showNotification, setShowNotification] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [showDevicePermission, setShowDevicePermission] = useState(false);
  const [showCurrencyPreference, setShowCurrencyPreference] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const menuItems = [
    {
      id: 1,
      title: 'Notifications',
      icon: 'notifications',
      onPress: () => setShowNotification(true),
    },
    {
      id: 2,
      title: 'Biometrics',
      icon: 'person-circle',
      onPress: () => setShowBiometrics(true),
    },
    {
      id: 3,
      title: 'Device Permissions',
      icon: 'shield-checkmark',
      onPress: () => setShowDevicePermission(true),
    },
    {
      id: 4,
      title: 'Currency Preference',
      icon: 'cash-outline',
      onPress: () => setShowCurrencyPreference(true),
    },
    {
      id: 5,
      title: 'Delete Account',
      icon: 'trash',
      onPress: () => setShowDeleteAccount(true),
    },
  ];

  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.option}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Ionicons name={item.icon} size={20} color={colors.activeIcon} />
              </View>
              <Text style={styles.optionTitle}>{item.title}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.inactiveIcon}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modals */}
      <Modal visible={showNotification} animationType="slide" presentationStyle="pageSheet">
        <Notifications onClose={() => setShowNotification(false)} />
      </Modal>

      <Modal visible={showBiometrics} animationType="slide" presentationStyle="pageSheet">
        <Biometrics onClose={() => setShowBiometrics(false)} />
      </Modal>

      <Modal visible={showDevicePermission} animationType="slide" presentationStyle="pageSheet">
        <DevicePermission onClose={() => setShowDevicePermission(false)} />
      </Modal>

      <Modal visible={showCurrencyPreference} animationType="slide" presentationStyle="pageSheet">
        <CurrencyPreference onClose={() => setShowCurrencyPreference(false)} />
      </Modal>

      <Modal visible={showDeleteAccount} animationType="slide" presentationStyle="pageSheet">
        <DeleteAccount onClose={() => setShowDeleteAccount(false)} />
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
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
  menuSection: {
    backgroundColor: colors.background,
    borderBottomColor: colors.secondaryText,
    margin: 16,
    borderRadius: 12,
    shadowColor: colors.primaryText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inactiveIcon,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitle: { fontSize: 16, color: colors.primaryText, fontWeight: '500' },
});
