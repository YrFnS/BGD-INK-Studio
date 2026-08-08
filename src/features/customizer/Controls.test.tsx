import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { getReadyProductModelConfig } from '@/data/assets3d';
import { ProductType, Size, type DecalLayer, type Product } from '@/types';
import { Controls } from './Controls';

const modelConfig = getReadyProductModelConfig('tshirt-classic');
if (!modelConfig) throw new Error('Classic T-shirt model configuration is missing.');

const product: Product = {
  id: 'tshirt-classic',
  name: 'product.classic_tshirt',
  type: ProductType.TSHIRT,
  basePrice: 25_000,
  colors: ['#000000', '#ffffff'],
  image: '/brand/products/classic-tshirt.svg',
  inStock: true,
};

const layer: DecalLayer = {
  id: 'layer-1',
  name: 'شعار الفريق',
  visible: true,
  url: 'data:image/png;base64,iVBORw0KGgo=',
  surfaceId: 'front',
  position: [0, -0.04, 0.16],
  rotation: [0, 0, 0],
  userRotation: 0,
  scale: 0.2,
};

const renderControls = (decals: DecalLayer[] = [], activeDecalId: string | null = null) =>
  render(
    <AppProvider>
      <Controls
        product={product}
        selectedColor="#000000"
        onColorChange={vi.fn()}
        selectedSize={Size.L}
        onSizeChange={vi.fn()}
        surfaces={modelConfig.surfaces}
        selectedSurfaceId="front"
        onSurfaceChange={vi.fn()}
        decals={decals}
        activeDecalId={activeDecalId}
        onSetActiveDecal={vi.fn()}
        onUpload={vi.fn()}
        onRemoveDecal={vi.fn()}
        onUpdateDecal={vi.fn()}
        onRenameDecal={vi.fn()}
        onDuplicateDecal={vi.fn()}
        onToggleDecalVisibility={vi.fn()}
        onMoveDecal={vi.fn()}
        onBeginTransform={vi.fn()}
        onEndTransform={vi.fn()}
        canUndo={false}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        notes=""
        onNotesChange={vi.fn()}
        saveStatus="saved"
        isUploading={false}
        onCheckout={vi.fn()}
      />
    </AppProvider>,
  );

beforeEach(() => {
  window.localStorage.setItem('bgd-ink-language', 'ar');
});

afterEach(() => {
  window.localStorage.clear();
});

describe('Arabic customizer controls', () => {
  it('uses reviewed Iraqi-Arabic labels and stable technical direction', () => {
    const { container } = renderControls();

    expect(container.firstElementChild).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('toolbar', { name: 'سجل التعديلات' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'أضف أول طبقة تصميم' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'القياس: L' })).toBeInTheDocument();
    expect(screen.getAllByText('30 × 38 cm')[0]).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('محفوظ على هذا الجهاز')).toBeInTheDocument();
  });

  it('keeps layer actions and transform values clear inside RTL controls', () => {
    renderControls([layer], layer.id);

    expect(screen.getByRole('button', { name: 'الطبقة المختارة: شعار الفريق' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'اخفِ الطبقة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'انسخ الطبقة' })).toBeInTheDocument();
    expect(screen.getByLabelText('اسم الطبقة')).toHaveAttribute('dir', 'auto');
    expect(screen.getByLabelText('عرض التصميم')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByLabelText('زاوية الدوران')).toHaveAttribute('dir', 'ltr');
  });
});
