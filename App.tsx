import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BiometricProvider, useBiometric } from './src/context/BiometricContext';
import { AuthenticatedNavigator } from './src/navigation/AuthenticatedNavigator';
import { UnauthenticatedNavigator } from './src/navigation/AppNavigator';
import { BiometricAuthScreen } from './src/screens/BiometricAuthScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import messaging from '@react-native-firebase/messaging';
import { FCMService } from './src/services/FCMService';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isBiometricLocked, setBiometricLocked } = useBiometric();
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  // Initialize FCM when user is authenticated (non-blocking)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Run FCM initialization in background without blocking UI
      const initializeFCM = async () => {
        try {
          // Delay FCM initialization slightly to not block initial render
          await new Promise<void>(resolve => setTimeout(resolve, 100));

          // Request permission and initialize FCM
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

          if (enabled) {
            // Initialize background message handler is already done in index.js
            await FCMService.initialize(user.id);
          }
        } catch (error) {
          console.error('FCM initialization error:', error);
        }
      };

      // Don't await - let it run in background
      initializeFCM();
    }
  }, [isAuthenticated, user]);

  // Show splash screen first (colors are now guaranteed to be available)
  if (showSplash) {
    return (
      <SplashScreen onAnimationEnd={() => setShowSplash(false)} />
    );
  }

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}>
        <ActivityIndicator size="large" color={colors.primaryButton} />
      </View>
    );
  }

  // Show biometric lock screen if user is authenticated but app is biometrically locked
  if (isAuthenticated && isBiometricLocked) {
    return (
      <BiometricAuthScreen
        onAuthenticated={() => setBiometricLocked(false)}
      />
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedNavigator /> : <UnauthenticatedNavigator />}
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <BiometricProvider>
            <AppContent />
          </BiometricProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
