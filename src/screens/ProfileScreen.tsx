import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { EditProfileScreen } from './EditProfileScreen';
import { ThemeSettingsScreen } from './ThemeSettingsScreen';
import { ReferralSystemScreen } from './ReferralSystemScreen';
import { Settings } from './Settings';
import { HelpandSupport } from './HelpandSupport';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProps } from '../types/navigation';
import { getProfileImageUri } from '../utils/imageUtils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string | null;
}

type ProfileScreenProps = NavigationProps;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, logout, isLoading } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showReferralSystem, setShowReferralSystem] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpandSupport, setShowHelpandSupport] = useState(false);
  const [loadingProfile] = useState(false);

  // Use actual user profile from auth context
  const userProfile: UserProfile = {
    firstName: user?.name?.split(' ')[0] || 'User',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || user?.phoneNumber || '',
    profileImageUrl: null,
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const menuItems = [
    { id: 1, title: 'Theme Setting', icon: 'palette', onPress: () => setShowThemeSettings(true) },
    { id: 2, title: 'Payments', icon: 'credit-card', onPress: () => navigation.navigate('PaymentHistory') },
    { id: 3, title: 'Settings', icon: 'settings', onPress: () => setShowSettings(true) },
    { id: 4, title: 'Referral System', icon: 'card-giftcard', onPress: () => setShowReferralSystem(true) },
    { id: 5, title: 'Help & Support', icon: 'help-outline', onPress: () => setShowHelpandSupport(true) },
    {
      id: 6,
      title: 'Logout',
      icon: 'logout',
      onPress: handleLogout,
      isLoading: isLoading,
    },
  ];

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.statusBarBackground} 
      />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {loadingProfile ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="small" color={colors.primaryButton} />
                </View>
              ) : (
                <Image
                  source={{ uri: getProfileImageUri(user || {}) }}
                  style={styles.avatar}
                  onError={(error) => {
                    console.log('Profile image failed to load:', error.nativeEvent.error);
                    console.log('User data:', {
                      hasProfileImage: !!(user?.profileImage || user?.profileImageBase64),
                      profileImageLength: (user?.profileImage || user?.profileImageBase64)?.length,
                      firstName: user?.firstName,
                      name: user?.name
                    });
                  }}
                  onLoad={() => {
                    console.log('Profile image loaded successfully');
                  }}
                />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {`${userProfile.firstName} ${userProfile.lastName}`}
              </Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setShowEditProfile(true)}>
            <MaterialIcons name="edit" size={20} color={colors.primaryButton} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.title === 'Logout' && isLoading && { opacity: 0.6 }
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
              disabled={item.title === 'Logout' && isLoading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name={item.icon}
                  size={24}
                  color={item.title === 'Logout' ? colors.error || '#EF4444' : colors.primaryText}
                  style={{ marginRight: 16 }}
                />
                <Text style={[
                  styles.menuTitle,
                  item.title === 'Logout' && { color: colors.error || '#EF4444' }
                ]}>{item.title}</Text>
                {item.title === 'Logout' && isLoading && (
                  <ActivityIndicator size="small" color={colors.error || '#EF4444'} style={{ marginLeft: 8 }} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
        <EditProfileScreen onClose={() => setShowEditProfile(false)} />
      </Modal>

      <Modal visible={showThemeSettings} animationType="slide" presentationStyle="pageSheet">
        <ThemeSettingsScreen onClose={() => setShowThemeSettings(false)} />
      </Modal>


      <Modal visible={showReferralSystem} animationType="slide" presentationStyle="pageSheet">
        <ReferralSystemScreen onClose={() => setShowReferralSystem(false)} />
      </Modal>

      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet">
        <Settings onClose={() => setShowSettings(false)} />
      </Modal>

      <Modal visible={showHelpandSupport} animationType="slide" presentationStyle="pageSheet">
        <HelpandSupport onClose={() => setShowHelpandSupport(false)} />
      </Modal>


    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
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
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primaryText },
    scrollView: { flex: 1 },
    profileSection: {
      backgroundColor: colors.cardBackground,
      margin: 16,
      padding: 20,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: colors.primaryText,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    profileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarContainer: { marginRight: 16 },
    avatar: { width: 60, height: 60, borderRadius: 30 },
    avatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: '600', color: colors.primaryText, marginBottom: 4 },
    userEmail: { fontSize: 14, color: colors.secondaryText },
    editButton: { padding: 8 },
    menuSection: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      shadowColor: colors.primaryText,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBackground,
    },
    menuTitle: { fontSize: 16, color: colors.primaryText, fontWeight: '500' },
    versionContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    versionText: {
      color: colors.primaryText,
      opacity: 0.5,
      fontSize: 14,
    },
  });
