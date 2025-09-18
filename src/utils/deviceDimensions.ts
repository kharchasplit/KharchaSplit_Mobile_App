import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fallback implementations if react-native-size-matters is not available
const widthPercentageToDP = (widthPercent: string | number): number => {
  const screenWidth = SCREEN_WIDTH;
  const elemWidth = parseFloat(widthPercent.toString());
  return (screenWidth * elemWidth) / 100;
};

const heightPercentageToDP = (heightPercent: string | number): number => {
  const screenHeight = SCREEN_HEIGHT;
  const elemHeight = parseFloat(heightPercent.toString());
  return (screenHeight * elemHeight) / 100;
};

const scale = (size: number): number => {
  const guidelineBaseWidth = 350;
  return (SCREEN_WIDTH / guidelineBaseWidth) * size;
};

const verticalScale = (size: number): number => {
  const guidelineBaseHeight = 680;
  return (SCREEN_HEIGHT / guidelineBaseHeight) * size;
};

const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Try to import from react-native-size-matters, fallback to our implementations
let wp: (widthPercent: string | number) => number;
let hp: (heightPercent: string | number) => number;
let s: (size: number) => number;
let vs: (size: number) => number;
let ms: (size: number, factor?: number) => number;

try {
  const sizeMatters = require('react-native-size-matters');
  wp = sizeMatters.widthPercentageToDP || widthPercentageToDP;
  hp = sizeMatters.heightPercentageToDP || heightPercentageToDP;
  s = sizeMatters.scale || scale;
  vs = sizeMatters.verticalScale || verticalScale;
  ms = sizeMatters.moderateScale || moderateScale;
} catch (error) {
  // Fallback to our implementations
  wp = widthPercentageToDP;
  hp = heightPercentageToDP;
  s = scale;
  vs = verticalScale;
  ms = moderateScale;
}

// Export the functions
export { wp, hp, s, vs, ms };

// Responsive font size function using moderateScale
export const rf = (size: number, factor?: number): number => {
  return ms(size, factor);
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
  get xs() { return s(4); },      // 4px scaled
  get sm() { return s(8); },      // 8px scaled
  get md() { return s(16); },     // 16px scaled
  get lg() { return s(24); },     // 24px scaled
  get xl() { return s(32); },     // 32px scaled
  get xxl() { return s(48); },    // 48px scaled
};

// Responsive border radius using size-matters
export const borderRadius = {
  get xs() { return s(4); },      // 4px scaled
  get sm() { return s(8); },      // 8px scaled
  get md() { return s(12); },     // 12px scaled
  get lg() { return s(16); },     // 16px scaled
  get xl() { return s(24); },     // 24px scaled
  get full() { return wp(50); },  // 50% for circular
};

// Responsive icon sizes using moderateScale
export const iconSizes = {
  get xs() { return ms(12); },
  get sm() { return ms(16); },
  get md() { return ms(20); },
  get lg() { return ms(24); },
  get xl() { return ms(32); },
  get xxl() { return ms(40); },
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