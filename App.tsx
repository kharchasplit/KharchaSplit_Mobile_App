import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BiometricProvider, useBiometric } from './src/context/BiometricContext';
import { AuthenticatedNavigator } from './src/navigation/AuthenticatedNavigator';
import { UnauthenticatedNavigator } from './src/navigation/AppNavigator';
import { BiometricAuthScreen } from './src/screens/BiometricAuthScreen';
import { SplashScreen } from './src/screens/SplashScreen';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isBiometricLocked, setBiometricLocked } = useBiometric();
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  // Show splash screen first
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
    <ThemeProvider>
      <AuthProvider>
        <BiometricProvider>
          <AppContent />
        </BiometricProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
