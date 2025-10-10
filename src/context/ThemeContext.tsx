import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors } from '../utils/colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ReturnType<typeof getColors>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_MODE_KEY = '@theme_mode';

export const ThemeProvider: React.FC<{ initialMode?: ThemeMode; children: React.ReactNode }> = ({
  initialMode = 'system',
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
          setMode(savedMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    // Start loading immediately without blocking
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  // Save theme preference whenever it changes
  const handleSetMode = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, newMode);
      setMode(newMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Still update the mode even if saving fails
      setMode(newMode);
    }
  };

  const effectiveMode = mode === 'system' ? systemScheme : mode;
  const colors = useMemo(() => getColors(effectiveMode), [effectiveMode]);

  const value = useMemo(() => ({ mode, setMode: handleSetMode, colors }), [mode, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};