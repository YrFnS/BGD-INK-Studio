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
  markDesignDraftSubmitted as markDesignDraftPrepared,
  releaseDraftObjectUrls,
  saveCheckoutDetails,
  saveDraftQuantity,
} from '@/services/drafts';
import { registerDraftPersistenceFlusher } from '@/persistenceCoordinator';
import { OrderDetails, PendingOrder, Product } from '@/types';
import { submitOrder } from './services';
import { BAGHDAD_AREA_OPTIONS, checkoutSchema } from './validation';

interface CheckoutProps {
  draftId: string;
  onBack: () => void;
  onMissingDraft: () => void;
  onSuccess: (result: SubmitOrderResult, pendingOrder: PendingOrder, details: OrderDetails) => void;
}

const FIELD_IDS: Record<keyof OrderDetails, string> = {
  fullName: 'checkout-full-name',
  phone: 'checkout-phone',
  area: 'checkout-area',
  street: 'checkout-address',
  house: 'checkout-address',
};

export const Checkout: React.FC<CheckoutProps> = ({
  draftId,
  onBack,
  onMissingDraft,
  onSuccess,
}) => {
  const { t, isRTL, language } = useAppContext();
  const isArabic = language === 'ar';
  const [loadStatus, setLoadStatus] = useState<DraftLoadStatus>('loading');
  const [reloadToken, setReloadToken] = useState(0);
  const [draft, setDraft] = useState<HydratedDesignDraft | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(MIN_DRAFT_QUANTITY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetryingSave, setIsRetryingSave] = useState(false);
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
  const pendingPreparationRef = useRef<{ details: OrderDetails; quantity: number } | null>(null);
  const preparationTimerRef = useRef<number | null>(null);

  const copy = isArabic
    ? {
        loading: 'جاري تحميل تجهيزات المسودة…',
        missingTitle: 'هذه المسودة مو موجودة',
        missingDescription:
          'يمكن انحذفت المسودة أو انمسحت بيانات المتصفح. افتح تصاميمي حتى تشوف المسودات الباقية على هذا الجهاز.',
        loadErrorTitle: 'تعذر فتح تجهيزات المسودة',
        loadErrorDescription:
          'قاعدة بيانات المتصفح أو إعدادات القطع ما استجابت. جرّب التحميل مرة ثانية، وتصميمك الأصلي يبقى محفوظ إذا كانت المسودة موجودة.',
        openDesigns: 'افتح تصاميمي',
        retryLoad: 'حاول مرة ثانية',
        eyebrow: 'تجهيز محلي قابل للاسترجاع',
        introduction:
          'هذه المعلومات تنحفظ ويا المسودة على هذا الجهاز فقط. ما تنرسل للستوديو وما تعتبر طلب.',
        validationTitle: 'راجع الحقول المطلوبة قبل الحفظ',
        saveWarningTitle: 'آخر تغييراتك بعدها مو محفوظة',
        saveWarningDescription:
          'تعذر حفظ معلومات التواصل أو الكمية داخل المتصفح. جرّب الحفظ مرة ثانية قبل ما تكمل.',
        retrySave: 'أعد محاولة الحفظ',
        retryingSave: 'جاري إعادة الحفظ…',
        artworkNotStored: 'ملفات التصميم لازم تنحفظ على هذا الجهاز قبل ما نكدر نحفظ إيصال المسودة.',
        submitFailed: 'تعذر حفظ إيصال المسودة محلياً. راجع مساحة التخزين بالمتصفح وحاول مرة ثانية.',
        saving: 'جاري حفظ المسودة…',
        quantity: 'الكمية المحلية',
        decreaseQuantity: 'قلّل الكمية',
        increaseQuantity: 'زيد الكمية',
        unitPrice: 'سعر القطعة المحدد محلياً',
        estimate: 'التقدير المحلي',
        quantityNote: 'للتجهيز والمقارنة فقط. ماكو حجز مخزون أو عرض سعر مؤكد.',
        localOnly: 'على هذا الجهاز',
        garment: 'القطعة',
        artworkLayers: 'طبقات التصميم',
        estimateNote: 'مو عرض سعر أو طلب مؤكد',
        artworkPreview: 'معاينة طبقة التصميم',
      }
    : {
        loading: 'Restoring draft preparation…',
        missingTitle: 'This draft is no longer available',
        missingDescription:
          'The draft may have been deleted or browser data may have been cleared. Open My Designs to review the drafts still stored on this device.',
        loadErrorTitle: 'Draft preparation could not be opened',
        loadErrorDescription:
          'The browser database or local catalog did not respond. Try loading again; existing artwork remains untouched when the draft is still available.',
        openDesigns: 'Open My Designs',
        retryLoad: 'Try loading again',
        eyebrow: 'Recoverable local preparation',
        introduction:
          'These details stay with the draft on this device. They are not sent to the studio and do not create an order.',
        validationTitle: 'Review the highlighted fields before saving',
        saveWarningTitle: 'Your latest changes are not saved yet',
        saveWarningDescription:
          'Contact details or quantity could not be written to browser storage. Retry the local save before continuing.',
        retrySave: 'Retry local save',
        retryingSave: 'Retrying save…',
        artworkNotStored:
          'Artwork must be stored on this device before the local draft receipt can be saved.',
        submitFailed:
          'The local draft receipt could not be saved. Check browser storage availability and try again.',
        saving: 'Saving local draft…',
        quantity: 'Local quantity',
        decreaseQuantity: 'Decrease quantity',
        increaseQuantity: 'Increase quantity',
        unitPrice: 'Configured unit price',
        estimate: 'Local estimate',
        quantityNote:
          'For preparation and comparison only. No stock is reserved and this is not a confirmed quote.',
        localOnly: 'On this device',
        garment: 'Garment',
        artworkLayers: 'Artwork layers',
        estimateNote: 'Not a quote or confirmed order',
        artworkPreview: 'Artwork layer preview',
      };

  const fieldLabels: Partial<Record<keyof OrderDetails, string>> = {
    fullName: t('checkout.name'),
    phone: t('checkout.phone'),
    area: t('checkout.area'),
    street: t('checkout.address'),
  };

  const fieldLabelClass = isArabic
    ? 'mb-2 block text-sm font-bold text-gray-500 dark:text-gray-400'
    : 'mb-2 block text-sm font-bold uppercase text-gray-500 dark:text-gray-400';
  const compactLabelClass = isArabic
    ? 'block text-[10px] font-black leading-5 text-black/38 dark:text-white/34'
    : 'block text-[9px] font-black uppercase tracking-[0.14em] text-black/38 dark:text-white/34';

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

  const flushPreparationSave = useCallback(async (): Promise<void> => {
    if (preparationTimerRef.current !== null) {
      window.clearTimeout(preparationTimerRef.current);
      preparationTimerRef.current = null;
    }

    const pending = pendingPreparationRef.current;
    pendingPreparationRef.current = null;
    if (pending) await queuePreparationSave(pending.details, pending.quantity);
    await preparationSaveQueueRef.current;
  }, [queuePreparationSave]);

  useEffect(
    () => registerDraftPersistenceFlusher(`checkout:${draftId}`, flushPreparationSave),
    [draftId, flushPreparationSave],
  );

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    setLoadStatus('loading');
    setDraft(null);
    setProduct(null);
    setErrors({});
    setSubmitError(null);
    setFormSaveFailed(false);

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
  }, [draftId, reloadToken]);

  useEffect(() => {
    if (loadStatus !== 'ready') return undefined;

    setFormSaveFailed(false);
    pendingPreparationRef.current = { details: formData, quantity };
    if (preparationTimerRef.current !== null) window.clearTimeout(preparationTimerRef.current);
    preparationTimerRef.current = window.setTimeout(() => {
      preparationTimerRef.current = null;
      const pending = pendingPreparationRef.current;
      pendingPreparationRef.current = null;
      if (!pending) return;
      void queuePreparationSave(pending.details, pending.quantity).catch(() => {
        pendingPreparationRef.current = pending;
        setFormSaveFailed(true);
      });
    }, 500);

    return () => {
      if (preparationTimerRef.current !== null) {
        window.clearTimeout(preparationTimerRef.current);
        preparationTimerRef.current = null;
      }
    };
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

  const handleRetryPreparationSave = async () => {
    setIsRetryingSave(true);
    setSubmitError(null);

    try {
      pendingPreparationRef.current = { details: formData, quantity };
      await flushPreparationSave();
      setFormSaveFailed(false);
    } catch {
      setFormSaveFailed(true);
    } finally {
      setIsRetryingSave(false);
    }
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

      const firstField = parsed.error.issues[0]?.path[0];
      if (typeof firstField === 'string' && firstField in FIELD_IDS) {
        window.requestAnimationFrame(() => {
          document.getElementById(FIELD_IDS[firstField as keyof OrderDetails])?.focus();
        });
      }
      return;
    }

    const normalizedDetails = parsed.data;
    setFormData(normalizedDetails);
    setIsSubmitting(true);
    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      pendingPreparationRef.current = {
        details: normalizedDetails,
        quantity: pendingOrder.quantity,
      };
      await flushPreparationSave();
      setFormSaveFailed(false);
      const result = await submitOrder(draftId, pendingOrder, normalizedDetails, controller.signal);
      await markDesignDraftPrepared(draftId, result.orderId);
      onSuccess(result, pendingOrder, normalizedDetails);
    } catch (error: unknown) {
      if (isAbortError(error)) return;

      setSubmitError(
        error instanceof PlatformApiError && error.code === 'ARTWORK_NOT_PERSISTED'
          ? copy.artworkNotStored
          : copy.submitFailed,
      );
    } finally {
      if (submitControllerRef.current === controller) submitControllerRef.current = null;
      setIsSubmitting(false);
    }
  };

  if (loadStatus === 'loading') {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center px-4 pt-24"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white" />
          <p className="text-sm font-medium text-gray-500">{copy.loading}</p>
        </div>
      </div>
    );
  }

  if (loadStatus === 'missing' || loadStatus === 'error' || !draft || !product || !pendingOrder) {
    const missing = loadStatus === 'missing';

    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pt-24 text-center">
        <div className="max-w-lg rounded-3xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold" dir="auto">
            {missing ? copy.missingTitle : copy.loadErrorTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400" dir="auto">
            {missing ? copy.missingDescription : copy.loadErrorDescription}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {!missing && (
              <button
                type="button"
                onClick={() => setReloadToken((value) => value + 1)}
                className="min-h-12 rounded-full bg-accent px-6 font-bold text-white"
              >
                {copy.retryLoad}
              </button>
            )}
            <button
              type="button"
              onClick={onMissingDraft}
              className="min-h-12 rounded-full bg-black px-6 font-bold text-white dark:bg-white dark:text-black"
            >
              {copy.openDesigns}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat(isArabic ? 'ar-IQ' : 'en-US').format(price);

  return (
    <div
      ref={containerRef}
      data-testid="draft-preparation"
      className="mx-auto min-h-screen max-w-7xl overflow-x-clip px-4 pb-12 pt-20 md:px-8 md:pt-28"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
        <div className="min-w-0">
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">{t('common.back')}</span>
          </button>

          <p
            className={
              isArabic
                ? 'mb-3 text-[11px] font-black text-accent'
                : 'mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-accent'
            }
          >
            {copy.eyebrow}
          </p>
          <h1
            className={
              isArabic
                ? 'mb-3 text-3xl font-bold leading-[1.35]'
                : 'mb-3 text-3xl font-bold uppercase tracking-tight'
            }
          >
            {t('checkout.title')}
          </h1>
          <p
            className="mb-8 max-w-xl text-sm leading-7 text-gray-500 dark:text-gray-400"
            dir="auto"
          >
            {copy.introduction}
          </p>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
            {Object.keys(errors).length > 0 && (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
                role="alert"
                data-testid="preparation-validation-summary"
              >
                <p className="font-bold">{copy.validationTitle}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>
                      {fieldLabels[field as keyof OrderDetails] ?? field}: {t(message)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="checkout-full-name" className={fieldLabelClass}>
                {t('checkout.name')}
              </label>
              <input
                id="checkout-full-name"
                name="name"
                autoComplete="name"
                type="text"
                dir="auto"
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
              <label htmlFor="checkout-phone" className={fieldLabelClass}>
                {t('checkout.phone')}
              </label>
              <input
                id="checkout-phone"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                type="tel"
                dir="ltr"
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
              <label htmlFor="checkout-area" className={fieldLabelClass}>
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
                  className={`w-full appearance-none rounded-xl border bg-gray-50 p-4 pe-12 transition-all focus:outline-none focus:ring-2 focus:ring-accent dark:bg-zinc-900 ${errors.area ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'}`}
                >
                  <option value="">{t('checkout.selectArea')}</option>
                  {BAGHDAD_AREA_OPTIONS.map((area) => (
                    <option key={area.value} value={area.value}>
                      {area.label[language]}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-gray-500">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
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
              <label htmlFor="checkout-address" className={fieldLabelClass}>
                {t('checkout.address')}
              </label>
              <textarea
                id="checkout-address"
                name="street-address"
                autoComplete="street-address"
                dir="auto"
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
              <div
                className="rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100"
                role="status"
                data-testid="preparation-save-warning"
              >
                <p className="font-bold">{copy.saveWarningTitle}</p>
                <p className="mt-1 text-sm leading-6">{copy.saveWarningDescription}</p>
                <button
                  type="button"
                  onClick={() => void handleRetryPreparationSave()}
                  disabled={isRetryingSave}
                  className="mt-3 min-h-10 rounded-full bg-amber-900 px-4 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-50 dark:bg-amber-200 dark:text-amber-950"
                >
                  {isRetryingSave ? copy.retryingSave : copy.retrySave}
                </button>
              </div>
            )}

            {submitError && (
              <p
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isRetryingSave}
              className="form-group w-full rounded-full bg-accent py-4 text-lg font-bold text-white transition-all hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
            >
              {isSubmitting ? copy.saving : t('checkout.submit')}
            </button>
          </form>
        </div>

        <aside
          className="order-summary h-fit min-w-0 rounded-[2rem] border border-black/10 bg-[#ece7de] p-6 dark:border-white/10 dark:bg-[#0d0d0d] sm:p-8"
          aria-label={t('checkout.summary')}
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2
              className={
                isArabic
                  ? 'text-xl font-bold leading-8'
                  : 'text-xl font-bold uppercase tracking-tight'
              }
            >
              {t('checkout.summary')}
            </h2>
            <span
              className={
                isArabic
                  ? 'rounded-full border border-black/10 bg-white/50 px-3 py-1.5 text-[9px] font-black text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/48'
                  : 'rounded-full border border-black/10 bg-white/50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/48'
              }
            >
              {copy.localOnly}
            </span>
          </div>

          <div className="relative mb-6 aspect-square overflow-hidden rounded-2xl border border-black/10 bg-[#f4f1ea] dark:border-white/10 dark:bg-black">
            <img
              src={product.image}
              alt={t(product.name)}
              className="h-full w-full object-contain p-5 opacity-90"
            />
            <div
              className="absolute inset-0 opacity-30 mix-blend-multiply"
              style={{ backgroundColor: pendingOrder.color }}
            />

            {pendingOrder.decals
              .filter((layer) => layer.visible)
              .map((layer) => (
                <div
                  key={layer.id}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <img
                    src={layer.url}
                    alt={layer.name || copy.artworkPreview}
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
            <div className="flex min-w-0 items-center justify-between gap-4 border-b border-black/10 py-3 dark:border-white/10">
              <span className="text-black/48 dark:text-white/42">{copy.garment}</span>
              <span className="min-w-0 text-end font-bold" dir="auto">
                {t(pendingOrder.productName)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-black/10 py-4 dark:border-white/10">
              <div className="min-w-0 rounded-xl border border-black/10 bg-white/45 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                <span className={compactLabelClass}>{t('customizer.size')}</span>
                <bdi className="technical-ltr mt-2 block text-lg font-black" dir="ltr">
                  {pendingOrder.size}
                </bdi>
              </div>
              <div className="min-w-0 rounded-xl border border-black/10 bg-white/45 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                <span className={compactLabelClass}>{t('customizer.color')}</span>
                <span className="mt-2 flex min-w-0 items-center gap-2 font-bold">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-black/20 dark:border-white/20"
                    style={{ backgroundColor: pendingOrder.color }}
                  />
                  <bdi className="technical-ltr truncate" dir="ltr">
                    {pendingOrder.color}
                  </bdi>
                </span>
              </div>
            </div>

            <div className="border-b border-black/10 py-4 dark:border-white/10">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="block font-bold">{copy.quantity}</span>
                  <bdi
                    className="technical-ltr mt-1 block text-xs text-black/42 dark:text-white/38"
                    dir="ltr"
                  >
                    {MIN_DRAFT_QUANTITY}–{MAX_DRAFT_QUANTITY}
                  </bdi>
                </div>
                <div className="flex items-center rounded-full border border-black/10 bg-white/55 p-1 dark:border-white/10 dark:bg-white/[0.05]">
                  <button
                    type="button"
                    aria-label={copy.decreaseQuantity}
                    disabled={quantity <= MIN_DRAFT_QUANTITY}
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="grid h-10 w-10 place-items-center rounded-full text-xl font-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white dark:hover:text-black"
                  >
                    −
                  </button>
                  <input
                    aria-label={copy.quantity}
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    min={MIN_DRAFT_QUANTITY}
                    max={MAX_DRAFT_QUANTITY}
                    value={quantity}
                    onChange={(event) => handleQuantityChange(Number(event.target.value))}
                    className="h-10 w-14 border-0 bg-transparent text-center font-mono text-lg font-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label={copy.increaseQuantity}
                    disabled={quantity >= MAX_DRAFT_QUANTITY}
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="grid h-10 w-10 place-items-center rounded-full text-xl font-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white dark:hover:text-black"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-xs leading-6 text-black/45 dark:text-white/40" dir="auto">
                {copy.quantityNote}
              </p>
            </div>

            {pendingOrder.decals.length > 0 && (
              <div className="flex items-center justify-between gap-4 border-b border-black/10 py-3 dark:border-white/10">
                <span className="text-black/48 dark:text-white/42">{copy.artworkLayers}</span>
                <bdi className="technical-ltr font-bold" dir="ltr">
                  {pendingOrder.decals.length}
                </bdi>
              </div>
            )}

            {pendingOrder.notes && (
              <div className="border-b border-black/10 py-3 dark:border-white/10">
                <span className="mb-1 block text-black/48 dark:text-white/42">
                  {t('customizer.notes')}
                </span>
                <p
                  className="break-words font-medium italic text-black/62 dark:text-white/55"
                  dir="auto"
                >
                  “{pendingOrder.notes}”
                </p>
              </div>
            )}

            <div className="space-y-2 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-black/45 dark:text-white/40">
                <span>{copy.unitPrice}</span>
                <bdi className="technical-ltr" dir="ltr">
                  {formatPrice(pendingOrder.basePrice)} {t('common.price')} ×{' '}
                  {pendingOrder.quantity}
                </bdi>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="block text-lg font-bold">{copy.estimate}</span>
                  <span className="mt-1 block text-[10px] leading-5 text-black/42 dark:text-white/38">
                    {copy.estimateNote}
                  </span>
                </div>
                <bdi
                  className="technical-ltr text-end text-2xl font-black tracking-[-0.03em]"
                  dir="ltr"
                >
                  {formatPrice(localEstimate)} {t('common.price')}
                </bdi>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
