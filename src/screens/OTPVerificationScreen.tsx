import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Vibration,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';


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
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [activeIndex, setActiveIndex] = useState(0);
  const { colors } = useTheme();


  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      handleVerifyOTP();
    }
  }, [otp]);

  const handleOTPChange = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, '');

    if (numericText.length <= 1) {
      const newOTP = [...otp];
      newOTP[index] = numericText;
      setOTP(newOTP);

      // Auto-focus next input
      if (numericText && index < 5) {
        inputRefs.current[index + 1]?.focus();
        setActiveIndex(index + 1);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      return;
    }

    setLoading(true);
    try {
      const isValid = await authService.verifyOTP(phoneNumber, otpValue);

      if (isValid) {
        await authService.clearOTP(phoneNumber);

        const userExists = await authService.checkUserExists(phoneNumber);

        if (userExists) {
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
        handleInvalidOTP();
      }
    } catch (error) {
      handleInvalidOTP();
      console.error('Verify OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidOTP = () => {
    Vibration.vibrate(200);
    setOTP(['', '', '', '', '', '']);
    setActiveIndex(0);
    inputRefs.current[0]?.focus();
    Alert.alert('Invalid OTP', 'Please enter the correct 6-digit code');
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await authService.sendOTP(phoneNumber);
      Alert.alert('Success', 'New OTP sent to your WhatsApp');
      setCountdown(60);
      setOTP(['', '', '', '', '', '']);
      setActiveIndex(0);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setResendLoading(false);
    }
  };

  const maskedPhoneNumber = `+91 ${phoneNumber.substring(0, 2)}****${phoneNumber.substring(8)}`;
  const otpComplete = otp.join('').length === 6;

  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {maskedPhoneNumber}
            </Text>
          </View>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  activeIndex === index && styles.otpBoxActive,
                  digit && styles.otpBoxFilled,
                ]}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    activeIndex === index && styles.otpInputActive,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOTPChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  onFocus={() => setActiveIndex(index)}
                  keyboardType="numeric"
                  maxLength={1}
                  editable={!loading}
                  autoFocus={index === 0}
                  textAlign="center"
                  selectTextOnFocus
                />
              </View>
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              otpComplete && styles.verifyButtonActive,
              loading && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerifyOTP}
            disabled={!otpComplete || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryButtonText} />
            ) : (
              <Text style={[
                styles.verifyButtonText,
                otpComplete && styles.verifyButtonTextActive,
              ]}>
                {otpComplete ? 'Verify Code' : 'Enter 6-digit code'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Resend code in {countdown}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={resendLoading}
                style={styles.resendButton}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color={colors.activeIcon} />
                ) : (
                  <Text style={styles.resendText}>Resend Code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <TouchableOpacity
            style={styles.changeNumberButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.changeNumberText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: 'rgba(103, 111, 157, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: colors.activeIcon,
    backgroundColor: colors.cardBackground,
  },
  otpBoxFilled: {
    borderColor: colors.activeIcon,
    backgroundColor: colors.cardBackground,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primaryText,
    width: '100%',
    height: '100%',
    textAlign: 'center',
  },
  otpInputActive: {
    color: colors.primaryText,
  },
  verifyButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  verifyButtonActive: {
    backgroundColor: colors.activeIcon,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  verifyButtonTextActive: {
    color: colors.primaryButtonText,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  countdownText: {
    fontSize: 16,
    color: colors.secondaryText,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 16,
    color: colors.activeIcon,
    fontWeight: '600',
  },
  changeNumberButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  changeNumberText: {
    fontSize: 16,
    color: colors.secondaryText,
    textDecorationLine: 'underline',
  },
});