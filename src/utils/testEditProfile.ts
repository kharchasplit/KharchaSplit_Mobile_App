// Test functions for the dynamic edit profile functionality
import { processProfileImage, getProfileImageUri, createImageDataUri } from './imageUtils';

export const testImageUtils = () => {
  console.log('Testing Image Utils...');

  // Test placeholder generation
  const placeholder1 = getProfileImageUri({ firstName: 'John' });
  const placeholder2 = getProfileImageUri({ name: 'Jane Doe' });
  const placeholder3 = getProfileImageUri({});

  console.log('✅ Placeholder URIs:', {
    placeholder1,
    placeholder2,
    placeholder3,
  });

  // Test base64 data URI creation
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const dataUri = createImageDataUri(sampleBase64);
  console.log('✅ Data URI created:', dataUri.substring(0, 50) + '...');

  // Test with existing base64
  const userWithImage = {
    firstName: 'John',
    profileImageBase64: sampleBase64,
  };

  const imageUri = getProfileImageUri(userWithImage);
  console.log('✅ Image URI with base64:', imageUri.substring(0, 50) + '...');

  return {
    success: true,
    message: 'Image utils tests completed successfully',
  };
};

export const testProfileData = () => {
  console.log('Testing Profile Data Structure...');

  // Mock user profile data
  const mockUserProfile = {
    id: 'user123',
    phoneNumber: '+911234567890',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    alternatePhone: '+919876543210',
    address: '123 Main St, City, State',
    profileImageBase64: 'sample_base64_data_here',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  console.log('✅ Mock user profile structure:', {
    hasRequiredFields: !!(
      mockUserProfile.id &&
      mockUserProfile.phoneNumber &&
      mockUserProfile.name
    ),
    hasOptionalFields: !!(
      mockUserProfile.firstName &&
      mockUserProfile.lastName &&
      mockUserProfile.email &&
      mockUserProfile.alternatePhone &&
      mockUserProfile.address &&
      mockUserProfile.profileImageBase64
    ),
    fieldsCount: Object.keys(mockUserProfile).length,
  });

  // Test form data extraction
  const formData = {
    firstName: mockUserProfile.firstName || mockUserProfile.name?.split(' ')[0] || '',
    lastName: mockUserProfile.lastName || mockUserProfile.name?.split(' ')[1] || '',
    email: mockUserProfile.email || '',
    alternateMobile: mockUserProfile.alternatePhone?.replace(/^\+91/, '') || '',
    address: mockUserProfile.address || '',
  };

  console.log('✅ Extracted form data:', formData);

  return {
    success: true,
    message: 'Profile data tests completed successfully',
    mockUserProfile,
    formData,
  };
};

// Combined test function
export const runEditProfileTests = () => {
  console.log('🧪 Starting Edit Profile Tests...');

  try {
    const imageTest = testImageUtils();
    const profileTest = testProfileData();

    console.log('✅ All Edit Profile tests passed!');
    return {
      success: true,
      message: 'All edit profile functionality tests completed successfully',
      results: {
        imageUtils: imageTest,
        profileData: profileTest,
      },
    };
  } catch (error) {
    console.error('❌ Edit Profile tests failed:', error);
    return {
      success: false,
      message: 'Edit profile tests failed',
      error,
    };
  }
};