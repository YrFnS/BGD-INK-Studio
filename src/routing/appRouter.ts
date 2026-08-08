import { useCallback, useEffect, useRef, useState } from 'react';
import { flushPendingDraftPersistence } from '@/persistenceCoordinator';
import { ViewState } from '@/types';

export type AppRoute =
  | { view: 'HOME' }
  | { view: 'CATALOG' }
  | { view: 'GUIDE' }
  | { view: 'DESIGNS' }
  | { view: 'CUSTOMIZER'; draftId: string }
  | { view: 'CHECKOUT'; draftId: string }
  | { view: 'SUCCESS'; orderId: string };

interface NavigateOptions {
  replace?: boolean;
  scroll?: boolean;
}

const decodeRoutePart = (value: string): string | null => {
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded || null;
  } catch {
    return null;
  }
};

export const routes = {
  home: (): AppRoute => ({ view: 'HOME' }),
  catalog: (): AppRoute => ({ view: 'CATALOG' }),
  guide: (): AppRoute => ({ view: 'GUIDE' }),
  designs: (): AppRoute => ({ view: 'DESIGNS' }),
  customizer: (draftId: string): AppRoute => ({ view: 'CUSTOMIZER', draftId }),
  checkout: (draftId: string): AppRoute => ({ view: 'CHECKOUT', draftId }),
  success: (orderId: string): AppRoute => ({ view: 'SUCCESS', orderId }),
} as const;

export const routeToPath = (route: AppRoute): string => {
  switch (route.view) {
    case 'HOME':
      return '/';
    case 'CATALOG':
      return '/catalog';
    case 'GUIDE':
      return '/guide';
    case 'DESIGNS':
      return '/designs';
    case 'CUSTOMIZER':
      return `/studio/${encodeURIComponent(route.draftId)}`;
    case 'CHECKOUT':
      return `/checkout/${encodeURIComponent(route.draftId)}`;
    case 'SUCCESS':
      return `/draft/${encodeURIComponent(route.orderId)}`;
  }
};

export const parseAppRoute = (pathname: string): AppRoute => {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (normalizedPath === '/') return routes.home();
  if (normalizedPath === '/catalog') return routes.catalog();
  if (normalizedPath === '/guide') return routes.guide();
  if (normalizedPath === '/designs') return routes.designs();

  const studioMatch = normalizedPath.match(/^\/studio\/([^/]+)$/);
  if (studioMatch) {
    const draftId = decodeRoutePart(studioMatch[1]);
    if (draftId) return routes.customizer(draftId);
  }

  const checkoutMatch = normalizedPath.match(/^\/checkout\/([^/]+)$/);
  if (checkoutMatch) {
    const draftId = decodeRoutePart(checkoutMatch[1]);
    if (draftId) return routes.checkout(draftId);
  }

  const successMatch = normalizedPath.match(/^\/draft\/([^/]+)$/);
  if (successMatch) {
    const orderId = decodeRoutePart(successMatch[1]);
    if (orderId) return routes.success(orderId);
  }

  return routes.home();
};

const readCurrentRoute = (): AppRoute => parseAppRoute(window.location.pathname);

export const useAppRouter = () => {
  const [route, setRoute] = useState<AppRoute>(readCurrentRoute);
  const routeRef = useRef(route);
  const navigationSequenceRef = useRef(0);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  useEffect(() => {
    const canonicalPath = routeToPath(readCurrentRoute());
    if (canonicalPath !== window.location.pathname) {
      window.history.replaceState(null, '', canonicalPath);
    }

    const handlePopState = async () => {
      const sequence = ++navigationSequenceRef.current;
      const previousRoute = routeRef.current;
      const nextRoute = readCurrentRoute();
      const flushed = await flushPendingDraftPersistence();
      if (sequence !== navigationSequenceRef.current) return;

      if (!flushed) {
        window.history.replaceState(null, '', routeToPath(previousRoute));
        return;
      }

      routeRef.current = nextRoute;
      setRoute(nextRoute);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback(async (nextRoute: AppRoute, options: NavigateOptions = {}) => {
    const sequence = ++navigationSequenceRef.current;
    const flushed = await flushPendingDraftPersistence();
    if (!flushed || sequence !== navigationSequenceRef.current) return false;

    const nextPath = routeToPath(nextRoute);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (options.replace) {
      window.history.replaceState(null, '', nextPath);
    } else if (currentPath !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }

    routeRef.current = nextRoute;
    setRoute(nextRoute);

    if (options.scroll !== false) {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    }

    return true;
  }, []);

  return {
    route,
    view: route.view as ViewState,
    navigate,
  };
};
