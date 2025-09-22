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

interface ContactSupportProps {
  onClose: () => void;
}

export const ContactSupport: React.FC<ContactSupportProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@kharchasplit.in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>
          For any queries or feedback, please reach us at:
        </Text>

        <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7}>
          <View style={styles.emailContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.activeIcon}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.emailText}>support@kharchasplit.in</Text>
          </View>
        </TouchableOpacity>
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
    marginBottom: 12,
    marginHorizontal: 20,
    marginTop: 24,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryButton,
    textDecorationLine: 'underline',
  },
});

