import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TermsAndConditionsProps {
  onClose: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: September 22, 2025</Text>

        <Text style={styles.introText}>
          Welcome to KharchaSplit! These Terms and Conditions ("Terms") govern your use of our mobile application and services. By using KharchaSplit, you agree to be bound by these Terms.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionContent}>
            By downloading, installing, or using the KharchaSplit application, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionContent}>
            KharchaSplit is a mobile application that helps users manage and split expenses among groups. Our services include:
          </Text>
          <Text style={styles.bulletPoint}>• Creating and managing expense groups</Text>
          <Text style={styles.bulletPoint}>• Recording and tracking shared expenses</Text>
          <Text style={styles.bulletPoint}>• Calculating balances and settlements</Text>
          <Text style={styles.bulletPoint}>• Sending payment reminders and notifications</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.sectionContent}>
            To use KharchaSplit, you must create an account. You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Providing accurate and complete information</Text>
          <Text style={styles.bulletPoint}>• Maintaining the security of your account credentials</Text>
          <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
          <Text style={styles.bulletPoint}>• Notifying us immediately of any unauthorized use</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
          <Text style={styles.sectionContent}>
            You agree to use KharchaSplit only for lawful purposes and in accordance with these Terms. You will not:
          </Text>
          <Text style={styles.bulletPoint}>• Use the service for any illegal or fraudulent activities</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to our systems</Text>
          <Text style={styles.bulletPoint}>• Upload malicious code or compromise app security</Text>
          <Text style={styles.bulletPoint}>• Harass or abuse other users</Text>
          <Text style={styles.bulletPoint}>• Violate any applicable laws or regulations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data and Privacy</Text>
          <Text style={styles.sectionContent}>
            Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Payments and Settlements</Text>
          <Text style={styles.sectionContent}>
            KharchaSplit facilitates the tracking and calculation of shared expenses but does not process actual payments. Users are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Making payments to other users outside the app</Text>
          <Text style={styles.bulletPoint}>• Ensuring accuracy of recorded expenses</Text>
          <Text style={styles.bulletPoint}>• Resolving payment disputes independently</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.sectionContent}>
            The KharchaSplit app, including its design, features, and content, is owned by us and protected by intellectual property laws. You may not copy, modify, or distribute our app without permission.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.sectionContent}>
            KharchaSplit is provided "as is" without warranties. We are not liable for any damages arising from your use of the app, including but not limited to financial losses or data loss.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Termination</Text>
          <Text style={styles.sectionContent}>
            We may terminate or suspend your account at any time for violation of these Terms. You may delete your account at any time through the app settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.sectionContent}>
            We reserve the right to update these Terms at any time. Continued use of the app after changes constitutes acceptance of the new Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.sectionContent}>
            For questions about these Terms, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>Email: support@kharchasplit.in</Text>
        </View>

        <Text style={styles.footer}>
          By using KharchaSplit, you acknowledge that you have read and understood these Terms and Conditions.
        </Text>
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
  lastUpdated: {
    fontSize: 12,
    color: colors.secondaryText,
    fontStyle: 'italic',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: colors.primaryButton,
    fontWeight: '500',
    marginTop: 4,
  },
  footer: {
    fontSize: 12,
    color: colors.secondaryText,
    fontStyle: 'italic',
    textAlign: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    lineHeight: 18,
  },
});