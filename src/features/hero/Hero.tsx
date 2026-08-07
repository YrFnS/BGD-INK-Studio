import gsap from 'gsap';
import React, { useEffect, useMemo, useRef } from 'react';
import { Magnetic } from '@/components/ui/Magnetic';
import { BRAND, getLocalizedBrandText } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';
import { isProductCustomizerReady } from '@/data/assets3d';
import { PRODUCTS } from '@/data/products';
import {
  STOREFRONT_CONTENT,
  getProductPresentation,
} from '@/data/storefront';
import { useSEO } from '@/hooks/useSEO';
import { StudioIcon } from './StudioIcon';
import { StudioWorkbench } from './StudioWorkbench';

interface HeroProps {
  onStart: () => void;
  onOpenDesigns: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart, onOpenDesigns }) => {
  const { t, language } = useAppContext();
  const mainRef = useRef<HTMLDivElement>(null);
  const localized = (text: { en: string; ar: string }): string =>
    getLocalizedBrandText(text, language);

  useSEO('seo.home.title', 'seo.home.description');

  const collection = useMemo(
    () =>
      PRODUCTS.map((product) => ({
        product,
        presentation: getProductPresentation(product.id),
        modelReady: isProductCustomizerReady(product.id),
      })),
    [],
  );

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } });
      timeline
        .from('.p3-hero-line', {
          yPercent: 115,
          opacity: 0,
          rotate: 1.5,
          duration: 1.05,
          stagger: 0.09,
        })
        .from(
          '.p3-hero-copy',
          { y: 28, opacity: 0, duration: 0.72, stagger: 0.08 },
          '-=0.62',
        )
        .from(
          '.p3-workbench',
          { xPercent: language === 'ar' ? -7 : 7, scale: 0.965, opacity: 0, duration: 1.1 },
          '-=0.9',
        )
        .from(
          '.p3-proof-point',
          { y: 20, opacity: 0, duration: 0.6, stagger: 0.06 },
          '-=0.5',
        );
    }, mainRef);

    return () => context.revert();
  }, [language]);

  const evidence = STOREFRONT_CONTENT.evidence;
  const process = STOREFRONT_CONTENT.process;
  const catalogCopy = STOREFRONT_CONTENT.catalog;
  const finalCta = STOREFRONT_CONTENT.finalCta;

  return (
    <div
      ref={mainRef}
      className="overflow-hidden bg-[#f4f1ea] text-[#111111] dark:bg-[#050505] dark:text-[#f5f1e8]"
    >
      <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_18%,rgba(225,59,45,.18),transparent_28%),radial-gradient(circle_at_12%_78%,rgba(17,17,17,.08),transparent_32%)] dark:bg-[radial-gradient(circle_at_78%_18%,rgba(225,59,45,.22),transparent_27%),radial-gradient(circle_at_14%_78%,rgba(244,241,234,.06),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(to_right,rgba(17,17,17,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,17,17,.06)_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-30 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)]" />

        <div className="mx-auto grid w-full max-w-[1450px] items-center gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(430px,.98fr)] lg:gap-16 xl:gap-24">
          <div className="relative z-10 text-center lg:text-start">
            <div className="p3-hero-copy mb-7 inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/55 px-4 py-2 text-[10px] font-black uppercase tracking-[0.23em] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_16px_rgba(225,59,45,.8)]" />
              {localized(STOREFRONT_CONTENT.hero.eyebrow)}
            </div>

            <h1
              className={`font-black uppercase leading-[0.84] tracking-[-0.07em] ${
                language === 'ar'
                  ? 'text-5xl leading-[1.08] tracking-[-0.04em] sm:text-7xl xl:text-[6.7rem]'
                  : 'font-display text-[clamp(3.8rem,8.5vw,8.9rem)]'
              }`}
            >
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="p3-hero-line block">{localized(STOREFRONT_CONTENT.hero.titlePrimary)}</span>
              </span>
              <span className="block overflow-hidden pb-[0.12em]">
                <span className="p3-hero-line block text-accent">
                  {localized(STOREFRONT_CONTENT.hero.titleAccent)}
                </span>
              </span>
            </h1>

            <p className="p3-hero-copy mx-auto mt-8 max-w-2xl text-base leading-7 text-black/62 dark:text-white/58 sm:text-lg sm:leading-8 lg:mx-0">
              {localized(STOREFRONT_CONTENT.hero.description)}
            </p>

            <div className="p3-hero-copy mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Magnetic strength={0.22}>
                <button
                  type="button"
                  onClick={onStart}
                  className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#111111] px-7 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_45px_rgba(0,0,0,.2)] transition-transform hover:-translate-y-0.5 dark:bg-[#f4f1ea] dark:text-black sm:w-auto"
                >
                  {localized(STOREFRONT_CONTENT.hero.primaryCta)}
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full bg-accent text-white transition-transform group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
              </Magnetic>
              <button
                type="button"
                onClick={onOpenDesigns}
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-black/15 bg-white/40 px-7 text-sm font-black uppercase tracking-[0.12em] transition-colors hover:border-black hover:bg-white dark:border-white/15 dark:bg-white/[0.035] dark:hover:border-white dark:hover:bg-white/[0.07]"
              >
                {localized(STOREFRONT_CONTENT.hero.secondaryCta)}
              </button>
            </div>

            <p className="p3-hero-copy mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-black/48 dark:text-white/42 lg:justify-start">
              <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M7 10V8a5 5 0 0 1 10 0v2M5 10h14v10H5z" />
                <path d="M12 14v2" />
              </svg>
              {localized(STOREFRONT_CONTENT.hero.privacy)}
            </p>
          </div>

          <div className="p3-workbench relative mx-auto w-full max-w-[680px] lg:max-w-none">
            <div className="absolute -inset-5 -z-10 rotate-2 rounded-[3rem] border border-black/10 bg-accent/10 dark:border-white/10" />
            <StudioWorkbench />
          </div>
        </div>

        <div className="mx-auto mt-14 grid w-full max-w-[1450px] grid-cols-2 border-y border-black/10 dark:border-white/10 lg:mt-20 lg:grid-cols-4">
          {STOREFRONT_CONTENT.proofPoints.map((item, index) => (
            <div
              key={item.id}
              className={`p3-proof-point flex min-h-32 items-start gap-3 px-3 py-6 sm:gap-4 sm:px-5 lg:px-7 ${
                index % 2 !== 0 ? 'border-s border-black/10 dark:border-white/10' : ''
              } ${index > 1 ? 'border-t border-black/10 dark:border-white/10 lg:border-t-0' : ''} ${
                index > 0 ? 'lg:border-s lg:border-black/10 lg:dark:border-white/10' : ''
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/10 bg-white/60 text-accent dark:border-white/10 dark:bg-white/[0.05]">
                <StudioIcon icon={item.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black sm:text-base">{localized(item.value)}</p>
                <p className="mt-1 text-xs leading-5 text-black/48 dark:text-white/42">
                  {localized(item.label)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#111111] px-4 py-24 text-[#f5f1e8] dark:border-white/10 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-[1450px]">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
                {localized(process.eyebrow)}
              </p>
              <h2
                className={`mt-5 max-w-xl text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl ${language === 'en' ? 'font-display' : 'leading-[1.2]'}`}
              >
                {localized(process.title)}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/52 sm:text-lg sm:leading-8">
                {localized(process.description)}
              </p>
            </div>

            <div className="divide-y divide-white/10 border-y border-white/10">
              {process.steps.map((step) => (
                <article
                  key={step.id}
                  className="group grid gap-5 py-7 sm:grid-cols-[70px_72px_1fr] sm:items-start sm:gap-6 sm:py-9"
                >
                  <span className="font-mono text-sm font-black text-white/30">{step.index}</span>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                    <StudioIcon icon={step.icon} className="h-7 w-7" />
                  </span>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-[-0.02em] sm:text-2xl">
                      {localized(step.title)}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/48 sm:text-base">
                      {localized(step.description)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-[1450px]">
          <div className="max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
              {localized(evidence.eyebrow)}
            </p>
            <h2
              className={`mt-5 text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl lg:text-7xl ${language === 'en' ? 'font-display' : 'leading-[1.2]'}`}
            >
              {localized(evidence.title)}
            </h2>
            <p className="mt-7 max-w-3xl text-base leading-8 text-black/58 dark:text-white/50 sm:text-lg">
              {localized(evidence.description)}
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.035] sm:p-9">
              <div className="flex items-center justify-between gap-5">
                <h3 className="text-xl font-black uppercase tracking-[-0.03em] sm:text-2xl">
                  {localized(evidence.readyTitle)}
                </h3>
                <span className="rounded-full bg-emerald-500/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <ul className="mt-7 space-y-5">
                {evidence.readyItems.map((item) => (
                  <li key={item.en} className="flex gap-4 text-sm leading-7 text-black/60 dark:text-white/54 sm:text-base">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    {localized(item)}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[2rem] border border-accent/25 bg-accent/[0.055] p-6 shadow-sm sm:p-9">
              <div className="flex items-center justify-between gap-5">
                <h3 className="text-xl font-black uppercase tracking-[-0.03em] sm:text-2xl">
                  {localized(evidence.guardrailTitle)}
                </h3>
                <span className="rounded-full bg-accent/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-accent">
                  Honest
                </span>
              </div>
              <ul className="mt-7 space-y-5">
                {evidence.guardrailItems.map((item) => (
                  <li key={item.en} className="flex gap-4 text-sm leading-7 text-black/60 dark:text-white/54 sm:text-base">
                    <span className="mt-2 grid h-3 w-3 shrink-0 place-items-center rounded-sm border border-accent/60">
                      <span className="h-1 w-1 bg-accent" />
                    </span>
                    {localized(item)}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#e9e3d8] px-4 py-24 dark:border-white/10 dark:bg-[#0e0e0e] sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-[1450px]">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
                {localized(catalogCopy.eyebrow)}
              </p>
              <h2
                className={`mt-5 text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl ${language === 'en' ? 'font-display' : 'leading-[1.2]'}`}
              >
                {localized(catalogCopy.title)}
              </h2>
            </div>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full border border-black/15 px-5 text-xs font-black uppercase tracking-[0.13em] transition-colors hover:border-black hover:bg-black hover:text-white dark:border-white/15 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
            >
              {t('nav.catalog')}
              <span className={language === 'ar' ? 'rotate-180' : ''} aria-hidden="true">→</span>
            </button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {collection.map(({ product, presentation, modelReady }) => {
              const available = product.inStock && modelReady;
              const status = !product.inStock
                ? localized(catalogCopy.unavailableLabel)
                : modelReady
                  ? localized(catalogCopy.readyLabel)
                  : localized(catalogCopy.pendingLabel);

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[1.65rem] border border-black/10 bg-[#f4f1ea] dark:border-white/10 dark:bg-[#080808]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#111111]">
                    <img
                      src={product.image}
                      alt={t(product.name)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                    />
                    <span
                      className={`absolute start-4 top-4 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] backdrop-blur ${
                        available
                          ? 'border-emerald-300/30 bg-emerald-950/70 text-emerald-200'
                          : 'border-white/15 bg-black/65 text-white/72'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.16em] text-black/38 dark:text-white/34">
                      <span>{presentation.collectionCode}</span>
                      <span>{presentation.index}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-black uppercase tracking-[-0.035em]">
                      {t(product.name)}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-xs leading-6 text-black/52 dark:text-white/46">
                      {localized(presentation.description)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-accent px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto grid max-w-[1450px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/65">
              {localized(finalCta.eyebrow)}
            </p>
            <h2
              className={`mt-5 max-w-5xl text-5xl font-black uppercase leading-[.88] tracking-[-0.065em] sm:text-7xl lg:text-8xl ${language === 'en' ? 'font-display' : 'leading-[1.15]'}`}
            >
              {localized(finalCta.title)}
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
              {localized(finalCta.description)}
            </p>
          </div>
          <Magnetic strength={0.18}>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-16 items-center justify-center rounded-full bg-white px-8 text-sm font-black uppercase tracking-[0.13em] text-black shadow-[0_20px_55px_rgba(80,10,4,.28)] transition-transform hover:-translate-y-1"
            >
              {localized(finalCta.cta)}
            </button>
          </Magnetic>
        </div>
        <p className="relative mx-auto mt-14 max-w-[1450px] border-t border-white/25 pt-5 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
          {BRAND.displayName} · {getLocalizedBrandText(BRAND.location, language)}
        </p>
      </section>
    </div>
  );
};
