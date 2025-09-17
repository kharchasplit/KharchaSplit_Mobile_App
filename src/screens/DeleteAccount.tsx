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
  // --- RESPONSIVE ---
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
// --- RESPONSIVE ---
import { typography } from '../utils/typography'; // Assuming path is correct

type DeleteAccountProps = {
  onClose: () => void;
};

const CONSEQUENCES = [
  { id: 1, text: 'Delete all your expense data' },
  { id: 2, text: 'Remove you from all groups' },
  { id: 3, text: 'Delete your profile permanently' },
  { id: 4, text: 'Cannot be recovered' },
] as const;

export const DeleteAccount: React.FC<DeleteAccountProps> = ({ onClose }) => {
  const { colors } = useTheme();

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
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // --- STYLE FIX & RESPONSIVE ---
  // Pass all dependencies to createStyles and useMemo
  const styles = useMemo(() => {
    return createStyles(colors, scale, scaledFontSize);
  }, [colors, scale, scaledFontSize]);
  // --- END FIX ---

  const validatePassword = useCallback((pwd: string) => {
    if (!pwd.trim()) {
      return 'Password is required';
    }
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }, []);

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      if (passwordError) {
        setPasswordError('');
      }
    },
    [passwordError],
  );

  const handleDeleteAccount = useCallback(() => {
    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }
    setShowConfirmModal(true);
  }, [password, validatePassword]);

  const confirmDelete = useCallback(() => {
    setShowConfirmModal(false);
    Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
      { text: 'OK', onPress: onClose },
    ]);
  }, [onClose]);

  const cancelDelete = useCallback(() => {
    setShowConfirmModal(false);
    setPasswordError('');
  }, []);

  // Use style from useMemo
  const ConsequenceItem: React.FC<{ text: string }> = ({ text }) => (
    <View style={styles.consequenceItem}>
      <Ionicons name="close-circle" size={scale(20)} color={colors.error} />
      <Text style={styles.consequenceText}>{text}</Text>
    </View>
  );

  const isDeleteDisabled = useMemo(
    () => !password.trim() || password.length < 6,
    [password],
  );

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
        <Text style={styles.warningTitle}>Delete Your Account</Text>
        <Text style={styles.warningText}>
          Deleting your account is a permanent action and cannot be undone. This will:
        </Text>

        {/* Consequences List */}
        <View style={styles.consequencesList}>
          {CONSEQUENCES.map(consequence => (
            <ConsequenceItem key={consequence.id} text={consequence.text} />
          ))}
        </View>

        <Text style={styles.warningText}>Enter your Password to continue</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, passwordError ? styles.textInputError : null]}
            placeholder="Enter Your Password"
            placeholderTextColor={colors.secondaryText}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, isDeleteDisabled && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleteDisabled}>
          <Text
            style={[
              styles.deleteButtonText,
              isDeleteDisabled && styles.deleteButtonTextDisabled,
            ]}>
            Delete My Account
          </Text>
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
              This action cannot be undone. Your account and all data will be permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={confirmDelete}>
                <Text style={styles.confirmDeleteButtonText}>Delete Account</Text>
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
  });