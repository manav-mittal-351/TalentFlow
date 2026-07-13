// ─── contexts/ThemeContext.jsx ────────────────────────────────────────────────
// Global Theme management context. Controls light / dark / system preferences
// and applies class attributes to the html document node.

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const getResolvedTheme = (theme) => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('tf_theme') || 'system';
  });

  const setTheme = (newTheme) => {
    localStorage.setItem('tf_theme', newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const resolved = getResolvedTheme(theme);

    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // If system theme is selected, listen for OS color-scheme updates
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      const resolved = mediaQuery.matches ? 'dark' : 'light';
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: getResolvedTheme(theme), setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
