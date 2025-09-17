import { Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

export interface BiometricInfo {
  available: boolean;
  type: string;
  displayName: string;
  icon: string;
}

export class BiometricUtils {
  private static rnBiometrics = new ReactNativeBiometrics();

  static async getBiometricInfo(): Promise<BiometricInfo> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      console.log('BiometricUtils - Raw biometry data:', { available, biometryType, platform: Platform.OS });

      if (!available) {
        return {
          available: false,
          type: 'none',
          displayName: 'Biometric Authentication',
          icon: 'shield-checkmark',
        };
      }

      // Handle different biometric types based on platform and detection
      if (Platform.OS === 'ios') {
        switch (biometryType) {
          case 'TouchID':
            return {
              available: true,
              type: 'TouchID',
              displayName: 'Touch ID',
              icon: 'finger-print',
            };
          case 'FaceID':
            return {
              available: true,
              type: 'FaceID',
              displayName: 'Face ID',
              icon: 'eye',
            };
          default:
            return {
              available: true,
              type: 'Biometrics',
              displayName: 'Biometric Authentication',
              icon: 'shield-checkmark',
            };
        }
      } else {
        // Android handling
        switch (biometryType) {
          case 'TouchID':
          case 'Fingerprint':
            return {
              available: true,
              type: 'Fingerprint',
              displayName: 'Fingerprint',
              icon: 'finger-print',
            };
          case 'FaceID':
          case 'Face':
            return {
              available: true,
              type: 'Face',
              displayName: 'Face Unlock',
              icon: 'eye',
            };
          case 'Biometrics':
            // Android reports generic 'Biometrics' for various types
            // We'll use a generic approach that works for both face and fingerprint
            return {
              available: true,
              type: 'Biometrics',
              displayName: 'Biometric Authentication',
              icon: 'shield-checkmark',
            };
          default:
            console.log('Unknown Android biometric type:', biometryType);
            return {
              available: true,
              type: 'Biometrics',
              displayName: 'Biometric Authentication',
              icon: 'shield-checkmark',
            };
        }
      }
    } catch (error) {
      console.error('BiometricUtils - Error getting biometric info:', error);
      return {
        available: false,
        type: 'none',
        displayName: 'Biometric Authentication',
        icon: 'shield-checkmark',
      };
    }
  }

  static async authenticateWithBiometrics(message?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const biometricInfo = await this.getBiometricInfo();

      if (!biometricInfo.available) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      console.log('BiometricUtils - Attempting authentication with type:', biometricInfo.type);

      const promptMessage = message || `Authenticate with ${biometricInfo.displayName}`;

      const result = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
        fallbackEnabled: true,
      });

      console.log('BiometricUtils - Authentication result:', result);
      return result;
    } catch (error) {
      console.error('BiometricUtils - Authentication error:', error);
      return { success: false, error: error?.toString() || 'Authentication failed' };
    }
  }
}