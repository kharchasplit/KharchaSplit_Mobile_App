import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReportAProblemProps {
  onClose: () => void;
}

export const ReportAProblem: React.FC<ReportAProblemProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const handleEmailPress = () => {
    const subject = 'Problem Report - KharchaSplit App';
    const body = 'Dear KharchaSplit Support Team,\n\nI am experiencing the following issue with the app:\n\n[Please describe your problem here]\n\nDevice Information:\n- Operating System: \n- App Version: 1.0.0\n- Problem occurred on: \n\nThank you for your assistance.\n\nBest regards,';
    Linking.openURL(`mailto:support@kharchasplit.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report a problem</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.introText}>
          We're sorry to hear that you're experiencing issues with KharchaSplit. Your feedback helps us improve the app for everyone.
        </Text>
        
        <Text style={styles.instructionText}>
          To report a problem, please email us with details about the issue you're facing:
        </Text>

        <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7}>
          <View style={styles.emailContainer}>
            <Ionicons
              name="mail-outline"
              size={24}
              color={colors.primaryButton}
              style={{ marginRight: 12 }}
            />
            <View style={styles.emailContent}>
              <Text style={styles.emailTitle}>Email Support</Text>
              <Text style={styles.emailAddress}>support@kharchasplit.in</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.secondaryText}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for better support:</Text>
          <Text style={styles.tipItem}>• Describe the problem in detail</Text>
          <Text style={styles.tipItem}>• Include steps to reproduce the issue</Text>
          <Text style={styles.tipItem}>• Mention your device type and OS version</Text>
          <Text style={styles.tipItem}>• Attach screenshots if helpful</Text>
          <Text style={styles.tipItem}>• Include any error messages you see</Text>
        </View>

        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>
            📧 We typically respond within 24-48 hours during business days.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 0,
    borderBottomColor: colors.secondaryText,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  introText: {
    fontSize: 16,
    color: colors.primaryText,
    lineHeight: 22,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryButton + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emailContent: {
    flex: 1,
  },
  emailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 2,
  },
  emailAddress: {
    fontSize: 14,
    color: colors.primaryButton,
    fontWeight: '500',
  },
  tipsContainer: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryButton,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 20,
    marginBottom: 6,
    marginLeft: 8,
  },
  responseContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: colors.primaryButton + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryButton + '20',
  },
  responseText: {
    fontSize: 14,
    color: colors.primaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryText,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '500',
  },
});
