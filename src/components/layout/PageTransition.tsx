import React, { useLayoutEffect } from 'react';
import {
  incrementRuntimeCounter,
  markRuntimeMilestone,
} from '@/runtime/performanceMetrics';

interface PageTransitionProps {
  children: React.ReactNode;
  viewKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, viewKey }) => {
  useLayoutEffect(() => {
    incrementRuntimeCounter('routeTransitions');
    markRuntimeMilestone('routeSettled');
  }, [viewKey]);

  return (
    <div key={viewKey} className="page-transition w-full" data-page-transition-key={viewKey}>
      {children}
    </div>
  );
};
