import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
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
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<StackParamList>();

interface TabBarIconProps {
  name: keyof TabParamList;
  focused: boolean;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused }) => {
  const { colors } = useTheme();
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return <MaterialIcons
          name="group"
          size={24}
          color={focused ? colors.activeIcon : colors.inactiveIcon}
        />;
      case 'Activity':
        return <MaterialIcons
          name="notifications"
          size={24}
          color={focused ? colors.activeIcon : colors.inactiveIcon}
        />;
      case 'Profile':
        return <Ionicons
          name="person"
          size={24}
          color={focused ? colors.activeIcon : colors.inactiveIcon}
        />;
      default:
        return <MaterialIcons
          name="error"
          size={24}
          color={focused ? colors.activeIcon : colors.inactiveIcon}
        />;
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
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
    </Stack.Navigator>
  );
};

// Main Tab Navigator for authenticated users
export const AuthenticatedNavigator: React.FC = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }): BottomTabNavigationOptions => ({
        tabBarIcon: ({ focused }) => <TabBarIcon name={route.name as keyof TabParamList} focused={focused} />,
        tabBarActiveTintColor: colors.activeIcon,
        tabBarInactiveTintColor: colors.inactiveIcon,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.background,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.background,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.primaryText,
        },
        headerTintColor: colors.activeIcon,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ title: 'My Groups', headerShown: false }} />
      <Tab.Screen name="Activity" component={ActivityScreen} options={{ title: 'Activity', headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerShown: false }} />
    </Tab.Navigator>
  );
};