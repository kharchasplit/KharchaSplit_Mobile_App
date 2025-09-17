import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';

export type UnauthenticatedStackParamList = {
  Login: undefined;
  OTPVerification: { phoneNumber: string };
  ProfileSetup: { phoneNumber: string };
};

const Stack = createNativeStackNavigator<UnauthenticatedStackParamList>();

export const UnauthenticatedNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
};