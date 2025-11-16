// contexts/ThemeContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  const colors = {
    dark: {
      bg: 'bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950',
      bgSecondary: 'bg-purple-900/40 backdrop-blur-lg',
      card: 'bg-white/5 backdrop-blur-xl border border-white/10',
      cardHover: 'hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/20',
      text: 'text-white',
      textSecondary: 'text-purple-200',
      textMuted: 'text-purple-300/70',
      accent: 'bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600',
      accentHover: 'hover:from-purple-600 hover:via-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/50',
      button: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
      buttonHover: 'hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105',
      input: 'bg-white/5 border-white/20 text-white placeholder-purple-300/50',
      inputFocus: 'focus:border-purple-500 focus:ring-purple-500/50 focus:bg-white/10',
    },
    light: {
      bg: 'bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/40',
      bgSecondary: 'bg-white/60 backdrop-blur-lg',
      card: 'bg-white/80 backdrop-blur-xl border border-purple-100/50',
      cardHover: 'hover:bg-white/95 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-200/50',
      text: 'text-gray-900',
      textSecondary: 'text-purple-700',
      textMuted: 'text-gray-600',
      accent: 'bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600',
      accentHover: 'hover:from-purple-600 hover:via-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-400/50',
      button: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
      buttonHover: 'hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-purple-400/50 hover:scale-105',
      input: 'bg-white/80 border-purple-200 text-gray-900 placeholder-gray-400',
      inputFocus: 'focus:border-purple-500 focus:ring-purple-500/30 focus:bg-white',
    }
  };

  const currentColors = isDarkMode ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors: currentColors, allColors: colors }}>
      <div className={isDarkMode ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

