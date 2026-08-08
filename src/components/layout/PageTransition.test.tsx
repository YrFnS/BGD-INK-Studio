import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageTransition } from './PageTransition';

describe('PageTransition', () => {
  it('updates route content without replacing the container when the route key is unchanged', () => {
    const { container, rerender } = render(
      <PageTransition viewKey="/catalog">
        <p>Catalog loading</p>
      </PageTransition>,
    );
    const initialContainer = container.firstElementChild;

    rerender(
      <PageTransition viewKey="/catalog">
        <p>Catalog ready</p>
      </PageTransition>,
    );

    expect(container.firstElementChild).toBe(initialContainer);
    expect(screen.getByText('Catalog ready')).toBeInTheDocument();
    expect(screen.queryByText('Catalog loading')).not.toBeInTheDocument();
  });

  it('replaces the transition container exactly when the stable route key changes', () => {
    const { container, rerender } = render(
      <PageTransition viewKey="/catalog">
        <p>Catalog</p>
      </PageTransition>,
    );
    const catalogContainer = container.firstElementChild;

    rerender(
      <PageTransition viewKey="/guide">
        <p>Guide</p>
      </PageTransition>,
    );

    expect(container.firstElementChild).not.toBe(catalogContainer);
    expect(container.firstElementChild).toHaveAttribute('data-page-transition-key', '/guide');
    expect(screen.getByText('Guide')).toBeInTheDocument();
    expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
  });
});
