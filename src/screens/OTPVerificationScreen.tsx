import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { authService } from '../services/authService';
import { colors } from '../utils/colors';

interface OTPVerificationScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
    };
  };
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { phoneNumber } = route.params;
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [focusedInput, setFocusedInput] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(countdown - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (otp.length === 6) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [otp]);

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const isValid = await authService.verifyOTP(phoneNumber, otp);
      
      if (isValid) {
        await authService.clearOTP(phoneNumber);
        
        // Check if user exists in database
        const userExists = await authService.checkUserExists(phoneNumber);
        
        if (userExists) {
          // Load user data from Firebase and save locally
          const { firebaseService } = await import('../services/firebaseService');
          const { userStorage } = await import('../services/userStorage');
          
          const userProfile = await firebaseService.getUserByPhone(phoneNumber);
          if (userProfile) {
            await userStorage.saveUser(userProfile);
            await userStorage.saveAuthToken(userProfile.id);
          }
          
          navigation.navigate('Home');
        } else {
          navigation.navigate('ProfileSetup', { phoneNumber });
        }
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
        setOTP('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      console.error('Verify OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await authService.sendOTP(phoneNumber);
      Alert.alert('Success', 'OTP sent again to your WhatsApp number');
      setCountdown(60);
      setOTP('');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setResendLoading(false);
    }
  };

  const formatOTP = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      setOTP(cleaned);
    }
  };

  const maskedPhoneNumber = `+91 ${phoneNumber.substring(0, 2)}****${phoneNumber.substring(8)}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Background Effect */}
      <View style={styles.backgroundGradient} />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.lockIcon}>🔐</Text>
          </View>
          
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to
          </Text>
          <View style={styles.phoneContainer}>
            <Text style={styles.phoneNumber}>{maskedPhoneNumber}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.editText}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* OTP Input Section */}
        <View style={styles.otpSection}>
          <Animated.View 
            style={[
              styles.otpContainer,
              focusedInput && styles.otpContainerFocused,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <TextInput
              style={styles.otpInput}
              placeholder="• • • • • •"
              placeholderTextColor={colors.inputPlaceholder}
              value={otp.split('').join(' ')}
              onChangeText={formatOTP}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              autoFocus={true}
            />
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading && styles.buttonDisabled,
              otp.length === 6 && styles.buttonActive
            ]}
            onPress={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryButtonText} size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Verify & Continue</Text>
                <Text style={styles.buttonIcon}>✓</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          {countdown > 0 ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Resend code in</Text>
              <View style={styles.timerContainer}>
                <Text style={styles.countdownText}>{countdown}s</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOTP}
              disabled={resendLoading}
              activeOpacity={0.7}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={colors.activeIcon} />
              ) : (
                <>
                  <Text style={styles.resendIcon}>🔄</Text>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Change Number</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: colors.background,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.activeIcon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  lockIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.activeIcon,
    marginRight: 8,
  },
  editButton: {
    padding: 4,
  },
  editText: {
    fontSize: 16,
  },
  otpSection: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  otpContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.cardBackground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  otpContainerFocused: {
    borderColor: colors.activeIcon,
    shadowColor: colors.activeIcon,
    shadowOpacity: 0.4,
  },
  otpInput: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.inputText,
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: 8,
  },
  primaryButton: {
    backgroundColor: colors.primaryButton,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    opacity: 0.5,
  },
  buttonActive: {
    opacity: 1,
    transform: [{ scale: 1.02 }],
  },
  buttonDisabled: {
    opacity: 0.5,
    transform: [{ scale: 1 }],
  },
  buttonText: {
    color: colors.primaryButtonText,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    color: colors.primaryButtonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countdownLabel: {
    fontSize: 14,
    color: colors.secondaryText,
    marginRight: 8,
  },
  timerContainer: {
    backgroundColor: colors.activeIcon,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryButtonText,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.activeIcon,
  },
  resendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resendText: {
    fontSize: 16,
    color: colors.activeIcon,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backIcon: {
    fontSize: 18,
    color: colors.secondaryText,
    marginRight: 6,
  },
  backText: {
    fontSize: 16,
    color: colors.secondaryText,
    fontWeight: '500',
  },
});