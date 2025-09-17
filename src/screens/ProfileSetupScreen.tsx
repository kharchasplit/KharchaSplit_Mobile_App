import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ProfileSetupScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
    };
  };
}

// --- FIX ---
// The component props { navigation, route } are destructured in the arguments.
// All hooks (useTheme) and variable declarations (styles) must go INSIDE the component body.
export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  navigation,
  route,
}) => {
  // These lines were in the wrong place. They belong inside the function body.
  const { colors } = useTheme();
  const styles = createStyles(colors);
  // --- END FIX ---

  const { phoneNumber } = route.params;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (email.trim() && !isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { firebaseService } = await import('../services/firebaseService');
      const { userStorage } = await import('../services/userStorage');
      
      const userProfile = await firebaseService.createUser({
        phoneNumber,
        name: name.trim(),
        email: email.trim() || undefined,
      });

      // Save user data locally for quick access
      await userStorage.saveUser(userProfile);
      await userStorage.saveAuthToken(userProfile.id);

      console.log('User profile created:', userProfile.id);

      Alert.alert('Success', 'Profile created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'), // This will now work
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
      console.error('Save profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    // All the JSX will now work because `styles` and `colors` are correctly defined
    <View style={styles.container}> 
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.profileIcon}>👤</Text>
          </View>
          <Text style={styles.title}>Setup Your Profile</Text>
          <Text style={styles.subtitle}>Let's get to know you better</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.inputPlaceholder}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor={colors.inputPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.phoneContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneDisplay}>
              <Text style={styles.phoneText}>+91 {phoneNumber}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading && styles.buttonDisabled,
              name.trim().length > 0 && styles.buttonActive
            ]}
            onPress={handleSaveProfile}
            disabled={loading || !name.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryButtonText} />
            ) : (
              <>
                <Text style={styles.buttonText}>Complete Setup</Text>
                <Text style={styles.buttonIcon}>🚀</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can update this information later in settings
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// The createStyles function remains unchanged
const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.activeIcon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  profileIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
    marginLeft: 4,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.inputText,
    fontWeight: '500',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  phoneContainer: {
    marginBottom: 32,
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.success,
  },
  phoneText: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '600',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedIcon: {
    fontSize: 12,
    color: colors.primaryText,
    marginRight: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: colors.primaryText,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primaryButton,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    opacity: 0.5,
  },
  buttonActive: {
    opacity: 1,
    transform: [{ scale: 1.02 }],
  },
  buttonDisabled: {
    opacity: 0.5,
    transform: [{ scale: 1 }],
  },
  buttonText: {
    color: colors.primaryButtonText,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    fontSize: 18,
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
  },
});