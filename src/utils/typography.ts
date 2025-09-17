// Standard text styles for the app
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Text styles
  text: {
    header: {
      fontSize: 18,
      fontWeight: '600',
    },
    headerLarge: {
      fontSize: 24,
      fontWeight: '700',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
    },
  },
} as const;
