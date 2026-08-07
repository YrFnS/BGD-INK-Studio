import gsap from 'gsap';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImageReveal } from '@/components/ui/ImageReveal';
import { getLocalizedBrandText, type LocalizedText } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';
import { isProductCustomizerReady } from '@/data/assets3d';
import { STOREFRONT_CONTENT, getProductPresentation } from '@/data/storefront';
import { useSEO } from '@/hooks/useSEO';
import { isAbortError, platformApi, type CatalogApi } from '@/services/api';
import { Product, ProductType } from '@/types';

interface CatalogProps {
  onSelectProduct: (product: Product) => void | Promise<void>;
  busyProductId?: string | null;
  catalogApi?: CatalogApi;
}

type CatalogStatus = 'loading' | 'ready' | 'error';

const PRODUCT_TYPE_LABELS: Record<ProductType, LocalizedText> = {
  [ProductType.TSHIRT]: { en: 'T-Shirt', ar: 'تيشيرت' },
  [ProductType.HOODIE]: { en: 'Hoodie', ar: 'هودي' },
  [ProductType.VEST]: { en: 'Vest', ar: 'فيست' },
};

export const Catalog: React.FC<CatalogProps> = ({
  onSelectProduct,
  busyProductId = null,
  catalogApi = platformApi.catalog,
}) => {
  const { t, language } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  useSEO('seo.catalog.title', 'seo.catalog.description');

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const catalogCopy = STOREFRONT_CONTENT.catalog;
  const localized = (text: LocalizedText): string => getLocalizedBrandText(text, language);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    catalogApi
      .listProducts(controller.signal)
      .then((nextProducts) => {
        setProducts(nextProducts);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setProducts([]);
        setStatus('error');
      });

    return () => controller.abort();
  }, [catalogApi, reloadToken]);

  useEffect(() => {
    if (status !== 'ready' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } });
      timeline.fromTo(
        titleRef.current,
        { y: 36, opacity: 0, skewY: 2 },
        { y: 0, opacity: 1, skewY: 0, duration: 0.85 },
      );

      if (gridRef.current?.children.length) {
        timeline.fromTo(
          gridRef.current.children,
          { y: 54, opacity: 0, scale: 0.975 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.08,
            clearProps: 'transform',
          },
          '-=0.42',
        );
      }
    }, containerRef);

    return () => context.revert();
  }, [products, status]);

  const readyProductCount = useMemo(
    () => products.filter((product) => product.inStock && isProductCustomizerReady(product.id)).length,
    [products],
  );

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-US').format(price);

  const loadingText = language === 'ar' ? 'جاري تحميل القطع…' : 'Loading products…';
  const errorText =
    language === 'ar'
      ? 'تعذر تحميل القطع من الإعدادات المحلية. حاول مرة ثانية.'
      : 'Products could not be loaded from local configuration. Try again.';
  const retryText = language === 'ar' ? 'حاول مرة ثانية' : 'Try again';
  const preparingText = language === 'ar' ? 'جاري تجهيز المسودة…' : 'Preparing draft…';
  const sizeLabel = language === 'ar' ? 'قياسات المحرر' : 'Editor sizes';
  const readyCountText = `${readyProductCount} ${localized(catalogCopy.readyCount)}`;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#f4f1ea] px-4 pb-24 pt-28 text-[#111111] dark:bg-[#050505] dark:text-[#f5f1e8] sm:px-6 sm:pt-32 lg:px-8"
    >
      <div className="mx-auto max-w-[1450px]">
        <div
          ref={titleRef}
          className="grid gap-8 border-b border-black/10 pb-10 dark:border-white/10 lg:grid-cols-[1fr_auto] lg:items-end lg:pb-14"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
              {localized(catalogCopy.eyebrow)}
            </p>
            <h1
              className={`mt-5 max-w-5xl text-5xl font-black uppercase leading-[.88] tracking-[-0.065em] sm:text-7xl lg:text-8xl ${language === 'en' ? 'font-display' : 'leading-[1.14]'}`}
            >
              {localized(catalogCopy.title)}
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-black/58 dark:text-white/50 sm:text-lg">
              {localized(catalogCopy.description)}
            </p>
          </div>

          {status === 'ready' && (
            <div className="w-fit rounded-full border border-black/10 bg-white/55 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-black/60 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
              <span
                className="me-2 inline-block h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              <bdi dir="auto">{readyCountText}</bdi>
            </div>
          )}
        </div>

        {status === 'loading' && (
          <div className="mt-12" role="status" aria-live="polite">
            <p className="sr-only">{loadingText}</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="grid overflow-hidden rounded-[2rem] border border-black/10 bg-white/50 dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-[42%_1fr]"
                  aria-hidden="true"
                >
                  <div className="aspect-[4/5] animate-pulse bg-black/10 dark:bg-white/10 sm:aspect-auto" />
                  <div className="space-y-5 p-7">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                    <div className="h-8 w-3/4 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                    <div className="h-20 w-full animate-pulse rounded bg-black/5 dark:bg-white/5" />
                    <div className="h-12 w-full animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            className="mx-auto mt-14 max-w-xl rounded-[2rem] border border-red-300/50 bg-red-50 p-8 text-center dark:border-red-900/70 dark:bg-red-950/25"
          >
            <h2 className="text-xl font-black text-red-950 dark:text-red-100">{errorText}</h2>
            <button
              type="button"
              onClick={() => setReloadToken((value) => value + 1)}
              className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-black"
            >
              {retryText}
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div ref={gridRef} className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
              {products.map((product) => {
                const isBusy = busyProductId === product.id;
                const isModelReady = isProductCustomizerReady(product.id);
                const isDisabled = !product.inStock || !isModelReady || isBusy;
                const presentation = getProductPresentation(product.id);
                const unavailableLabel = !product.inStock
                  ? t('catalog.soldOut')
                  : !isModelReady
                    ? t('catalog.modelUnavailable')
                    : null;
                const statusLabel = !product.inStock
                  ? localized(catalogCopy.unavailableLabel)
                  : isModelReady
                    ? localized(catalogCopy.readyLabel)
                    : localized(catalogCopy.pendingLabel);
                const statusNote = isModelReady
                  ? localized(presentation.readyNote)
                  : localized(presentation.pendingNote);
                const productTypeLabel = localized(PRODUCT_TYPE_LABELS[product.type]);

                return (
                  <button
                    type="button"
                    key={product.id}
                    disabled={isDisabled}
                    onClick={() => void onSelectProduct(product)}
                    className={`group grid overflow-hidden rounded-[2rem] border bg-white/60 text-start shadow-sm transition-all duration-500 dark:bg-white/[0.035] sm:grid-cols-[42%_1fr] ${
                      product.inStock && isModelReady
                        ? 'border-black/10 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_24px_70px_rgba(0,0,0,.13)] dark:border-white/10 dark:hover:border-accent/70'
                        : 'cursor-not-allowed border-black/8 opacity-78 dark:border-white/8'
                    } ${isBusy ? 'cursor-wait' : ''}`}
                    aria-label={`${t(product.name)} — ${formatPrice(product.basePrice)} ${t('common.price')}${unavailableLabel ? ` — ${unavailableLabel}` : ''}`}
                    aria-busy={isBusy}
                  >
                    <div className="relative min-h-[360px] overflow-hidden bg-[#111111] sm:min-h-[500px]">
                      <ImageReveal
                        src={product.image}
                        alt={t(product.name)}
                        containerClassName="w-full h-full absolute inset-0"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 to-transparent" />
                      <div className="absolute start-4 top-4 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] backdrop-blur ${
                            product.inStock && isModelReady
                              ? 'border-emerald-300/30 bg-emerald-950/75 text-emerald-200'
                              : 'border-white/15 bg-black/68 text-white/75'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/52">
                            <bdi dir="ltr">{presentation.collectionCode}</bdi>
                          </p>
                          <p className="mt-1 font-mono text-sm font-black">
                            <bdi dir="ltr">{presentation.index}</bdi>
                          </p>
                        </div>
                        <p className="max-w-[12rem] text-end text-[9px] font-bold uppercase leading-4 tracking-[0.12em] text-white/60">
                          {statusNote}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-h-[430px] flex-col p-6 sm:min-h-0 sm:p-8">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/38 dark:text-white/34">
                            {productTypeLabel}
                          </p>
                          <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.045em] sm:text-3xl">
                            {t(product.name)}
                          </h2>
                        </div>
                        <bdi
                          dir="ltr"
                          className="font-mono text-xs font-black text-black/35 dark:text-white/32"
                        >
                          {presentation.index}
                        </bdi>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-black/55 dark:text-white/48">
                        {localized(presentation.description)}
                      </p>

                      <div className="mt-7 grid grid-cols-2 gap-3 border-y border-black/10 py-5 dark:border-white/10">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-black/35 dark:text-white/32">
                            {localized(catalogCopy.startingAt)}
                          </p>
                          <p className="mt-2 font-mono text-lg font-black">
                            <bdi dir="auto">
                              {formatPrice(product.basePrice)} {t('common.price')}
                            </bdi>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-black/35 dark:text-white/32">
                            {sizeLabel}
                          </p>
                          <p className="mt-2 font-mono text-sm font-black">
                            <bdi dir="ltr">S / M / L / XL / XXL</bdi>
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-black/35 dark:text-white/32">
                            {localized(catalogCopy.configuredColors)}
                          </p>
                          <bdi
                            dir="ltr"
                            className="font-mono text-[10px] text-black/38 dark:text-white/34"
                          >
                            {product.colors.length.toString().padStart(2, '0')}
                          </bdi>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {product.colors.map((color) => (
                            <span
                              key={color}
                              className="h-7 w-7 rounded-full border border-black/15 shadow-sm dark:border-white/20"
                              style={{ backgroundColor: color }}
                              title={color}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto pt-8">
                        <span
                          className={`flex min-h-13 w-full items-center justify-center rounded-full px-5 text-xs font-black uppercase tracking-[0.13em] transition-colors ${
                            product.inStock && isModelReady
                              ? 'bg-[#111111] text-white group-hover:bg-accent dark:bg-[#f4f1ea] dark:text-black dark:group-hover:bg-accent dark:group-hover:text-white'
                              : 'border border-black/10 text-black/38 dark:border-white/10 dark:text-white/35'
                          }`}
                        >
                          {isBusy ? preparingText : unavailableLabel ?? t('catalog.startDesign')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-6 text-black/45 dark:text-white/40">
              {localized(catalogCopy.localPriceNote)}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
