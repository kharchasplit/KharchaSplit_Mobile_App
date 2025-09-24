import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { userStorage } from '../services/userStorage';
import { authService } from '../services/authService';
import { UserProfile } from '../services/firebaseService';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const isLoggedIn = await userStorage.isLoggedIn();
      if (isLoggedIn) {
        const userData = await userStorage.getUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: UserProfile) => {
    setUser(userData);
  };

  const logout = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);

                // Clear user data from storage
                await userStorage.logout();

                // Clear any cached auth data
                const phoneNumber = user?.phoneNumber;
                if (phoneNumber) {
                  await authService.clearOTP(phoneNumber);
                }

                // Clear user from context
                setUser(null);

                resolve();
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to logout. Please try again.');
                reject(error);
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        { cancelable: false }
      );
    });
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};