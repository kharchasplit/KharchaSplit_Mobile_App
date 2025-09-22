import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  // --- RESPONSIVE ---
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
// --- RESPONSIVE ---
import { typography } from '../utils/typography'; // Assuming path is correct
import { firebaseService } from '../services/firebaseService';

type DeleteAccountProps = {
  onClose: () => void;
};

const CONSEQUENCES = [
  { id: 1, text: 'Your account will be deactivated (but data preserved for security)' },
  { id: 2, text: 'You will be removed from all active groups' },
  { id: 3, text: 'Your profile will no longer be visible to other users' },
  { id: 4, text: 'You cannot login or access the app anymore' },
  { id: 5, text: 'Historical data remains for group transaction integrity' },
] as const;

export const DeleteAccount: React.FC<DeleteAccountProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  // --- RESPONSIVE SETUP ---
  const { width: screenWidth } = useWindowDimensions();
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;

  const scaledFontSize = {
    xs: scale(typography.fontSize.xs),
    sm: scale(typography.fontSize.sm),
    base: scale(typography.fontSize.base),
    lg: scale(typography.fontSize.lg),
    xl: scale(typography.fontSize.xl),
    '2xl': scale(typography.fontSize['2xl']),
    header: scale(typography.text.header.fontSize),
    title: scale(typography.text.title.fontSize),
    subtitle: scale(typography.text.subtitle.fontSize),
    body: scale(typography.text.body.fontSize),
    caption: scale(typography.text.caption.fontSize),
    button: scale(typography.text.button.fontSize),
  };
  // --- END RESPONSIVE SETUP ---

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Get user's phone number (remove country code and get last 10 digits)
  const userPhoneNumber = user?.phoneNumber?.replace(/\D/g, '').slice(-10) || '';

  // --- STYLE FIX & RESPONSIVE ---
  // Pass all dependencies to createStyles and useMemo
  const styles = useMemo(() => {
    return createStyles(colors, scale, scaledFontSize);
  }, [colors, scale, scaledFontSize]);
  // --- END FIX ---


  const validateOtp = useCallback((otpValue: string) => {
    if (!otpValue.trim()) {
      return 'OTP is required';
    }
    if (otpValue.length !== 6) {
      return 'OTP must be 6 digits';
    }
    return '';
  }, []);


  const handleOtpChange = useCallback(
    (text: string) => {
      // Only allow digits and limit to 6
      const cleaned = text.replace(/\D/g, '').slice(0, 6);
      setOtp(cleaned);
      if (otpError) {
        setOtpError('');
      }
    },
    [otpError],
  );

  const handleSendOtp = useCallback(async () => {
    if (!userPhoneNumber) {
      Alert.alert('Error', 'No phone number found for your account.');
      return;
    }

    setSendingOtp(true);
    try {
      // Here you would integrate with your OTP service
      // For now, we'll simulate the OTP sending
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setOtpSent(true);
      setCountdown(60); // Start 60 second countdown
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      Alert.alert('OTP Sent', `Verification code sent to +91${userPhoneNumber}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  }, [userPhoneNumber]);

  const handleDeleteAccount = useCallback(() => {
    if (!otpSent) {
      handleSendOtp();
      return;
    }

    const otpErr = validateOtp(otp);
    if (otpErr) {
      setOtpError(otpErr);
      return;
    }

    // In a real app, you would verify the OTP with your backend
    // For now, we'll accept any 6-digit OTP
    setShowConfirmModal(true);
  }, [otp, otpSent, validateOtp, handleSendOtp]);

  const confirmDelete = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not found.');
      return;
    }

    setIsDeleting(true);
    
    try {
      // Call Firebase service to deactivate account
      await firebaseService.deactivateUserAccount(user.id);
      
      setShowConfirmModal(false);
      
      Alert.alert(
        '✅ Account Deactivated', 
        'Your account has been successfully deactivated. You have been logged out and cannot access the app anymore.\n\nNote: Your historical data is preserved for security and group transaction integrity.',
        [
          { 
            text: 'OK', 
            onPress: async () => {
              try {
                await logout();
                onClose();
              } catch (error) {
                console.error('Logout error after account deletion:', error);
                onClose();
              }
            }
          },
        ]
      );
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
      
      Alert.alert(
        '❌ Error', 
        error.message || 'Failed to delete account. Please try again or contact support.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  }, [user?.id, logout, onClose]);

  const cancelDelete = useCallback(() => {
    setShowConfirmModal(false);
    setOtpError('');
  }, []);

  const resetForm = useCallback(() => {
    setOtp('');
    setOtpError('');
    setOtpSent(false);
    setCountdown(0);
  }, []);

  // Use style from useMemo
  const ConsequenceItem: React.FC<{ text: string }> = ({ text }) => (
    <View style={styles.consequenceItem}>
      <Ionicons name="close-circle" size={scale(20)} color={colors.error} />
      <Text style={styles.consequenceText}>{text}</Text>
    </View>
  );

  const isDeleteDisabled = useMemo(() => {
    if (!otpSent) {
      return false; // Send OTP button is always enabled
    }
    return !otp.trim() || otp.length !== 6;
  }, [otp, otpSent]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={scale(24)} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Warning Icon */}
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={scale(60)} color={colors.error} />
        </View>

        {/* Warning Text */}
        <Text style={styles.warningTitle}>Deactivate Your Account</Text>
        <Text style={styles.warningText}>
          Deactivating your account will disable access while preserving data for security. This will:
        </Text>

        {/* Consequences List */}
        <View style={styles.consequencesList}>
          {CONSEQUENCES.map(consequence => (
            <ConsequenceItem key={consequence.id} text={consequence.text} />
          ))}
        </View>

        <Text style={styles.warningText}>Verify your phone number to confirm account deactivation:</Text>
        
        {/* Phone Number Display - Read Only */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Your registered phone number</Text>
          <View style={styles.phoneDisplayContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <Text style={styles.phoneDisplay}>{userPhoneNumber}</Text>
          </View>
        </View>

        {/* OTP Input - Only show after OTP is sent */}
        {otpSent && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter verification code</Text>
            <TextInput
              style={[styles.textInput, otpError ? styles.textInputError : null]}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={colors.secondaryText}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="numeric"
              maxLength={6}
            />
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
            
            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>Resend OTP in {countdown}s</Text>
              ) : (
                <TouchableOpacity onPress={handleSendOtp} disabled={sendingOtp}>
                  <Text style={styles.resendText}>
                    {sendingOtp ? 'Sending...' : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, (isDeleteDisabled || isDeleting) && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleteDisabled || isDeleting}>
          {isDeleting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.deleteButtonText, { marginLeft: scale(8) }]}>Deactivating...</Text>
            </View>
          ) : sendingOtp ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.deleteButtonText, { marginLeft: scale(8) }]}>Sending OTP...</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.deleteButtonText,
                isDeleteDisabled && styles.deleteButtonTextDisabled,
              ]}>
              {otpSent ? 'Verify & Deactivate Account' : 'Send OTP'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={scale(40)} color={colors.error} />
            <Text style={styles.modalTitle}>Are you absolutely sure?</Text>
            <Text style={styles.modalText}>
              This action will deactivate your account and log you out. You won't be able to access the app, but your data will be preserved for security purposes.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmDeleteButton, isDeleting && styles.confirmDeleteButtonDisabled]} 
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.confirmDeleteButtonText, { marginLeft: scale(6) }]}>Deactivating...</Text>
                  </View>
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Deactivate Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- STYLESHEET FIX & RESPONSIVE ---
// createStyles now correctly receives colors, scale, and fonts as arguments
const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  scale: (size: number) => number,
  fonts: { [key: string]: number }
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(20),
      paddingVertical: scale(16),
      borderBottomWidth: 0,
      borderBottomColor: colors.cardBackground,
      backgroundColor: colors.cardBackground,
    },
    backButton: { padding: scale(4) },
    headerTitle: { fontSize: fonts.header, fontWeight: '600', color: colors.primaryText },
    placeholder: { width: scale(32) },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: scale(40) }, // Add padding to bottom
    warningContainer: { marginBottom: scale(16), marginTop: scale(16), alignItems: 'center' },
    warningTitle: {
      fontSize: fonts.xl,
      fontWeight: '700',
      color: colors.error,
      marginBottom: scale(16),
      textAlign: 'center',
    },
    warningText: {
      fontSize: fonts.body,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: scale(16),
      marginHorizontal: scale(20),
      lineHeight: fonts.body * 1.5, // Add line height
    },
    consequencesList: { width: '100%', marginBottom: scale(24), paddingHorizontal: scale(20) }, // Add padding
    consequenceItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: scale(12),
    },
    consequenceText: { 
      fontSize: fonts.body, 
      color: colors.primaryText, 
      marginLeft: scale(12), 
      flex: 1 
    },
    inputContainer: { marginBottom: scale(24), marginHorizontal: scale(20) },
    textInput: {
      borderWidth: 1,
      borderColor: colors.secondaryText,
      borderRadius: scale(8),
      paddingHorizontal: scale(16),
      paddingVertical: scale(14),
      fontSize: fonts.body,
      color: colors.primaryText,
      backgroundColor: colors.cardBackground,
      width: '100%',
    },
    textInputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: fonts.caption, marginTop: scale(8), textAlign: 'left' },
    deleteButton: {
      backgroundColor: colors.error,
      paddingVertical: scale(16),
      paddingHorizontal: scale(32),
      borderRadius: scale(12),
      marginHorizontal: scale(20), // Add horizontal margin
      alignItems: 'center',
    },
    deleteButtonText: { color: '#FFFFFF', fontSize: fonts.button, fontWeight: '600' },
    deleteButtonDisabled: { backgroundColor: colors.inactiveIcon, opacity: 0.6 },
    deleteButtonTextDisabled: { color: colors.secondaryText },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: scale(20),
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: scale(16),
      padding: scale(24),
      alignItems: 'center',
      width: '100%',
      maxWidth: scale(340), // Use scaled max width
    },
    modalTitle: {
      fontSize: fonts.header,
      fontWeight: '700',
      color: colors.primaryText,
      marginTop: scale(16),
      marginBottom: scale(12),
      textAlign: 'center',
    },
    modalText: {
      fontSize: fonts.body,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: scale(24),
      lineHeight: fonts.body * 1.4,
    },
    modalButtons: { flexDirection: 'row', width: '100%', gap: scale(12) },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      paddingVertical: scale(12),
      borderRadius: scale(8),
      alignItems: 'center',
    },
    cancelButtonText: { color: colors.primaryText, fontSize: fonts.button, fontWeight: '600' },
    confirmDeleteButton: {
      flex: 1,
      backgroundColor: colors.error,
      paddingVertical: scale(12),
      borderRadius: scale(8),
      alignItems: 'center',
    },
    confirmDeleteButtonText: { color: '#FFFFFF', fontSize: fonts.button, fontWeight: '600' },
    confirmDeleteButtonDisabled: { backgroundColor: colors.inactiveIcon, opacity: 0.6 },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputLabel: {
      fontSize: fonts.caption,
      color: colors.primaryText,
      marginBottom: scale(8),
      fontWeight: '500',
    },
    phoneDisplayContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.secondaryText + '40',
      borderRadius: scale(8),
      backgroundColor: colors.cardBackground + '60',
    },
    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.secondaryText,
      borderRadius: scale(8),
      backgroundColor: colors.cardBackground,
    },
    countryCode: {
      fontSize: fonts.body,
      color: colors.primaryText,
      paddingHorizontal: scale(12),
      paddingVertical: scale(14),
      borderRightWidth: 1,
      borderRightColor: colors.secondaryText,
    },
    phoneDisplay: {
      flex: 1,
      paddingHorizontal: scale(12),
      paddingVertical: scale(14),
      fontSize: fonts.body,
      color: colors.primaryText,
      fontWeight: '600',
    },
    phoneInput: {
      flex: 1,
      paddingHorizontal: scale(12),
      paddingVertical: scale(14),
      fontSize: fonts.body,
      color: colors.primaryText,
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: scale(12),
    },
    countdownText: {
      fontSize: fonts.caption,
      color: colors.secondaryText,
    },
    resendText: {
      fontSize: fonts.caption,
      color: colors.primaryButton,
      fontWeight: '600',
    },
  });