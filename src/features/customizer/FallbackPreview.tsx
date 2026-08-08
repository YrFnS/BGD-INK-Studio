import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { PrintSurfaceDefinition } from '@/data/assets3d';
import type { DecalLayer } from '@/types';
import { normalizeArtworkAspectRatio } from './artworkAnalysis';
import type { RenderingFallbackReason } from './renderingCapabilities';

interface FallbackPreviewProps {
  productName: string;
  color: string;
  surface: PrintSurfaceDefinition;
  decals: DecalLayer[];
  activeDecalId: string | null;
  reason: RenderingFallbackReason;
  canRetry3d: boolean;
  onRetry3d: () => void;
}

const toPercentage = (value: number): string => `${Math.max(0, Math.min(100, value))}%`;

export const FallbackPreview: React.FC<FallbackPreviewProps> = ({
  productName,
  color,
  surface,
  decals,
  activeDecalId,
  reason,
  canRetry3d,
  onRetry3d,
}) => {
  const { language, t } = useAppContext();
  const width = surface.modelBounds.maxX - surface.modelBounds.minX;
  const height = surface.modelBounds.maxY - surface.modelBounds.minY;
  const visibleLayers = decals.filter(
    (layer) => layer.visible && layer.surfaceId === surface.id,
  );

  const copy =
    language === 'ar'
      ? {
          label: 'معاينة التصميم ثنائية الأبعاد',
          title: 'المعاينة الثنائية الآمنة',
          manual: 'أنت تستخدم المعاينة ثنائية الأبعاد. كل طبقاتك وتعديلاتك ما زالت محفوظة.',
          unsupported: 'هذا الجهاز لا يوفر WebGL حالياً، لذلك تم فتح معاينة آمنة ثنائية الأبعاد.',
          lost: 'توقفت المعاينة ثلاثية الأبعاد مؤقتاً بعد فقدان اتصال WebGL. التصميم لم يضيع.',
          model: 'تعذر عرض موديل القطعة ثلاثي الأبعاد، لكن يمكنك متابعة مراجعة التصميم محلياً.',
          retry: 'جرّب 3D مرة ثانية',
          surface: 'مساحة الطباعة',
          noArtwork: 'لا توجد طبقة ظاهرة على هذه الجهة.',
        }
      : {
          label: '2D design preview',
          title: 'Safe 2D preview',
          manual: 'The 2D preview is active. Your layers and local draft remain fully preserved.',
          unsupported: 'WebGL is unavailable on this device, so a safe 2D preview is being used.',
          lost: 'The 3D preview paused after its WebGL context was lost. Your design was not lost.',
          model: 'The 3D garment model could not be rendered, but the local design remains available.',
          retry: 'Try 3D again',
          surface: 'Print area',
          noArtwork: 'No visible layer is placed on this surface.',
        };

  const reasonText = {
    manual: copy.manual,
    unsupported: copy.unsupported,
    'context-lost': copy.lost,
    'model-error': copy.model,
  }[reason];

  return (
    <div
      className="relative flex h-full min-h-[45vh] items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-200 p-6 dark:from-zinc-800 dark:to-zinc-950"
      role="img"
      aria-label={copy.label}
    >
      <div className="absolute inset-x-4 top-24 z-20 mx-auto max-w-lg rounded-2xl border border-black/10 bg-white/90 p-3 text-center shadow-lg backdrop-blur dark:border-white/10 dark:bg-black/75">
        <p className="text-sm font-bold">{copy.title}</p>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{reasonText}</p>
        {canRetry3d && (
          <button
            type="button"
            onClick={onRetry3d}
            className="mt-3 rounded-full bg-black px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-black"
          >
            {copy.retry}
          </button>
        )}
      </div>

      <div className="relative mt-24 h-[68%] min-h-80 w-full max-w-md">
        <svg
          viewBox="0 0 500 620"
          className="absolute inset-0 h-full w-full drop-shadow-2xl"
          aria-hidden="true"
        >
          <path
            d="M160 70 80 120 25 235l82 39 34-68v340c0 20 16 36 36 36h146c20 0 36-16 36-36V206l34 68 82-39-55-115-80-50c-18 33-49 52-90 52s-72-19-90-52Z"
            fill={color}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M196 74c8 20 28 32 54 32s46-12 54-32"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute left-[28%] top-[27%] h-[50%] w-[44%]">
          <div className="absolute inset-0 border-2 border-dashed border-red-500/80 bg-white/5">
            <span className="absolute -top-6 start-0 rounded bg-black/70 px-2 py-1 text-[9px] font-bold uppercase text-white">
              {copy.surface}: {t(surface.labelKey)}
            </span>
          </div>

          {visibleLayers.map((layer, order) => {
            const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
            const x = ((layer.position[0] - surface.modelBounds.minX) / width) * 100;
            const y =
              (1 - (layer.position[1] - surface.modelBounds.minY) / height) * 100;
            const layerWidth = (layer.scale / width) * 100;
            const layerHeight = ((layer.scale / aspectRatio) / height) * 100;

            return (
              <img
                key={layer.id}
                src={layer.url}
                alt={layer.name}
                className={`absolute max-w-none select-none object-contain ${
                  layer.id === activeDecalId ? 'ring-2 ring-white ring-offset-2 ring-offset-black/30' : ''
                }`}
                style={{
                  left: toPercentage(x),
                  top: toPercentage(y),
                  width: toPercentage(layerWidth),
                  height: toPercentage(layerHeight),
                  zIndex: order + 1,
                  transform: `translate(-50%, -50%) rotate(${layer.userRotation}rad)`,
                }}
              />
            );
          })}

          {visibleLayers.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs font-semibold text-white/90">
              {copy.noArtwork}
            </p>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{productName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t(surface.labelKey)}</p>
        </div>
      </div>
    </div>
  );
};
