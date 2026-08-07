import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { translations } from '@/translations';
import { AppContextType, Language, Theme } from '@/types';

const LANGUAGE_STORAGE_KEY = 'bgd-ink-language';

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';

  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
    root.dataset.language = language;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Browser storage can be blocked. Direction and language still update for this session.
    }
  }, [language]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const t = (key: string): string => {
    const dictionary = translations[language] as Readonly<Record<string, string>>;
    return dictionary[key] ?? key;
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

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
