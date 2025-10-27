import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { s, vs } from '../utils/deviceDimensions';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Shimmer effect animation
    const shimmerAnimation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 2,
        duration: 1500,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Cleanup animations on unmount
    return () => {
      shimmerAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.8],
  });

  // Convert width to number if it's a percentage string
  const numericWidth = typeof width === 'string' && width.includes('%')
    ? undefined
    : typeof width === 'number'
    ? width
    : parseFloat(width as string);

  return (
    <View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.inputBackground,
        },
        styles.container,
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity,
            backgroundColor: colors.cardBackground,
          },
        ]}
      />
      {numericWidth && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [-1, 2],
                    outputRange: [-numericWidth, numericWidth],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.shimmerBar,
              {
                width: numericWidth * 0.5,
                backgroundColor: colors.background,
              }
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmerBar: {
    height: '100%',
    opacity: 0.3,
    transform: [{ skewX: '-20deg' }],
  },
});

// HomeScreen Skeleton Component
export const HomeScreenSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonLoader width={s(120)} height={vs(28)} borderRadius={s(6)} />
        <View style={styles.headerActions}>
          <SkeletonLoader width={s(32)} height={s(32)} borderRadius={s(16)} />
          <SkeletonLoader width={s(32)} height={s(32)} borderRadius={s(16)} />
        </View>
      </View>

      {/* Balance Section Skeleton */}
      <View style={styles.balanceSection}>
        <SkeletonLoader width={s(140)} height={vs(20)} borderRadius={s(4)} style={{ marginBottom: vs(16) }} />
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <SkeletonLoader width={s(80)} height={vs(14)} borderRadius={s(4)} style={{ marginBottom: vs(8) }} />
            <SkeletonLoader width={s(60)} height={vs(18)} borderRadius={s(4)} />
          </View>
          <View style={styles.balanceItem}>
            <SkeletonLoader width={s(80)} height={vs(14)} borderRadius={s(4)} style={{ marginBottom: vs(8) }} />
            <SkeletonLoader width={s(60)} height={vs(18)} borderRadius={s(4)} />
          </View>
          <View style={styles.balanceItem}>
            <SkeletonLoader width={s(80)} height={vs(14)} borderRadius={s(4)} style={{ marginBottom: vs(8) }} />
            <SkeletonLoader width={s(60)} height={vs(18)} borderRadius={s(4)} />
          </View>
        </View>
      </View>

      {/* Groups List Skeleton */}
      {[1, 2, 3].map((index) => (
        <View key={index} style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <SkeletonLoader width={s(50)} height={s(50)} borderRadius={s(25)} />
            <View style={styles.groupInfo}>
              <SkeletonLoader width={s(150)} height={vs(20)} borderRadius={s(4)} style={{ marginBottom: vs(6) }} />
              <SkeletonLoader width={s(100)} height={vs(14)} borderRadius={s(4)} style={{ marginBottom: vs(6) }} />
              <SkeletonLoader width={s(80)} height={vs(14)} borderRadius={s(4)} />
            </View>
          </View>
          <View style={styles.groupDetails}>
            <View style={styles.detailRow}>
              <SkeletonLoader width={s(120)} height={vs(16)} borderRadius={s(4)} />
              <SkeletonLoader width={s(50)} height={vs(16)} borderRadius={s(4)} />
            </View>
            <View style={styles.detailRow}>
              <SkeletonLoader width={s(140)} height={vs(16)} borderRadius={s(4)} />
              <SkeletonLoader width={s(40)} height={vs(16)} borderRadius={s(4)} />
            </View>
          </View>
        </View>
      ))}
    </View>
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
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    backgroundColor: colors.cardBackground,
  },
  headerActions: {
    flexDirection: 'row',
    gap: s(12),
  },
  balanceSection: {
    backgroundColor: colors.cardBackground,
    margin: s(16),
    padding: s(12),
    borderRadius: s(8),
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  groupCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: s(16),
    marginVertical: vs(8),
    padding: s(12),
    borderRadius: s(8),
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vs(12),
  },
  groupInfo: {
    flex: 1,
    marginLeft: s(12),
  },
  groupDetails: {
    paddingLeft: s(8),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(6),
  },
});

// ActivityScreen Skeleton Component
export const ActivityScreenSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createActivitySkeletonStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonLoader width={s(160)} height={vs(28)} borderRadius={s(6)} />
      </View>

      {/* Activity Items Skeleton */}
      <View style={styles.content}>
        {[1, 2, 3, 4, 5, 6, 7].map((index) => (
          <View key={index} style={styles.activityItem}>
            {/* Activity Icon */}
            <SkeletonLoader width={s(48)} height={s(48)} borderRadius={s(24)} />
            
            {/* Activity Content */}
            <View style={styles.activityContent}>
              <SkeletonLoader width={s(200)} height={vs(18)} borderRadius={s(4)} style={{ marginBottom: vs(6) }} />
              <SkeletonLoader width={s(160)} height={vs(14)} borderRadius={s(4)} style={{ marginBottom: vs(8) }} />
              <View style={styles.activityMeta}>
                <SkeletonLoader width={s(100)} height={vs(12)} borderRadius={s(4)} />
                <SkeletonLoader width={s(60)} height={vs(12)} borderRadius={s(4)} />
              </View>
            </View>
            
            {/* Amount and Arrow */}
            <View style={styles.activityRight}>
              <SkeletonLoader width={s(60)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(4) }} />
              <SkeletonLoader width={s(16)} height={vs(16)} borderRadius={s(2)} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const createActivitySkeletonStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: s(20),
    paddingVertical: vs(16),
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.secondaryText + '20',
  },
  content: {
    flex: 1,
    paddingVertical: vs(8),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingVertical: vs(16),
    backgroundColor: colors.cardBackground,
    marginVertical: vs(1),
  },
  activityContent: {
    flex: 1,
    marginLeft: s(16),
    marginRight: s(12),
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityRight: {
    alignItems: 'flex-end',
    marginRight: s(8),
  },
});

// GroupDetailScreen Tab Skeleton Components
export const ExpensesSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createExpensesSkeletonStyles(colors);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((index) => (
        <View key={index} style={styles.expenseItem}>
          {/* Category Icon */}
          <SkeletonLoader width={s(48)} height={s(48)} borderRadius={s(24)} />
          
          {/* Expense Content */}
          <View style={styles.expenseContent}>
            <SkeletonLoader width={s(180)} height={vs(18)} borderRadius={s(4)} style={{ marginBottom: vs(4) }} />
            <SkeletonLoader width={s(120)} height={vs(14)} borderRadius={s(4)} style={{ marginBottom: vs(6) }} />
            <SkeletonLoader width={s(80)} height={vs(12)} borderRadius={s(4)} />
          </View>
          
          {/* Amount and Share */}
          <View style={styles.expenseAmount}>
            <SkeletonLoader width={s(60)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(4) }} />
            <SkeletonLoader width={s(50)} height={vs(14)} borderRadius={s(4)} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const BalancesSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createBalancesSkeletonStyles(colors);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((index) => (
        <View key={index} style={styles.balanceItem}>
          {/* User Avatar */}
          <SkeletonLoader width={s(50)} height={s(50)} borderRadius={s(25)} />
          
          {/* Balance Content */}
          <View style={styles.balanceContent}>
            <SkeletonLoader width={s(140)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(6) }} />
            <SkeletonLoader width={s(100)} height={vs(14)} borderRadius={s(4)} />
          </View>
          
          {/* Amount and Arrow */}
          <View style={styles.balanceRight}>
            <SkeletonLoader width={s(70)} height={vs(18)} borderRadius={s(4)} style={{ marginBottom: vs(4) }} />
            <SkeletonLoader width={s(16)} height={vs(16)} borderRadius={s(2)} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const SettlementSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createSettlementSkeletonStyles(colors);

  return (
    <View style={styles.container}>
      {[1, 2, 3].map((index) => (
        <View key={index} style={styles.settlementItem}>
          {/* Status Icon */}
          <SkeletonLoader width={s(24)} height={s(24)} borderRadius={s(12)} />
          
          {/* Settlement Content */}
          <View style={styles.settlementContent}>
            <SkeletonLoader width={s(200)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(8) }} />
            <View style={styles.settlementMeta}>
              <SkeletonLoader width={s(80)} height={vs(14)} borderRadius={s(4)} />
              <SkeletonLoader width={s(60)} height={vs(14)} borderRadius={s(4)} />
            </View>
          </View>
          
          {/* Action Button */}
          <SkeletonLoader width={s(80)} height={vs(32)} borderRadius={s(16)} />
        </View>
      ))}
    </View>
  );
};

const createExpensesSkeletonStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    paddingVertical: vs(8),
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingVertical: vs(16),
    backgroundColor: colors.cardBackground,
    marginVertical: vs(2),
  },
  expenseContent: {
    flex: 1,
    marginLeft: s(16),
    marginRight: s(12),
  },
  expenseAmount: {
    alignItems: 'flex-end',
    marginRight: s(8),
  },
});

const createBalancesSkeletonStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    paddingVertical: vs(8),
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingVertical: vs(16),
    backgroundColor: colors.cardBackground,
    marginVertical: vs(2),
  },
  balanceContent: {
    flex: 1,
    marginLeft: s(16),
    marginRight: s(12),
  },
  balanceRight: {
    alignItems: 'flex-end',
    marginRight: s(8),
  },
});

const createSettlementSkeletonStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    paddingVertical: vs(8),
  },
  settlementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingVertical: vs(16),
    backgroundColor: colors.cardBackground,
    marginVertical: vs(2),
  },
  settlementContent: {
    flex: 1,
    marginLeft: s(16),
    marginRight: s(12),
  },
  settlementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

// ExpenseDetailScreen Skeleton Component
export const ExpenseDetailSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createExpenseDetailSkeletonStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonLoader width={s(24)} height={s(24)} borderRadius={s(12)} />
        <SkeletonLoader width={s(120)} height={vs(20)} borderRadius={s(4)} />
        <SkeletonLoader width={s(24)} height={s(24)} borderRadius={s(12)} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Expense Header */}
        <View style={styles.expenseHeader}>
          <SkeletonLoader width={s(60)} height={s(60)} borderRadius={s(30)} />
          <View style={styles.expenseInfo}>
            <SkeletonLoader width={s(180)} height={vs(20)} borderRadius={s(4)} style={{ marginBottom: vs(6) }} />
            <SkeletonLoader width={s(120)} height={vs(14)} borderRadius={s(4)} style={{ marginBottom: vs(4) }} />
            <SkeletonLoader width={s(100)} height={vs(12)} borderRadius={s(4)} />
          </View>
          <SkeletonLoader width={s(80)} height={vs(24)} borderRadius={s(4)} />
        </View>

        {/* Paid By Section */}
        <View style={styles.section}>
          <SkeletonLoader width={s(80)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(12) }} />
          <View style={styles.paidByContainer}>
            <SkeletonLoader width={s(50)} height={s(50)} borderRadius={s(25)} />
            <View style={styles.paidByInfo}>
              <SkeletonLoader width={s(120)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(6) }} />
              <SkeletonLoader width={s(100)} height={vs(14)} borderRadius={s(4)} />
            </View>
          </View>
        </View>

        {/* Split Details Section */}
        <View style={styles.section}>
          <SkeletonLoader width={s(100)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(12) }} />
          <View style={styles.splitTypeContainer}>
            <SkeletonLoader width={s(20)} height={s(20)} borderRadius={s(10)} />
            <SkeletonLoader width={s(140)} height={vs(16)} borderRadius={s(4)} />
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.section}>
          <SkeletonLoader width={s(120)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(12) }} />
          {[1, 2, 3].map((index) => (
            <View key={index} style={styles.participantItem}>
              <SkeletonLoader width={s(40)} height={s(40)} borderRadius={s(20)} />
              <View style={styles.participantInfo}>
                <SkeletonLoader width={s(120)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(4) }} />
                <SkeletonLoader width={s(100)} height={vs(12)} borderRadius={s(4)} />
              </View>
              <SkeletonLoader width={s(60)} height={vs(16)} borderRadius={s(4)} />
            </View>
          ))}
        </View>

        {/* Receipt Section */}
        <View style={styles.section}>
          <SkeletonLoader width={s(80)} height={vs(16)} borderRadius={s(4)} style={{ marginBottom: vs(12) }} />
          <SkeletonLoader width="100%" height={vs(200)} borderRadius={s(8)} />
        </View>
      </View>
    </View>
  );
};

const createExpenseDetailSkeletonStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    backgroundColor: colors.cardBackground,
  },
  content: {
    flex: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(20),
    backgroundColor: colors.cardBackground,
    marginBottom: vs(8),
  },
  expenseInfo: {
    flex: 1,
    marginLeft: s(16),
    marginRight: s(12),
  },
  section: {
    backgroundColor: colors.cardBackground,
    marginVertical: vs(4),
    padding: s(16),
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidByInfo: {
    flex: 1,
    marginLeft: s(12),
  },
  splitTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  participantInfo: {
    flex: 1,
    marginLeft: s(12),
    marginRight: s(12),
  },
});