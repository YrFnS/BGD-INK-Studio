
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const Cursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Hide cursor on touch devices to prevent stuck visual artifacts
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const moveCursor = (e: MouseEvent) => {
      // Direct fast movement for the central dot
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0, // Instant response
      });
      // Smooth follow for the outer ring
      gsap.to(followerRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.4,
        ease: 'power3.out'
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Detect interactive elements
      const isInteractive = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') || 
        target.closest('a') ||
        target.classList.contains('interactive') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'LABEL';

      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // Do not render on mobile/touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;

  return (
    <>
      {/* 
        CRITICAL: mix-blend-difference is used with BG-WHITE.
        - Light Theme (White BG): White - White = Black (Visible Cursor)
        - Dark Theme (Black BG): |White - Black| = White (Visible Cursor)
        - Black Section in Light Theme: |White - Black| = White (Visible Cursor)
        
        This satisfies the 'auto change' requirement mathematically.
      */}
      <div 
        ref={cursorRef}
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[10001] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      />
      <div 
        ref={followerRef}
        className={`fixed top-0 left-0 border border-white rounded-full pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out mix-blend-difference ${
          isHovering 
            ? 'w-12 h-12 bg-white opacity-100' // Solid blob on hover -> Inverts background completely
            : 'w-8 h-8 opacity-100' // Outlined ring normally -> Inverts border pixels
        }`}
      />
    </>
  );
};
