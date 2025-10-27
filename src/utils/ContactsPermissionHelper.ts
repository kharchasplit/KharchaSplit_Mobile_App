import { Platform, Alert } from 'react-native';
import { request, check, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

export interface ContactPermissionResult {
  granted: boolean;
  blocked: boolean;
  unavailable: boolean;
  shouldShowRationale: boolean;
}


export class ContactsPermissionHelper {
  private static getPermission() {
    return Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.READ_CONTACTS
      : PERMISSIONS.IOS.CONTACTS;
  }

  /**
   * Check current permission status without requesting
   */
  static async checkPermission(): Promise<ContactPermissionResult> {
    try {
      const permission = this.getPermission();
      const result = await check(permission);


      switch (result) {
        case RESULTS.GRANTED:
          return {
            granted: true,
            blocked: false,
            unavailable: false,
            shouldShowRationale: false,
          };
        case RESULTS.DENIED:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
            shouldShowRationale: true,
          };
        case RESULTS.BLOCKED:
          return {
            granted: false,
            blocked: true,
            unavailable: false,
            shouldShowRationale: false,
          };
        case RESULTS.UNAVAILABLE:
          return {
            granted: false,
            blocked: false,
            unavailable: true,
            shouldShowRationale: false,
          };
        default:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
            shouldShowRationale: true,
          };
      }
    } catch (error) {
      console.error('ContactsPermissionHelper - Error checking permission:', error);
      return {
        granted: false,
        blocked: false,
        unavailable: false,
        shouldShowRationale: true,
      };
    }
  }

  /**
   * Request contacts permission
   */
  static async requestPermission(): Promise<ContactPermissionResult> {
    try {

      const permission = this.getPermission();
      const result = await request(permission);


      switch (result) {
        case RESULTS.GRANTED:
          return {
            granted: true,
            blocked: false,
            unavailable: false,
            shouldShowRationale: false,
          };
        case RESULTS.DENIED:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
            shouldShowRationale: true,
          };
        case RESULTS.BLOCKED:
          return {
            granted: false,
            blocked: true,
            unavailable: false,
            shouldShowRationale: false,
          };
        case RESULTS.UNAVAILABLE:
          return {
            granted: false,
            blocked: false,
            unavailable: true,
            shouldShowRationale: false,
          };
        default:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
            shouldShowRationale: true,
          };
      }
    } catch (error) {
      console.error('ContactsPermissionHelper - Error requesting permission:', error);
      return {
        granted: false,
        blocked: false,
        unavailable: false,
        shouldShowRationale: true,
      };
    }
  }


  /**
   * Show permission explanation dialog
   */
  static showPermissionRationale(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Contacts Access Required',
        'KharchaSplit needs access to your contacts to help you easily add friends who are already using the app to your groups.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Grant Access',
            onPress: () => resolve(true)
          },
        ]
      );
    });
  }

  /**
   * Show blocked permission dialog with settings option
   */
  static showPermissionBlockedDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Contacts Access Required',
        'Contacts access has been blocked. To add friends from your contacts, please enable contacts access in your device settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Open Settings',
            onPress: () => {
              openSettings().catch(err => console.error('Error opening settings:', err));
              resolve(true);
            }
          },
        ]
      );
    });
  }

  /**
   * Show unavailable contacts dialog
   */
  static showUnavailableDialog(): void {
    Alert.alert(
      'Contacts Unavailable',
      'Contacts are not available on this device. You can still create groups by entering phone numbers manually.',
      [{ text: 'OK' }]
    );
  }
}