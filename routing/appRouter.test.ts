import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseAppRoute, routeToPath, routes, useAppRouter } from './appRouter';

describe('application routes', () => {
  it('round-trips every supported route', () => {
    const supportedRoutes = [
      routes.home(),
      routes.catalog(),
      routes.designs(),
      routes.customizer('draft-123'),
      routes.checkout('draft-456'),
      routes.success('BGD-789'),
    ];

    supportedRoutes.forEach((route) => {
      expect(parseAppRoute(routeToPath(route))).toEqual(route);
    });
  });

  it('encodes and decodes route identifiers safely', () => {
    const draftId = 'draft / team β';
    const path = routeToPath(routes.customizer(draftId));

    expect(path).toBe('/studio/draft%20%2F%20team%20%CE%B2');
    expect(parseAppRoute(path)).toEqual(routes.customizer(draftId));
  });

  it('normalizes trailing slashes and rejects malformed identifiers', () => {
    expect(parseAppRoute('/designs///')).toEqual(routes.designs());
    expect(parseAppRoute('/studio/%E0%A4%A')).toEqual(routes.home());
    expect(parseAppRoute('/unknown')).toEqual(routes.home());
  });
});

describe('useAppRouter', () => {
  it('pushes and replaces History API routes', () => {
    const { result } = renderHook(() => useAppRouter());

    act(() => result.current.navigate(routes.designs()));
    expect(window.location.pathname).toBe('/designs');
    expect(result.current.route).toEqual(routes.designs());

    act(() => result.current.navigate(routes.catalog(), { replace: true, scroll: false }));
    expect(window.location.pathname).toBe('/catalog');
    expect(result.current.route).toEqual(routes.catalog());
  });

  it('reacts to browser Back and Forward navigation', () => {
    const { result } = renderHook(() => useAppRouter());

    window.history.pushState(null, '', '/checkout/draft-abc');
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));

    expect(result.current.route).toEqual(routes.checkout('draft-abc'));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
