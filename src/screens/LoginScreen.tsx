import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { authService } from '../services/authService';
import { PhoneStorage } from '../services/phoneStorage';
import { useTheme } from '../context/ThemeContext';
import { wp, hp, ms, s, vs } from '../utils/deviceDimensions';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLastNumber, setLoadingLastNumber] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your WhatsApp number');
      return;
    }

    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      await authService.sendOTP(cleanedNumber);
      // Save the number after successful OTP send
      await PhoneStorage.saveLastPhoneNumber(cleanedNumber);
      Alert.alert('Success', 'OTP sent to your WhatsApp number');
      navigation.navigate('OTPVerification', { phoneNumber: cleanedNumber });
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      console.error('Send OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load last used phone number on component mount
  useEffect(() => {
    loadLastUsedNumber();
  }, []);

  const loadLastUsedNumber = async () => {
    try {
      setLoadingLastNumber(true);
      const lastNumber = await PhoneStorage.getLastPhoneNumber();
      
      if (lastNumber && lastNumber.length === 10) {
        setPhoneNumber(lastNumber);
      }
    } catch (error) {
    } finally {
      setLoadingLastNumber(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>KharchaSplit</Text>
          <Text style={styles.subtitle}>
            {loadingLastNumber ? 'Loading your number...' : 'Enter your WhatsApp number'}
          </Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder={loadingLastNumber ? 'Loading...' : 'Enter your WhatsApp number'}
              placeholderTextColor={colors.inputPlaceholder}
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading && !loadingLastNumber}
              autoFocus={!loadingLastNumber && phoneNumber.length === 0}
            />
            {loadingLastNumber && (
              <ActivityIndicator 
                size="small" 
                color={colors.activeIcon} 
                style={styles.loadingIndicator}
              />
            )}
            {!loadingLastNumber && phoneNumber.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setPhoneNumber('');
                  PhoneStorage.clearLastPhoneNumber();
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            phoneNumber.length === 10 ? styles.buttonActive : styles.buttonInactive
          ]}
          onPress={handleSendOTP}
          disabled={loading || phoneNumber.length !== 10}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryButtonText} size="small" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: s(20),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: vs(60),
  },
  title: {
    fontSize: ms(32),
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: vs(10),
  },
  subtitle: {
    fontSize: ms(16),
    color: colors.secondaryText,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: vs(30),
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: s(12),
    paddingHorizontal: s(15),
    height: vs(50),
  },
  countryCode: {
    paddingRight: s(10),
    marginRight: s(10),
    borderRightWidth: s(1),
    borderRightColor: colors.secondaryText,
  },
  countryText: {
    fontSize: ms(16),
    color: colors.primaryText,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    fontSize: ms(16),
    color: colors.inputText,
    padding: 0,
  },
  loadingIndicator: {
    marginLeft: s(8),
  },
  clearButton: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
  },
  clearText: {
    fontSize: ms(16),
    color: colors.secondaryText,
  },
  button: {
    height: vs(50),
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(40),
  },
  buttonActive: {
    backgroundColor: colors.primaryButton,
  },
  buttonInactive: {
    backgroundColor: colors.secondaryText,
  },
  buttonText: {
    fontSize: ms(16),
    fontWeight: 'bold',
    color: colors.primaryButtonText,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: ms(12),
    color: colors.secondaryText,
    textAlign: 'center',
  },
});