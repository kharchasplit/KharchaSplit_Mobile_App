import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type CurrencyPreferenceProps = {
  onClose: () => void;
};

type CurrencyOption = {
  code: string;
  logo: string;
};

export const CurrencyPreference: React.FC<CurrencyPreferenceProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const currencyOptions: CurrencyOption[] = [
    { code: 'INR', logo: '₹' },
    { code: 'USD', logo: '$' },
  ];

  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');

  const handleCurrencySelect = (code: string) => {
    setSelectedCurrency(code);
    Alert.alert('Preference Saved', `You selected ${code} as your currency.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Currency Preference</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>Select Currency Preference</Text>

        {currencyOptions.map(({ code, logo }) => (
          <TouchableOpacity
            key={code}
            style={styles.option}
            onPress={() => handleCurrencySelect(code)}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Text style={styles.currencyLogo}>{logo}</Text>
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{code}</Text>
              </View>
            </View>
            {selectedCurrency === code && (
              <Ionicons
                name="checkmark"
                size={20}
                color={colors.activeIcon}
              />
            )}
          </TouchableOpacity>
        ))}
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
  currencyLogo: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
  },
});


