import React from 'react';
import type { PrintSurfaceDefinition } from '@/data/assets3d';
import type { DecalLayer, Language } from '@/types';
import {
  createArtworkQualityReport,
  normalizeArtworkAspectRatio,
  type ArtworkDpiLevel,
  type ArtworkQualityWarning,
} from './artworkAnalysis';
import { getArtworkEdgeClearanceCm, getArtworkPhysicalDimensions } from './printArea';

interface ArtworkQualityOverlayProps {
  layer: DecalLayer | null;
  surface: PrintSurfaceDefinition;
  language: Language;
}

const levelClasses: Record<ArtworkDpiLevel, string> = {
  unknown: 'bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-200',
  excellent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  good: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  acceptable: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  low: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  'very-low': 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

export const ArtworkQualityOverlay: React.FC<ArtworkQualityOverlayProps> = ({
  layer,
  surface,
  language,
}) => {
  if (!layer) return null;

  const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
  const dimensions = getArtworkPhysicalDimensions(layer.scale, surface, aspectRatio);
  const edgeClearanceCm = getArtworkEdgeClearanceCm(
    layer.position,
    surface,
    layer.scale,
    aspectRatio,
  );
  const report = createArtworkQualityReport(
    {
      pixelWidth: layer.pixelWidth ?? 0,
      pixelHeight: layer.pixelHeight ?? 0,
      aspectRatio,
      transparentPaddingRatio: layer.transparentPaddingRatio ?? 0,
    },
    dimensions.widthCm,
    dimensions.heightCm,
    edgeClearanceCm,
  );

  const copy = {
    title: language === 'ar' ? 'جودة التصميم للطباعة' : 'Artwork quality',
    printSize: language === 'ar' ? 'حجم التصميم على القطعة' : 'Print size',
    source: language === 'ar' ? 'أبعاد الملف الأصلي' : 'Source resolution',
    estimatedDpi: language === 'ar' ? 'الدقة المقدّرة للطباعة' : 'Estimated DPI',
    transparent: language === 'ar' ? 'الملف يحتوي شفافية' : 'Transparent background',
    analysisUnavailable:
      language === 'ar'
        ? 'ما گدرنا نقرأ أبعاد هذا الملف القديم بدقة. ارفع الملف من جديد حتى نحدّث فحص الجودة.'
        : 'Exact source analysis is unavailable for this older layer. Re-upload it for precise quality guidance.',
  };

  const levelLabels: Record<ArtworkDpiLevel, string> = {
    unknown: language === 'ar' ? 'غير محسوبة' : 'Unknown',
    excellent: language === 'ar' ? 'ممتازة' : 'Excellent',
    good: language === 'ar' ? 'جيدة' : 'Good',
    acceptable: language === 'ar' ? 'مقبولة' : 'Acceptable',
    low: language === 'ar' ? 'منخفضة' : 'Low',
    'very-low': language === 'ar' ? 'منخفضة جداً' : 'Very low',
  };

  const warningLabels: Record<ArtworkQualityWarning, string> = {
    'very-low-resolution':
      language === 'ar'
        ? 'دقة الملف منخفضة جداً، وممكن يطلع التصميم مشوش بالطباعة. صغّر حجمه أو استخدم ملف أوضح.'
        : 'Resolution is very low and may look visibly blurry in print.',
    'low-resolution':
      language === 'ar'
        ? 'دقة الملف أقل من المفضّل. صغّر حجم الطباعة أو استخدم نسخة أكبر.'
        : 'Resolution is below the preferred range. Reduce the print size or use a larger source file.',
    'extreme-aspect-ratio':
      language === 'ar'
        ? 'نسبة أبعاد التصميم غير اعتيادية. راجع القص والمساحة قبل ما تكمل.'
        : 'The artwork has an unusual aspect ratio; review its crop and placement.',
    'transparent-padding':
      language === 'ar'
        ? 'أكو فراغ شفاف كبير حول التصميم، وهذا ممكن يصعّب ضبط حجمه ومكانه.'
        : 'The file has substantial transparent padding around the visible artwork.',
    'near-print-edge':
      language === 'ar'
        ? 'التصميم قريب كلش من الحد الآمن للطباعة. حرّكه للداخل قبل التسليم.'
        : 'The artwork is very close to the safe print boundary.',
  };

  const hasSourceDimensions = Boolean(layer.pixelWidth && layer.pixelHeight);

  return (
    <aside
      className="pointer-events-none absolute bottom-32 start-4 z-10 max-h-[min(46vh,23rem)] w-[min(24rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-white/60 bg-white/90 p-4 text-xs shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/75"
      aria-label={copy.title}
      aria-live="polite"
      data-testid="artwork-quality-overlay"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-bold uppercase tracking-wider">{copy.title}</h3>
        <span className={`rounded-full px-2 py-1 font-bold ${levelClasses[report.level]}`}>
          {levelLabels[report.level]}
        </span>
      </div>

      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-gray-600 dark:text-gray-300">
        <dt>{copy.printSize}</dt>
        <dd className="text-end font-mono font-bold text-black dark:text-white">
          <bdi className="technical-ltr" dir="ltr">
            {dimensions.widthCm.toFixed(1)} × {dimensions.heightCm.toFixed(1)} cm
          </bdi>
        </dd>
        <dt>{copy.source}</dt>
        <dd className="text-end font-mono font-bold text-black dark:text-white">
          {hasSourceDimensions ? (
            <bdi className="technical-ltr" dir="ltr">
              {layer.pixelWidth} × {layer.pixelHeight} px
            </bdi>
          ) : (
            '—'
          )}
        </dd>
        <dt>{copy.estimatedDpi}</dt>
        <dd className="text-end font-mono font-bold text-black dark:text-white">
          {report.dpi === null ? (
            '—'
          ) : (
            <bdi className="technical-ltr" dir="ltr">
              {Math.round(report.dpi)} DPI
            </bdi>
          )}
        </dd>
      </dl>

      {layer.hasTransparency && (
        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 font-medium text-blue-800 dark:bg-blue-950/70 dark:text-blue-200">
          {copy.transparent}
          {typeof layer.transparentPixelRatio === 'number' ? (
            <>
              {' · '}
              <bdi className="technical-ltr" dir="ltr">
                {Math.round(layer.transparentPixelRatio * 100)}%
              </bdi>
            </>
          ) : null}
        </p>
      )}

      {!hasSourceDimensions && (
        <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-600 dark:bg-zinc-800 dark:text-gray-300">
          {copy.analysisUnavailable}
        </p>
      )}

      {report.warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {report.warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-900 dark:bg-amber-950/70 dark:text-amber-100"
            >
              {warningLabels[warning]}
            </p>
          ))}
        </div>
      )}
    </aside>
  );
};
