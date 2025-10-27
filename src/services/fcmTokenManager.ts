import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { firebaseService } from './firebaseService';

const FCM_TOKEN_KEY = 'fcm_token';

export class FCMTokenManager {
  /**
   * Force refresh and save FCM token for current user
   */
  static async refreshAndSaveToken(userId: string): Promise<string | null> {
    try {

      // Register device for remote messages first
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      } else {
        const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
        if (!isRegistered) {
          await messaging().registerDeviceForRemoteMessages();
        }
      }

      // Try to delete old token, but don't fail if it doesn't exist
      try {
        await messaging().deleteToken();
      } catch (deleteError) {
        // Token deletion failed, but continue with new token generation
      }

      // Get new token
      const newToken = await messaging().getToken();

      if (newToken) {
        // Save to AsyncStorage
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
        
        // Save to Firebase user document
        await firebaseService.updateUser(userId, { fcmToken: newToken });
        
        return newToken;
      }

      return null;
    } catch (error) {
      console.error('❌ Error refreshing FCM token:', error);
      return null;
    }
  }

  /**
   * Get and save FCM token without deleting old one (gentler approach)
   */
  static async getAndSaveToken(userId: string): Promise<string | null> {
    try {

      // Register device for remote messages first
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      } else {
        const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
        if (!isRegistered) {
          await messaging().registerDeviceForRemoteMessages();
        }
      }

      // Get current token (don't delete old one)
      const currentToken = await messaging().getToken();

      if (currentToken) {
        // Save to AsyncStorage
        await AsyncStorage.setItem(FCM_TOKEN_KEY, currentToken);
        
        // Save to Firebase user document
        await firebaseService.updateUser(userId, { fcmToken: currentToken });
        
        return currentToken;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Check if current user has FCM token in Firebase
   */
  static async checkUserToken(userId: string): Promise<boolean> {
    try {
      const user = await firebaseService.getUserById(userId);
      const hasToken = !!user?.fcmToken;
      
      // Return token status without logging

      return hasToken;
    } catch (error) {
      console.error('❌ Error checking user token:', error);
      return false;
    }
  }

  /**
   * Get all users in a group and their token status
   */
  static async checkGroupTokens(groupId: string): Promise<void> {
    try {
      const group = await firebaseService.getGroupById(groupId);
      if (!group) {
        return;
      }

      // Check tokens for all group members (silently)
      for (const member of group.members) {
        await this.checkUserToken(member.userId);
      }
    } catch (error) {
      console.error('❌ Error checking group tokens:', error);
    }
  }
}