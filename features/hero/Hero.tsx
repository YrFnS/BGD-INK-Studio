
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppContext } from '../../contexts/AppContext';
import { useSEO } from '../../hooks/useSEO';
import { getGallery } from '../../utils/storage';
import { ImageReveal } from '../../components/ui/ImageReveal';
import { Magnetic } from '../../components/ui/Magnetic';

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  onStart: () => void;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1503342394128-c104d54dba01?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
];

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const { t, language } = useAppContext();
  
  // FIX: Initialize state synchronously so DOM is ready for GSAP on first render
  const [galleryImages] = useState<string[]>(() => {
    const saved = getGallery();
    return saved.length > 0 ? saved.slice(0, 4) : FALLBACK_IMAGES;
  });
  
  useSEO('seo.home.title', 'seo.home.description');

  // Refs for animations
  const mainRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Entrance & Parallax (Enhanced)
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      
      // Text Reveal with Skew
      tl.fromTo('.hero-text', 
        { y: 100, opacity: 0, skewY: 7 }, 
        { y: 0, opacity: 1, skewY: 0, duration: 1.2, stagger: 0.15 }
      );
      
      // Gallery Cards - Pop in with elasticity
      // Added check to ensure elements exist
      const galleryItems = document.querySelectorAll('.hero-gallery-item');
      if (galleryItems.length > 0) {
        tl.fromTo(galleryItems, 
          { y: 100, opacity: 0, scale: 0.8, rotation: 5 }, 
          { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.5, stagger: 0.1, ease: 'elastic.out(1, 0.75)' }, 
          '-=0.8'
        );
      }

      // Parallax Effect
      gsap.to('.hero-gallery-wrapper', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: { 
          trigger: mainRef.current, 
          start: 'top top', 
          end: 'bottom top', 
          scrub: true 
        }
      });

      // 2. Marquee Animation (Smoother Infinite Scroll)
      if (marqueeRef.current) {
        gsap.to(marqueeRef.current, {
          xPercent: language === 'ar' ? 50 : -50,
          ease: 'none',
          duration: 25, // Slower for elegance
          repeat: -1
        });
      }

      // 3. Process Section Reveal (Staggered Up)
      // Safety check for trigger
      if (processRef.current) {
        gsap.from('.process-step', {
          y: 100,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: processRef.current, start: 'top 85%' }
        });
      }

      // 4. Quality Section Reveal (Slide In)
      if (qualityRef.current) {
        gsap.from('.quality-content', {
          x: language === 'ar' ? 100 : -100,
          opacity: 0,
          duration: 1.2,
          ease: 'power4.out',
          scrollTrigger: { trigger: qualityRef.current, start: 'top 75%' }
        });

        gsap.from('.quality-image', {
          scale: 0.9,
          opacity: 0,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: qualityRef.current, start: 'top 75%' }
        });
      }

      // 5. Reviews Reveal
      if (reviewsRef.current) {
        gsap.from('.review-card', {
          y: 50,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: reviewsRef.current, start: 'top 80%' }
        });
      }
      
    }, mainRef);

    return () => ctx.revert();
  }, [language]); // Removed galleryImages from dependency since it's stable now

  return (
    <div ref={mainRef} className="bg-white dark:bg-black overflow-hidden">
      
      {/* --- HERO SECTION --- */}
      <div className="relative min-h-screen flex flex-col justify-center pt-20 pb-10">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.1] pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="text-center lg:text-start flex flex-col items-center lg:items-start z-10">
            <div className="overflow-hidden mb-6">
              <h1 className="hero-text text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9]">
                {language === 'en' ? (
                  <>PRINT<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-300">REALITY.</span></>
                ) : (
                  <>{t('hero.title')}</>
                )}
              </h1>
            </div>
            <p className="hero-text text-lg text-gray-600 dark:text-gray-400 max-w-lg mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <Magnetic strength={0.4}>
              <button 
                onClick={onStart}
                className="hero-text group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-accent rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              >
                {t('hero.cta')}
              </button>
            </Magnetic>
          </div>

          {/* Gallery */}
          <div className="hero-gallery-wrapper relative w-full h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center will-change-transform">
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-transparent dark:from-gray-900 rounded-full blur-3xl opacity-30 transform scale-75 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4 w-full h-full relative perspective-[1000px]">
              {galleryImages.map((src, index) => (
                <div 
                  key={index}
                  className={`hero-gallery-item relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 cursor-pointer group bg-gray-100 dark:bg-zinc-800 hover:z-10 hover:shadow-2xl ${
                    index === 1 ? 'translate-y-8 md:translate-y-12' : index === 2 ? '-translate-y-8 md:-translate-y-12' : ''
                  }`}
                >
                  <ImageReveal 
                    src={src} 
                    alt="Work" 
                    containerClassName="w-full h-full"
                    className="grayscale group-hover:grayscale-0 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-50">
          <span className="text-[10px] uppercase tracking-widest mb-2 font-bold">{t('common.scroll')}</span>
          <div className="w-[1px] h-8 bg-black dark:bg-white"></div>
        </div>
      </div>

      {/* --- MARQUEE SECTION --- */}
      <div className="w-full bg-accent text-white py-4 overflow-hidden relative z-20 rotate-1 scale-105 shadow-xl">
        <div ref={marqueeRef} className="whitespace-nowrap flex gap-8">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-xl md:text-3xl font-bold uppercase tracking-widest">
              {t('home.marquee')}
            </span>
          ))}
        </div>
      </div>

      {/* --- HOW IT WORKS --- */}
      <div ref={processRef} className="py-24 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">{t('home.process.title')}</h2>
          <div className="w-24 h-1 bg-accent mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Step 1 */}
          <div className="process-step text-center group">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 border border-gray-200 dark:border-zinc-800 shadow-sm">
              👕
            </div>
            <h3 className="text-xl font-bold mb-3">{t('home.process.step1.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('home.process.step1.desc')}</p>
          </div>
          {/* Step 2 */}
          <div className="process-step text-center group">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 border border-gray-200 dark:border-zinc-800 shadow-sm">
              🎨
            </div>
            <h3 className="text-xl font-bold mb-3">{t('home.process.step2.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('home.process.step2.desc')}</p>
          </div>
          {/* Step 3 */}
          <div className="process-step text-center group">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 border border-gray-200 dark:border-zinc-800 shadow-sm">
              🚀
            </div>
            <h3 className="text-xl font-bold mb-3">{t('home.process.step3.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('home.process.step3.desc')}</p>
          </div>
        </div>
      </div>

      {/* --- QUALITY FEATURETTE --- */}
      <div ref={qualityRef} className="py-24 bg-gray-50 dark:bg-zinc-900 border-y border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="quality-content order-2 md:order-1">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-tight">
              {t('home.quality.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {t('home.quality.desc')}
            </p>
            <button 
              onClick={onStart}
              className="inline-flex items-center gap-2 font-bold border-b-2 border-black dark:border-white pb-1 hover:text-accent hover:border-accent transition-colors"
            >
              {t('nav.catalog')}
              <svg className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
          <div className="quality-image order-1 md:order-2 relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
            <ImageReveal 
              src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Quality Fabric" 
              containerClassName="w-full h-full"
              className="grayscale hover:grayscale-0 scale-105 hover:scale-100"
            />
          </div>
        </div>
      </div>

      {/* --- REVIEWS --- */}
      <div ref={reviewsRef} className="py-24 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-400 mb-4">{t('home.reviews.title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="review-card bg-gray-50 dark:bg-zinc-900 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800 relative hover:border-accent dark:hover:border-accent transition-colors duration-300">
               <div className="text-4xl text-accent mb-4 font-serif">"</div>
               <p className="text-xl font-medium mb-6 leading-relaxed">
                 {t(`home.reviews.${i}` as any)}
               </p>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                 <div>
                   <div className="font-bold text-sm">Customer #{840 + i}</div>
                   <div className="text-xs text-gray-500">Baghdad, IQ</div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- FINAL CTA --- */}
      <div className="bg-black text-white py-24 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-8">{t('hero.title')}</h2>
        <Magnetic strength={0.3}>
          <button 
            onClick={onStart}
            className="bg-white text-black px-12 py-5 rounded-full font-bold text-xl hover:bg-gray-200 transition-colors"
          >
            {t('hero.cta')}
          </button>
        </Magnetic>
      </div>

    </div>
  );
};
