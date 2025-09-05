// 🌙 Dark Mode
const darkColors = {
  background: '#121212',
  cardBackground: '#1e1e2f',
  primaryText: '#ffffff',
  secondaryText: '#a0a0b8',
  primaryButton: '#ff8c42',
  primaryButtonText: '#1e1e2f',
  secondaryButton: '#6c63ff',
  inputBackground: '#2a2a3d',
  inputText: '#ffffff',
  inputPlaceholder: '#7a7a99',
  activeIcon: '#ff8c42',
  inactiveIcon: '#7a7a99',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  primaryGradient: ['#ff8c42', '#ff5e62'],
  backgroundGradient: ['#1e1e2f', '#121212'],
} as const;

// ☀️ Light Mode
const lightColors = {
  background: '#f9f9fb',
  cardBackground: '#ffffff',
  primaryText: '#1e1e2f',
  secondaryText: '#5a5a89',
  primaryButton: '#0077ff',
  primaryButtonText: '#ffffff',
  secondaryButton: '#00c9a7',
  inputBackground: '#e6e6f0',
  inputText: '#1e1e2f',
  inputPlaceholder: '#7a7a99',
  activeIcon: '#0077ff',
  inactiveIcon: '#7a7a99',
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  primaryGradient: ['#0077ff', '#00c9a7'],
  backgroundGradient: ['#f9f9fb', '#e6e6f0'],
} as const;

// 🛠️ Theme helper
export const getColors = (mode: 'light' | 'dark') => (mode === 'dark' ? darkColors : lightColors);
export type ColorKey = keyof typeof darkColors;
