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
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
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
    expect(screen.getByTestId('catalog-label')).toHaveTextContent('الموديلات');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
});
