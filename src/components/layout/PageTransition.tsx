import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  viewKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, viewKey }) => (
  <div key={viewKey} className="page-transition w-full" data-page-transition-key={viewKey}>
    {children}
  </div>
);
