import { rf, ms } from './deviceDimensions';
import { PixelRatio } from 'react-native';

// Get device font scale to respect user's accessibility settings
const getFontScale = () => PixelRatio.getFontScale();

// Responsive font size function using react-native-size-matters
const responsiveFont = (size: number, factor?: number) => {
  const fontScale = getFontScale();

  // Use moderateScale for better font scaling
  const baseSize = ms(size, factor);

  // Apply font scale but cap it to prevent extremely large text
  const maxScale = 1.3;
  const appliedScale = Math.min(fontScale, maxScale);

  return Math.round(baseSize * appliedScale);
};

// Standard text styles for the app with responsive sizing
export const typography = {
  // Responsive font sizes
  fontSize: {
    xs: responsiveFont(12),
    sm: responsiveFont(14),
    base: responsiveFont(16),
    lg: responsiveFont(18),
    xl: responsiveFont(20),
    '2xl': responsiveFont(24),
    '3xl': responsiveFont(30),
    '4xl': responsiveFont(36),
  },

  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800',
  },

  // Responsive text styles
  text: {
    // Headers
    header: {
      fontSize: responsiveFont(18),
      fontWeight: '600',
    },
    headerLarge: {
      fontSize: responsiveFont(24),
      fontWeight: '700',
    },
    headerXL: {
      fontSize: responsiveFont(30),
      fontWeight: '700',
    },

    // Titles and subtitles
    title: {
      fontSize: responsiveFont(18),
      fontWeight: '600',
    },
    titleLarge: {
      fontSize: responsiveFont(20),
      fontWeight: '600',
    },
    subtitle: {
      fontSize: responsiveFont(16),
      fontWeight: '500',
    },
    subtitleSmall: {
      fontSize: responsiveFont(14),
      fontWeight: '500',
    },

    // Body text
    body: {
      fontSize: responsiveFont(16),
      fontWeight: '400',
    },
    bodyLarge: {
      fontSize: responsiveFont(18),
      fontWeight: '400',
    },
    bodySmall: {
      fontSize: responsiveFont(14),
      fontWeight: '400',
    },

    // Captions and labels
    caption: {
      fontSize: responsiveFont(12),
      fontWeight: '400',
    },
    captionLarge: {
      fontSize: responsiveFont(14),
      fontWeight: '400',
    },
    label: {
      fontSize: responsiveFont(14),
      fontWeight: '500',
    },
    labelLarge: {
      fontSize: responsiveFont(16),
      fontWeight: '500',
    },

    // Interactive elements
    button: {
      fontSize: responsiveFont(16),
      fontWeight: '600',
    },
    buttonLarge: {
      fontSize: responsiveFont(18),
      fontWeight: '600',
    },
    buttonSmall: {
      fontSize: responsiveFont(14),
      fontWeight: '600',
    },

    // Form elements
    input: {
      fontSize: responsiveFont(16),
      fontWeight: '400',
    },
    placeholder: {
      fontSize: responsiveFont(16),
      fontWeight: '400',
    },

    // Navigation
    tabLabel: {
      fontSize: responsiveFont(12),
      fontWeight: '500',
    },
    navTitle: {
      fontSize: responsiveFont(18),
      fontWeight: '600',
    },
  },

  // Line heights (responsive)
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Helper function to get responsive font size
  getResponsiveFont: responsiveFont,

  // Helper function to get current font scale
  getFontScale,

  // Direct access to moderateScale for custom usage
  ms,
  rf,
} as const;
