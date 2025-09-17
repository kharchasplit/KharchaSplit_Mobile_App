import { Alert } from 'react-native';

export interface ImageResult {
  base64: string;
  uri: string;
  type: string;
  fileName: string;
}

/**
 * Converts a file URI to base64 string
 */
export const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Creates a data URI from base64 string
 */
export const createImageDataUri = (base64: string, mimeType: string = 'image/jpeg'): string => {
  if (!base64) return '';

  // If it already has data URI prefix, return as is
  if (base64.startsWith('data:')) {
    return base64;
  }

  return `data:${mimeType};base64,${base64}`;
};

/**
 * Validates and compresses image if needed
 */
export const processProfileImage = async (uri: string): Promise<ImageResult> => {
  try {
    // Check if the URI is valid
    if (!uri || uri === '') {
      throw new Error('Invalid image URI');
    }

    const base64 = await convertImageToBase64(uri);

    // Check file size (base64 is ~1.33x larger than original)
    const sizeInBytes = (base64.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 5) {
      Alert.alert(
        'Image Too Large',
        'Please select an image smaller than 5MB'
      );
      throw new Error('Image too large');
    }

    return {
      base64,
      uri,
      type: 'image/jpeg',
      fileName: `profile_${Date.now()}.jpg`,
    };
  } catch (error) {
    console.error('Error processing profile image:', error);
    throw error;
  }
};

/**
 * Gets placeholder image URI for initials
 */
export const getPlaceholderImageUri = (name: string): string => {
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  return `https://via.placeholder.com/150x150/4F46E5/fff?text=${initial}`;
};

/**
 * Gets display URI for profile image (base64 or placeholder)
 */
export const getProfileImageUri = (user: {
  profileImageBase64?: string;
  profileImage?: string;
  name?: string;
  firstName?: string
}): string => {
  // Check for base64 image data in either field name for compatibility
  const base64Image = user.profileImageBase64 || user.profileImage;

  if (base64Image) {
    return createImageDataUri(base64Image);
  }

  const displayName = user.firstName || user.name || 'User';
  return getPlaceholderImageUri(displayName);
};