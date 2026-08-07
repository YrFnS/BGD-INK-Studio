import gsap from 'gsap';
import React, { useEffect, useRef, useState } from 'react';
import { BRAND } from '@/config/brand';
import { calculateLocalDraftEstimate } from '@/config/draft';
import { PLATFORM_STATUS, getPlatformText } from '@/config/platform';
import { useAppContext } from '@/contexts/AppContext';
import { OrderDetails, PendingOrder } from '@/types';
import { generateWhatsAppLink } from './services';

interface SuccessProps {
  orderId: string;
  orderDetails?: OrderDetails;
  pendingOrder?: PendingOrder;
  onReset: () => void;
  onOpenDesigns: () => void;
  onStartNew: () => void;
}

export const Success: React.FC<SuccessProps> = ({
  orderId,
  orderDetails,
  pendingOrder,
  onReset,
  onOpenDesigns,
  onStartNew,
}) => {
  const { t, language } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline.from('.receipt-mark', { scale: 0.8, opacity: 0, duration: 0.55 });
      timeline.from(
        '.receipt-reveal',
        { y: 18, opacity: 0, duration: 0.45, stagger: 0.07 },
        '-=0.25',
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
  const localEstimate = pendingOrder
    ? calculateLocalDraftEstimate(pendingOrder.basePrice, pendingOrder.quantity)
    : null;
  const formatPrice = (price: number): string =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-US').format(price);

  const copy =
    language === 'ar'
      ? {
          eyebrow: 'إيصال مسودة محلية',
          copyId: 'انسخ رقم المسودة',
          copied: 'اننسخ الرقم',
          summary: 'ملخص التجهيز',
          garment: 'القطعة',
          variant: 'القياس واللون',
          quantity: 'الكمية',
          estimate: 'التقدير المحلي',
          estimateNote: 'مو عرض سعر أو طلب مؤكد',
          detailsUnavailable:
            'بعد تحديث الصفحة تبقى المسودة محفوظة ضمن تصاميمي، بس هذا الإيصال المختصر يعرض رقمها فقط.',
          openDesigns: 'افتح تصاميمي',
          startNew: 'ابدأ مسودة جديدة',
          home: 'العودة للرئيسية',
          deviceOnly: 'محفوظ بهذا المتصفح فقط',
        }
      : {
          eyebrow: 'Local draft receipt',
          copyId: 'Copy draft ID',
          copied: 'Copied',
          summary: 'Preparation summary',
          garment: 'Garment',
          variant: 'Size and colour',
          quantity: 'Quantity',
          estimate: 'Local estimate',
          estimateNote: 'Not a quote or confirmed order',
          detailsUnavailable:
            'After a refresh, the draft remains available in My Designs, while this compact receipt shows only its identifier.',
          openDesigns: 'Open My Designs',
          startNew: 'Start another draft',
          home: 'Back to home',
          deviceOnly: 'Saved in this browser only',
        };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-24 sm:px-6 sm:pt-32 lg:px-8"
    >
      <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#ece7de] shadow-[0_30px_90px_rgba(17,17,17,.12)] dark:border-white/10 dark:bg-[#0d0d0d] sm:rounded-[2.75rem]">
        <div className="grid lg:grid-cols-[.9fr_1.1fr]">
          <section className="relative overflow-hidden bg-[#111111] p-6 text-[#f5f1e8] sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="pointer-events-none absolute -end-20 -top-24 h-72 w-72 rounded-full bg-accent/35 blur-3xl" />

            <div className="relative">
              <div className="receipt-mark grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-white/[0.06]">
                <svg
                  className="h-8 w-8 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
                </svg>
              </div>

              <p className="receipt-reveal mt-8 text-[10px] font-black uppercase tracking-[0.24em] text-white/42">
                {copy.eyebrow} / <bdi dir="ltr">{BRAND.displayName}</bdi>
              </p>
              <h1 className="receipt-reveal mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                {title}
              </h1>
              <p className="receipt-reveal mt-5 max-w-xl text-sm leading-7 text-white/54 sm:text-base sm:leading-8">
                {message}
              </p>

              <div className="receipt-reveal mt-8 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/38">
                      {identifierLabel}
                    </span>
                    <bdi
                      dir="ltr"
                      className="mt-2 block break-all font-mono text-sm font-black text-white"
                    >
                      {orderId}
                    </bdi>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="min-h-11 shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-black transition-colors hover:bg-white hover:text-black"
                    aria-live="polite"
                  >
                    {copied ? copy.copied : copy.copyId}
                  </button>
                </div>
              </div>

              <div className="receipt-reveal mt-5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.17em] text-white/38">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                {copy.deviceOnly}
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-10 lg:p-12">
            {pendingOrder ? (
              <div className="receipt-reveal">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">
                  {copy.summary}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-black/38 dark:text-white/34">
                      {copy.garment}
                    </span>
                    <span className="mt-2 block text-lg font-black">{t(pendingOrder.productName)}</span>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-black/38 dark:text-white/34">
                      {copy.variant}
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-lg font-black">
                      <bdi dir="ltr">{pendingOrder.size}</bdi>
                      <span
                        className="h-4 w-4 rounded-full border border-black/20 dark:border-white/20"
                        style={{ backgroundColor: pendingOrder.color }}
                        aria-label={pendingOrder.color}
                        role="img"
                      />
                    </span>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-black/38 dark:text-white/34">
                      {copy.quantity}
                    </span>
                    <bdi dir="auto" className="mt-2 block font-mono text-2xl font-black">
                      {pendingOrder.quantity}
                    </bdi>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-black/38 dark:text-white/34">
                      {copy.estimate}
                    </span>
                    <bdi dir="auto" className="mt-2 block text-lg font-black">
                      {localEstimate === null
                        ? '—'
                        : `${formatPrice(localEstimate)} ${t('common.price')}`}
                    </bdi>
                    <span className="mt-1 block text-[9px] text-black/42 dark:text-white/38">
                      {copy.estimateNote}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="receipt-reveal rounded-2xl border border-black/10 bg-white/55 p-5 text-sm leading-7 text-black/55 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/48">
                {copy.detailsUnavailable}
              </p>
            )}

            {isPrototype && (
              <div
                className="receipt-reveal mt-5 rounded-2xl border border-amber-400/35 bg-amber-500/[0.08] p-4 text-sm leading-7 text-amber-950 dark:text-amber-100"
                role="alert"
              >
                {getPlatformText(PLATFORM_STATUS.notice, language)}
              </div>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onOpenDesigns}
                className="receipt-reveal min-h-14 rounded-full bg-accent px-6 text-sm font-black uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5"
              >
                {copy.openDesigns}
              </button>
              <button
                type="button"
                onClick={onStartNew}
                className="receipt-reveal min-h-14 rounded-full bg-[#111111] px-6 text-sm font-black uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5 dark:bg-[#f4f1ea] dark:text-black"
              >
                {copy.startNew}
              </button>
            </div>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="receipt-reveal mt-3 flex min-h-14 w-full items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 text-sm font-black text-emerald-800 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
              >
                {t('success.whatsapp')}
              </a>
            )}

            <button
              type="button"
              onClick={onReset}
              className="receipt-reveal mt-3 min-h-12 w-full text-sm font-bold text-black/48 underline-offset-4 hover:text-black hover:underline dark:text-white/42 dark:hover:text-white"
            >
              {copy.home}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
