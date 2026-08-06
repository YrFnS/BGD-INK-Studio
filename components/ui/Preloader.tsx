import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { BRAND } from '../../config/brand';

export const Preloader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const words = ['CONCEPT', 'DESIGN', 'PRINT', BRAND.displayName];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (containerRef.current) containerRef.current.style.display = 'none';
      return undefined;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline();

      timeline.to(
        progressRef.current,
        { scaleX: 1, duration: 1.2, ease: 'power2.inOut' },
        0,
      );
      timeline.to(
        textGroupRef.current,
        { yPercent: -75, duration: 1.2, ease: 'power4.inOut' },
        0,
      );
      const finalWord = textGroupRef.current?.lastElementChild;
      if (finalWord) {
        timeline.to(finalWord, {
          scale: 1.1,
          color: '#DC2626',
          duration: 0.35,
          ease: 'back.out(1.7)',
        });
      }
      timeline.to(containerRef.current, {
        yPercent: -100,
        duration: 0.7,
        ease: 'expo.inOut',
        delay: 0.15,
        onComplete: () => {
          if (containerRef.current) containerRef.current.style.display = 'none';
        },
      });
    }, containerRef);

    return () => context.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div className="h-[4rem] md:h-[6rem] overflow-hidden relative border-b-2 border-white/10 px-8">
        <div ref={textGroupRef} className="flex flex-col items-center">
          {words.map((word) => (
            <div
              key={word}
              className="h-[4rem] md:h-[6rem] flex items-center justify-center text-5xl md:text-8xl font-bold tracking-tighter text-white whitespace-nowrap"
            >
              {word}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
        <div ref={progressRef} className="h-full bg-accent origin-left transform scale-x-0" />
      </div>
    </div>
  );
};
