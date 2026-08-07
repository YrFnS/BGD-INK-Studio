import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { Hero } from './Hero';

describe('P3 premium storefront', () => {
  it('uses owned imagery and routes both homepage actions', () => {
    const onStart = vi.fn();
    const onOpenDesigns = vi.fn();

    render(
      <AppProvider>
        <Hero onStart={onStart} onOpenDesigns={onOpenDesigns} />
      </AppProvider>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'YOUR ARTWORK. BUILT FOR THE GARMENT.',
    );
    expect(screen.getByText('WE SHOW WHAT IS READY — AND WHAT IS NOT.')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Open the studio' }));
    fireEvent.click(screen.getByRole('button', { name: 'My saved designs' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onOpenDesigns).toHaveBeenCalledTimes(1);

    const externalImages = Array.from(document.querySelectorAll('img')).filter((image) =>
      /^https?:\/\//i.test(image.getAttribute('src') ?? ''),
    );
    expect(externalImages).toHaveLength(0);
  });

  it('does not present fabricated reviews or unsupported production promises', () => {
    render(
      <AppProvider>
        <Hero onStart={vi.fn()} onOpenDesigns={vi.fn()} />
      </AppProvider>,
    );

    expect(screen.queryByText(/Customer #/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/trusted by Baghdad/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/100% premium cotton/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fast delivery/i)).not.toBeInTheDocument();
  });
});
