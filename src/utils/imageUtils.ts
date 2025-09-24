import { Alert } from 'react-native';
import { launchImageLibrary, ImagePickerResponse, ImageLibraryOptions } from 'react-native-image-picker';

export interface ImageResult {
  base64: string;
  uri: string;
  type: string;
  fileName: string;
  size?: number;
}

export interface CompressedImage {
  base64: string;
  type: string;
  size: number;
  uri: string;
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

/**
 * Pick and process receipt image with compression
 */
export const pickReceiptImage = (
  onSuccess: (image: CompressedImage) => void,
  onError?: (error: string) => void
): void => {
  const options: ImageLibraryOptions = {
    mediaType: 'photo',
    quality: 0.5, // Lower quality for receipts (still readable)
    maxWidth: 1000, // Max width for receipts
    maxHeight: 1500, // Max height for receipts  
    includeBase64: true,
  };

  launchImageLibrary(options, (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }
    
    if (response.errorMessage) {
      onError?.(response.errorMessage);
      return;
    }
    
    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      
      if (!asset.base64) {
        onError?.('Failed to convert image to base64');
        return;
      }
      
      // Check file size
      const base64Size = (asset.base64.length * 3) / 4;
      const maxSize = 3 * 1024 * 1024; // 3MB limit for receipts
      
      if (base64Size > maxSize) {
        Alert.alert(
          'Image Too Large',
          'Receipt image is too large. Please choose a smaller image or reduce quality.',
          [{ text: 'OK' }]
        );
        onError?.('Image size exceeds 3MB limit');
        return;
      }
      
      const compressedImage: CompressedImage = {
        base64: `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`,
        type: asset.type || 'image/jpeg',
        size: base64Size,
        uri: asset.uri || '',
      };
      
      onSuccess(compressedImage);
    }
  });
};

/**
 * Process expense receipt image
 */
export const processReceiptImage = async (uri: string): Promise<ImageResult> => {
  try {
    if (!uri || uri === '') {
      throw new Error('Invalid receipt URI');
    }

    const base64 = await convertImageToBase64(uri);
    const sizeInBytes = (base64.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 3) {
      Alert.alert(
        'Receipt Too Large',
        'Please select a receipt image smaller than 3MB'
      );
      throw new Error('Receipt too large');
    }

    return {
      base64,
      uri,
      type: 'image/jpeg',
      fileName: `receipt_${Date.now()}.jpg`,
      size: sizeInBytes,
    };
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
};

/**
 * Calculate readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate receipt image
 */
export const validateReceiptImage = (base64String: string): { valid: boolean; error?: string } => {
  try {
    if (!base64String.startsWith('data:image/')) {
      return { valid: false, error: 'Invalid image format' };
    }
    
    const sizeInBytes = (base64String.length * 3) / 4;
    const maxSize = 3 * 1024 * 1024; // 3MB
    
    if (sizeInBytes > maxSize) {
      return { valid: false, error: 'Receipt image exceeds 3MB limit' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to validate image' };
  }
};

/**
 * Ensures proper data URI format for image display
 */
export const ensureDataUri = (imageData: string | null | undefined, mimeType: string = 'image/jpeg'): string | null => {
  if (!imageData) {
    return null;
  }

  // If already a data URI, return as is
  if (imageData.startsWith('data:')) {
    return imageData;
  }

  // If it's base64 without data URI prefix, add it
  return `data:${mimeType};base64,${imageData}`;
};

/**
 * Debug helper for image data
 */
export const debugImageData = (imageData: string | null | undefined, label: string = 'Image'): void => {
  // Debug function - implementation removed for production
};