import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ThemeOption {
  id: 'light' | 'dark' | 'system';
  name: string;
  description: string;
  icon: string;
}

interface ThemeSettingsScreenProps {
  onClose: () => void;
}

export const ThemeSettingsScreen: React.FC<ThemeSettingsScreenProps> = ({ onClose }) => {
  const { mode, setMode, colors } = useTheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(mode);

  const themeOptions: ThemeOption[] = [
    {
      id: 'light',
      name: 'Light',
      description: 'Light theme with bright colors',
      icon: 'sunny',
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Dark theme with muted colors',
      icon: 'moon',
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follow system appearance setting',
      icon: 'phone-portrait',
    },
  ];

  const getThemeDisplayName = (mode: string) => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  const getThemeIcon = (mode: string) => {
    switch (mode) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      default:
        return 'phone-portrait';
    }
  };

  const handleThemeSelect = (themeId: 'light' | 'dark' | 'system') => {
    setThemeMode(themeId);
    setMode(themeId);
  };

  return (
    <SafeAreaView style={styles(colors).container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles(colors).header}>
        <TouchableOpacity style={styles(colors).backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Theme Settings</Text>
        <View style={styles(colors).placeholder} />
      </View>

      <ScrollView style={styles(colors).scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Theme Info */}
        <View style={styles(colors).currentThemeSection}>
          <Text style={styles(colors).sectionTitle}>Current Theme</Text>
          <View style={styles(colors).currentThemeCard}>
            <View style={styles(colors).currentThemeIcon}>
              <Ionicons
                name={getThemeIcon(themeMode)}
                size={24}
                color={colors.activeIcon}
              />
            </View>
            <View style={styles(colors).currentThemeInfo}>
              <Text style={styles(colors).currentThemeName}>
                {getThemeDisplayName(themeMode)}
              </Text>
              <Text style={styles(colors).currentThemeDescription}>
                {themeMode === 'system'
                  ? 'Automatically adapts to your device settings'
                  : `Using ${themeMode} theme across the app`}
              </Text>
            </View>
          </View>
        </View>

        {/* Theme Options */}
        <View style={styles(colors).optionsSection}>
          <Text style={styles(colors).sectionTitle}>Choose Theme</Text>

          {themeOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles(colors).themeOption,
                themeMode === option.id && styles(colors).themeOptionSelected,
              ]}
              onPress={() => handleThemeSelect(option.id)}
              activeOpacity={0.7}>
              <View style={styles(colors).themeOptionLeft}>
                <View
                  style={[
                    styles(colors).themeOptionIcon,
                    themeMode === option.id && styles(colors).themeOptionIconSelected,
                  ]}>
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={
                      themeMode === option.id
                        ? colors.activeIcon
                        : colors.inactiveIcon
                    }
                  />
                </View>
                <View style={styles(colors).themeOptionInfo}>
                  <Text
                    style={[
                      styles(colors).themeOptionName,
                      themeMode === option.id && styles(colors).themeOptionNameSelected,
                    ]}>
                    {option.name}
                  </Text>
                  <Text style={styles(colors).themeOptionDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>

              {themeMode === option.id && (
                <View style={styles(colors).selectedIndicator}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.activeIcon}
                  />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Preview */}
        <View style={styles(colors).previewSection}>
          <Text style={styles(colors).sectionTitle}>Preview</Text>
          <View style={styles(colors).previewCard}>
            <View style={styles(colors).previewHeader}>
              <Text style={styles(colors).previewHeaderText}>App Preview</Text>
              <View style={styles(colors).previewHeaderIcon}>
                <Ionicons name="eye" size={16} color={colors.activeIcon} />
              </View>
            </View>
            <View style={styles(colors).previewContent}>
              <Text style={styles(colors).previewText}>
                This is how your app will look with the selected theme.
              </Text>
              <View style={styles(colors).previewButton}>
                <Text style={styles(colors).previewButtonText}>Sample Button</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles(colors).infoSection}>
          <View style={styles(colors).infoCard}>
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.secondaryText}
            />
            <Text style={styles(colors).infoText}>
              Theme changes will be applied immediately and saved for future app
              launches.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
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
  currentThemeSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
  },
  currentThemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },
  currentThemeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentThemeInfo: {
    flex: 1,
  },
  currentThemeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  currentThemeDescription: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  optionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },
  themeOptionSelected: {
    borderColor: colors.activeIcon,
    backgroundColor: colors.inputBackground,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  themeOptionIconSelected: {
    backgroundColor: colors.background,
  },
  themeOptionInfo: {
    flex: 1,
  },
  themeOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryText,
    marginBottom: 2,
  },
  themeOptionNameSelected: {
    color: colors.activeIcon,
    fontWeight: '600',
  },
  themeOptionDescription: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondaryText,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryText,
  },
  previewHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryText,
  },
  previewHeaderIcon: {
    padding: 4,
  },
  previewContent: {
    padding: 16,
  },
  previewText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 16,
  },
  previewButton: {
    backgroundColor: colors.primaryButton,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryButtonText,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },
  infoText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

