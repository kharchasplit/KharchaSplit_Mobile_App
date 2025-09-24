import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { firebaseService } from './firebaseService';

const FCM_TOKEN_KEY = 'fcm_token';

export class FCMService {
  /**
   * Initialize FCM and notification services
   */
  static async initialize(userId: string) {
    try {
      // Request notification permissions (handled by NotificationPermissionHelper)
      const authStatus = await messaging().requestPermission();
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        return;
      }

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        await this.createAndroidChannels();
      }

      // Get and save FCM token
      await this.getAndSaveFCMToken(userId);

      // Set up message handlers
      this.setupMessageHandlers();

      // Set up notification interaction handlers
      this.setupNotificationHandlers();

    } catch (error) {
      console.error('❌ FCM initialization error:', error);
    }
  }

  /**
   * Create Android notification channels
   */
  static async createAndroidChannels() {
    // Create channels for different notification types
    await notifee.createChannel({
      id: 'expenses',
      name: 'Expenses',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'payments',
      name: 'Payments & Settlements',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'groups',
      name: 'Group Activities',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'default',
      name: 'General Notifications',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  /**
   * Get and save FCM token
   */
  static async getAndSaveFCMToken(userId: string) {
    try {
      // Register device for remote messages first (required for iOS and some Android versions)
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      } else {
        // For Android, check if we need to register
        const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
        
        if (!isRegistered) {
          await messaging().registerDeviceForRemoteMessages();
        }
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      
      if (fcmToken) {
        // Save to AsyncStorage
        await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
        
        // Save to Firebase for this user
        await firebaseService.updateUser(userId, { fcmToken });
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
    }
  }

  /**
   * Setup FCM message handlers
   */
  static setupMessageHandlers() {
    // Foreground message handler
    messaging().onMessage(async remoteMessage => {
      // Display notification using Notifee when app is in foreground
      try {
        await this.displayNotification(remoteMessage);
      } catch (error) {
        console.error('❌ Error displaying foreground notification:', error);
      }
    });
  }

  /**
   * Setup notification interaction handlers
   */
  static setupNotificationHandlers() {
    // Handle notification interactions (when user taps on notification)
    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          // Handle notification press
          this.handleNotificationPress(detail.notification);
          break;
      }
    });

    // Handle background notification interactions
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        // Handle notification press in background
        this.handleNotificationPress(detail.notification);
      }
    });
  }

  /**
   * Display notification using Notifee (for foreground)
   */
  static async displayNotification(remoteMessage: any) {
    const { notification, data } = remoteMessage;

    if (!notification) return;

    // Determine channel based on activity type
    let channelId = 'default';
    if (data?.activityType) {
      switch (data.activityType) {
        case 'expense_added':
          channelId = 'expenses';
          break;
        case 'payment_made':
        case 'settlement_created':
        case 'settlement_confirmed':
          channelId = 'payments';
          break;
        case 'group_created':
        case 'group_joined':
          channelId = 'groups';
          break;
      }
    }

    // Create notification request
    const notificationRequest: any = {
      title: notification.title,
      body: notification.body,
      data: data || {},
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        smallIcon: 'ic_notification', // Make sure to add this icon
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    };

    // Add group summary for Android
    if (Platform.OS === 'android' && data?.groupId) {
      notificationRequest.android.groupId = data.groupId;
      notificationRequest.android.groupSummary = true;
    }

    // Display the notification
    await notifee.displayNotification(notificationRequest);
  }

  /**
   * Handle notification press
   */
  static handleNotificationPress(notification: any) {
    // This will be handled by the navigation service
    // For now, we'll just log it
    const { data } = notification;
    
    if (data?.groupId) {
      // Navigate to group detail screen
      // This should be handled by your navigation service
    }
  }

  /**
   * Update FCM token if changed
   */
  static async checkAndUpdateToken(userId: string) {
    try {
      const savedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      const currentToken = await messaging().getToken();

      if (currentToken && currentToken !== savedToken) {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, currentToken);
        await firebaseService.updateUser(userId, { fcmToken: currentToken });
      }
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }

  /**
   * Clean up FCM token on logout
   */
  static async cleanup() {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    } catch (error) {
      console.error('Error cleaning up FCM:', error);
    }
  }

}