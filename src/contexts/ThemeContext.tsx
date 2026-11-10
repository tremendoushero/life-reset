import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences } from '@/types';
import { storage } from '@/lib/supabase';

interface ThemeContextType {
  theme: UserPreferences['theme'];
  colorMode: UserPreferences['color_mode'];
  fontSize: UserPreferences['font_size'];
  reducedMotion: boolean;
  setTheme: (theme: UserPreferences['theme']) => void;
  setColorMode: (mode: UserPreferences['color_mode']) => void;
  setFontSize: (size: UserPreferences['font_size']) => void;
  setReducedMotion: (reduced: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<UserPreferences['theme']>(() =>
    storage.get('theme', 'warm-ivory')
  );
  const [colorMode, setColorModeState] = useState<UserPreferences['color_mode']>(() =>
    storage.get('color_mode', 'light')
  );
  const [fontSize, setFontSizeState] = useState<UserPreferences['font_size']>(() =>
    storage.get('font_size', 'normal')
  );
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() =>
    storage.get('reduced_motion', false)
  );

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    storage.set('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === 'dark') {
      root.classList.add('dark');
    } else if (colorMode === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    storage.set('color_mode', colorMode);
  }, [colorMode]);

  useEffect(() => {
    document.body.setAttribute('data-font-size', fontSize);
    storage.set('font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
    storage.set('reduced_motion', reducedMotion);
  }, [reducedMotion]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorMode,
        fontSize,
        reducedMotion,
        setTheme: setThemeState,
        setColorMode: setColorModeState,
        setFontSize: setFontSizeState,
        setReducedMotion: setReducedMotionState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

