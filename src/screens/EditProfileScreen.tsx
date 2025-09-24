import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseService, UpdateUserProfile } from '../services/firebaseService';
import { userStorage } from '../services/userStorage';
import { processProfileImage, getProfileImageUri } from '../utils/imageUtils';
import { PhotoLibraryPermissionHelper } from '../utils/PhotoLibraryPermissionHelper';

interface EditProfileScreenProps {
  onClose: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    alternateMobile: '',
    address: '',
  });

  const [selectedAltCountryCode, setSelectedAltCountryCode] = useState('+91');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileImageBase64, setProfileImageBase64] = useState<string>('');
  const [displayImageUri, setDisplayImageUri] = useState<string>('');

  // Load user data on mount and sync with real-time user updates
  useEffect(() => {
    if (user) {

      const alternatePhoneWithoutCode = user.alternatePhone?.replace(/^\+91/, '') || '';

      // Dynamically update form data from current user state
      setFormData({
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ')[1] || '',
        email: user.email || '',
        alternateMobile: alternatePhoneWithoutCode,
        address: user.address || '',
      });

      // Update profile image state dynamically
      const currentImageBase64 = user.profileImageBase64 || user.profileImage || '';
      setProfileImageBase64(currentImageBase64);
      setDisplayImageUri(getProfileImageUri(user));

      // Extract alternate phone country code if present
      if (user.alternatePhone?.startsWith('+91')) {
        setSelectedAltCountryCode('+91');
      }
    }
    setLoading(false);
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Update display image if name changes
    if (field === 'firstName') {
      if (!profileImageBase64) {
        setDisplayImageUri(getProfileImageUri({
          firstName: value,
          profileImageBase64
        }));
      }
    }
  };

  const handleSaveChanges = async () => {
    // Validate only mandatory fields: First Name and Last Name
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First Name is required');
      return;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Last Name is required');
      return;
    }

    // Optional email validation if provided
    if (formData.email.trim() && !isValidEmail(formData.email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setSaving(true);

    try {
      const updateData: UpdateUserProfile = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim() || undefined,
        alternatePhone: formData.alternateMobile.trim()
          ? `${selectedAltCountryCode}${formData.alternateMobile.trim()}`
          : undefined,
        address: formData.address.trim() || undefined,
        profileImageBase64: profileImageBase64 || undefined,
      };


      // Update in Firebase
      const updatedUser = await firebaseService.updateUser(user.id, updateData);

      // Update local storage
      await userStorage.saveUser(updatedUser);

      // Update auth context to reflect changes immediately
      login(updatedUser);


      // Show success without closing - keep UI intact
      Alert.alert('Success', 'Profile updated successfully!');

    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPhoto = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: true, // This will include base64 in response
    };

    Alert.alert(
      'Select Profile Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Choose from Gallery', 
          onPress: () => {
            PhotoLibraryPermissionHelper.handlePhotoLibraryPermission(
              () => selectImage(options),
              () => {
                // Permission denied - do nothing
              }
            );
          }
        },
        { text: 'Remove Photo', style: 'destructive', onPress: removePhoto },
      ]
    );
  };

  const selectImage = (options: ImageLibraryOptions) => {
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Error', 'Failed to select image');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];

        try {
          let base64Data = '';

          if (asset.base64) {
            // Use base64 from image picker
            base64Data = asset.base64;
          } else if (asset.uri) {
            // Convert URI to base64 using our utility
            const imageResult = await processProfileImage(asset.uri);
            base64Data = imageResult.base64;
          }

          if (base64Data) {
            setProfileImageBase64(base64Data);
            setDisplayImageUri(`data:image/jpeg;base64,${base64Data}`);
          }
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process the selected image. Please try again.');
        }
      }
    });
  };

  const removePhoto = () => {
    setProfileImageBase64('');
    setDisplayImageUri(getProfileImageUri({ firstName: formData.firstName }));
  };

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: displayImageUri }}
              style={styles.profilePhoto}
              onError={() => {
                // Fallback to placeholder on error
                setDisplayImageUri(getProfileImageUri({ firstName: formData.firstName }));
              }}
            />
            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={handleEditPhoto}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>
            Tap the camera icon to change your profile photo
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* First Name - Required */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              First Name <Text style={styles.requiredIndicator}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, !formData.firstName.trim() && styles.textInputRequired]}
              value={formData.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
              placeholder="Enter first name (required)"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>

          {/* Last Name - Required */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Last Name <Text style={styles.requiredIndicator}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, !formData.lastName.trim() && styles.textInputRequired]}
              value={formData.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
              placeholder="Enter last name (required)"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>

          {/* Email ID - Optional */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Email ID <Text style={styles.optionalIndicator}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={value => handleInputChange('email', value)}
              placeholder="Enter email address (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="email-address"
            />
          </View>

          {/* Primary Mobile Number (Read Only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{user?.phoneNumber}</Text>
              <Text style={styles.readOnlyHint}>Primary number cannot be changed</Text>
            </View>
          </View>

          {/* Alternate Mobile Number - Optional */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Alternate Mobile Number <Text style={styles.optionalIndicator}>(optional)</Text>
            </Text>
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity style={styles.countryCodeButton}>
                <Image
                  source={{ uri: 'https://flagcdn.com/w40/in.png' }}
                  style={styles.flagIcon}
                />
                <Text style={styles.countryCode}>{selectedAltCountryCode}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.secondaryText} />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                value={formData.alternateMobile}
                onChangeText={value => handleInputChange('alternateMobile', value)}
                placeholder="Enter alternate number (optional)"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          {/* Address - Optional */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Address <Text style={styles.optionalIndicator}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={value => handleInputChange('address', value)}
              placeholder="Enter your address (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Required Fields Note */}
        <View style={styles.requirementNote}>
          <Text style={styles.requirementText}>
            <Text style={styles.requiredIndicator}>*</Text> Required fields
          </Text>
          <Text style={styles.requirementSubText}>
            Only First Name and Last Name are mandatory. All other fields are optional.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            (!formData.firstName.trim() || !formData.lastName.trim()) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveChanges}
          disabled={saving || !formData.firstName.trim() || !formData.lastName.trim()}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Changes
              {(!formData.firstName.trim() || !formData.lastName.trim()) && ' (Complete required fields)'}
            </Text>
          )}
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
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  photoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryButton,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.cardBackground,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.inputText,
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },
  phoneInputContainer: {
    flexDirection: 'row',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondaryText,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    minWidth: 100,
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    color: colors.primaryText,
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.secondaryText,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.inputText,
    backgroundColor: colors.inputBackground,
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: colors.primaryButton,
    marginHorizontal: 20,
    marginVertical: 30,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.primaryButtonText,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondaryText,
  },
  photoHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  readOnlyContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.secondaryText,
    opacity: 0.7,
  },
  readOnlyText: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '500',
  },
  readOnlyHint: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
    fontStyle: 'italic',
  },
  requiredIndicator: {
    color: '#EF4444', // Red color for required fields
    fontSize: 14,
    fontWeight: '600',
  },
  optionalIndicator: {
    color: colors.secondaryText,
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  textInputRequired: {
    borderColor: '#FCA5A5', // Light red border for empty required fields
    borderWidth: 1.5,
  },
  requirementNote: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  requirementText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementSubText: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 16,
  },
});

