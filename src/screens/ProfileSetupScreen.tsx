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
  Image,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface ProfileSetupScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
    };
  };
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  route,
}) => {
  const { colors } = useTheme();
  const { login } = useAuth();
  const styles = createStyles(colors);

  const { phoneNumber } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate referral code dynamically
  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValid(null);
      return;
    }

    // Format code to uppercase and check basic format
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode.startsWith('KS') || formattedCode.length !== 8) {
      setReferralValid(false);
      return;
    }

    setValidatingReferral(true);
    try {
      const { firebaseService } = await import('../services/firebaseService');
      const isValid = await firebaseService.validateReferralCode(formattedCode);
      setReferralValid(isValid);
      console.log('Referral code validation:', formattedCode, isValid ? 'VALID' : 'INVALID');
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferralValid(false);
    } finally {
      setValidatingReferral(false);
    }
  };

  // Handle referral code input with debounced validation
  const handleReferralCodeChange = (text: string) => {
    const formattedText = text.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Only allow alphanumeric
    setReferralCode(formattedText);

    // Clear previous validation
    setReferralValid(null);

    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateReferralCode(formattedText);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }

    if (email.trim() && !isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Check referral code validity if provided
    if (referralCode.trim() && referralValid === false) {
      Alert.alert('Error', 'Please enter a valid referral code or leave it empty');
      return;
    }

    setLoading(true);
    try {
      const { firebaseService } = await import('../services/firebaseService');
      const { userStorage } = await import('../services/userStorage');
      
      // Prepare user data, only including defined values
      const userData: any = {
        phoneNumber,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`, // Combined name for compatibility
      };

      // Only add email if it has a value
      if (email.trim()) {
        userData.email = email.trim();
      }

      // Only add profileImage if it exists (base64 format)
      if (profileImage) {
        userData.profileImage = profileImage.replace(/^data:image\/[a-z]+;base64,/, ''); // Remove data URL prefix if present
        console.log('Profile image size:', userData.profileImage.length, 'characters');
      }

      const userProfile = await firebaseService.createUser(userData);

      // Apply referral code if provided and valid
      if (referralCode.trim() && referralValid === true) {
        try {
          console.log('Applying referral code:', referralCode, 'to user:', userProfile.id);
          const applied = await firebaseService.applyReferralCode(userProfile.id, referralCode.trim());
          if (applied) {
            console.log('Referral code applied successfully');
            Alert.alert('Success', `Profile created successfully! Referral code ${referralCode} has been applied.`);
          } else {
            console.log('Referral code application failed');
            Alert.alert('Success', 'Profile created successfully! However, the referral code could not be applied.');
          }
        } catch (referralError) {
          console.error('Error applying referral code:', referralError);
          Alert.alert('Success', 'Profile created successfully! However, there was an issue applying the referral code.');
        }
      } else {
        Alert.alert('Success', 'Profile created successfully!');
      }

      // Save user data locally for quick access
      await userStorage.saveUser(userProfile);
      await userStorage.saveAuthToken(userProfile.id);

      // Update auth context to trigger navigation to main app
      login(userProfile);

      console.log('User profile created:', userProfile.id);
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

  const convertImageToBase64 = (imageUri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      fetch(imageUri)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });
  };

  const selectImage = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
      maxWidth: 500,
      maxHeight: 500,
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            launchCamera(options, handleImageResponse);
          } else if (buttonIndex === 2) {
            launchImageLibrary(options, handleImageResponse);
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose how you want to select an image',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => launchCamera(options, handleImageResponse) },
          { text: 'Choose from Library', onPress: () => launchImageLibrary(options, handleImageResponse) },
        ]
      );
    }
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      try {
        if (asset.uri) {
          const base64Image = await convertImageToBase64(asset.uri);
          setProfileImage(base64Image);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to process image. Please try again.');
        console.error('Image processing error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={selectImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileIcon}>👤</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>Setup Your Profile</Text>
          <Text style={styles.subtitle}>Let's get to know you better</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your first name"
              placeholderTextColor={colors.inputPlaceholder}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your last name"
              placeholderTextColor={colors.inputPlaceholder}
              value={lastName}
              onChangeText={setLastName}
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

          {/* Referral Code Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Referral Code (Optional)</Text>
            <View style={styles.referralInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.referralInput,
                  referralValid === true && styles.inputValid,
                  referralValid === false && styles.inputInvalid
                ]}
                placeholder="Enter referral code (e.g., KS2A7B9K)"
                placeholderTextColor={colors.inputPlaceholder}
                value={referralCode}
                onChangeText={handleReferralCodeChange}
                autoCapitalize="characters"
                maxLength={8}
                editable={!loading}
              />
              <View style={styles.referralStatusContainer}>
                {validatingReferral && (
                  <ActivityIndicator size="small" color={colors.primaryButton} />
                )}
                {!validatingReferral && referralValid === true && (
                  <Text style={styles.validIcon}>✅</Text>
                )}
                {!validatingReferral && referralValid === false && (
                  <Text style={styles.invalidIcon}>❌</Text>
                )}
              </View>
            </View>
            {referralCode.length > 0 && (
              <Text style={[
                styles.referralHint,
                referralValid === true && { color: colors.success || '#10B981' },
                referralValid === false && { color: colors.error || '#EF4444' }
              ]}>
                {validatingReferral
                  ? 'Validating referral code...'
                  : referralValid === true
                    ? 'Valid referral code!'
                    : referralValid === false
                      ? 'Invalid referral code'
                      : 'Checking referral code...'}
              </Text>
            )}
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
              (firstName.trim().length > 0 && lastName.trim().length > 0) && styles.buttonActive
            ]}
            onPress={handleSaveProfile}
            disabled={loading || !firstName.trim() || !lastName.trim()}
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
   profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cardBackground,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.activeIcon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  profileIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryButton,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryButton,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraIconText: {
    fontSize: 16,
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
  // Referral Code Styles
  referralInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  referralInput: {
    flex: 1,
    paddingRight: 50, // Space for status indicator
  },
  inputValid: {
    borderColor: colors.success || '#10B981',
    borderWidth: 2,
  },
  inputInvalid: {
    borderColor: colors.error || '#EF4444',
    borderWidth: 2,
  },
  referralStatusContainer: {
    position: 'absolute',
    right: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  validIcon: {
    fontSize: 16,
  },
  invalidIcon: {
    fontSize: 16,
  },
  referralHint: {
    fontSize: 12,
    marginTop: 5,
    color: colors.secondaryText,
    fontStyle: 'italic',
  },
});