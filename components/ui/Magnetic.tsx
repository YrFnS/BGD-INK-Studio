
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number; // How far it moves (default 0.5)
}

export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.5 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use quickTo for high performance mouse tracking
    const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = el.getBoundingClientRect();
      
      // Calculate distance from center
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      
      // Move element towards mouse
      xTo(x * strength);
      yTo(y * strength);
    };

    const handleMouseLeave = () => {
      // Spring back to center
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={containerRef} className="inline-block cursor-pointer">
      {children}
    </div>
  );
};
