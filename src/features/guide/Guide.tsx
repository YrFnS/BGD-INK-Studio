import React, { useEffect } from 'react';
import { Magnetic } from '@/components/ui/Magnetic';
import { BRAND, getLocalizedBrandText } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';
import { STUDIO_GUIDE_CONTENT } from '@/data/studioGuide';

interface GuideProps {
  onOpenCatalog: () => void;
  onOpenDesigns: () => void;
}

const StatusMark = ({ verified }: { verified: boolean }) => (
  <span
    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${
      verified
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
    }`}
    aria-hidden="true"
  >
    {verified ? '✓' : '—'}
  </span>
);

export const Guide: React.FC<GuideProps> = ({ onOpenCatalog, onOpenDesigns }) => {
  const { language } = useAppContext();
  const copy = STUDIO_GUIDE_CONTENT;
  const localized = (text: { en: string; ar: string }): string =>
    getLocalizedBrandText(text, language);

  useEffect(() => {
    document.title =
      language === 'ar'
        ? `دليل الستوديو | ${BRAND.displayName}`
        : `Studio Guide | ${BRAND.displayName}`;

    let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = getLocalizedBrandText(copy.hero.description, language);
  }, [copy.hero.description, language]);

  const verifiedLabel = language === 'ar' ? 'مؤكد بالنسخة الحالية' : 'Verified in this build';
  const pendingLabel = language === 'ar' ? 'يحتاج تأكيد خارجي' : 'Requires external confirmation';
  const bestForLabel = language === 'ar' ? 'مناسب عادةً لـ' : 'Commonly suited to';
  const tradeoffLabel = language === 'ar' ? 'انتبه إلى' : 'Important trade-off';

  return (
    <div className="bg-paper text-ink dark:bg-background dark:text-primary">
      <section className="relative isolate overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_80%_20%,rgba(225,59,45,.18),transparent_30%),radial-gradient(circle_at_15%_78%,rgba(17,17,17,.08),transparent_34%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(225,59,45,.22),transparent_28%),radial-gradient(circle_at_15%_78%,rgba(255,255,255,.06),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-45 [background-image:linear-gradient(to_right,rgba(17,17,17,.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,17,17,.055)_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-25 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)]" />

        <div className="mx-auto max-w-[1450px]">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
            {localized(copy.hero.eyebrow)}
          </p>
          <h1
            className={`mt-6 max-w-6xl text-5xl font-black uppercase leading-[.88] tracking-[-0.065em] sm:text-7xl lg:text-[6.7rem] ${
              language === 'en' ? 'font-display' : 'leading-[1.13] tracking-[-0.045em]'
            }`}
          >
            {localized(copy.hero.title)}
          </h1>
          <p className="mt-8 max-w-3xl text-base leading-8 text-black/58 dark:text-white/50 sm:text-lg">
            {localized(copy.hero.description)}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Magnetic strength={0.18}>
              <button
                type="button"
                onClick={onOpenCatalog}
                className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-ink px-7 text-sm font-black uppercase tracking-[0.13em] text-white shadow-[0_18px_45px_rgba(0,0,0,.18)] transition-transform hover:-translate-y-0.5 dark:bg-paper dark:text-ink sm:w-auto"
              >
                {localized(copy.hero.primaryCta)}
                <span className={language === 'ar' ? 'rotate-180' : ''} aria-hidden="true">
                  →
                </span>
              </button>
            </Magnetic>
            <button
              type="button"
              onClick={onOpenDesigns}
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-black/15 bg-white/40 px-7 text-sm font-black uppercase tracking-[0.12em] transition-colors hover:border-black hover:bg-white dark:border-white/15 dark:bg-white/[0.035] dark:hover:border-white dark:hover:bg-white/[0.07]"
            >
              {localized(copy.hero.secondaryCta)}
            </button>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-ink px-4 py-20 text-primary dark:border-white/10 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-[1450px]">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
            {localized(copy.expectations.eyebrow)}
          </p>
          <h2
            className={`mt-5 max-w-5xl text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl ${language === 'en' ? 'font-display' : 'leading-[1.18]'}`}
          >
            {localized(copy.expectations.title)}
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {copy.expectations.items.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 sm:p-7"
              >
                <StatusMark verified={item.verified} />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-black uppercase tracking-[-0.025em]">
                      {localized(item.title)}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] ${
                        item.verified
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-amber-300/10 text-amber-200'
                      }`}
                    >
                      {item.verified ? verifiedLabel : pendingLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/52">
                    {localized(item.description)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sizing" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-[1450px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
              {localized(copy.sizing.eyebrow)}
            </p>
            <h2
              className={`mt-5 text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl ${language === 'en' ? 'font-display' : 'leading-[1.18]'}`}
            >
              {localized(copy.sizing.title)}
            </h2>
            <p className="mt-6 text-base leading-8 text-black/58 dark:text-white/50">
              {localized(copy.sizing.description)}
            </p>
            <div className="mt-8 rounded-[1.6rem] border border-amber-500/30 bg-amber-500/[0.08] p-5">
              <p className="text-sm font-black uppercase tracking-[-0.02em] text-amber-900 dark:text-amber-100">
                {localized(copy.sizing.pendingTitle)}
              </p>
              <p className="mt-3 text-sm leading-7 text-black/55 dark:text-white/48">
                {localized(copy.sizing.pendingDescription)}
              </p>
            </div>
          </div>
          <ol className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
            {copy.sizing.steps.map((step) => (
              <li key={step.id} className="grid gap-4 py-7 sm:grid-cols-[64px_1fr] sm:py-8">
                <span className="font-mono text-sm font-black text-accent">{step.index}</span>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-[-0.03em]">
                    {localized(step.title)}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55 dark:text-white/48">
                    {localized(step.description)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="methods"
        className="border-y border-black/10 bg-[#e9e3d8] px-4 py-20 dark:border-white/10 dark:bg-[#0e0e0e] sm:px-6 sm:py-28 lg:px-8"
      >
        <div className="mx-auto max-w-[1450px]">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
            {localized(copy.methods.eyebrow)}
          </p>
          <h2
            className={`mt-5 text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl ${language === 'en' ? 'font-display' : 'leading-[1.18]'}`}
          >
            {localized(copy.methods.title)}
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-black/58 dark:text-white/50">
            {localized(copy.methods.description)}
          </p>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {copy.methods.items.map((method, index) => (
              <article
                key={method.id}
                className="rounded-[2rem] border border-black/10 bg-paper p-6 shadow-sm dark:border-white/10 dark:bg-[#070707] sm:p-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs font-black text-black/30 dark:text-white/28">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="rounded-full border border-accent/25 bg-accent/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.13em] text-accent">
                    {localized(copy.methods.referenceLabel)}
                  </span>
                </div>
                <h3 className="mt-7 text-2xl font-black uppercase tracking-[-0.04em]">
                  {localized(method.name)}
                </h3>
                <p className="mt-4 text-sm leading-7 text-black/55 dark:text-white/48">
                  {localized(method.summary)}
                </p>
                <div className="mt-7 border-t border-black/10 pt-5 dark:border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-[0.17em] text-black/35 dark:text-white/32">
                    {bestForLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/58 dark:text-white/50">
                    {localized(method.bestFor)}
                  </p>
                </div>
                <div className="mt-5 border-t border-black/10 pt-5 dark:border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-[0.17em] text-black/35 dark:text-white/32">
                    {tradeoffLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/58 dark:text-white/50">
                    {localized(method.tradeoff)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="preparation" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-[1450px] gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
              {localized(copy.preparation.eyebrow)}
            </p>
            <h2
              className={`mt-5 text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl ${language === 'en' ? 'font-display' : 'leading-[1.18]'}`}
            >
              {localized(copy.preparation.title)}
            </h2>
          </div>
          <ol className="space-y-3">
            {copy.preparation.items.map((item, index) => (
              <li
                key={item.en}
                className="flex gap-4 rounded-2xl border border-black/10 bg-white/50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.035]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-[10px] font-black text-white dark:bg-paper dark:text-ink">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <p className="pt-1 text-sm leading-7 text-black/58 dark:text-white/50">
                  {localized(item)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="policies"
        className="border-y border-black/10 bg-ink px-4 py-20 text-primary dark:border-white/10 sm:px-6 sm:py-28 lg:px-8"
      >
        <div className="mx-auto max-w-[1450px]">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
            {localized(copy.policies.eyebrow)}
          </p>
          <h2
            className={`mt-5 text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl ${language === 'en' ? 'font-display' : 'leading-[1.18]'}`}
          >
            {localized(copy.policies.title)}
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {copy.policies.items.map((policy, index) => (
              <article key={policy.id} className="bg-ink p-6 sm:p-8">
                <span className="font-mono text-xs font-black text-white/25">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <h3 className="mt-6 text-xl font-black uppercase tracking-[-0.03em]">
                  {localized(policy.title)}
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/50">
                  {localized(policy.description)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-[1450px] gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
              {localized(copy.faq.eyebrow)}
            </p>
            <h2
              className={`mt-5 text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] sm:text-6xl ${language === 'en' ? 'font-display' : 'leading-[1.18]'}`}
            >
              {localized(copy.faq.title)}
            </h2>
          </div>
          <div className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
            {copy.faq.items.map((item, index) => (
              <details key={item.id} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center gap-5 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-[10px] font-black text-black/30 dark:text-white/28">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-base font-black leading-6 sm:text-lg">
                    {localized(item.question)}
                  </span>
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-lg transition-transform group-open:rotate-45 dark:border-white/10"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-7 ps-12 pe-8 text-sm leading-7 text-black/56 dark:text-white/48 sm:text-base sm:leading-8">
                  {localized(item.answer)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-accent px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto grid max-w-[1450px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/65">
              {localized(copy.finalCta.eyebrow)}
            </p>
            <h2
              className={`mt-5 max-w-5xl text-5xl font-black uppercase leading-[.88] tracking-[-0.065em] sm:text-7xl lg:text-8xl ${language === 'en' ? 'font-display' : 'leading-[1.14]'}`}
            >
              {localized(copy.finalCta.title)}
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/72">
              {localized(copy.finalCta.description)}
            </p>
          </div>
          <Magnetic strength={0.18}>
            <button
              type="button"
              onClick={onOpenCatalog}
              className="inline-flex min-h-16 items-center justify-center rounded-full bg-white px-8 text-sm font-black uppercase tracking-[0.13em] text-black shadow-[0_20px_55px_rgba(80,10,4,.28)] transition-transform hover:-translate-y-1"
            >
              {localized(copy.finalCta.cta)}
            </button>
          </Magnetic>
        </div>
      </section>
    </div>
  );
};