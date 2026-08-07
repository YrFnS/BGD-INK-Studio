import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { PLATFORM_STATUS, getPlatformText } from '@/config/platform';
import { useAppContext } from '@/contexts/AppContext';
import { OrderDetails, PendingOrder } from '@/types';
import { generateWhatsAppLink } from './services';

interface SuccessProps {
  orderId: string;
  orderDetails?: OrderDetails;
  pendingOrder?: PendingOrder;
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

  const whatsappLink =
    pendingOrder && orderDetails ? generateWhatsAppLink(orderId, pendingOrder, orderDetails) : null;
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
      className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-4 pb-16 pt-24 text-center"
    >
      <div className="success-icon relative mb-8 h-24 w-24" aria-hidden="true">
        <div className="absolute inset-0 animate-ping rounded-full bg-amber-500 opacity-20" />
        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-amber-500 shadow-xl shadow-amber-500/30">
          <svg
            className="h-12 w-12 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 8v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"
            />
          </svg>
        </div>
      </div>

      <h2 className="success-text mb-3 text-4xl font-bold tracking-tight text-black dark:text-white">
        {title}
      </h2>

      <div className="success-text mb-6 rounded-lg border border-gray-200 bg-gray-50 px-6 py-2 font-mono text-lg dark:border-zinc-800 dark:bg-zinc-900">
        <span className="me-2 text-gray-500">{identifierLabel}:</span>
        <span className="font-bold text-black dark:text-white">#{orderId}</span>
      </div>

      <p className="success-text mb-8 leading-relaxed text-gray-600 dark:text-gray-300">
        {message}
      </p>

      {isPrototype && (
        <div
          className="success-text mb-8 w-full rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100"
          role="alert"
        >
          {getPlatformText(PLATFORM_STATUS.notice, language)}
        </div>
      )}

      <div className="w-full space-y-4">
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="success-action flex w-full items-center justify-center gap-3 rounded-full bg-[#25D366] py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#20bd5a] hover:shadow-xl"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4c.1-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.5 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.3-.6-.4Z" />
            </svg>
            {t('success.whatsapp')}
          </a>
        )}

        <button
          type="button"
          onClick={onReset}
          className="success-action w-full rounded-full border border-gray-200 bg-white py-4 font-bold text-black transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:bg-black dark:text-white dark:hover:bg-zinc-900"
        >
          {t('success.home')}
        </button>
      </div>
    </div>
  );
};
