import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { ViewState } from '../../types';
import { Magnetic } from '../ui/Magnetic';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { theme, toggleTheme, language, setLanguage, t } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Magnetic strength={0.2}>
              <div 
                className="flex-shrink-0 cursor-pointer group z-50 px-2" 
                onClick={() => handleNavigate('HOME')}
              >
                <h1 className="text-2xl font-bold tracking-tighter text-black dark:text-white group-hover:opacity-80 transition-opacity font-display">
                  ASHUS
                </h1>
              </div>
            </Magnetic>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex gap-4 items-center">
              <Magnetic>
                <button 
                  onClick={() => handleNavigate('HOME')}
                  className={`text-sm font-medium transition-colors px-4 py-2 hover:text-gray-900 dark:hover:text-gray-200 ${
                    currentView === 'HOME' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {t('nav.home')}
                </button>
              </Magnetic>
              <Magnetic>
                <button 
                  onClick={() => handleNavigate('CATALOG')}
                  className={`text-sm font-medium transition-colors px-4 py-2 hover:text-gray-900 dark:hover:text-gray-200 ${
                    currentView === 'CATALOG' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {t('nav.catalog')}
                </button>
              </Magnetic>
            </nav>

            {/* Actions & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-4 z-50">
              {/* Language Toggle */}
              <Magnetic strength={0.3}>
                <button
                  onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white"
                  aria-label="Toggle Language"
                >
                  <span className="text-sm font-bold font-sans">
                    {language === 'en' ? 'AR' : 'EN'}
                  </span>
                </button>
              </Magnetic>

              {/* Theme Toggle */}
              <Magnetic strength={0.3}>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </Magnetic>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? (
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                ) : (
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                   </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          className={`fixed inset-0 bg-white dark:bg-black transition-transform duration-300 ease-in-out md:hidden flex flex-col items-center justify-center gap-8 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        >
          <button 
            onClick={() => handleNavigate('HOME')}
            className={`text-2xl font-bold transition-colors hover:text-gray-500 ${
              currentView === 'HOME' ? 'text-black dark:text-white' : 'text-gray-400'
            }`}
          >
            {t('nav.home')}
          </button>
          <button 
            onClick={() => handleNavigate('CATALOG')}
            className={`text-2xl font-bold transition-colors hover:text-gray-500 ${
              currentView === 'CATALOG' ? 'text-black dark:text-white' : 'text-gray-400'
            }`}
          >
            {t('nav.catalog')}
          </button>
        </div>
      </header>
    </>
  );
};