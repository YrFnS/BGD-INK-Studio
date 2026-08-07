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
          title: 'ملفات الإنتاج المحلية',
          description:
            'نزّل إثباتاً مرئياً لكل الجهات وملف JSON بالقياسات والطبقات. لا يتم رفع أي ملف إلى خادم.',
          proof: 'تنزيل إثبات PNG',
          specification: 'تنزيل مواصفات JSON',
          exporting: 'جاري إنشاء الملفات…',
          empty: 'أضف طبقة ظاهرة واحدة على الأقل حتى تنشئ ملفات الإنتاج.',
          caution: 'يجب تأكيد قياسات القطعة وطريقة الطباعة الفعلية قبل الإنتاج.',
        }
      : {
          title: 'Local production files',
          description:
            'Download a visual proof for every surface and a JSON file containing measurements and layer data. Nothing is uploaded.',
          proof: 'Download PNG proof',
          specification: 'Download JSON specification',
          exporting: 'Generating files…',
          empty: 'Add at least one visible artwork layer before generating production files.',
          caution: 'Confirm the exact garment and print-process measurements before production.',
        };

  const disabled = hasVisibleArtwork === false || isExporting;

  return (
    <section
      className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl dark:border-amber-900/70 dark:bg-amber-950/90"
      aria-labelledby="production-export-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            id="production-export-title"
            className="text-sm font-black uppercase tracking-wider text-amber-950 dark:text-amber-100"
          >
            {copy.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/75 dark:text-amber-100/75">
            {copy.description}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-200 px-2 py-1 text-[10px] font-black uppercase text-amber-950 dark:bg-amber-900 dark:text-amber-100">
          Local
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void onDownloadProof()}
          disabled={disabled}
          className="min-h-11 rounded-xl bg-black px-3 py-2 text-xs font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-black"
        >
          {isExporting ? copy.exporting : copy.proof}
        </button>
        <button
          type="button"
          onClick={() => void onDownloadSpecification()}
          disabled={disabled}
          className="min-h-11 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-950 transition-colors hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-45 dark:border-amber-800 dark:bg-black/30 dark:text-amber-100"
        >
          {isExporting ? copy.exporting : copy.specification}
        </button>
      </div>

      <p
        className="mt-3 text-[11px] font-semibold leading-relaxed text-amber-900/80 dark:text-amber-100/75"
        role="status"
        aria-live="polite"
      >
        {hasVisibleArtwork === false ? copy.empty : copy.caution}
      </p>
    </section>
  );
};
