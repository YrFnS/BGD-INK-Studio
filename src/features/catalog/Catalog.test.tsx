import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { ProductType, type Product } from '@/types';
import type { CatalogApi } from '@/services/api';
import { Catalog } from './Catalog';

const product: Product = {
  id: 'tshirt-classic',
  name: 'product.classic_tshirt',
  type: ProductType.TSHIRT,
  basePrice: 25_000,
  colors: ['#000000'],
  image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  inStock: true,
};

const unavailableModelProduct: Product = {
  id: 'hoodie-premium',
  name: 'product.premium_hoodie',
  type: ProductType.HOODIE,
  basePrice: 35_000,
  colors: ['#000000'],
  image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  inStock: true,
};

describe('Catalog model readiness and failure recovery', () => {
  it('shows a retry action and recovers after a failed catalog request', async () => {
    const listProducts = vi
      .fn<CatalogApi['listProducts']>()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce([product]);

    render(
      <AppProvider>
        <Catalog onSelectProduct={vi.fn()} catalogApi={{ listProducts }} />
      </AppProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Products could not be loaded');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: /Classic T-Shirt/ })).toBeEnabled();
    expect(listProducts).toHaveBeenCalledTimes(2);
  });

  it('does not open a product until its genuine 3D model is configured', async () => {
    const onSelectProduct = vi.fn();
    const listProducts = vi
      .fn<CatalogApi['listProducts']>()
      .mockResolvedValue([unavailableModelProduct]);

    render(
      <AppProvider>
        <Catalog onSelectProduct={onSelectProduct} catalogApi={{ listProducts }} />
      </AppProvider>,
    );

    const hoodie = await screen.findByRole('button', {
      name: /Premium Hoodie.*3D model coming soon/,
    });
    expect(hoodie).toBeDisabled();
    expect(onSelectProduct).not.toHaveBeenCalled();
  });
});
