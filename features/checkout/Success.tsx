
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useAppContext } from '../../contexts/AppContext';
import { PendingOrder, OrderDetails } from '../../types';
import { generateWhatsAppLink } from './services';

interface SuccessProps {
  orderId: string;
  orderDetails: OrderDetails;
  pendingOrder: PendingOrder;
  onReset: () => void;
}

export const Success: React.FC<SuccessProps> = ({ orderId, orderDetails, pendingOrder, onReset }) => {
  const { t } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)' } });

      // 1. Icon Pop
      tl.from('.success-icon', { 
        scale: 0, 
        opacity: 0, 
        duration: 0.8, 
        ease: 'elastic.out(1, 0.5)' 
      });

      // 2. Text Reveal
      tl.from('.success-text', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
      }, '-=0.4');

      // 3. Actions Slide Up
      tl.from('.success-action', {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power3.out'
      }, '-=0.2');

    }, containerRef);
    return () => ctx.revert();
  }, []);

  const whatsappLink = generateWhatsAppLink(orderId, pendingOrder, orderDetails);

  return (
    <div ref={containerRef} className="min-h-screen pt-20 flex flex-col items-center justify-center p-4 text-center max-w-md mx-auto">
      
      {/* Success Icon Animation */}
      <div className="success-icon w-24 h-24 mb-8 relative">
        <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
        <div className="relative w-full h-full bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
      </div>

      <h2 className="success-text text-4xl font-bold mb-2 tracking-tight text-black dark:text-white">
        {t('success.title')}
      </h2>

      <div className="success-text bg-gray-50 dark:bg-zinc-900 px-6 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 mb-6 font-mono text-lg">
        <span className="text-gray-500 mr-2">{t('success.orderId')}:</span>
        <span className="font-bold text-black dark:text-white">#{orderId}</span>
      </div>

      <p className="success-text text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
        {t('success.message')}
      </p>

      <div className="w-full space-y-4">
        {/* WhatsApp Button */}
        <a 
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="success-action flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.683-2.031-9.672-.272-.989-.47.149-.642.149-.124 0-.323.003-.496.003-.173 0-.453.065-.69.322-.233.257-8.928 8.723-8.928 2.129 0 1.405 1.024 2.76 1.166 2.956.143.196 2.016 3.078 4.885 4.316 2.869 1.238 2.869.825 3.39.774.52-.051 1.698-.693 1.946-1.362.248-.669.248-1.241.174-1.365z"/>
          </svg>
          {t('success.whatsapp')}
        </a>

        {/* Home Button */}
        <button 
          onClick={onReset} 
          className="success-action w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 text-black dark:text-white py-4 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
        >
          {t('success.home')}
        </button>
      </div>
    </div>
  );
};
