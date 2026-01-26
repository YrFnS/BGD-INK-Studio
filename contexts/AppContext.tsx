
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppContextType, Language, Theme } from '../types';
import { translations } from '../translations';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Light mode and English
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  // Handle Theme Changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Handle Language/Direction Changes
  useEffect(() => {
    const root = window.document.documentElement;
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    root.setAttribute('dir', dir);
    root.setAttribute('lang', language);
    
    // Switch font based on language
    if (language === 'ar') {
      root.style.fontFamily = "'Noto Kufi Arabic', sans-serif";
    } else {
      root.style.fontFamily = "'Space Grotesk', sans-serif";
    }
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const t = (key: string): string => {
    // @ts-ignore - Dynamic key access
    return translations[language][key] || key;
  };

  const value: AppContextType = {
    language,
    theme,
    toggleTheme,
    setLanguage,
    t,
    isRTL: language === 'ar',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
