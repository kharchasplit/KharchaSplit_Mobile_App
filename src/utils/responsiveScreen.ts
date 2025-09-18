import { Dimensions, Platform } from 'react-native';
import { wp, hp, rf, s, vs, ms, spacing, borderRadius, iconSizes } from './deviceDimensions';
import { typography } from './typography';

/**
 * Comprehensive responsive screen utility
 * Provides easy access to all responsive functions and device information
 */

// Device screen information
export const screenInfo = {
  dimensions: Dimensions.get('window'),
  screen: Dimensions.get('screen'),
  platform: Platform.OS,
  isAndroid: Platform.OS === 'android',
  isIOS: Platform.OS === 'ios',
};

// Responsive dimension functions using react-native-size-matters
export const responsive = {
  // Width percentage
  wp,
  // Height percentage
  hp,
  // Scale based on device width
  s,
  // Vertical scale based on device height
  vs,
  // Moderate scale for fonts
  ms,
  // Responsive font
  rf,
  // Spacing
  spacing,
  // Border radius
  borderRadius,
  // Icon sizes
  iconSizes,
  // Typography
  typography,
};

// Common responsive values using size-matters for better scaling
export const commonSizes = {
  // Header heights using vertical scale
  headerHeight: vs(56),
  tabBarHeight: vs(64),
  statusBarHeight: Platform.OS === 'ios' ? vs(44) : vs(24),

  // Button sizes using vertical scale
  buttonHeight: {
    small: vs(36),
    medium: vs(44),
    large: vs(52),
  },

  // Input field heights using vertical scale
  inputHeight: {
    small: vs(36),
    medium: vs(44),
    large: vs(52),
  },

  // Card dimensions
  cardPadding: spacing.md,
  cardMargin: spacing.sm,
  cardBorderRadius: borderRadius.lg,

  // Avatar sizes using scale
  avatarSize: {
    xs: s(24),
    sm: s(32),
    md: s(40),
    lg: s(56),
    xl: s(72),
  },

  // Modal dimensions
  modalPadding: spacing.lg,
  modalBorderRadius: borderRadius.xl,

  // List item heights using vertical scale
  listItemHeight: {
    small: vs(48),
    medium: vs(64),
    large: vs(80),
  },
};

// Device-specific adjustments
export const deviceAdjustments = {
  // Small device adjustments
  small: {
    paddingMultiplier: 0.8,
    fontMultiplier: 0.9,
    spacingMultiplier: 0.8,
  },

  // Large device adjustments
  large: {
    paddingMultiplier: 1.2,
    fontMultiplier: 1.1,
    spacingMultiplier: 1.2,
  },

  // Tablet adjustments
  tablet: {
    paddingMultiplier: 1.5,
    fontMultiplier: 1.3,
    spacingMultiplier: 1.5,
  },
};

// Utility functions for common responsive scenarios
export const responsiveUtils = {
  // Get safe padding using size-matters scaling
  getSafePadding: (base: number) => {
    return {
      paddingHorizontal: s(base),
      paddingVertical: vs(base * 0.8),
    };
  },

  // Get responsive margin
  getMargin: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    return {
      margin: spacing[size],
    };
  },

  // Get responsive padding
  getPadding: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    return {
      padding: spacing[size],
    };
  },

  // Get responsive border radius
  getBorderRadius: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    return {
      borderRadius: borderRadius[size],
    };
  },

  // Get responsive shadow
  getShadow: (elevation: number = 2) => {
    return Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: elevation,
        },
        shadowOpacity: 0.1,
        shadowRadius: elevation,
      },
      android: {
        elevation: elevation,
      },
    });
  },

  // Get responsive flex container
  getFlexContainer: (direction: 'row' | 'column' = 'column') => {
    return {
      flexDirection: direction,
      padding: spacing.md,
      gap: spacing.sm,
    };
  },
};

// Export everything for easy access
export default {
  screenInfo,
  responsive,
  commonSizes,
  deviceAdjustments,
  responsiveUtils,
  // Re-export individual functions for convenience
  wp,
  hp,
  s,
  vs,
  ms,
  rf,
  spacing,
  borderRadius,
  iconSizes,
  typography,
};