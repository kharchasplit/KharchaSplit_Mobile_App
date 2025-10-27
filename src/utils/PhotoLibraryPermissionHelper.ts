import { Platform, Alert, Linking } from 'react-native';
import { 
  request, 
  check, 
  PERMISSIONS, 
  RESULTS,
  openSettings 
} from 'react-native-permissions';

export interface PhotoPermissionResult {
  granted: boolean;
  blocked: boolean;
  unavailable: boolean;
}

export class PhotoLibraryPermissionHelper {
  /**
   * Get the platform-specific photo library permission
   */
  private static getPhotoLibraryPermission() {
    if (Platform.OS === 'android') {
      // Android 13+ uses different permissions
      if (Platform.Version >= 33) {
        return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
      }
      // Older Android versions
      return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
    }
    // iOS
    return PERMISSIONS.IOS.PHOTO_LIBRARY;
  }

  /**
   * Get the camera permission
   */
  private static getCameraPermission() {
    return Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.CAMERA
      : PERMISSIONS.IOS.CAMERA;
  }

  /**
   * Check photo library permission status
   */
  static async checkPhotoLibraryPermission(): Promise<PhotoPermissionResult> {
    try {
      const permission = this.getPhotoLibraryPermission();
      const result = await check(permission);

      switch (result) {
        case RESULTS.GRANTED:
          return {
            granted: true,
            blocked: false,
            unavailable: false,
          };
        case RESULTS.DENIED:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
          };
        case RESULTS.BLOCKED:
          return {
            granted: false,
            blocked: true,
            unavailable: false,
          };
        case RESULTS.UNAVAILABLE:
          return {
            granted: false,
            blocked: false,
            unavailable: true,
          };
        default:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
          };
      }
    } catch (error) {
      console.error('Error checking photo library permission:', error);
      return {
        granted: false,
        blocked: false,
        unavailable: false,
      };
    }
  }

  /**
   * Check camera permission status
   */
  static async checkCameraPermission(): Promise<PhotoPermissionResult> {
    try {
      const permission = this.getCameraPermission();
      const result = await check(permission);

      switch (result) {
        case RESULTS.GRANTED:
          return {
            granted: true,
            blocked: false,
            unavailable: false,
          };
        case RESULTS.DENIED:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
          };
        case RESULTS.BLOCKED:
          return {
            granted: false,
            blocked: true,
            unavailable: false,
          };
        case RESULTS.UNAVAILABLE:
          return {
            granted: false,
            blocked: false,
            unavailable: true,
          };
        default:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
          };
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return {
        granted: false,
        blocked: false,
        unavailable: false,
      };
    }
  }

  /**
   * Request photo library permission
   */
  static async requestPhotoLibraryPermission(): Promise<PhotoPermissionResult> {
    try {
      const permission = this.getPhotoLibraryPermission();
      const result = await request(permission);

      switch (result) {
        case RESULTS.GRANTED:
          return {
            granted: true,
            blocked: false,
            unavailable: false,
          };
        case RESULTS.DENIED:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
          };
        case RESULTS.BLOCKED:
          return {
            granted: false,
            blocked: true,
            unavailable: false,
          };
        default:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
          };
      }
    } catch (error) {
      console.error('Error requesting photo library permission:', error);
      return {
        granted: false,
        blocked: false,
        unavailable: false,
      };
    }
  }

  /**
   * Request camera permission
   */
  static async requestCameraPermission(): Promise<PhotoPermissionResult> {
    try {
      const permission = this.getCameraPermission();
      const result = await request(permission);

      switch (result) {
        case RESULTS.GRANTED:
          return {
            granted: true,
            blocked: false,
            unavailable: false,
          };
        case RESULTS.DENIED:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
          };
        case RESULTS.BLOCKED:
          return {
            granted: false,
            blocked: true,
            unavailable: false,
          };
        default:
          return {
            granted: false,
            blocked: false,
            unavailable: false,
          };
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return {
        granted: false,
        blocked: false,
        unavailable: false,
      };
    }
  }

  /**
   * Show permission blocked alert
   */
  static showPermissionBlockedAlert(type: 'gallery' | 'camera') {
    const message = type === 'gallery' 
      ? 'Gallery access has been blocked. To select photos, please enable gallery access in your device settings.'
      : 'Camera access has been blocked. To take photos, please enable camera access in your device settings.';

    Alert.alert(
      `${type === 'gallery' ? 'Gallery' : 'Camera'} Access Required`,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Open Settings',
          onPress: () => openSettings()
        }
      ]
    );
  }

  /**
   * Handle photo library permission and execute callback
   */
  static async handlePhotoLibraryPermission(
    onSuccess: () => void,
    onDenied?: () => void
  ): Promise<void> {
    const status = await this.checkPhotoLibraryPermission();

    if (status.granted) {
      onSuccess();
      return;
    }

    if (status.blocked) {
      this.showPermissionBlockedAlert('gallery');
      onDenied?.();
      return;
    }

    // Request permission
    const requestResult = await this.requestPhotoLibraryPermission();

    if (requestResult.granted) {
      onSuccess();
    } else if (requestResult.blocked) {
      this.showPermissionBlockedAlert('gallery');
      onDenied?.();
    } else {
      onDenied?.();
    }
  }

  /**
   * Handle camera permission and execute callback
   */
  static async handleCameraPermission(
    onSuccess: () => void,
    onDenied?: () => void
  ): Promise<void> {
    const status = await this.checkCameraPermission();

    if (status.granted) {
      onSuccess();
      return;
    }

    if (status.blocked) {
      this.showPermissionBlockedAlert('camera');
      onDenied?.();
      return;
    }

    // Request permission
    const requestResult = await this.requestCameraPermission();

    if (requestResult.granted) {
      onSuccess();
    } else if (requestResult.blocked) {
      this.showPermissionBlockedAlert('camera');
      onDenied?.();
    } else {
      onDenied?.();
    }
  }
}