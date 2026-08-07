import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
}

export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.5 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const canAnimate =
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canAnimate) return undefined;

    const moveX = gsap.quickTo(element, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
    const moveY = gsap.quickTo(element, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });

    const handleMouseMove = (event: MouseEvent) => {
      const bounds = element.getBoundingClientRect();
      moveX((event.clientX - (bounds.left + bounds.width / 2)) * strength);
      moveY((event.clientY - (bounds.top + bounds.height / 2)) * strength);
    };

    const handleMouseLeave = () => {
      moveX(0);
      moveY(0);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={containerRef} className="inline-block">
      {children}
    </div>
  );
};
