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
  Animated,
  Easing,
  ScrollView,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { wp, hp, ms, s, vs } from '../utils/deviceDimensions';
import { NotificationPermissionHelper } from '../utils/NotificationPermissionHelper';


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
  const { login } = useAuth();
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [activeIndex, setActiveIndex] = useState(0);
  const { colors } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const hiddenInputRef = useRef<TextInput | null>(null);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

    // Handle paste operation
    if (numericText.length > 1) {
      // User pasted multiple digits
      handlePastedOTP(numericText);
    } else if (numericText.length <= 1) {
      // Normal single digit input
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

  // Handle pasted OTP
  const handlePastedOTP = (pastedText: string) => {
    const numericText = pastedText.replace(/[^0-9]/g, '');
    
    if (numericText.length >= 6) {
      // If pasted text has 6 or more digits, take first 6
      const otpDigits = numericText.slice(0, 6).split('');
      setOTP(otpDigits);
      
      // Focus on last input
      setTimeout(() => {
        inputRefs.current[5]?.focus();
        setActiveIndex(5);
      }, 100);
    } else if (numericText.length > 0) {
      // If less than 6 digits, fill what we can
      const newOTP = ['', '', '', '', '', ''];
      numericText.split('').forEach((digit, index) => {
        if (index < 6) {
          newOTP[index] = digit;
        }
      });
      setOTP(newOTP);
      
      // Focus on next empty field
      const nextEmptyIndex = newOTP.findIndex(digit => digit === '');
      if (nextEmptyIndex !== -1) {
        setTimeout(() => {
          inputRefs.current[nextEmptyIndex]?.focus();
          setActiveIndex(nextEmptyIndex);
        }, 100);
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
            login(userProfile); // Use AuthContext login
            
            // Request notification permission after successful login
            setTimeout(async () => {
              const result = await NotificationPermissionHelper.requestPermissionIfNeeded();
              // No UI needed, just request the permission
            }, 1000); // Small delay to ensure smooth navigation
          }
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
    // Shake animation for error feedback
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    Vibration.vibrate([0, 100, 50, 100]);
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
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      {/* Clean Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Verification</Text>
              <Text style={styles.subtitle}>
                We sent a code to {maskedPhoneNumber}
              </Text>
            </View>

            {/* OTP Input Section */}
            <Animated.View 
              style={[
                styles.otpSection,
                {
                  transform: [{ translateX: shakeAnim }],
                },
              ]}
            >
              <TouchableOpacity 
                style={styles.otpTouchArea}
                activeOpacity={1}
                onPress={async () => {
                  // Try to get text from clipboard when user taps the OTP area
                  try {
                    const clipboardContent = await Clipboard.getString();
                    if (clipboardContent) {
                      handlePastedOTP(clipboardContent);
                    }
                  } catch (error) {
                    // Clipboard read failed, focus first input
                    inputRefs.current[0]?.focus();
                  }
                }}
              >
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
                        style={styles.otpInput}
                        value={digit}
                        onChangeText={(text) => handleOTPChange(text, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        onFocus={() => setActiveIndex(index)}
                        keyboardType="numeric"
                        maxLength={index === 0 ? 6 : 1} // Allow paste on first input
                        editable={!loading}
                        autoFocus={index === 0}
                        textAlign="center"
                        selectTextOnFocus
                        textContentType="oneTimeCode" // iOS autofill support
                        autoComplete="sms-otp" // Android autofill support
                      />
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
              
              {/* Paste hint */}
              <Text style={styles.pasteHint}>Tap to paste • Enter 6-digit code</Text>
            </Animated.View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                otpComplete && styles.verifyButtonActive,
                loading && styles.verifyButtonLoading,
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
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <Text style={styles.resendInfoText}>
                  Resend code in {countdown}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendButtonText}>
                    {resendLoading ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Change Number Link */}
            <TouchableOpacity
              style={styles.changeNumberButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.changeNumberText}>Change Phone Number</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
    height: vs(56),
    justifyContent: 'center',
  },
  backButton: {
    width: s(40),
    height: s(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: vs(40),
  },
  content: {
    flex: 1,
    paddingHorizontal: s(24),
  },
  
  // Title Section - Clean and Centered
  titleSection: {
    alignItems: 'center',
    marginTop: vs(40),
    marginBottom: vs(48),
  },
  title: {
    fontSize: ms(32),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: vs(12),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: ms(16),
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: vs(24),
  },
  
  // OTP Section - Simple and Clean
  otpSection: {
    marginBottom: vs(48),
  },
  otpTouchArea: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(10),
  },
  pasteHint: {
    fontSize: ms(12),
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: vs(12),
    opacity: 0.6,
  },
  otpBox: {
    width: s(50),
    height: vs(56),
    borderRadius: s(12),
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.inputBackground,
  },
  otpBoxActive: {
    borderColor: colors.primaryButton,
    backgroundColor: colors.inputBackground,
  },
  otpBoxFilled: {
    borderColor: colors.inputBackground,
    backgroundColor: colors.inputBackground,
  },
  otpInput: {
    fontSize: ms(22),
    fontWeight: '600',
    color: colors.primaryText,
    width: '100%',
    height: '100%',
    textAlign: 'center',
    includeFontPadding: false,
  },
  
  // Verify Button - Clean and Professional
  verifyButton: {
    height: vs(52),
    borderRadius: s(12),
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(32),
  },
  verifyButtonActive: {
    backgroundColor: colors.primaryButton,
  },
  verifyButtonLoading: {
    backgroundColor: colors.primaryButton,
    opacity: 0.8,
  },
  verifyButtonText: {
    fontSize: ms(16),
    fontWeight: '600',
    color: colors.secondaryText,
    letterSpacing: 0.5,
  },
  verifyButtonTextActive: {
    color: colors.primaryButtonText,
  },
  
  // Resend Section - Simple Text Based
  resendContainer: {
    alignItems: 'center',
    marginBottom: vs(24),
  },
  resendInfoText: {
    fontSize: ms(14),
    color: colors.secondaryText,
    fontWeight: '400',
  },
  resendButtonText: {
    fontSize: ms(14),
    color: colors.primaryButton,
    fontWeight: '600',
  },
  
  // Change Number - Subtle Link
  changeNumberButton: {
    alignItems: 'center',
    paddingVertical: vs(8),
  },
  changeNumberText: {
    fontSize: ms(14),
    color: colors.secondaryText,
    fontWeight: '400',
  },
});