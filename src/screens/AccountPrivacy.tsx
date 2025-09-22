import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useTheme } from '../context/ThemeContext';
import { useBiometric } from '../context/BiometricContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { BiometricUtils, BiometricInfo } from '../utils/BiometricUtils';

type BiometricsProps = {
  onClose: () => void;
};


export const Biometrics: React.FC<BiometricsProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const { checkBiometricStatus } = useBiometric();
  const styles = createStyles(colors);

  // Dynamic biometric states
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    available: false,
    type: 'none',
    displayName: 'Biometric Authentication',
    icon: 'shield-checkmark',
  });

  const rnBiometrics = new ReactNativeBiometrics();

  // Check biometric availability and load saved state
  useEffect(() => {
    const initializeBiometrics = async () => {
      try {
        // Use the new BiometricUtils for proper detection
        const info = await BiometricUtils.getBiometricInfo();

        setBiometricInfo(info);

        // Load saved biometric state
        const storedState = await AsyncStorage.getItem('biometricEnabled');

        if (storedState === 'true' && info.available) {
          setBiometricEnabled(true);
        }
      } catch (error) {
        console.error('AccountPrivacy - Error checking biometric availability:', error);
      }
    };

    initializeBiometrics();
  }, []);

  // Dynamic biometric toggle handler
  const handleBiometricToggle = async () => {
    if (!biometricInfo.available) {
      Alert.alert(
        'Biometrics Not Available',
        'Your device does not support biometric authentication.'
      );
      return;
    }

    if (!biometricEnabled) {
      try {
        const result = await BiometricUtils.authenticateWithBiometrics(
          `Authenticate with ${biometricInfo.displayName}`
        );

        if (result.success) {
          setBiometricEnabled(true);
          await AsyncStorage.setItem('biometricEnabled', 'true');
          // Refresh the biometric context to update app-level state
          await checkBiometricStatus();
          Alert.alert(
            'Success',
            `${biometricInfo.displayName} authentication enabled successfully!`
          );
        } else {
          Alert.alert('Authentication Cancelled', 'Biometric setup was cancelled.');
        }
      } catch (error) {
        console.error('AccountPrivacy - Biometric authentication error:', error);
        Alert.alert(
          'Authentication Failed',
          'Failed to authenticate. Please try again.'
        );
      }
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem('biometricEnabled', 'false');
      // Refresh the biometric context to update app-level state
      await checkBiometricStatus();
      Alert.alert(
        'Disabled',
        `${biometricInfo.displayName} authentication has been disabled.`
      );
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScreenHeader
        title="Biometrics"
        onBack={onClose}
      />

      <ScrollView style={styles.scrollView}>
        {/* Dynamic Biometric Authentication Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Biometric Authentication</Text>

          {biometricInfo.available ? (
            <View style={styles.biometricCard}>
              <View style={styles.biometricHeader}>
                <View style={styles.biometricIconContainer}>
                  <Ionicons
                    name={biometricInfo.icon}
                    size={24}
                    color={colors.primaryButton}
                  />
                </View>
                <View style={styles.biometricTextContainer}>
                  <Text style={styles.biometricTitle}>
                    Enable {biometricInfo.displayName}
                  </Text>
                  <Text style={styles.biometricDescription}>
                    Use {biometricInfo.displayName.toLowerCase()} to quickly and securely access your account
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: colors.inactiveIcon, true: colors.primaryButton }}
                  thumbColor={biometricEnabled ? '#ffffff' : '#f4f3f4'}
                  ios_backgroundColor={colors.cardBackground}
                  onValueChange={handleBiometricToggle}
                  value={biometricEnabled}
                />
              </View>

              {biometricEnabled && (
                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success || '#4CAF50'} />
                  <Text style={styles.statusText}>
                    {biometricInfo.displayName} authentication is active
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.unavailableCard}>
              <Ionicons name="information-circle" size={24} color={colors.secondaryText} />
              <Text style={styles.unavailableText}>
                Biometric authentication is not available on this device
              </Text>
            </View>
          )}
        </View>

        {/* Additional Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Security Information</Text>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primaryButton} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Your data is secure</Text>
              <Text style={styles.infoDescription}>
                Biometric authentication data is stored securely on your device and never shared.
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Section styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
  },

  // Dynamic biometric card styles
  biometricCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.secondaryText,
    shadowColor: colors.primaryText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  biometricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  biometricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  biometricTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  biometricDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.inactiveIcon,
  },
  statusText: {
    fontSize: 14,
    color: colors.success || '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Unavailable state styles
  unavailableCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },
  unavailableText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginLeft: 12,
    flex: 1,
  },

  // Info card styles
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
  },
});

