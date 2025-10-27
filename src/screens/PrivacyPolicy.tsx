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

interface PrivacyPolicyProps {
  onClose: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: September 22, 2025</Text>

        <Text style={styles.introText}>
          At KharchaSplit, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our mobile application.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionContent}>
            We collect the following types of information:
          </Text>
          
          <Text style={styles.subTitle}>Personal Information:</Text>
          <Text style={styles.bulletPoint}>• Name and phone number (for account creation)</Text>
          <Text style={styles.bulletPoint}>• Email address (optional)</Text>
          <Text style={styles.bulletPoint}>• Profile picture (optional)</Text>
          <Text style={styles.bulletPoint}>• Contact list (with your permission, to find friends)</Text>
          
          <Text style={styles.subTitle}>Usage Information:</Text>
          <Text style={styles.bulletPoint}>• Expenses and transaction data</Text>
          <Text style={styles.bulletPoint}>• Group memberships and activities</Text>
          <Text style={styles.bulletPoint}>• App usage patterns and preferences</Text>
          <Text style={styles.bulletPoint}>• Device information and analytics</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionContent}>
            We use your information to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide and maintain our expense splitting services</Text>
          <Text style={styles.bulletPoint}>• Create and manage your account</Text>
          <Text style={styles.bulletPoint}>• Connect you with friends who use KharchaSplit</Text>
          <Text style={styles.bulletPoint}>• Send notifications about expenses and settlements</Text>
          <Text style={styles.bulletPoint}>• Improve our app features and user experience</Text>
          <Text style={styles.bulletPoint}>• Provide customer support</Text>
          <Text style={styles.bulletPoint}>• Prevent fraud and ensure security</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.sectionContent}>
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
          </Text>
          <Text style={styles.bulletPoint}>• With other app users in your expense groups (name, expenses)</Text>
          <Text style={styles.bulletPoint}>• With your explicit consent</Text>
          <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
          <Text style={styles.bulletPoint}>• To protect our rights and prevent fraud</Text>
          <Text style={styles.bulletPoint}>• With service providers who help us operate the app (under strict confidentiality)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.sectionContent}>
            We implement appropriate security measures to protect your personal information:
          </Text>
          <Text style={styles.bulletPoint}>• Encryption of data in transit and at rest</Text>
          <Text style={styles.bulletPoint}>• Secure authentication and access controls</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
          <Text style={styles.bulletPoint}>• Limited access to personal data by authorized personnel only</Text>
          <Text style={styles.bulletPoint}>• Secure cloud infrastructure with Firebase</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Retention</Text>
          <Text style={styles.sectionContent}>
            We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights and Choices</Text>
          <Text style={styles.sectionContent}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Access and update your personal information</Text>
          <Text style={styles.bulletPoint}>• Delete your account and associated data</Text>
          <Text style={styles.bulletPoint}>• Control notification preferences</Text>
          <Text style={styles.bulletPoint}>• Opt out of non-essential data collection</Text>
          <Text style={styles.bulletPoint}>• Request a copy of your data</Text>
          <Text style={styles.bulletPoint}>• Withdraw consent for data processing</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Third-Party Services</Text>
          <Text style={styles.sectionContent}>
            KharchaSplit uses third-party services that may collect information:
          </Text>
          <Text style={styles.bulletPoint}>• Firebase (Google) for backend services and analytics</Text>
          <Text style={styles.bulletPoint}>• Push notification services</Text>
          <Text style={styles.bulletPoint}>• App store analytics</Text>
          <Text style={styles.sectionContent}>
            These services have their own privacy policies governing the use of your information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.sectionContent}>
            KharchaSplit is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete such information promptly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
          <Text style={styles.sectionContent}>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your privacy rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to Privacy Policy</Text>
          <Text style={styles.sectionContent}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy in the app and updating the "Last updated" date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.sectionContent}>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </Text>
          <Text style={styles.contactInfo}>Email: support@kharchasplit.in</Text>
          <Text style={styles.contactInfo}>Subject: Privacy Policy Inquiry</Text>
        </View>

        <Text style={styles.footer}>
          By using KharchaSplit, you acknowledge that you have read and understood this Privacy Policy and consent to our data practices as described herein.
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
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 8,
    marginBottom: 4,
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