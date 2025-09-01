export const colors = {
  // Background colors
  background: '#2d3250',
  cardBackground: '#424769',
  
  // Text colors
  primaryText: '#ffffff',
  secondaryText: '#676f9d',
  
  // Button colors
  primaryButton: '#f9b17a',
  primaryButtonText: '#2d3250',
  secondaryButton: '#f9b17a',
  
  // Input colors
  inputBackground: '#424769',
  inputText: '#ffffff',
  inputPlaceholder: '#676f9d',
  
  // Icon colors
  activeIcon: '#f9b17a',
  inactiveIcon: '#676f9d',
  
  // Status colors
  success: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
  
  // Gradients
  primaryGradient: ['#f9b17a', '#ff8c42'],
  backgroundGradient: ['#2d3250', '#1a1d35'],
} as const;

export type ColorKey = keyof typeof colors;