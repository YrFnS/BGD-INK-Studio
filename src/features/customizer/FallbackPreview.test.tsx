import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { getPrintSurface, getReadyProductModelConfig } from '@/data/assets3d';
import { FallbackPreview } from './FallbackPreview';

const modelConfig = getReadyProductModelConfig('tshirt-classic');
if (!modelConfig) throw new Error('Classic T-shirt model configuration is missing.');
const surface = getPrintSurface(modelConfig, 'front');

const renderFallback = (onRetry3d = vi.fn()) =>
  render(
    <AppProvider>
      <FallbackPreview
        productName="Classic T-Shirt"
        color="#111111"
        surface={surface}
        decals={[]}
        activeDecalId={null}
        reason="context-lost"
        canRetry3d
        onRetry3d={onRetry3d}
      />
    </AppProvider>,
  );

afterEach(() => {
  window.localStorage.clear();
});

describe('safe 2D fallback', () => {
  it('keeps the retry action accessible outside the image role', async () => {
    const onRetry3d = vi.fn();
    const { container } = renderFallback(onRetry3d);

    expect(screen.getByText('Safe 2D preview')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Classic T-Shirt.*Print area: Front/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try 3D again' }));
    expect(onRetry3d).toHaveBeenCalledOnce();

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('uses reviewed Iraqi-Arabic recovery language', () => {
    window.localStorage.setItem('bgd-ink-language', 'ar');
    renderFallback();

    expect(screen.getByText('المعاينة الآمنة 2D')).toBeInTheDocument();
    expect(screen.getByText(/تصميمك ما ضاع/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'جرّب معاينة 3D من جديد' })).toBeInTheDocument();
  });
});
