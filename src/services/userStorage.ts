import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from './firebaseService';

const USER_KEY = 'user_profile';
const AUTH_TOKEN_KEY = 'auth_token';

export const userStorage = {
  async saveUser(user: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  async getUser(): Promise<UserProfile | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  },

  async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.getUser();
      const token = await this.getAuthToken();
      return user !== null && token !== null;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await this.removeUser();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
};