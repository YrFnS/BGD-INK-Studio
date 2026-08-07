import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { ProductType, type Product } from '@/types';
import type { CatalogApi } from '@/services/api';
import { Catalog } from './Catalog';

const product: Product = {
  id: 'classic-shirt',
  name: 'product.classic_tshirt',
  type: ProductType.TSHIRT,
  basePrice: 25_000,
  colors: ['#000000'],
  image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  inStock: true,
};

describe('Catalog failure recovery', () => {
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

    expect(await screen.findByRole('button', { name: /Classic T-Shirt/ })).toBeInTheDocument();
    expect(listProducts).toHaveBeenCalledTimes(2);
  });
});
