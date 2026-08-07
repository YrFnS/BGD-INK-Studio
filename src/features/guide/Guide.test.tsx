import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { Guide } from './Guide';

const renderGuide = (onOpenCatalog = vi.fn(), onOpenDesigns = vi.fn()) =>
  render(
    <AppProvider>
      <Guide onOpenCatalog={onOpenCatalog} onOpenDesigns={onOpenDesigns} />
    </AppProvider>,
  );

describe('Studio Guide', () => {
  it('renders honest guidance and its primary actions', () => {
    const onOpenCatalog = vi.fn();
    const onOpenDesigns = vi.fn();
    renderGuide(onOpenCatalog, onOpenDesigns);

    expect(
      screen.getByRole('heading', { name: 'KNOW WHAT IS VERIFIED BEFORE YOU DESIGN.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Exact garment chart pending')).toBeInTheDocument();
    expect(screen.getAllByText('Reference only')).toHaveLength(3);
    expect(screen.getByText('Does checkout send a real order?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Browse model-ready garments' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open my saved designs' }));

    expect(onOpenCatalog).toHaveBeenCalledOnce();
    expect(onOpenDesigns).toHaveBeenCalledOnce();
  });

  it('has no automated accessibility violations in the default language', async () => {
    const { container } = renderGuide();
    const results = await axe(container, {
      rules: {
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
