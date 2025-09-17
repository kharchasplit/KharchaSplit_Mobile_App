import React, { useState } from 'react';
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
import { launchImageLibrary, Asset, ImageLibraryOptions } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditProfileScreenProps {
  onClose: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    alternateMobile: '',
    address: '',
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [selectedAltCountryCode, setSelectedAltCountryCode] = useState('+91');
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<Asset | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Here you can save data to your own API or local DB
      console.log('Saving profile data:', {
        ...formData,
        phoneNumber: `${selectedCountryCode}${formData.mobileNumber.trim()}`,
        alternateMobile: `${selectedAltCountryCode}${formData.alternateMobile.trim()}`,
        profileImageUri,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      onClose();
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
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProfileImage(asset);
        setProfileImageUri(asset.uri || null);
      }
    });
  };

  const styles = createStyles(colors);
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
              source={{
                uri:
                  profileImageUri ||
                  `https://via.placeholder.com/150x150/333/fff?text=${
                    formData.firstName ? formData.firstName.charAt(0) : 'U'
                  }`,
              }}
              style={styles.profilePhoto}
            />
            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={handleEditPhoto}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
              placeholder="Enter first name"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
              placeholder="Enter last name"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>

          {/* Email ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email ID</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={value => handleInputChange('email', value)}
              placeholder="Enter email"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="email-address"
            />
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity style={styles.countryCodeButton}>
                <Image
                  source={{ uri: 'https://flagcdn.com/w40/in.png' }}
                  style={styles.flagIcon}
                />
                <Text style={styles.countryCode}>{selectedCountryCode}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.secondaryText} />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                value={formData.mobileNumber}
                onChangeText={value => handleInputChange('mobileNumber', value)}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          {/* Alternate Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Alternate Mobile Number</Text>
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
                placeholder="Enter alternate mobile no."
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={value => handleInputChange('address', value)}
              placeholder="Enter your address"
              placeholderTextColor={colors.inputPlaceholder}
              multiline
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
});

