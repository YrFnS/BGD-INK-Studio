
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const Preloader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const words = ["CONCEPT", "DESIGN", "PRINT", "ASHUS"];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Progress Bar (Visual indicator of loading)
      tl.to(progressRef.current, {
        scaleX: 1,
        duration: 1.5,
        ease: 'power2.inOut'
      }, 0);

      // 2. Slot Machine Text Roll
      // Moves the text strip up to reveal words one by one
      tl.to(textGroupRef.current, {
        yPercent: -75, // Move to show the 4th item (0% -> -25% -> -50% -> -75%)
        duration: 1.5,
        ease: 'power4.inOut',
        stagger: 0.1
      }, 0);

      // 3. Final Brand Reveal (Scale & Color)
      tl.to(textGroupRef.current?.lastElementChild!, {
        scale: 1.2,
        color: '#DC2626', // Accent Red
        duration: 0.4,
        ease: 'back.out(1.7)'
      });

      // 4. Smooth Exit
      tl.to(containerRef.current, {
        yPercent: -100,
        duration: 0.8,
        ease: 'expo.inOut',
        delay: 0.2,
        onComplete: () => {
          if (containerRef.current) {
            containerRef.current.style.display = 'none';
          }
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Mask Container */}
      <div className="h-[4rem] md:h-[6rem] overflow-hidden relative border-b-2 border-white/10 px-8">
        {/* Moving Text Strip */}
        <div ref={textGroupRef} className="flex flex-col items-center">
          {words.map((word, i) => (
            <div 
              key={i} 
              className="h-[4rem] md:h-[6rem] flex items-center justify-center text-5xl md:text-8xl font-bold tracking-tighter text-white"
            >
              {word}
            </div>
          ))}
        </div>
      </div>
      
      {/* Loading Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
        <div 
          ref={progressRef} 
          className="h-full bg-accent origin-left transform scale-x-0"
        ></div>
      </div>
    </div>
  );
};
