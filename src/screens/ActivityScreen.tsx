import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  useWindowDimensions,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseService, Activity } from '../services/firebaseService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityScreenSkeleton } from '../components/SkeletonLoader';

interface ActivityScreenProps {
  navigation: any;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Animation for content fade in
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  const loadActivities = useCallback(async () => {
    if (!user?.id) {
      // Set initial loading to false even when no user
      if (initialLoading) {
        setInitialLoading(false);
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      setLoading(false);
      return;
    }

    try {
      // Show skeleton loader for minimum duration (for better UX)
      const minLoadingTime = new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      
      // Get user's groups first to get group activities
      const dataPromise = (async () => {
        const userGroups = await firebaseService.getUserGroups(user.id);
        const groupIds = userGroups.map(group => group.id);
        
        // Get both user activities and group activities
        const [userActivities, groupActivities] = await Promise.all([
          firebaseService.getUserActivities(user.id, 30),
          firebaseService.getGroupActivities(groupIds, 20)
        ]);

        // Combine and deduplicate activities
        const allActivities = [...userActivities, ...groupActivities];
        const uniqueActivities = allActivities.filter((activity, index, self) => 
          index === self.findIndex(a => a.id === activity.id)
        );

        // Sort by creation time (most recent first)
        uniqueActivities.sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        });

        // Limit to 50 most recent
        return uniqueActivities.slice(0, 50);
      })();
      
      // Wait for both data loading and minimum loading time
      const [limitedActivities] = await Promise.all([dataPromise, minLoadingTime]);
      
      setActivities(limitedActivities);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recent activities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      
      // Set initial loading to false after first load and animate content in
      if (initialLoading) {
        setInitialLoading(false);
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [user?.id, initialLoading, contentFadeAnim]);

  useEffect(() => {
    // Only load data if user is available
    if (user?.id) {
      loadActivities();
    } else {
      // If no user, still show skeleton briefly then show empty state
      setTimeout(() => {
        if (initialLoading) {
          setInitialLoading(false);
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }, 1000);
    }
  }, [user?.id, loadActivities, initialLoading, contentFadeAnim]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!loading && !initialLoading && user?.id) {
        loadActivities();
      }
    }, [loadActivities, loading, initialLoading, user?.id])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivities();
  }, [loadActivities]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'expense_added':
        return 'receipt';
      case 'payment_made':
      case 'settlement_created':
      case 'settlement_confirmed':
        return 'swap-horiz';
      case 'group_created':
      case 'group_joined':
        return 'group-add';
      default:
        return 'event-note';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'expense_added':
        return '#F59E0B'; // Orange
      case 'payment_made':
      case 'settlement_created':
        return '#EF4444'; // Red
      case 'settlement_confirmed':
        return '#10B981'; // Green
      case 'group_created':
      case 'group_joined':
        return '#3B82F6'; // Blue
      default:
        return '#6B7280'; // Gray
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return date.toLocaleDateString();
  };

  const handleActivityPress = (activity: Activity) => {
    if (activity.groupId) {
      // Navigate to Home tab first, then to GroupDetail screen
      navigation.navigate('Home', {
        screen: 'GroupDetail',
        params: { 
          group: { id: activity.groupId, name: activity.groupName },
          currentUserId: user?.id,
        }
      });
    }
  };

  const handleDeleteActivity = async (activity: Activity) => {
    // Haptic feedback on swipe reveal
    if (Platform.OS === 'ios') {
      Vibration.vibrate(50); // Light haptic feedback
    } else {
      Vibration.vibrate(25); // Short vibration for Android
    }

    Alert.alert(
      '🗑️ Delete Activity',
      `Are you sure you want to delete "${activity.title}"?\n\nThis action cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // Light feedback for cancel
            if (Platform.OS === 'ios') {
              Vibration.vibrate(25);
            }
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Set deleting state for loading indicator
              setDeletingActivityId(activity.id!);
              
              // Strong haptic feedback for delete action
              if (Platform.OS === 'ios') {
                Vibration.vibrate([0, 100, 50, 100]); // Pattern vibration
              } else {
                Vibration.vibrate(100);
              }

              // Delete from Firebase
              await firebaseService.deleteActivity(activity.id!);
              
              // Animate out with fade effect
              const activityElement = activities.find(a => a.id === activity.id);
              if (activityElement) {
                // Remove from local state with smooth animation
                setActivities(prevActivities => 
                  prevActivities.filter(a => a.id !== activity.id)
                );
              }
              
              // Success feedback
              if (Platform.OS === 'ios') {
                Vibration.vibrate(50); // Success haptic
              }
              
            } catch (error) {
              
              // Error haptic feedback
              if (Platform.OS === 'ios') {
                Vibration.vibrate([0, 200, 100, 200]); // Error pattern
              } else {
                Vibration.vibrate(200);
              }
              
              Alert.alert(
                '❌ Error', 
                'Failed to delete activity. Please check your connection and try again.',
                [{ text: 'OK', style: 'default' }]
              );
            } finally {
              setDeletingActivityId(null);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderRightActions = (activity: Activity) => {
    const isDeleting = deletingActivityId === activity.id;
    
    return (
      <Animated.View style={styles(colors, scale).deleteButtonContainer}>
        <TouchableOpacity
          style={[
            styles(colors, scale).deleteButton,
            isDeleting && styles(colors, scale).deleteButtonLoading
          ]}
          onPress={() => handleDeleteActivity(activity)}
          activeOpacity={0.8}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles(colors, scale).deleteButtonText}>Deleting...</Text>
            </>
          ) : (
            <>
              <MaterialIcons 
                name="delete" 
                size={scale(24)} 
                color="#FFFFFF" 
              />
              <Text style={styles(colors, scale).deleteButtonText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderActivity = (activity: Activity) => {
    const iconName = getActivityIcon(activity.type);
    const iconColor = getActivityColor(activity.type);

    const activityContent = (
      <TouchableOpacity
        style={styles(colors, scale).activityItem}
        onPress={() => handleActivityPress(activity)}
        activeOpacity={0.7}
      >
        <View style={[styles(colors, scale).activityIcon, { backgroundColor: iconColor + '20' }]}>
          <MaterialIcons name={iconName} size={scale(24)} color={iconColor} />
        </View>
        
        <View style={styles(colors, scale).activityContent}>
          <Text style={styles(colors, scale).activityTitle} numberOfLines={2}>
            {activity.title}
          </Text>
          
          {activity.description && (
            <Text style={styles(colors, scale).activityDescription} numberOfLines={1}>
              {activity.description}
            </Text>
          )}
          
          <View style={styles(colors, scale).activityMeta}>
            {activity.groupName && (
              <Text style={styles(colors, scale).activityGroup} numberOfLines={1}>
                {activity.groupName}
              </Text>
            )}
            <Text style={styles(colors, scale).activityTime}>
              {formatRelativeTime(activity.createdAt)}
            </Text>
          </View>
        </View>
        
        {activity.amount && (
          <View style={styles(colors, scale).activityAmount}>
            <Text style={[styles(colors, scale).amountText, { color: iconColor }]}>
              ₹{activity.amount.toFixed(0)}
            </Text>
          </View>
        )}
        
        <MaterialIcons 
          name="chevron-right" 
          size={scale(20)} 
          color={colors.secondaryText} 
        />
      </TouchableOpacity>
    );

    return (
      <Swipeable
        key={activity.id}
        renderRightActions={() => renderRightActions(activity)}
        rightThreshold={40}
        friction={2}
        leftThreshold={30}
        onSwipeableWillOpen={() => {
          // Light haptic feedback when swipe starts to reveal delete button
          if (Platform.OS === 'ios') {
            Vibration.vibrate(25);
          }
        }}
        containerStyle={styles(colors, scale).swipeableContainer}
        childrenContainerStyle={styles(colors, scale).swipeableChildContainer}
      >
        {activityContent}
      </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles(colors, scale).emptyState}>
      <MaterialIcons name="event-note" size={scale(80)} color={colors.secondaryText} />
      <Text style={styles(colors, scale).emptyStateTitle}>No Recent Activity</Text>
      <Text style={styles(colors, scale).emptyStateDescription}>
        Your recent activities will appear here once you start adding expenses and making payments.
      </Text>
    </View>
  );

  // Show skeleton loader during initial loading
  if (initialLoading) {
    return (
      <SafeAreaView style={styles(colors, scale).container}>
        <StatusBar 
          barStyle={colors.statusBarStyle} 
          backgroundColor={colors.statusBarBackground} 
        />
        <ActivityScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles(colors, scale).container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.statusBarBackground} 
      />
      
      <Animated.View style={[styles(colors, scale).animatedContainer, { opacity: contentFadeAnim }]}>
        {/* Header */}
        <View style={styles(colors, scale).header}>
          <Text style={styles(colors, scale).headerTitle}>Recent Activity</Text>
        </View>


        {/* Content */}
        {loading && activities.length === 0 ? (
          <View style={styles(colors, scale).loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryButton} />
            <Text style={styles(colors, scale).loadingText}>Loading activities...</Text>
          </View>
        ) : (
        <GestureHandlerRootView style={styles(colors, scale).gestureContainer}>
          <ScrollView
            style={styles(colors, scale).scrollView}
            contentContainerStyle={styles(colors, scale).scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primaryButton]}
                tintColor={colors.primaryButton}
              />
            }
            showsVerticalScrollIndicator={false}
          >
          {activities.length > 0 ? (
            <>
              {activities.map(renderActivity)}
              
              {/* Load more placeholder */}
              {activities.length >= 50 && (
                <View style={styles(colors, scale).loadMoreContainer}>
                  <Text style={styles(colors, scale).loadMoreText}>
                    Showing recent 50 activities
                  </Text>
                </View>
              )}
            </>
          ) : (
            renderEmptyState()
          )}
          </ScrollView>
        </GestureHandlerRootView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = (colors: any, scale: (size: number) => number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(20),
      paddingVertical: scale(16),
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.secondaryText + '20',
    },
    headerTitle: {
      fontSize: scale(24),
      fontWeight: '700',
      color: colors.primaryText,
    },
    refreshButton: {
      padding: scale(8),
      borderRadius: scale(20),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: scale(40),
    },
    loadingText: {
      fontSize: scale(16),
      color: colors.secondaryText,
      marginTop: scale(16),
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: scale(8),
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: scale(20),
      paddingVertical: scale(16),
      backgroundColor: colors.cardBackground,
      marginVertical: scale(1),
    },
    activityIcon: {
      width: scale(48),
      height: scale(48),
      borderRadius: scale(24),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scale(16),
    },
    activityContent: {
      flex: 1,
      marginRight: scale(12),
    },
    activityTitle: {
      fontSize: scale(16),
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: scale(4),
    },
    activityDescription: {
      fontSize: scale(14),
      color: colors.secondaryText,
      marginBottom: scale(6),
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activityGroup: {
      fontSize: scale(12),
      color: colors.primaryButton,
      fontWeight: '500',
      flex: 1,
      marginRight: scale(8),
    },
    activityTime: {
      fontSize: scale(12),
      color: colors.secondaryText,
    },
    activityAmount: {
      alignItems: 'flex-end',
      marginRight: scale(8),
    },
    amountText: {
      fontSize: scale(16),
      fontWeight: '700',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: scale(40),
      paddingTop: scale(100),
    },
    emptyStateTitle: {
      fontSize: scale(20),
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: scale(16),
      marginBottom: scale(8),
    },
    emptyStateDescription: {
      fontSize: scale(14),
      color: colors.secondaryText,
      textAlign: 'center',
      lineHeight: scale(20),
    },
    loadMoreContainer: {
      padding: scale(20),
      alignItems: 'center',
    },
    loadMoreText: {
      fontSize: scale(14),
      color: colors.secondaryText,
      fontStyle: 'italic',
    },
    deleteButtonContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FF3B30',
      width: scale(80),
    },
    deleteButton: {
      backgroundColor: '#FF3B30',
      justifyContent: 'center',
      alignItems: 'center',
      width: scale(80),
      height: '100%',
      paddingHorizontal: scale(10),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    deleteButtonLoading: {
      backgroundColor: '#FF6B60',
      opacity: 0.8,
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontSize: scale(11),
      fontWeight: '600',
      marginTop: scale(4),
      textAlign: 'center',
    },
    swipeableContainer: {
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    swipeableChildContainer: {
      backgroundColor: colors.cardBackground,
    },
    animatedContainer: {
      flex: 1,
    },
    gestureContainer: {
      flex: 1,
    },
  });