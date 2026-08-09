import { useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { incrementRuntimeCounter } from './performanceMetrics';

export const RuntimeWebGLProbe = () => {
  useLayoutEffect(() => {
    incrementRuntimeCounter('reactCommits');
  });

  useFrame(() => {
    incrementRuntimeCounter('webglFrames');
  });

  return null;
};
