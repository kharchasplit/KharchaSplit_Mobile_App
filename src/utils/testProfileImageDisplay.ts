// Test utility for profile image display functionality
import { getProfileImageUri, createImageDataUri, getPlaceholderImageUri } from './imageUtils';

export const testProfileImageDisplay = () => {
  console.log('🖼️ Testing Profile Image Display...');

  // Test cases for different user scenarios
  const testUsers = [
    {
      name: 'User with profileImage field',
      user: {
        firstName: 'John',
        name: 'John Doe',
        profileImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' // 1x1 transparent PNG
      }
    },
    {
      name: 'User with profileImageBase64 field',
      user: {
        firstName: 'Jane',
        name: 'Jane Smith',
        profileImageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' // 1x1 transparent PNG
      }
    },
    {
      name: 'User with no image (firstName)',
      user: {
        firstName: 'Alice',
        name: 'Alice Johnson'
      }
    },
    {
      name: 'User with no image (name only)',
      user: {
        name: 'Bob Wilson'
      }
    },
    {
      name: 'User with empty data',
      user: {}
    }
  ];

  testUsers.forEach((testCase, index) => {
    console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`);

    try {
      const imageUri = getProfileImageUri(testCase.user);
      const isDataUri = imageUri.startsWith('data:');
      const isPlaceholder = imageUri.includes('placeholder');

      console.log(`   ✅ Generated URI: ${imageUri.substring(0, 50)}...`);
      console.log(`   📊 Type: ${isDataUri ? 'Base64 Data URI' : isPlaceholder ? 'Placeholder' : 'Other'}`);

      if (testCase.user.profileImage || testCase.user.profileImageBase64) {
        console.log(`   🎯 Expected: Base64 Data URI - ${isDataUri ? '✅ CORRECT' : '❌ INCORRECT'}`);
      } else {
        console.log(`   🎯 Expected: Placeholder - ${isPlaceholder ? '✅ CORRECT' : '❌ INCORRECT'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error generating URI: ${error}`);
    }
  });

  console.log('\n🧪 Testing Base64 Data URI Creation...');

  // Test base64 data URI creation
  const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  try {
    const dataUri = createImageDataUri(testBase64);
    const expectedPrefix = 'data:image/jpeg;base64,';
    const hasCorrectPrefix = dataUri.startsWith(expectedPrefix);

    console.log(`   ✅ Created Data URI: ${dataUri.substring(0, 50)}...`);
    console.log(`   🎯 Correct prefix: ${hasCorrectPrefix ? '✅ YES' : '❌ NO'}`);
  } catch (error) {
    console.log(`   ❌ Error creating data URI: ${error}`);
  }

  console.log('\n🧪 Testing Placeholder Generation...');

  const placeholderTests = ['John', 'A', '', 'Jane Doe'];
  placeholderTests.forEach(name => {
    const placeholderUri = getPlaceholderImageUri(name);
    const expectedInitial = name?.charAt(0)?.toUpperCase() || 'U';
    const containsInitial = placeholderUri.includes(`text=${expectedInitial}`);

    console.log(`   Name: "${name}" → Initial: "${expectedInitial}" → ${containsInitial ? '✅' : '❌'}`);
  });

  console.log('\n📊 Profile Image Display Test Complete!');
  return {
    success: true,
    message: 'Profile image display tests completed',
    timestamp: new Date().toISOString()
  };
};

export const debugUserProfileImage = (user: any) => {
  console.log('\n🔍 Debugging User Profile Image...');
  console.log('User object:', JSON.stringify(user, null, 2));

  const hasProfileImage = !!(user?.profileImage || user?.profileImageBase64);
  const profileImageData = user?.profileImage || user?.profileImageBase64;

  console.log('Profile image analysis:');
  console.log(`   Has profile image: ${hasProfileImage}`);
  console.log(`   Profile image length: ${profileImageData?.length || 'N/A'}`);
  console.log(`   Profile image field: ${user?.profileImage ? 'profileImage' : user?.profileImageBase64 ? 'profileImageBase64' : 'none'}`);

  if (profileImageData) {
    const isValidBase64 = /^[A-Za-z0-9+/]+=*$/.test(profileImageData);
    console.log(`   Valid base64 format: ${isValidBase64 ? '✅' : '❌'}`);

    const dataUri = createImageDataUri(profileImageData);
    console.log(`   Generated data URI: ${dataUri.substring(0, 100)}...`);
  }

  const finalUri = getProfileImageUri(user);
  console.log(`   Final display URI: ${finalUri.substring(0, 100)}...`);

  return {
    hasImage: hasProfileImage,
    imageLength: profileImageData?.length,
    finalUri: finalUri
  };
};