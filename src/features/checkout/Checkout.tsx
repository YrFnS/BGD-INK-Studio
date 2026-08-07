import gsap from 'gsap';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateLocalDraftEstimate,
  MAX_DRAFT_QUANTITY,
  MIN_DRAFT_QUANTITY,
  normalizeDraftQuantity,
} from '@/config/draft';
import { useAppContext } from '@/contexts/AppContext';
import { isAbortError, platformApi, PlatformApiError, SubmitOrderResult } from '@/services/api';
import {
  DraftLoadStatus,
  HydratedDesignDraft,
  loadDesignDraft,
  markDesignDraftSubmitted,
  releaseDraftObjectUrls,
  saveCheckoutDetails,
  saveDraftQuantity,
} from '@/services/drafts';
import { OrderDetails, PendingOrder, Product } from '@/types';
import { submitOrder } from './services';
import { BAGHDAD_AREAS, checkoutSchema } from './validation';

interface CheckoutProps {
  draftId: string;
  onBack: () => void;
  onMissingDraft: () => void;
  onSuccess: (result: SubmitOrderResult, pendingOrder: PendingOrder, details: OrderDetails) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({
  draftId,
  onBack,
  onMissingDraft,
  onSuccess,
}) => {
  const { t, isRTL, language } = useAppContext();
  const [loadStatus, setLoadStatus] = useState<DraftLoadStatus>('loading');
  const [draft, setDraft] = useState<HydratedDesignDraft | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(MIN_DRAFT_QUANTITY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSaveFailed, setFormSaveFailed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderDetails>({
    fullName: '',
    phone: '',
    area: '',
    street: '',
    house: '',
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const restoredDraftRef = useRef<HydratedDesignDraft | null>(null);
  const submitControllerRef = useRef<AbortController | null>(null);
  const preparationSaveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const queuePreparationSave = useCallback(
    (nextDetails: OrderDetails, nextQuantity: number): Promise<void> => {
      const task = preparationSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          await saveCheckoutDetails(draftId, nextDetails);
          await saveDraftQuantity(draftId, nextQuantity);
        });

      preparationSaveQueueRef.current = task;
      return task;
    },
    [draftId],
  );

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    setLoadStatus('loading');
    setDraft(null);
    setProduct(null);

    Promise.all([loadDesignDraft(draftId), platformApi.catalog.listProducts(controller.signal)])
      .then(([nextDraft, products]) => {
        if (disposed) {
          if (nextDraft) releaseDraftObjectUrls(nextDraft);
          return;
        }

        if (!nextDraft) {
          setLoadStatus('missing');
          return;
        }

        const matchingProduct = products.find((candidate) => candidate.id === nextDraft.productId);
        if (!matchingProduct) {
          releaseDraftObjectUrls(nextDraft);
          setLoadStatus('error');
          return;
        }

        restoredDraftRef.current = nextDraft;
        setDraft(nextDraft);
        setProduct(matchingProduct);
        setQuantity(normalizeDraftQuantity(nextDraft.quantity));
        setFormData(nextDraft.checkoutDetails);
        setLoadStatus('ready');
      })
      .catch((error: unknown) => {
        if (disposed || isAbortError(error)) return;
        setLoadStatus('error');
      });

    return () => {
      disposed = true;
      controller.abort();
      submitControllerRef.current?.abort();
      if (restoredDraftRef.current) {
        releaseDraftObjectUrls(restoredDraftRef.current);
        restoredDraftRef.current = null;
      }
    };
  }, [draftId]);

  useEffect(() => {
    if (loadStatus !== 'ready') return undefined;

    setFormSaveFailed(false);
    const timer = window.setTimeout(() => {
      void queuePreparationSave(formData, quantity).catch(() => setFormSaveFailed(true));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [formData, loadStatus, quantity, queuePreparationSave]);

  useEffect(() => {
    if (loadStatus !== 'ready' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline.from(containerRef.current, { opacity: 0, duration: 0.45 });
      const formElements = formRef.current?.querySelectorAll('.form-group');
      if (formElements) {
        timeline.from(formElements, { y: 18, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.15');
      }
      timeline.from('.order-summary', { x: isRTL ? -28 : 28, opacity: 0, duration: 0.7 }, '-=0.5');
    }, containerRef);

    return () => context.revert();
  }, [isRTL, loadStatus]);

  const pendingOrder = useMemo<PendingOrder | null>(() => {
    if (!draft || !product) return null;

    return {
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      color: draft.color,
      size: draft.size,
      quantity,
      decals: draft.decals,
      notes: draft.notes,
    };
  }, [draft, product, quantity]);

  const localEstimate = pendingOrder
    ? calculateLocalDraftEstimate(pendingOrder.basePrice, pendingOrder.quantity)
    : 0;

  const handleChange = (field: keyof OrderDetails, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setSubmitError(null);

    if (errors[field]) {
      setErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const handleQuantityChange = (value: number) => {
    setQuantity(normalizeDraftQuantity(value));
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingOrder) return;

    setSubmitError(null);
    setErrors({});

    const parsed = checkoutSchema.safeParse(formData);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === 'string') nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    const normalizedDetails = parsed.data;
    setFormData(normalizedDetails);
    setIsSubmitting(true);
    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      await preparationSaveQueueRef.current.catch(() => undefined);
      await queuePreparationSave(normalizedDetails, pendingOrder.quantity);
      const result = await submitOrder(draftId, pendingOrder, normalizedDetails, controller.signal);
      await markDesignDraftSubmitted(draftId, result.orderId);
      onSuccess(result, pendingOrder, normalizedDetails);
    } catch (error: unknown) {
      if (isAbortError(error)) return;

      setSubmitError(
        error instanceof PlatformApiError && error.code === 'ARTWORK_NOT_PERSISTED'
          ? language === 'ar'
            ? 'لازم تنحفظ ملفات التصميم على هذا الجهاز قبل حفظ ملخص المسودة.'
            : 'Artwork must be stored on this device before saving the draft summary.'
          : language === 'ar'
            ? 'تعذر حفظ المسودة. حاول مرة ثانية.'
            : 'The local draft could not be saved. Try again.',
      );
    } finally {
      if (submitControllerRef.current === controller) submitControllerRef.current = null;
      setIsSubmitting(false);
    }
  };

  if (loadStatus === 'loading') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-24" role="status">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white" />
          <p className="text-sm font-medium text-gray-500">
            {language === 'ar' ? 'جاري استرجاع معلومات المسودة…' : 'Restoring draft details…'}
          </p>
        </div>
      </div>
    );
  }

  if (loadStatus === 'missing' || loadStatus === 'error' || !draft || !product || !pendingOrder) {
    const message =
      loadStatus === 'missing'
        ? language === 'ar'
          ? 'مسودة التصميم غير موجودة، لذلك ما نكدر نكمل المعلومات.'
          : 'The design draft is missing, so its details cannot be completed.'
        : language === 'ar'
          ? 'تعذر استرجاع معلومات المسودة.'
          : 'The draft details could not be restored.';

    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pt-24 text-center">
        <div className="max-w-lg rounded-3xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-2xl font-bold">{message}</h2>
          <button
            type="button"
            onClick={onMissingDraft}
            className="mt-4 rounded-full bg-black px-6 py-3 font-bold text-white dark:bg-white dark:text-black"
          >
            {language === 'ar' ? 'العودة للموديلات' : 'Back to catalog'}
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-US').format(price);
  const quantityLabel = language === 'ar' ? 'الكمية المحلية' : 'Local quantity';
  const decreaseQuantityLabel = language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity';
  const increaseQuantityLabel = language === 'ar' ? 'زيادة الكمية' : 'Increase quantity';
  const unitPriceLabel = language === 'ar' ? 'سعر القطعة المحدد' : 'Configured unit price';
  const estimateLabel = language === 'ar' ? 'تقدير محلي' : 'Local estimate';
  const quantityNote =
    language === 'ar'
      ? 'للتجهيز والمقارنة فقط. ماكو حجز مخزون أو عرض سعر مؤكد.'
      : 'For preparation and comparison only. No stock is reserved and this is not a confirmed quote.';

  return (
    <div
      ref={containerRef}
      className="mx-auto min-h-screen max-w-7xl px-4 pb-12 pt-20 md:px-8 md:pt-28"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="group mb-8 flex items-center gap-2 text-gray-500 transition-colors hover:text-black dark:hover:text-white"
          >
            <svg
              className={`h-5 w-5 transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">{t('common.back')}</span>
          </button>

          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-accent">
            {language === 'ar' ? 'تفاصيل محلية قابلة للاسترجاع' : 'Recoverable local preparation'}
          </p>
          <h2 className="mb-3 text-3xl font-bold uppercase tracking-tight">
            {t('checkout.title')}
          </h2>
          <p className="mb-8 max-w-xl text-sm leading-7 text-gray-500 dark:text-gray-400">
            {language === 'ar'
              ? 'هذه المعلومات تنحفظ على هذا الجهاز ويا المسودة. ما تنرسل للمحل وما تعتبر طلب.'
              : 'These details stay with the draft on this device. They are not sent to a shop and do not create an order.'}
          </p>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="form-group">
              <label htmlFor="checkout-full-name" className="mb-2 block text-sm font-bold uppercase text-gray-500 dark:text-gray-400">
                {t('checkout.name')}
              </label>
              <input
                id="checkout-full-name"
                name="name"
                autoComplete="name"
                type="text"
                value={formData.fullName}
                onChange={(event) => handleChange('fullName', event.target.value)}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'checkout-full-name-error' : undefined}
                className={`w-full rounded-xl border bg-gray-50 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-accent dark:bg-zinc-900 ${errors.fullName ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'}`}
              />
              {errors.fullName && (
                <p id="checkout-full-name-error" className="mt-1 text-xs text-red-500">
                  {t(errors.fullName)}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="checkout-phone" className="mb-2 block text-sm font-bold uppercase text-gray-500 dark:text-gray-400">
                {t('checkout.phone')}
              </label>
              <input
                id="checkout-phone"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                type="tel"
                placeholder="07xxxxxxxxx"
                value={formData.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
                className={`w-full rounded-xl border bg-gray-50 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-accent dark:bg-zinc-900 ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'}`}
              />
              {errors.phone && (
                <p id="checkout-phone-error" className="mt-1 text-xs text-red-500">
                  {t(errors.phone)}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="checkout-area" className="mb-2 block text-sm font-bold uppercase text-gray-500 dark:text-gray-400">
                {t('checkout.area')}
              </label>
              <div className="relative">
                <select
                  id="checkout-area"
                  name="address-level2"
                  autoComplete="address-level2"
                  value={formData.area}
                  onChange={(event) => handleChange('area', event.target.value)}
                  aria-invalid={Boolean(errors.area)}
                  aria-describedby={errors.area ? 'checkout-area-error' : undefined}
                  className={`w-full appearance-none rounded-xl border bg-gray-50 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-accent dark:bg-zinc-900 ${errors.area ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'}`}
                >
                  <option value="">{t('checkout.selectArea')}</option>
                  {BAGHDAD_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-4' : 'right-4'} flex items-center text-gray-500`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.area && (
                <p id="checkout-area-error" className="mt-1 text-xs text-red-500">
                  {t(errors.area)}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="checkout-address" className="mb-2 block text-sm font-bold uppercase text-gray-500 dark:text-gray-400">
                {t('checkout.address')}
              </label>
              <textarea
                id="checkout-address"
                name="street-address"
                autoComplete="street-address"
                value={formData.street}
                onChange={(event) => handleChange('street', event.target.value)}
                aria-invalid={Boolean(errors.street)}
                aria-describedby={errors.street ? 'checkout-address-error' : undefined}
                className={`h-32 w-full resize-none rounded-xl border bg-gray-50 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-accent dark:bg-zinc-900 ${errors.street ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'}`}
              />
              {errors.street && (
                <p id="checkout-address-error" className="mt-1 text-xs text-red-500">
                  {t(errors.street)}
                </p>
              )}
            </div>

            {formSaveFailed && (
              <p className="text-sm text-amber-700 dark:text-amber-300" role="status">
                {language === 'ar'
                  ? 'تعذر حفظ آخر تغييرات المعلومات أو الكمية تلقائياً.'
                  : 'The latest detail or quantity change could not be autosaved.'}
              </p>
            )}

            {submitError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100" role="alert">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="form-group w-full rounded-full bg-accent py-4 text-lg font-bold text-white transition-all hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
            >
              {isSubmitting
                ? language === 'ar'
                  ? 'جاري الحفظ…'
                  : 'Saving…'
                : t('checkout.submit')}
            </button>
          </form>
        </div>

        <div className="order-summary h-fit rounded-[2rem] border border-black/10 bg-[#ece7de] p-6 dark:border-white/10 dark:bg-[#0d0d0d] sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold uppercase tracking-tight">{t('checkout.summary')}</h3>
            <span className="rounded-full border border-black/10 bg-white/50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/48">
              {language === 'ar' ? 'محلي فقط' : 'Local only'}
            </span>
          </div>

          <div className="relative mb-6 aspect-square overflow-hidden rounded-2xl border border-black/10 bg-[#f4f1ea] dark:border-white/10 dark:bg-black">
            <img src={product.image} alt={t(product.name)} className="h-full w-full object-contain p-5 opacity-90" />
            <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundColor: pendingOrder.color }} />

            {pendingOrder.decals
              .filter((layer) => layer.visible)
              .map((layer) => (
                <div key={layer.id} className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <img
                    src={layer.url}
                    alt={layer.fileName ?? 'Custom print'}
                    style={{
                      width: `${layer.scale * 300}%`,
                      transform: `translate(${layer.position[0] * 100}px, ${-layer.position[1] * 100}px) rotate(${layer.userRotation}rad)`,
                    }}
                    className="object-contain"
                  />
                </div>
              ))}
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-black/10 py-3 dark:border-white/10">
              <span className="text-black/48 dark:text-white/42">{language === 'ar' ? 'القطعة' : 'Garment'}</span>
              <span className="font-bold">{t(pendingOrder.productName)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-black/10 py-4 dark:border-white/10">
              <div className="rounded-xl border border-black/10 bg-white/45 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-black/38 dark:text-white/34">
                  {t('customizer.size')}
                </span>
                <span className="mt-2 block text-lg font-black">{pendingOrder.size}</span>
              </div>
              <div className="rounded-xl border border-black/10 bg-white/45 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-black/38 dark:text-white/34">
                  {t('customizer.color')}
                </span>
                <span className="mt-2 flex items-center gap-2 font-bold uppercase">
                  <span className="h-4 w-4 rounded-full border border-black/20 dark:border-white/20" style={{ backgroundColor: pendingOrder.color }} />
                  {pendingOrder.color}
                </span>
              </div>
            </div>

            <div className="border-b border-black/10 py-4 dark:border-white/10">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <span className="block font-bold">{quantityLabel}</span>
                  <span className="mt-1 block text-xs text-black/42 dark:text-white/38">
                    {MIN_DRAFT_QUANTITY}–{MAX_DRAFT_QUANTITY}
                  </span>
                </div>
                <div className="flex items-center rounded-full border border-black/10 bg-white/55 p-1 dark:border-white/10 dark:bg-white/[0.05]">
                  <button
                    type="button"
                    aria-label={decreaseQuantityLabel}
                    disabled={quantity <= MIN_DRAFT_QUANTITY}
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="grid h-10 w-10 place-items-center rounded-full text-xl font-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white dark:hover:text-black"
                  >
                    −
                  </button>
                  <input
                    aria-label={quantityLabel}
                    type="number"
                    inputMode="numeric"
                    min={MIN_DRAFT_QUANTITY}
                    max={MAX_DRAFT_QUANTITY}
                    value={quantity}
                    onChange={(event) => handleQuantityChange(Number(event.target.value))}
                    className="h-10 w-14 border-0 bg-transparent text-center font-mono text-lg font-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label={increaseQuantityLabel}
                    disabled={quantity >= MAX_DRAFT_QUANTITY}
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="grid h-10 w-10 place-items-center rounded-full text-xl font-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white dark:hover:text-black"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-xs leading-6 text-black/45 dark:text-white/40">{quantityNote}</p>
            </div>

            {pendingOrder.decals.length > 0 && (
              <div className="flex justify-between border-b border-black/10 py-3 dark:border-white/10">
                <span className="text-black/48 dark:text-white/42">
                  {language === 'ar' ? 'طبقات التصميم' : 'Artwork layers'}
                </span>
                <span className="font-bold">{pendingOrder.decals.length}</span>
              </div>
            )}

            {pendingOrder.notes && (
              <div className="border-b border-black/10 py-3 dark:border-white/10">
                <span className="mb-1 block text-black/48 dark:text-white/42">{t('customizer.notes')}</span>
                <p className="font-medium italic text-black/62 dark:text-white/55">“{pendingOrder.notes}”</p>
              </div>
            )}

            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between text-xs text-black/45 dark:text-white/40">
                <span>{unitPriceLabel}</span>
                <span>
                  {formatPrice(pendingOrder.basePrice)} {t('common.price')} × {pendingOrder.quantity}
                </span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="block text-lg font-bold">{estimateLabel}</span>
                  <span className="mt-1 block text-[10px] leading-5 text-black/42 dark:text-white/38">
                    {language === 'ar' ? 'مو عرض سعر أو طلب مؤكد' : 'Not a quote or confirmed order'}
                  </span>
                </div>
                <span className="text-end text-2xl font-black tracking-[-0.03em]">
                  {formatPrice(localEstimate)} {t('common.price')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
