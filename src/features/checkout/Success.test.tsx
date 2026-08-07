import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { Size } from '@/types';
import { Success } from './Success';

const pendingOrder = {
  productId: 'tshirt-classic',
  productName: 'product.classic_tshirt',
  basePrice: 25_000,
  size: Size.L,
  color: '#111111',
  quantity: 4,
  decals: [],
  notes: 'Front team mark',
};

const orderDetails = {
  fullName: 'Yasser Test',
  phone: '07701234567',
  area: 'Al-Mansour',
  street: 'Street 10',
  house: '',
};

const renderReceipt = (
  onReset = vi.fn(),
  onOpenDesigns = vi.fn(),
  onStartNew = vi.fn(),
) =>
  render(
    <AppProvider>
      <Success
        orderId="BGD-LOCAL-001"
        pendingOrder={pendingOrder}
        orderDetails={orderDetails}
        onReset={onReset}
        onOpenDesigns={onOpenDesigns}
        onStartNew={onStartNew}
      />
    </AppProvider>,
  );

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe('local draft receipt', () => {
  it('shows the prepared variant, quantity, estimate, and navigation actions', async () => {
    const onReset = vi.fn();
    const onOpenDesigns = vi.fn();
    const onStartNew = vi.fn();
    renderReceipt(onReset, onOpenDesigns, onStartNew);

    expect(screen.getByRole('heading', { name: 'Draft Saved' })).toBeInTheDocument();
    expect(screen.getByText('Classic T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('Local quantity').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Local estimate').parentElement).toHaveTextContent('100,000 IQD');

    fireEvent.click(screen.getByRole('button', { name: 'Open My Designs' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start another draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to home' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy draft ID' }));

    expect(onOpenDesigns).toHaveBeenCalledOnce();
    expect(onStartNew).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('BGD-LOCAL-001');
  });

  it('has no automated accessibility violations', async () => {
    const { container } = renderReceipt();
    const results = await axe(container, {
      rules: {
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
