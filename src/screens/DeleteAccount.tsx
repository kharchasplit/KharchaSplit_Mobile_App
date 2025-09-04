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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const styles = useMemo(() => createStyles(), []);

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

  const ConsequenceItem: React.FC<{ text: string }> = ({ text }) => (
    <View style={styles.consequenceItem}>
      <Ionicons name="close-circle" size={20} color={colors.error} />
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
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Warning Icon */}
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={60} color={colors.error} />
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
            <Ionicons name="warning" size={40} color={colors.error} />
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

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondaryText,
      backgroundColor: colors.background,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
    placeholder: { width: 32 },
    scrollView: { flex: 1 },
    warningContainer: { marginBottom: 16, marginTop: 16, alignItems: 'center' },
    warningTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.error,
      marginBottom: 16,
      textAlign: 'center',
    },
    warningText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 16,
      margin: 20,
    },
    consequencesList: { width: '100%', marginBottom: 24 },
    consequenceItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 },
    consequenceText: { fontSize: 16, color: colors.primaryText, marginLeft: 12, flex: 1 },
    inputContainer: { marginBottom: 24, marginHorizontal: 20 },
    textInput: {
      borderWidth: 1,
      borderColor: colors.secondaryText,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.primaryText,
      backgroundColor: colors.cardBackground,
      width: '100%',
    },
    textInputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 14, marginTop: 8, textAlign: 'left' },
    deleteButton: {
      backgroundColor: colors.error,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
    },
    deleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    deleteButtonDisabled: { backgroundColor: colors.inactiveIcon, opacity: 0.6 },
    deleteButtonTextDisabled: { color: colors.secondaryText },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
      marginTop: 16,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalText: {
      fontSize: 16,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
    confirmDeleteButton: {
      flex: 1,
      backgroundColor: colors.error,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    confirmDeleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  });
