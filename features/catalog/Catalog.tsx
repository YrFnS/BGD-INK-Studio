import gsap from 'gsap';
import React, { useEffect, useRef, useState } from 'react';
import { ImageReveal } from '../../components/ui/ImageReveal';
import { useAppContext } from '../../contexts/AppContext';
import { useSEO } from '../../hooks/useSEO';
import { isAbortError, platformApi } from '../../services/api';
import { Product } from '../../types';

interface CatalogProps {
  onSelectProduct: (product: Product) => void | Promise<void>;
  busyProductId?: string | null;
}

type CatalogStatus = 'loading' | 'ready' | 'error';

export const Catalog: React.FC<CatalogProps> = ({
  onSelectProduct,
  busyProductId = null,
}) => {
  const { t, language } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  useSEO('seo.catalog.title', 'seo.catalog.description');

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    platformApi.catalog
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
  }, [reloadToken]);

  useEffect(() => {
    if (status !== 'ready' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } });
      timeline.fromTo(
        titleRef.current,
        { y: 40, opacity: 0, skewY: 4 },
        { y: 0, opacity: 1, skewY: 0, duration: 0.8 },
      );

      if (gridRef.current?.children.length) {
        timeline.fromTo(
          gridRef.current.children,
          { y: 60, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.08,
            clearProps: 'transform',
          },
          '-=0.4',
        );
      }
    }, containerRef);

    return () => context.revert();
  }, [products, status]);

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-US').format(price);

  const loadingText = language === 'ar' ? 'جاري تحميل الموديلات…' : 'Loading products…';
  const errorText =
    language === 'ar'
      ? 'تعذر تحميل الموديلات. تحقق من الاتصال وحاول مرة ثانية.'
      : 'Products could not be loaded. Check the connection and try again.';
  const retryText = language === 'ar' ? 'إعادة المحاولة' : 'Try again';
  const preparingText = language === 'ar' ? 'جاري تجهيز المسودة…' : 'Preparing draft…';

  return (
    <div
      ref={containerRef}
      className="min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto"
    >
      <div className="mb-12 md:mb-16 text-center md:text-start" ref={titleRef}>
        <h2
          className={`text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-black dark:text-white ${language === 'en' ? 'font-display' : ''}`}
        >
          {t('catalog.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl text-lg">
          {t('catalog.subtitle')}
        </p>
      </div>

      {status === 'loading' && (
        <div role="status" aria-live="polite">
          <p className="sr-only">{loadingText}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                aria-hidden="true"
              >
                <div className="aspect-[4/5] animate-pulse bg-gray-200 dark:bg-zinc-800" />
                <div className="space-y-4 p-6">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/60 dark:bg-red-950/30"
        >
          <h3 className="mb-3 text-xl font-bold text-red-900 dark:text-red-100">{errorText}</h3>
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="rounded-full bg-black px-6 py-3 font-bold text-white transition-transform hover:scale-105 dark:bg-white dark:text-black"
          >
            {retryText}
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {products.map((product) => {
            const colorCount =
              language === 'ar'
                ? `${product.colors.length} لون`
                : `${product.colors.length} Color${product.colors.length === 1 ? '' : 's'}`;
            const isBusy = busyProductId === product.id;
            const isDisabled = !product.inStock || isBusy;

            return (
              <button
                type="button"
                key={product.id}
                disabled={isDisabled}
                onClick={() => void onSelectProduct(product)}
                className={`group relative text-start bg-white dark:bg-zinc-900 border ${product.inStock ? 'border-gray-200 dark:border-zinc-800 hover:border-accent dark:hover:border-accent' : 'border-gray-100 dark:border-zinc-800 opacity-70 cursor-not-allowed'} rounded-2xl overflow-hidden transition-all duration-500 flex flex-col hover:shadow-2xl enabled:hover:-translate-y-2 disabled:cursor-wait`}
                aria-label={`${t(product.name)} — ${formatPrice(product.basePrice)} ${t('common.price')}`}
                aria-busy={isBusy}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  <ImageReveal
                    src={product.image}
                    alt={t(product.name)}
                    containerClassName="w-full h-full"
                    className={
                      product.inStock
                        ? 'grayscale group-hover:scale-110 group-hover:grayscale-0'
                        : 'grayscale'
                    }
                  />

                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                      <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-full uppercase tracking-widest text-sm -rotate-12 border-2 border-white">
                        {t('catalog.soldOut')}
                      </span>
                    </div>
                  )}

                  {product.inStock && (
                    <div
                      className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center p-6 pointer-events-none ${isBusy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <span className="w-full bg-accent text-white font-bold py-3 rounded-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl text-center">
                        {isBusy ? preparingText : t('catalog.startDesign')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex w-full flex-col flex-grow">
                  <h3
                    className={`text-xl font-bold tracking-tight mb-6 ${product.inStock ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
                  >
                    {t(product.name)}
                  </h3>

                  <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {colorCount}
                    </span>
                    <span
                      className={`font-bold ${product.inStock ? 'text-black dark:text-white' : 'text-gray-400'}`}
                    >
                      {formatPrice(product.basePrice)} {t('common.price')}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
