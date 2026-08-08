import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { Guide } from './Guide';

const renderGuide = (onOpenCatalog = vi.fn(), onOpenDesigns = vi.fn()) =>
  render(
    <AppProvider>
      <Guide onOpenCatalog={onOpenCatalog} onOpenDesigns={onOpenDesigns} />
    </AppProvider>,
  );

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
  delete document.documentElement.dataset.language;
});

describe('Studio Guide', () => {
  it('renders honest guidance, section navigation, and its primary actions', () => {
    const onOpenCatalog = vi.fn();
    const onOpenDesigns = vi.fn();
    renderGuide(onOpenCatalog, onOpenDesigns);

    expect(
      screen.getByRole('heading', { name: 'KNOW WHAT IS VERIFIED BEFORE YOU DESIGN.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Exact garment chart pending')).toBeInTheDocument();
    expect(screen.getAllByText('Reference only')).toHaveLength(3);
    expect(screen.getByText('Does saving the draft send a real order?')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Guide sections' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Print methods/ })).toHaveAttribute('href', '#methods');

    fireEvent.click(screen.getByRole('button', { name: 'Browse model-ready garments' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open my saved designs' }));

    expect(onOpenCatalog).toHaveBeenCalledOnce();
    expect(onOpenDesigns).toHaveBeenCalledOnce();
  });

  it('restores reviewed Iraqi-Arabic guide copy and RTL-safe navigation', () => {
    window.localStorage.setItem('bgd-ink-language', 'ar');
    renderGuide();

    expect(
      screen.getByRole('heading', { name: 'اعرف شنو المؤكد قبل لا تبدأ التصميم.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'أقسام الدليل' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /طرق الطباعة/ })).toHaveAttribute('href', '#methods');
    expect(screen.getAllByText('مرجع عام')).toHaveLength(3);
    expect(screen.getByText('هل حفظ المسودة يرسل طلب حقيقي؟')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automated accessibility violations in Iraqi Arabic', async () => {
    window.localStorage.setItem('bgd-ink-language', 'ar');
    const { container } = renderGuide();
    const results = await axe(container, {
      rules: {
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
