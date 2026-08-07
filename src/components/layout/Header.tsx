import React, { useEffect, useState } from 'react';
import { Magnetic } from '@/components/ui/Magnetic';
import { BRAND } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';
import { ViewState } from '@/types';

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

  const navigationItems: Array<{ view: ViewState; label: string; index: string }> = [
    { view: 'HOME', label: t('nav.home'), index: '01' },
    { view: 'CATALOG', label: t('nav.catalog'), index: '02' },
    { view: 'DESIGNS', label: t('nav.designs'), index: '03' },
  ];
  const startLabel = language === 'ar' ? 'ابدأ تصميم' : 'Start design';

  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-[#f4f1ea]/90 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#050505]/90">
      <div className="mx-auto max-w-[1450px] px-3 sm:px-5 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Magnetic strength={0.16}>
            <button
              type="button"
              className="group flex shrink-0 items-center gap-3 rounded-full py-1 pe-2 text-black transition-opacity hover:opacity-80 dark:text-white"
              onClick={() => handleNavigate('HOME')}
              aria-label={`${BRAND.displayName} home`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#111111] font-display text-[10px] font-black tracking-[-0.05em] text-white shadow-sm transition-transform group-hover:-rotate-6 dark:bg-[#f4f1ea] dark:text-black">
                B/I
              </span>
              <span className="hidden text-start sm:block">
                <span className="font-display block text-base font-black tracking-[-0.045em]">
                  {BRAND.displayName}
                </span>
                <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-black/38 dark:text-white/34">
                  Baghdad studio
                </span>
              </span>
            </button>
          </Magnetic>

          <nav
            className="hidden items-center rounded-full border border-black/10 bg-white/45 p-1 dark:border-white/10 dark:bg-white/[0.035] md:flex"
            aria-label="Primary navigation"
          >
            {navigationItems.map((item) => (
              <button
                type="button"
                key={item.view}
                onClick={() => handleNavigate(item.view)}
                aria-current={currentView === item.view ? 'page' : undefined}
                className={`relative rounded-full px-4 py-2 text-[11px] font-black transition-all ${
                  currentView === item.view
                    ? 'bg-[#111111] text-white shadow-sm dark:bg-[#f4f1ea] dark:text-black'
                    : 'text-black/48 hover:text-black dark:text-white/42 dark:hover:text-white'
                }`}
              >
                <span className="me-2 font-mono text-[8px] opacity-50">{item.index}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="z-50 flex items-center gap-1.5 sm:gap-2">
            <Magnetic strength={0.2}>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="grid h-9 min-w-9 place-items-center rounded-full border border-black/10 bg-white/35 px-2 text-black transition-colors hover:border-black/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:hover:border-white/30"
                aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
              >
                <span className="text-[10px] font-black tracking-[0.08em]">
                  {language === 'en' ? 'AR' : 'EN'}
                </span>
              </button>
            </Magnetic>

            <Magnetic strength={0.2}>
              <button
                type="button"
                onClick={toggleTheme}
                className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/35 text-black transition-colors hover:border-black/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:hover:border-white/30"
                aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.4 6.4L17 17m-10-10L5.6 5.6m12.8 0L17 7M7 17l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.4 15.4A9 9 0 0 1 8.6 3.6a9 9 0 1 0 11.8 11.8Z" />
                  </svg>
                )}
              </button>
            </Magnetic>

            <button
              type="button"
              onClick={() => handleNavigate('CATALOG')}
              className="hidden min-h-9 items-center rounded-full bg-accent px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-[0_10px_25px_rgba(225,59,45,.24)] transition-transform hover:-translate-y-0.5 lg:inline-flex"
            >
              {startLabel}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/35 text-black transition-colors hover:border-black/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:hover:border-white/30 md:hidden"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 12h14M5 16h14" />
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
        className={`fixed inset-x-0 top-16 flex h-[calc(100dvh-4rem)] flex-col bg-[#f4f1ea] px-5 py-8 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] dark:bg-[#050505] md:hidden ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : `pointer-events-none ${language === 'ar' ? '-translate-x-full' : 'translate-x-full'}`
        }`}
      >
        <div className="flex flex-1 flex-col justify-center divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
          {navigationItems.map((item) => (
            <button
              type="button"
              key={item.view}
              onClick={() => handleNavigate(item.view)}
              aria-current={currentView === item.view ? 'page' : undefined}
              tabIndex={isMobileMenuOpen ? 0 : -1}
              className="group flex items-center justify-between py-6 text-start"
            >
              <span className="font-mono text-xs font-black text-black/30 dark:text-white/28">{item.index}</span>
              <span
                className={`text-3xl font-black tracking-[-0.045em] transition-colors ${
                  currentView === item.view
                    ? 'text-accent'
                    : 'text-black group-hover:text-accent dark:text-white'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          tabIndex={isMobileMenuOpen ? 0 : -1}
          onClick={() => handleNavigate('CATALOG')}
          className="mt-6 flex min-h-14 items-center justify-center rounded-full bg-accent px-6 text-sm font-black uppercase tracking-[0.13em] text-white"
        >
          {startLabel}
        </button>
      </nav>
    </header>
  );
};