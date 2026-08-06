import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const Cursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateEnabledState = () => setIsEnabled(finePointer.matches && !reducedMotion.matches);
    updateEnabledState();

    finePointer.addEventListener('change', updateEnabledState);
    reducedMotion.addEventListener('change', updateEnabledState);

    return () => {
      finePointer.removeEventListener('change', updateEnabledState);
      reducedMotion.removeEventListener('change', updateEnabledState);
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) return undefined;

    const moveCursor = (event: MouseEvent) => {
      gsap.set(cursorRef.current, { x: event.clientX, y: event.clientY });
      gsap.to(followerRef.current, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.25,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isInteractive = Boolean(
        target.closest('button, a, input, select, textarea, label, [role="button"], .interactive'),
      );
      setIsHovering(isInteractive);
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[10001] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        aria-hidden="true"
      />
      <div
        ref={followerRef}
        className={`fixed top-0 left-0 border border-white rounded-full pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 transition-[width,height,opacity] duration-200 ease-out mix-blend-difference ${
          isHovering ? 'w-12 h-12 bg-white opacity-100' : 'w-8 h-8 opacity-100'
        }`}
        aria-hidden="true"
      />
    </>
  );
};
