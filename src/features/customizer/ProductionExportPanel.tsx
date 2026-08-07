import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface ProductionExportPanelProps {
  hasVisibleArtwork: boolean | null;
  isExporting: boolean;
  onDownloadProof: () => void | Promise<void>;
  onDownloadSpecification: () => void | Promise<void>;
}

export const ProductionExportPanel: React.FC<ProductionExportPanelProps> = ({
  hasVisibleArtwork,
  isExporting,
  onDownloadProof,
  onDownloadSpecification,
}) => {
  const { language } = useAppContext();
  const copy =
    language === 'ar'
      ? {
          title: 'ملفات التسليم المحلية',
          description:
            'نزّل إثبات PNG لكل جهة وملف مواصفات JSON يحتوي القياسات والطبقات. كل المعالجة تصير على هذا الجهاز.',
          proofLead: 'نزّل إثبات',
          proofAria: 'نزّل إثبات PNG',
          specificationLead: 'نزّل مواصفات',
          specificationAria: 'نزّل مواصفات JSON',
          exporting: 'جارٍ تجهيز الملفات…',
          empty: 'أضف طبقة ظاهرة واحدة على الأقل حتى تگدر تنشئ ملفات التسليم.',
          caution:
            'هذه الملفات للمراجعة والتسليم فقط. لازم تتأكد من القطعة وقياسات الطباعة وطريقة التنفيذ قبل الإنتاج.',
          localBadge: 'على هذا الجهاز',
        }
      : {
          title: 'Local handoff files',
          description:
            'Download a PNG proof for every surface and a JSON specification containing measurements and layer data. Everything is generated on this device.',
          proofLead: 'Download',
          proofAria: 'Download PNG proof',
          specificationLead: 'Download',
          specificationAria: 'Download JSON specification',
          exporting: 'Generating files…',
          empty: 'Add at least one visible artwork layer before generating handoff files.',
          caution:
            'These files are for review and handoff only. Confirm the garment, print dimensions, and production process before printing.',
          localBadge: 'On this device',
        };

  const disabled = hasVisibleArtwork === false || isExporting;

  return (
    <section
      className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl dark:border-amber-900/70 dark:bg-amber-950/90"
      aria-labelledby="production-export-title"
      aria-describedby="production-export-description production-export-status"
      aria-busy={isExporting}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            id="production-export-title"
            className="text-sm font-black uppercase tracking-wider text-amber-950 dark:text-amber-100"
          >
            {copy.title}
          </h3>
          <p
            id="production-export-description"
            className="mt-1 text-xs leading-relaxed text-amber-900/75 dark:text-amber-100/75"
          >
            {copy.description}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-200 px-2 py-1 text-[10px] font-black uppercase text-amber-950 dark:bg-amber-900 dark:text-amber-100">
          {copy.localBadge}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void onDownloadProof()}
          disabled={disabled}
          aria-label={copy.proofAria}
          className="min-h-11 rounded-xl bg-black px-3 py-2 text-xs font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-black"
        >
          {isExporting ? (
            copy.exporting
          ) : (
            <>
              {copy.proofLead}{' '}
              <bdi className="technical-ltr" dir="ltr">
                PNG
              </bdi>
              {language === 'en' ? ' proof' : ''}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => void onDownloadSpecification()}
          disabled={disabled}
          aria-label={copy.specificationAria}
          className="min-h-11 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-950 transition-colors hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-45 dark:border-amber-800 dark:bg-black/30 dark:text-amber-100"
        >
          {isExporting ? (
            copy.exporting
          ) : (
            <>
              {copy.specificationLead}{' '}
              <bdi className="technical-ltr" dir="ltr">
                JSON
              </bdi>
              {language === 'en' ? ' specification' : ''}
            </>
          )}
        </button>
      </div>

      <p
        id="production-export-status"
        className="mt-3 text-[11px] font-semibold leading-relaxed text-amber-900/80 dark:text-amber-100/75"
        role="status"
        aria-live="polite"
      >
        {hasVisibleArtwork === false ? copy.empty : copy.caution}
      </p>
    </section>
  );
};
