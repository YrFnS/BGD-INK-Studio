import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import {
  createDesignDraft,
  deleteDesignDraft,
  listDesignDrafts,
  markDesignDraftSubmitted,
  releaseDraftSummaryObjectUrls,
  renameDesignDraft,
} from '@/services/drafts';
import { Size } from '@/types';
import { Designs } from './Designs';

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: toastMocks.showToast }),
}));

const clearAllDrafts = async (): Promise<void> => {
  const summaries = await listDesignDrafts();
  releaseDraftSummaryObjectUrls(summaries);

  for (const summary of summaries) {
    await deleteDesignDraft(summary.id);
  }
};

const renderWorkspace = (onOpenDraft = vi.fn(), onCreateNew = vi.fn()) =>
  render(
    <AppProvider>
      <Designs onOpenDraft={onOpenDraft} onCreateNew={onCreateNew} />
    </AppProvider>,
  );

beforeEach(async () => {
  window.localStorage.clear();
  toastMocks.showToast.mockReset();
  await clearAllDrafts();
});
afterEach(clearAllDrafts);

describe('My Designs workspace', () => {
  it('renders an accessible empty state', async () => {
    const onCreateNew = vi.fn();
    const { container } = renderWorkspace(vi.fn(), onCreateNew);

    expect(await screen.findByRole('heading', { name: 'MY LOCAL DESIGNS' })).toBeInTheDocument();
    expect(await screen.findByText('No saved designs yet')).toBeInTheDocument();

    const createButtons = screen.getAllByRole('button', { name: 'Create new design' });
    expect(createButtons).toHaveLength(2);
    fireEvent.click(createButtons[1]);
    expect(onCreateNew).toHaveBeenCalledOnce();

    const results = await axe(container, {
      rules: {
        region: { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });

  it('lists a prepared local draft with quantity and truthful status', async () => {
    const draft = await createDesignDraft({
      productId: 'tshirt-classic',
      color: '#000000',
      size: Size.L,
      quantity: 4,
    });
    await renameDesignDraft(draft.id, 'Team launch shirts');
    await markDesignDraftSubmitted(draft.id, 'BGD-LOCAL-TEST');

    const onOpenDraft = vi.fn();
    renderWorkspace(onOpenDraft);

    expect(await screen.findByText('Team launch shirts')).toBeInTheDocument();
    expect(screen.getByText('Classic T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('Prepared locally')).toBeInTheDocument();
    expect(screen.getByText('Quantity').parentElement).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open draft' }));
    expect(onOpenDraft).toHaveBeenCalledWith(draft.id);
  });
});
