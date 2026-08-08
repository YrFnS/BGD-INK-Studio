import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { getPrintSurface, getReadyProductModelConfig } from '@/data/assets3d';
import type { DecalLayer } from '@/types';
import { ArtworkQualityOverlay } from './ArtworkQualityOverlay';

const modelConfig = getReadyProductModelConfig('tshirt-classic');
if (!modelConfig) throw new Error('Classic T-shirt model configuration is missing.');
const surface = getPrintSurface(modelConfig, 'front');

const layer: DecalLayer = {
  id: 'layer-quality',
  name: 'Team logo',
  visible: true,
  url: 'data:image/png;base64,iVBORw0KGgo=',
  surfaceId: 'front',
  position: [0, -0.04, 0.16],
  rotation: [0, 0, 0],
  userRotation: 0,
  scale: 0.248,
  pixelWidth: 200,
  pixelHeight: 100,
  aspectRatio: 2,
  hasTransparency: true,
  transparentPixelRatio: 0.25,
  transparentPaddingRatio: 0.5,
};

describe('artwork quality overlay', () => {
  it('presents Iraqi-Arabic quality guidance with direction-safe measurements', async () => {
    const { container } = render(
      <ArtworkQualityOverlay layer={layer} surface={surface} language="ar" />,
    );

    expect(screen.getByLabelText('جودة التصميم للطباعة')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('أبعاد الملف الأصلي')).toBeInTheDocument();
    expect(screen.getByText('200 × 100 px')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('42 DPI')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText(/أكو فراغ شفاف كبير/)).toBeInTheDocument();

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
