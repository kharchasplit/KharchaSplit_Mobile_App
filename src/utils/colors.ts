// 🌙 Dark Mode (Slate & Mint)
const darkColors = {
  background: '#0D1117',         // Deep slate blue, darker than before
  cardBackground: '#161B22',    // Slightly lighter slate for cards/headers
  primaryText: '#E6EDF3',       // Soft white, not pure glaring white
  secondaryText: '#7D8590',     // Muted gray for secondary info
  primaryButton: '#23C5A0',     // Vibrant mint green
  primaryButtonText: '#0D1117', // Dark text for high contrast on mint button
  secondaryButton: '#21262D',   // Dark gray, subtle
  inputBackground: '#21262D',   // Dark input background
  inputText: '#E6EDF3',         // Soft white
  inputPlaceholder: '#484F58',  // Muted placeholder text
  activeIcon: '#23C5A0',         // Mint green for active states
  inactiveIcon: '#7D8590',     // Muted gray for inactive states
  success: '#28A745',           // A clear, vibrant green
  error: '#DA3633',             // A clear, vibrant red
  warning: '#E3B341',           // A clear yellow/gold
  primaryGradient: ['#23C5A0', '#30D1B2'], // Mint gradient
  backgroundGradient: ['#161B22', '#0D1117'], // Subtle background gradient
  statusBarStyle: 'light-content' as 'light-content' | 'dark-content',
  statusBarBackground: '#0D1117', // Dark background
} as const;

// ☀️ Light Mode (Clean & Mint)
const lightColors = {
  background: '#F6F8FA',         // Very light, clean gray
  cardBackground: '#FFFFFF',    // Crisp white cards
  primaryText: '#1F2328',       // Dark slate text (not pure black)
  secondaryText: '#57606A',     // Readable medium gray
  primaryButton: '#23866E',     // A slightly darker, richer mint for contrast on white
  primaryButtonText: '#FFFFFF', // White text
  secondaryButton: '#F6F8FA',   // Light gray button
  inputBackground: '#F6F8FA',   // Light gray inputs
  inputText: '#1F2328',         // Dark text
  inputPlaceholder: '#6E7781',  // Muted placeholder
  activeIcon: '#23866E',         // Primary mint color
  inactiveIcon: '#57606A',     // Medium gray
  success: '#1A7F37',           // A rich, accessible green
  error: '#CF222E',             // A strong, accessible red
  warning: '#BF8600',           // A clear, accessible yellow/brown
  primaryGradient: ['#23C5A0', '#23866E'],
  backgroundGradient: ['#FFFFFF', '#F6F8FA'],
  statusBarStyle: 'dark-content' as 'light-content' | 'dark-content',
  statusBarBackground: '#F6F8FA', // Light background
} as const;

// 🛠️ Theme helper (Your existing helper is perfect)
export const getColors = (mode: 'light' | 'dark') => (mode === 'dark' ? darkColors : lightColors);
export type ColorKey = keyof typeof darkColors;