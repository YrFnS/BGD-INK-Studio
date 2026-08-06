import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../contexts/AppContext';
import { ToastProvider } from '../../contexts/ToastContext';
import {
  createDesignDraft,
  deleteDesignDraft,
  listDesignDrafts,
  releaseDraftSummaryObjectUrls,
  renameDesignDraft,
} from '../../services/drafts';
import { Size } from '../../types';
import { Designs } from './Designs';

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
      <ToastProvider>
        <Designs onOpenDraft={onOpenDraft} onCreateNew={onCreateNew} />
      </ToastProvider>
    </AppProvider>,
  );

beforeEach(clearAllDrafts);
afterEach(clearAllDrafts);

describe('My Designs workspace', () => {
  it('renders an accessible empty state', async () => {
    const onCreateNew = vi.fn();
    const { container } = renderWorkspace(vi.fn(), onCreateNew);

    expect(await screen.findByRole('heading', { name: 'MY DESIGNS' })).toBeInTheDocument();
    expect(screen.getByText('No saved designs yet')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create new design' }));
    expect(onCreateNew).toHaveBeenCalledOnce();

    const results = await axe(container, {
      rules: {
        region: { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });

  it('lists a stored design and exposes its primary actions', async () => {
    const draft = await createDesignDraft({
      productId: 'tshirt-classic',
      color: '#000000',
      size: Size.L,
    });
    await renameDesignDraft(draft.id, 'Team launch shirts');

    const onOpenDraft = vi.fn();
    renderWorkspace(onOpenDraft);

    expect(await screen.findByText('Team launch shirts')).toBeInTheDocument();
    expect(screen.getByText('Classic T-Shirt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open design' }));
    expect(onOpenDraft).toHaveBeenCalledWith(draft.id);
  });
});
