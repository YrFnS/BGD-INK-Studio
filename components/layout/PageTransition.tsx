
import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  viewKey: string; // Unique key to trigger transition (e.g., ViewState)
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, viewKey }) => {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'active' | 'exit'>('enter');

  useEffect(() => {
    // Start Exit Transition
    setTransitionStage('exit');
  }, [viewKey, children]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'exit') {
      // Once exit is done, swap content and start enter
      setDisplayChildren(children);
      setTransitionStage('enter');
      
      // Small delay to ensure DOM update before active class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionStage('active');
        });
      });
    }
  };

  // Initial mount
  useEffect(() => {
    setTransitionStage('active');
  }, []);

  return (
    <div
      onTransitionEnd={handleAnimationEnd}
      className={`
        w-full transition-all duration-300 ease-out
        ${transitionStage === 'enter' ? 'opacity-0 translate-y-4' : ''}
        ${transitionStage === 'active' ? 'opacity-100 translate-y-0' : ''}
        ${transitionStage === 'exit' ? 'opacity-0 -translate-y-4' : ''}
      `}
    >
      {displayChildren}
    </div>
  );
};
