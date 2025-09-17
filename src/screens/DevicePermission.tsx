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

type Permission = {
  id: number;
  title: string;
  icon: string;
  enabled: boolean;
};

type DevicePermissionProps = {
  onClose: () => void;
};

export const DevicePermission: React.FC<DevicePermissionProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: 1, title: 'Camera', icon: 'camera', enabled: false },
    { id: 2, title: 'Photos', icon: 'images', enabled: false },
    { id: 3, title: 'Location Services', icon: 'location', enabled: false },
    { id: 4, title: 'Notification Permission', icon: 'notifications', enabled: false },
  ]);

  const toggleSwitch = (id: number) => {
    setPermissions(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Permission</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Permissions List */}
      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>Your Preferences</Text>
        {permissions.map(item => (
          <View key={item.id} style={styles.option}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.enabled ? colors.activeIcon : colors.inactiveIcon}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{item.title}</Text>
              </View>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleSwitch(item.id)}
              trackColor={{ false: colors.inactiveIcon, true: colors.activeIcon }}
              thumbColor={colors.primaryText}
              ios_backgroundColor={colors.inactiveIcon}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
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
  scrollView: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
    margin: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryText,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '500',
  },
});

