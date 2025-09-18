import { Dimensions, Platform } from 'react-native';
import {
  widthPercentageToDP,
  heightPercentageToDP,
  scale,
  verticalScale,
  moderateScale,
} from 'react-native-size-matters';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Re-export size-matters functions with shorter names for convenience
export const wp = widthPercentageToDP;      // Width percentage
export const hp = heightPercentageToDP;     // Height percentage
export const s = scale;                     // Scale based on device width
export const vs = verticalScale;            // Scale based on device height
export const ms = moderateScale;            // Moderate scale for fonts

// Responsive font size function using moderateScale
export const rf = (size: number, factor?: number): number => {
  return moderateScale(size, factor);
};

// Device classification
export const isTablet = () => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return SCREEN_WIDTH >= 768 || aspectRatio < 1.6;
};

export const isSmallDevice = () => {
  return SCREEN_WIDTH <= 320;
};

export const isMediumDevice = () => {
  return SCREEN_WIDTH > 320 && SCREEN_WIDTH <= 375;
};

export const isLargeDevice = () => {
  return SCREEN_WIDTH > 375;
};

// Get device info
export const getDeviceInfo = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    pixelRatio: PixelRatio.get(),
    fontScale: PixelRatio.getFontScale(),
    platform: Platform.OS,
    isTablet: isTablet(),
    isSmallDevice: isSmallDevice(),
    isMediumDevice: isMediumDevice(),
    isLargeDevice: isLargeDevice(),
  };
};

// Responsive margin/padding helpers using size-matters
export const spacing = {
  xs: s(4),      // 4px scaled
  sm: s(8),      // 8px scaled
  md: s(16),     // 16px scaled
  lg: s(24),     // 24px scaled
  xl: s(32),     // 32px scaled
  xxl: s(48),    // 48px scaled
};

// Responsive border radius using size-matters
export const borderRadius = {
  xs: s(4),      // 4px scaled
  sm: s(8),      // 8px scaled
  md: s(12),     // 12px scaled
  lg: s(16),     // 16px scaled
  xl: s(24),     // 24px scaled
  full: wp(50),  // 50% for circular
};

// Responsive icon sizes using moderateScale
export const iconSizes = {
  xs: ms(12),
  sm: ms(16),
  md: ms(20),
  lg: ms(24),
  xl: ms(32),
  xxl: ms(40),
};

// Export device dimensions for direct use
export const deviceDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  wp,
  hp,
  rf,
  spacing,
  borderRadius,
  iconSizes,
  getDeviceInfo,
};