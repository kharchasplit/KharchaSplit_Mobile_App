import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { colors } from '../utils/colors';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleCreateGroup = () => {
    // Navigate to create group screen
    console.log('Create group');
  };

  const handleJoinGroup = () => {
    // Navigate to join group screen
    console.log('Join group');
  };

  const handleViewProfile = () => {
    // Navigate to profile screen
    console.log('View profile');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back! 👋</Text>
            <Text style={styles.title}>KharchaSplit</Text>
          </View>
          <Text style={styles.subtitle}>Manage your group expenses seamlessly</Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleCreateGroup}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>+</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create Group</Text>
              <Text style={styles.actionDescription}>
                Start a new expense group with friends
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleJoinGroup}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>👥</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Join Group</Text>
              <Text style={styles.actionDescription}>
                Join an existing group with invite code
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.recentGroups}>
          <Text style={styles.sectionTitle}>Recent Groups</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No groups yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create or join a group to start splitting expenses
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleViewProfile}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  welcomeContainer: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    lineHeight: 22,
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.cardBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconText: {
    fontSize: 24,
    color: colors.primaryButtonText,
    fontWeight: 'bold',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  recentGroups: {
    paddingHorizontal: 24,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.primaryText,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.secondaryText,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    color: colors.inactiveIcon,
    fontWeight: '500',
  },
  navTextActive: {
    color: colors.activeIcon,
    fontWeight: '700',
  },
});