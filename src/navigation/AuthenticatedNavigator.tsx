import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { iconSizes, spacing, vs, hp, s, isTablet, getDeviceInfo, isSmallDevice } from '../utils/deviceDimensions';
import { typography } from '../utils/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { HomeScreen } from '../screens/HomeScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { GroupDetailsScreen } from '../screens/GroupDetailsScreen';
import { ManageGroupScreen } from '../screens/ManageGroupScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { AddMemberScreen } from '../screens/AddMemberScreen';
import { ExpenseDetailScreen } from '../screens/ExpenseDetailScreen';
import { ViewReceiptScreen } from '../screens/ViewReceiptScreen';
import { AllGroupsScreen } from '../screens/AllGroupsScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';

type TabParamList = {
  Home: undefined;
  Activity: undefined;
  Profile: undefined;
};

type StackParamList = {
  HomeMain: undefined;
  GroupDetail: { group: any };
  GroupDetails: { group: any };
  ManageGroup: { group: any };
  AddExpense: { group: any };
  AddMember: { group: any };
  ExpenseDetail: { expense: any; group: any };
  ViewReceipt: { receiptBase64: string; expenseDescription?: string };
  AllGroups: undefined;
  PaymentHistory: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<StackParamList>();
const ProfileStack = createStackNavigator();

interface TabBarIconProps {
  name: keyof TabParamList;
  focused: boolean;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused }) => {
  const { colors } = useTheme();

  // Get responsive icon size based on device type
  const getIconSize = () => {
    if (isTablet()) {
      return iconSizes.lg; // Larger icons for tablets
    } else if (isSmallDevice()) {
      return iconSizes.sm; // Smaller icons for small devices
    } else {
      return iconSizes.md; // Default size for medium/large devices
    }
  };

  const iconSize = getIconSize();

  const getIcon = () => {
    switch (name) {
      case 'Home':
        return <MaterialIcons
          name="group"
          size={iconSize}
          color={focused ? colors.activeIcon : colors.inactiveIcon}
        />;
      case 'Activity':
        return <MaterialIcons
          name="notifications"
          size={iconSize}
          color={focused ? colors.activeIcon : colors.inactiveIcon}
        />;
      case 'Profile':
        return <Ionicons
          name="person"
          size={iconSize}
          color={focused ? colors.activeIcon : colors.inactiveIcon}
        />;
      default:
        return <MaterialIcons
          name="error"
          size={iconSize}
          color={focused ? colors.activeIcon : colors.inactiveIcon}
        />;
    }
  };

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: s(24), // Minimum touch target
      minWidth: s(24),
    }}>
      {getIcon()}
    </View>
  );
};

// Home Stack Navigator
export const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="ManageGroup" component={ManageGroupScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="AddMember" component={AddMemberScreen} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <Stack.Screen name="ViewReceipt" component={ViewReceiptScreen} />
      <Stack.Screen name="AllGroups" component={AllGroupsScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
export const ProfileStackNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator for authenticated users
export const AuthenticatedNavigator: React.FC = () => {
  const { colors } = useTheme();
  const deviceInfo = getDeviceInfo();
  const insets = useSafeAreaInsets();

  // Calculate responsive tab bar height based on device
  const getTabBarHeight = () => {
    let baseHeight;
    if (isTablet()) {
      baseHeight = vs(72); // Tablets need more height
    } else if (isSmallDevice()) {
      baseHeight = vs(56); // Small devices get compact height
    } else {
      baseHeight = vs(64); // Default height for medium/large devices
    }

    // Add safe area bottom inset for proper spacing above home indicator
    return baseHeight + insets.bottom;
  };

  // Calculate responsive tab bar padding
  const getTabBarPadding = () => {
    if (isTablet()) {
      return {
        paddingTop: spacing.md,
        paddingBottom: Math.max(spacing.sm, insets.bottom * 0.5), // Use safe area or minimum padding
        paddingHorizontal: spacing.lg,
      };
    } else if (isSmallDevice()) {
      return {
        paddingTop: spacing.xs,
        paddingBottom: Math.max(spacing.xs, insets.bottom * 0.5), // Use safe area or minimum padding
        paddingHorizontal: spacing.sm,
      };
    } else {
      return {
        paddingTop: spacing.sm,
        paddingBottom: Math.max(spacing.sm, insets.bottom * 0.5), // Use safe area or minimum padding
        paddingHorizontal: spacing.md,
      };
    }
  };

  const tabBarPadding = getTabBarPadding();

  return (
    <Tab.Navigator
      screenOptions={({ route }): BottomTabNavigationOptions => ({
        tabBarIcon: ({ focused }) => <TabBarIcon name={route.name as keyof TabParamList} focused={focused} />,
        tabBarActiveTintColor: colors.activeIcon,
        tabBarInactiveTintColor: colors.inactiveIcon,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.background,
          borderTopWidth: s(1),
          height: getTabBarHeight(),
          paddingTop: tabBarPadding.paddingTop,
          paddingHorizontal: tabBarPadding.paddingHorizontal,
          // Position the tab bar properly above the safe area
          paddingBottom: insets.bottom > 0 ? insets.bottom : tabBarPadding.paddingBottom,
          // Add shadow for better visibility
          shadowColor: colors.primaryText,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: s(4),
          elevation: 5,
        },
        headerStyle: {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.background,
          borderBottomWidth: s(1),
          height: vs(56), // Responsive header height
        },
        headerTitleStyle: {
          ...typography.text.navTitle,
          color: colors.primaryText,
          fontSize: s(18), // Responsive font size
        },
        tabBarLabelStyle: {
          ...typography.text.tabLabel,
          fontSize: s(12), // Responsive tab label font size
          marginBottom: isSmallDevice() ? s(2) : s(4),
        },
        headerTintColor: colors.activeIcon,
        // Adjust tab bar item alignment for different devices
        tabBarItemStyle: {
          paddingVertical: isSmallDevice() ? s(4) : s(6),
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ title: 'My Groups', headerShown: false }} />
      <Tab.Screen name="Activity" component={ActivityScreen} options={{ title: 'Activity', headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ title: 'Profile', headerShown: false }} />
    </Tab.Navigator>
  );
};