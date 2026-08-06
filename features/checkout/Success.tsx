import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { PLATFORM_STATUS, getPlatformText } from '../../config/platform';
import { useAppContext } from '../../contexts/AppContext';
import { OrderDetails, PendingOrder } from '../../types';
import { generateWhatsAppLink } from './services';

interface SuccessProps {
  orderId: string;
  orderDetails: OrderDetails;
  pendingOrder: PendingOrder;
  onReset: () => void;
}

export const Success: React.FC<SuccessProps> = ({
  orderId,
  orderDetails,
  pendingOrder,
  onReset,
}) => {
  const { t, language } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'back.out(1.7)' } });
      timeline.from('.success-icon', {
        scale: 0,
        opacity: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.5)',
      });
      timeline.from(
        '.success-text',
        { y: 20, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' },
        '-=0.35',
      );
      timeline.from(
        '.success-action',
        { y: 24, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'power3.out' },
        '-=0.15',
      );
    }, containerRef);

    return () => context.revert();
  }, []);

  const whatsappLink = generateWhatsAppLink(orderId, pendingOrder, orderDetails);
  const isPrototype = PLATFORM_STATUS.phase === 'prototype';
  const title = isPrototype
    ? getPlatformText(PLATFORM_STATUS.savedDraftTitle, language)
    : t('success.title');
  const identifierLabel = isPrototype
    ? getPlatformText(PLATFORM_STATUS.draftIdLabel, language)
    : t('success.orderId');
  const message = isPrototype
    ? getPlatformText(PLATFORM_STATUS.savedDraftMessage, language)
    : t('success.message');

  return (
    <div
      ref={containerRef}
      className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center p-4 text-center max-w-lg mx-auto"
    >
      <div className="success-icon w-24 h-24 mb-8 relative" aria-hidden="true">
        <div className="absolute inset-0 bg-amber-500 rounded-full opacity-20 animate-ping" />
        <div className="relative w-full h-full bg-amber-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30">
          <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
      </div>

      <h2 className="success-text text-4xl font-bold mb-3 tracking-tight text-black dark:text-white">
        {title}
      </h2>

      <div className="success-text bg-gray-50 dark:bg-zinc-900 px-6 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 mb-6 font-mono text-lg">
        <span className="text-gray-500 me-2">{identifierLabel}:</span>
        <span className="font-bold text-black dark:text-white">#{orderId}</span>
      </div>

      <p className="success-text text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
        {message}
      </p>

      {isPrototype && (
        <div className="success-text w-full rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100 mb-8" role="alert">
          {getPlatformText(PLATFORM_STATUS.notice, language)}
        </div>
      )}

      <div className="w-full space-y-4">
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="success-action flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4c.1-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.5 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.3-.6-.4Z" />
            </svg>
            {t('success.whatsapp')}
          </a>
        )}

        <button
          type="button"
          onClick={onReset}
          className="success-action w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 text-black dark:text-white py-4 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
        >
          {t('success.home')}
        </button>
      </div>
    </div>
  );
};
