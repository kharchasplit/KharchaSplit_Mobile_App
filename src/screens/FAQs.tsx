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

interface FAQsProps {
  onClose: () => void;
}

export const FAQs: React.FC<FAQsProps> = ({ onClose }) => {
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
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>Frequently Asked Questions</Text>

        <View style={styles.faqItem}>
          <Text style={styles.question}>1. How does KharchaSplit work?</Text>
          <Text style={styles.answer}>
            KharchaSplit lets you manage group expenses and split bills easily with
            friends or roommates.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>
            2. Can I use KharchaSplit without an account?
          </Text>
          <Text style={styles.answer}>
            No, you need to create an account to track and sync your expenses
            securely.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>3. Is my data private?</Text>
          <Text style={styles.answer}>
            Yes. We do not share your data with third parties and your
            information is stored securely.
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
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
    margin: 20,
  },
  faqItem: {
    marginBottom: 24,
    marginHorizontal: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 16,
  },
});
