import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAQs } from './FAQs';
import { ContactSupport } from './ContactSupport';
import { ReportAProblem } from './Reportaproblem';
import { AppVersion } from './AppVersion';
import { TermsAndConditions } from './TermsAndConditions';
import { PrivacyPolicy } from './PrivacyPolicy';

interface HelpandSupportProps {
  onClose: () => void;
}

export const HelpandSupport: React.FC<HelpandSupportProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [showFAQs, setShowFAQs] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showReportaproblem, setShowReportaproblem] = useState(false);
  const [showAppVersion, setShowAppVersion] = useState(false);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const Helpoptions = [
    {
      id: 1,
      title: 'FAQs',
      icon: 'help-circle-outline',
      onPress: () => setShowFAQs(true),
    },
    {
      id: 2,
      title: 'Contact Support',
      icon: 'chatbox-ellipses-outline',
      onPress: () => setShowContactSupport(true),
    },
    {
      id: 3,
      title: 'Report a problem',
      icon: 'alert-circle-outline',
      onPress: () => setShowReportaproblem(true),
    },
    {
      id: 4,
      title: 'Terms & Conditions',
      icon: 'document-text-outline',
      onPress: () => setShowTermsAndConditions(true),
    },
    {
      id: 5,
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      onPress: () => setShowPrivacyPolicy(true),
    },
    {
      id: 6,
      title: 'App Version',
      icon: 'apps-outline',
      onPress: () => setShowAppVersion(true),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* <Text style={styles.text}>Help info and Support</Text> */}

        {Helpoptions.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.option}
            onPress={item.onPress}
            activeOpacity={0.7}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Ionicons name={item.icon} size={20} color={colors.inactiveIcon} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{item.title}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.inactiveIcon} />
          </TouchableOpacity>
        ))}

        {/* FAQs Modal */}
        <Modal visible={showFAQs} animationType="slide" presentationStyle="pageSheet">
          <FAQs onClose={() => setShowFAQs(false)} />
        </Modal>

        {/* Contact Support Modal */}
        <Modal visible={showContactSupport} animationType="slide" presentationStyle="pageSheet">
          <ContactSupport onClose={() => setShowContactSupport(false)} />
        </Modal>

        {/* Report a problem Modal */}
        <Modal visible={showReportaproblem} animationType="slide" presentationStyle="pageSheet">
          <ReportAProblem onClose={() => setShowReportaproblem(false)} />
        </Modal>

        {/* Terms & Conditions Modal */}
        <Modal visible={showTermsAndConditions} animationType="slide" presentationStyle="pageSheet">
          <TermsAndConditions onClose={() => setShowTermsAndConditions(false)} />
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal visible={showPrivacyPolicy} animationType="slide" presentationStyle="pageSheet">
          <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
        </Modal>

        {/* App Version Modal */}
        <Modal visible={showAppVersion} animationType="slide" presentationStyle="pageSheet">
          <AppVersion onClose={() => setShowAppVersion(false)} />
        </Modal>
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
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
    margin: 20,
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
