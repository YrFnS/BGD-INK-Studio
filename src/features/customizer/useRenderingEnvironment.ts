import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  areRenderingCapabilitiesEqual,
  detectWebGLSupport,
  readRenderingCapabilities,
  selectRenderingProfile,
  type RenderingCapabilities,
  type WebGLSupport,
} from './renderingCapabilities';

interface NetworkInformationLike extends EventTarget {
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
}

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

const addMediaQueryChangeListener = (
  query: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
): (() => void) => {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }

  const legacyQuery = query as LegacyMediaQueryList;
  legacyQuery.addListener?.(listener);
  return () => legacyQuery.removeListener?.(listener);
};

export const useRenderingEnvironment = () => {
  const [capabilities, setCapabilities] = useState<RenderingCapabilities>(() =>
    readRenderingCapabilities(),
  );
  const [isPageVisible, setIsPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );
  const [webglSupport, setWebglSupport] = useState<WebGLSupport>(() => detectWebGLSupport());

  const renderingProfile = useMemo(
    () => selectRenderingProfile(capabilities),
    [capabilities],
  );

  const refreshCapabilities = useCallback(() => {
    const nextCapabilities = readRenderingCapabilities();
    setCapabilities((current) =>
      areRenderingCapabilitiesEqual(current, nextCapabilities) ? current : nextCapabilities,
    );
    return nextCapabilities;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let scheduledFrame: number | null = null;
    let removeResolutionListener: () => void = () => undefined;

    const runScheduledRefresh = () => {
      scheduledFrame = null;
      refreshCapabilities();
    };

    const scheduleRefresh = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame =
        typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame(runScheduledRefresh)
          : window.setTimeout(runScheduledRefresh, 16);
    };

    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const removeCoarsePointerListener = addMediaQueryChangeListener(
      coarsePointerQuery,
      scheduleRefresh,
    );
    const removeReducedMotionListener = addMediaQueryChangeListener(
      reducedMotionQuery,
      scheduleRefresh,
    );

    const bindResolutionQuery = () => {
      removeResolutionListener();
      const currentDpr = Math.max(1, window.devicePixelRatio || 1);
      const resolutionQuery = window.matchMedia(`(resolution: ${currentDpr}dppx)`);
      removeResolutionListener = addMediaQueryChangeListener(resolutionQuery, () => {
        bindResolutionQuery();
        scheduleRefresh();
      });
    };

    const renderingNavigator = navigator as NavigatorWithConnection;
    const connection = renderingNavigator.connection;

    bindResolutionQuery();
    window.addEventListener('resize', scheduleRefresh, { passive: true });
    window.addEventListener('orientationchange', scheduleRefresh);
    window.addEventListener('pageshow', scheduleRefresh);
    window.visualViewport?.addEventListener('resize', scheduleRefresh, { passive: true });
    connection?.addEventListener('change', scheduleRefresh);

    return () => {
      if (scheduledFrame !== null) {
        if (typeof window.cancelAnimationFrame === 'function') {
          window.cancelAnimationFrame(scheduledFrame);
        } else {
          window.clearTimeout(scheduledFrame);
        }
      }
      removeCoarsePointerListener();
      removeReducedMotionListener();
      removeResolutionListener();
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('orientationchange', scheduleRefresh);
      window.removeEventListener('pageshow', scheduleRefresh);
      window.visualViewport?.removeEventListener('resize', scheduleRefresh);
      connection?.removeEventListener('change', scheduleRefresh);
    };
  }, [refreshCapabilities]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState !== 'hidden';
      setIsPageVisible(isVisible);
      if (isVisible) refreshCapabilities();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshCapabilities]);

  const recheckWebGLSupport = useCallback(() => {
    const nextSupport = detectWebGLSupport();
    setWebglSupport(nextSupport);
    return nextSupport;
  }, []);

  return {
    capabilities,
    isPageVisible,
    renderingProfile,
    webglSupport,
    recheckWebGLSupport,
  };
};
