import { Platform } from 'react-native';
import { 
  request, 
  check, 
  PERMISSIONS, 
  RESULTS, 
  PermissionStatus,
  checkNotifications,
  requestNotifications,
  NotificationOption 
} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PERMISSION_KEY = 'notification_permission_requested';

export interface NotificationPermissionResult {
  granted: boolean;
  blocked: boolean;
  unavailable: boolean;
  previouslyRequested: boolean;
}

export class NotificationPermissionHelper {

  /**
   * Check if notification permission has been requested before
   */
  static async hasRequestedBefore(): Promise<boolean> {
    try {
      const requested = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
      return requested === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark that notification permission has been requested
   */
  static async markAsRequested(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Check current notification permission status
   */
  static async checkPermission(): Promise<NotificationPermissionResult> {
    try {
      const previouslyRequested = await this.hasRequestedBefore();
      
      // For iOS, use checkNotifications
      if (Platform.OS === 'ios') {
        const { status } = await checkNotifications();
        
        return {
          granted: status === 'granted',
          blocked: status === 'blocked' || status === 'denied',
          unavailable: status === 'unavailable',
          previouslyRequested,
        };
      }

      // For Android (API 33+), check notification permission
      // Note: POST_NOTIFICATIONS permission may not be in type definitions yet
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const permission = 'android.permission.POST_NOTIFICATIONS';
        const result = await check(permission as any);

        switch (result) {
          case RESULTS.GRANTED:
            return {
              granted: true,
              blocked: false,
              unavailable: false,
              previouslyRequested,
            };
          case RESULTS.DENIED:
            return {
              granted: false,
              blocked: false,
              unavailable: false,
              previouslyRequested,
            };
          case RESULTS.BLOCKED:
            return {
              granted: false,
              blocked: true,
              unavailable: false,
              previouslyRequested,
            };
          case RESULTS.UNAVAILABLE:
            return {
              granted: false,
              blocked: false,
              unavailable: true,
              previouslyRequested,
            };
          default:
            return {
              granted: false,
              blocked: false,
              unavailable: false,
              previouslyRequested,
            };
        }
      }

      // For older Android versions, notifications are allowed by default
      if (Platform.OS === 'android') {
        return {
          granted: true,
          blocked: false,
          unavailable: false,
          previouslyRequested: true,
        };
      }

      return {
        granted: false,
        blocked: false,
        unavailable: false,
        previouslyRequested,
      };
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return {
        granted: false,
        blocked: false,
        unavailable: false,
        previouslyRequested: false,
      };
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermissionResult> {
    try {
      // Mark as requested
      await this.markAsRequested();

      // For iOS
      if (Platform.OS === 'ios') {
        const options: NotificationOption[] = ['alert', 'badge', 'sound'];
        const { status } = await requestNotifications(options);
        
        return {
          granted: status === 'granted',
          blocked: status === 'blocked' || status === 'denied',
          unavailable: status === 'unavailable',
          previouslyRequested: true,
        };
      }

      // For Android API 33+
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const permission = 'android.permission.POST_NOTIFICATIONS';
        const result = await request(permission as any);

        switch (result) {
          case RESULTS.GRANTED:
            return {
              granted: true,
              blocked: false,
              unavailable: false,
              previouslyRequested: true,
            };
          case RESULTS.DENIED:
            return {
              granted: false,
              blocked: false,
              unavailable: false,
              previouslyRequested: true,
            };
          case RESULTS.BLOCKED:
            return {
              granted: false,
              blocked: true,
              unavailable: false,
              previouslyRequested: true,
            };
          default:
            return {
              granted: false,
              blocked: false,
              unavailable: false,
              previouslyRequested: true,
            };
        }
      }

      // For older Android versions
      if (Platform.OS === 'android') {
        return {
          granted: true,
          blocked: false,
          unavailable: false,
          previouslyRequested: true,
        };
      }

      return {
        granted: false,
        blocked: false,
        unavailable: false,
        previouslyRequested: true,
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return {
        granted: false,
        blocked: false,
        unavailable: false,
        previouslyRequested: true,
      };
    }
  }

  /**
   * Request notification permission if not already requested
   */
  static async requestPermissionIfNeeded(): Promise<NotificationPermissionResult | null> {
    const hasRequested = await this.hasRequestedBefore();
    
    if (!hasRequested) {
      return await this.requestPermission();
    }
    
    return null;
  }
}