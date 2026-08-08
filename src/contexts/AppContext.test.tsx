import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider, useAppContext } from './AppContext';

const LanguageProbe = () => {
  const { language, setLanguage, t } = useAppContext();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="catalog-label">{t('nav.catalog')}</span>
      <button type="button" onClick={() => setLanguage('ar')}>
        Arabic
      </button>
    </div>
  );
};

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
  delete document.documentElement.dataset.language;
});

describe('AppProvider language direction', () => {
  it('switches the document and translations to Arabic RTL', () => {
    render(
      <AppProvider>
        <LanguageProbe />
      </AppProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Arabic' }));

    expect(screen.getByTestId('language')).toHaveTextContent('ar');
    expect(screen.getByTestId('catalog-label')).toHaveTextContent('القطع');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.documentElement).toHaveAttribute('data-language', 'ar');
    expect(window.localStorage.getItem('bgd-ink-language')).toBe('ar');
  });

  it('restores the saved Arabic preference on the next mount', () => {
    window.localStorage.setItem('bgd-ink-language', 'ar');

    render(
      <AppProvider>
        <LanguageProbe />
      </AppProvider>,
    );

    expect(screen.getByTestId('language')).toHaveTextContent('ar');
    expect(screen.getByTestId('catalog-label')).toHaveTextContent('القطع');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
});
