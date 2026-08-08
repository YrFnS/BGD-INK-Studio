import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  detectWebGLSupport,
  readRenderingCapabilities,
  selectRenderingProfile,
  type WebGLSupport,
} from './renderingCapabilities';

export const useRenderingEnvironment = () => {
  const [isPageVisible, setIsPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );
  const [webglSupport, setWebglSupport] = useState<WebGLSupport>(() => detectWebGLSupport());

  const renderingProfile = useMemo(
    () => selectRenderingProfile(readRenderingCapabilities()),
    [],
  );

  useEffect(() => {
    const handleVisibilityChange = () => setIsPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const recheckWebGLSupport = useCallback(() => {
    const nextSupport = detectWebGLSupport();
    setWebglSupport(nextSupport);
    return nextSupport;
  }, []);

  return {
    isPageVisible,
    renderingProfile,
    webglSupport,
    recheckWebGLSupport,
  };
};
