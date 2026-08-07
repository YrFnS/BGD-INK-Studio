import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { InteractionModeToolbar } from './InteractionModeToolbar';
import type { CustomizerInteractionMode } from './interactionGestures';
import type { PreviewMode } from './renderingCapabilities';

interface RenderToolbarOptions {
  hasActiveLayer?: boolean;
  previewMode?: PreviewMode;
  mode?: CustomizerInteractionMode;
}

const renderToolbar = ({
  hasActiveLayer = false,
  previewMode = '3d',
  mode = 'view',
}: RenderToolbarOptions = {}) => {
  const onModeChange = vi.fn();
  const onTogglePreview = vi.fn();
  const result = render(
    <AppProvider>
      <InteractionModeToolbar
        mode={mode}
        onModeChange={onModeChange}
        hasActiveLayer={hasActiveLayer}
        previewMode={previewMode}
        onTogglePreview={onTogglePreview}
        renderingQuality="balanced"
        webglSupport="webgl2"
      />
    </AppProvider>,
  );

  return { ...result, onModeChange, onTogglePreview };
};

describe('InteractionModeToolbar', () => {
  it('keeps artwork modes disabled until a visible layer is selected', async () => {
    const { container, onTogglePreview } = renderToolbar();

    expect(screen.getByRole('button', { name: 'View garment' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Move design' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Resize or rotate design' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to 2D preview' }));
    expect(onTogglePreview).toHaveBeenCalledOnce();

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('enables distinct move and transform modes for an active layer', () => {
    const { onModeChange } = renderToolbar({ hasActiveLayer: true });

    fireEvent.click(screen.getByRole('button', { name: 'Move design' }));
    fireEvent.click(screen.getByRole('button', { name: 'Resize or rotate design' }));

    expect(onModeChange).toHaveBeenNthCalledWith(1, 'move');
    expect(onModeChange).toHaveBeenNthCalledWith(2, 'transform');
  });

  it('disables 3D interaction controls while the safe 2D preview is active', () => {
    renderToolbar({ hasActiveLayer: true, previewMode: '2d' });

    expect(screen.getByRole('button', { name: 'View garment' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move design' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Resize or rotate design' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Try 3D preview' })).toBeEnabled();
  });
});
