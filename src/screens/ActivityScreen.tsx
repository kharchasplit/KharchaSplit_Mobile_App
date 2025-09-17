import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Activity {
  id: string;
  type: 'expense_added' | 'payment_made' | 'group_created';
  title: string;
  time: string;
  group: string | null;
  amount: string | null;
  groupId?: string;
}

interface ActivityScreenProps {
  navigation: any;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMockActivities();
  }, []);

  const loadMockActivities = () => {
    setLoading(true);
    setTimeout(() => {
      const mock: Activity[] = [
        {
          id: '1',
          type: 'expense_added',
          title: 'You added "Lunch at Goa"',
          time: '2h ago',
          group: 'Trip to Goa',
          amount: '₹500',
          groupId: '1',
        },
        {
          id: '2',
          type: 'payment_made',
          title: 'Alice paid you',
          time: '1d ago',
          group: 'Birthday Party',
          amount: '₹300',
          groupId: '2',
        },
        {
          id: '3',
          type: 'group_created',
          title: 'You created "Weekend Getaway"',
          time: '3d ago',
          group: null,
          amount: null,
          groupId: '3',
        },
      ];
      setActivities(mock);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMockActivities();
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'expense_added':
        return '💰';
      case 'payment_made':
        return '💸';
      case 'group_created':
        return '👥';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'expense_added':
        return '#F59E0B';
      case 'payment_made':
        return '#10B981';
      case 'group_created':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
       <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Activity</Text>
      </View> 

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryButton]} />}
      >
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primaryButton} />
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : activities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No recent activity</Text>
              <Text style={styles.emptySubtext}>Your group activities will appear here</Text>
            </View>
          ) : (
            activities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => {
                  if (activity.groupId) {
                    const group = { id: activity.groupId, name: activity.group };
                    navigation.navigate('GroupDetail', { group });
                  }
                }}
              >
                <View style={styles.activityHeader}>
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: getActivityColor(activity.type) + '20' },
                    ]}
                  >
                    <Text style={styles.activityIconText}>{getActivityIcon(activity.type)}</Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    {activity.group && <Text style={styles.activityGroup}>in {activity.group}</Text>}
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  {activity.amount && (
                    <Text style={[styles.activityAmount, { color: getActivityColor(activity.type) }]}>
                      {activity.amount}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primaryText },
    scrollView: { flex: 1 },
    content: { padding: 16 },
    activityCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.primaryText,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    activityHeader: { flexDirection: 'row', alignItems: 'center' },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityIconText: { fontSize: 18 },
    activityContent: { flex: 1 },
    activityTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 4 },
    activityGroup: { fontSize: 14, color: colors.secondaryText, marginBottom: 4 },
    activityTime: { fontSize: 12, color: colors.secondaryText },
    activityAmount: { fontSize: 16, fontWeight: 'bold' },
    loadingContainer: { alignItems: 'center', paddingVertical: 40 },
    loadingText: { fontSize: 16, color: colors.secondaryText, marginTop: 16 },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '600', color: colors.secondaryText, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: colors.secondaryText, textAlign: 'center' },
  });

