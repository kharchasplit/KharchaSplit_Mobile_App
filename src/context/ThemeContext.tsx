import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { getColors } from '../utils/colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ReturnType<typeof getColors>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ initialMode?: ThemeMode; children: React.ReactNode }> = ({
  initialMode = 'system',
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const effectiveMode = mode === 'system' ? systemScheme : mode;
  const colors = useMemo(() => getColors(effectiveMode), [effectiveMode]);

  const value = useMemo(() => ({ mode, setMode, colors }), [mode, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
