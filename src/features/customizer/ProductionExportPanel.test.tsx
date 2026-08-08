import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { ProductionExportPanel } from './ProductionExportPanel';

const renderPanel = (
  onDownloadProof = vi.fn(),
  onDownloadSpecification = vi.fn(),
) =>
  render(
    <AppProvider>
      <ProductionExportPanel
        hasVisibleArtwork
        isExporting={false}
        onDownloadProof={onDownloadProof}
        onDownloadSpecification={onDownloadSpecification}
      />
    </AppProvider>,
  );

afterEach(() => {
  window.localStorage.clear();
});

describe('local handoff export panel', () => {
  it('keeps the existing English download actions and remains accessible', async () => {
    const onDownloadProof = vi.fn();
    const onDownloadSpecification = vi.fn();
    const { container } = renderPanel(onDownloadProof, onDownloadSpecification);

    expect(screen.getByText('On this device')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Download PNG proof' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download JSON specification' }));
    expect(onDownloadProof).toHaveBeenCalledOnce();
    expect(onDownloadSpecification).toHaveBeenCalledOnce();

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('localizes the panel, badge, and technical formats in Arabic mode', () => {
    window.localStorage.setItem('bgd-ink-language', 'ar');
    renderPanel();

    expect(screen.getByRole('heading', { name: 'ملفات التسليم المحلية' })).toBeInTheDocument();
    expect(screen.getByText('على هذا الجهاز')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'نزّل إثبات PNG' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'نزّل مواصفات JSON' })).toBeInTheDocument();
    expect(screen.getAllByText(/PNG|JSON/).some((node) => node.getAttribute('dir') === 'ltr')).toBe(true);
  });
});
