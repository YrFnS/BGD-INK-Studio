import React, { useEffect, useState } from 'react';
import { BRAND } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';
import { ViewState } from '@/types';
import { Magnetic } from '@/components/ui/Magnetic';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { theme, toggleTheme, language, setLanguage, t } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  const handleNavigate = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const navigationItems: Array<{ view: ViewState; label: string }> = [
    { view: 'HOME', label: t('nav.home') },
    { view: 'CATALOG', label: t('nav.catalog') },
    { view: 'DESIGNS', label: t('nav.designs') },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-black/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Magnetic strength={0.2}>
            <button
              type="button"
              className="font-display flex-shrink-0 px-2 text-2xl font-bold tracking-tighter text-black transition-opacity hover:opacity-80 dark:text-white"
              onClick={() => handleNavigate('HOME')}
              aria-label={`${BRAND.displayName} home`}
            >
              {BRAND.displayName}
            </button>
          </Magnetic>

          <nav className="hidden items-center gap-4 md:flex" aria-label="Primary navigation">
            {navigationItems.map((item) => (
              <Magnetic key={item.view}>
                <button
                  type="button"
                  onClick={() => handleNavigate(item.view)}
                  aria-current={currentView === item.view ? 'page' : undefined}
                  className={`px-4 py-2 text-sm font-medium transition-colors hover:text-gray-900 dark:hover:text-gray-200 ${
                    currentView === item.view
                      ? 'text-black dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </button>
              </Magnetic>
            ))}
          </nav>

          <div className="z-50 flex items-center gap-2 sm:gap-4">
            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="rounded-full p-2 text-black transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
              >
                <span className="font-sans text-sm font-bold">
                  {language === 'en' ? 'AR' : 'EN'}
                </span>
              </button>
            </Magnetic>

            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full p-2 text-black transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
              >
                {theme === 'dark' ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 1 0 20.354 15.354Z"
                    />
                  </svg>
                )}
              </button>
            </Magnetic>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="rounded-full p-2 text-black transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 md:hidden"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!isMobileMenuOpen}
        className={`fixed inset-x-0 top-16 flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-8 bg-white transition-transform duration-300 ease-in-out dark:bg-black md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        {navigationItems.map((item) => (
          <button
            type="button"
            key={item.view}
            onClick={() => handleNavigate(item.view)}
            aria-current={currentView === item.view ? 'page' : undefined}
            tabIndex={isMobileMenuOpen ? 0 : -1}
            className={`text-2xl font-bold transition-colors hover:text-gray-500 ${
              currentView === item.view ? 'text-black dark:text-white' : 'text-gray-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
