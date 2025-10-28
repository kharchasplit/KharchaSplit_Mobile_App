import firestore from '@react-native-firebase/firestore';
import { Linking, Platform } from 'react-native';

export interface AppVersion {
  latestVersion: string;
  latestVersionCode: number;
  minimumVersion: string;
  minimumVersionCode: number;
  forceUpdate: boolean;
  updateMessage: string;
  playStoreUrl: string;
  appStoreUrl: string;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateMessage: string;
  storeUrl: string;
}

class VersionCheckService {
  private readonly COLLECTION_NAME = 'appConfig';
  private readonly DOC_ID = 'version';

  // Current app version - should match build.gradle versionCode and versionName
  private readonly CURRENT_VERSION_CODE = 2;
  private readonly CURRENT_VERSION_NAME = '1.0.1';

  /**
   * Check if app update is available
   * @returns UpdateCheckResult object with update information
   */
  async checkForUpdate(): Promise<UpdateCheckResult | null> {
    try {
      const versionDoc = await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(this.DOC_ID)
        .get();

      if (!versionDoc.exists) {
        console.log('Version document not found in Firebase');
        return null;
      }

      const versionData = versionDoc.data();

      // Validate that we have the required fields
      if (!versionData ||
          typeof versionData.latestVersionCode !== 'number' ||
          typeof versionData.minimumVersionCode !== 'number') {
        console.log('Version document missing required fields:', versionData);
        return null;
      }

      // Type assertion after validation
      const appVersion = versionData as AppVersion;

      // Compare version codes
      const updateAvailable = this.CURRENT_VERSION_CODE < appVersion.latestVersionCode;
      const forceUpdate = this.CURRENT_VERSION_CODE < appVersion.minimumVersionCode;

      const storeUrl = Platform.OS === 'android'
        ? appVersion.playStoreUrl
        : appVersion.appStoreUrl;

      return {
        updateAvailable,
        forceUpdate,
        currentVersion: this.CURRENT_VERSION_NAME,
        latestVersion: appVersion.latestVersion,
        updateMessage: appVersion.updateMessage || 'A new version is available!',
        storeUrl,
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    }
  }

  /**
   * Open app store for update
   * @param storeUrl - Play Store or App Store URL
   */
  async openStore(storeUrl: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        console.error('Cannot open store URL:', storeUrl);
      }
    } catch (error) {
      console.error('Error opening store:', error);
    }
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): { code: number; name: string } {
    return {
      code: this.CURRENT_VERSION_CODE,
      name: this.CURRENT_VERSION_NAME,
    };
  }
}

export default new VersionCheckService();
