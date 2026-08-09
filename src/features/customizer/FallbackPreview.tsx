import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { PrintSurfaceDefinition } from '@/data/assets3d';
import type { DecalLayer } from '@/types';
import { normalizeArtworkAspectRatio } from './artworkAnalysis';
import { getGarmentPreviewDefinition } from './garmentPreview';
import type { RenderingFallbackReason } from './renderingCapabilities';

interface FallbackPreviewProps {
  productId?: string;
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
  productId = 'tshirt-classic',
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
  const instanceId = React.useId().replace(/:/g, '');
  const fabricGradientId = `fallback-fabric-${instanceId}`;
  const sheenGradientId = `fallback-sheen-${instanceId}`;
  const shadowFilterId = `fallback-shadow-${instanceId}`;
  const definition = getGarmentPreviewDefinition(productId, surface.side);
  const width = surface.modelBounds.maxX - surface.modelBounds.minX;
  const height = surface.modelBounds.maxY - surface.modelBounds.minY;
  const visibleLayers = decals.filter(
    (layer) => layer.visible && layer.surfaceId === surface.id,
  );

  const copy =
    language === 'ar'
      ? {
          label: 'معاينة التصميم ثنائية الأبعاد',
          title: 'المعاينة الآمنة 2D',
          manual: 'معاينة 2D مفعّلة. كل الطبقات وتعديلات المسودة بعدها محفوظة على هذا الجهاز.',
          unsupported: 'هذا الجهاز ما يدعم WebGL حالياً، لذلك فتحنا معاينة 2D آمنة.',
          lost: 'توقفت معاينة 3D مؤقتاً بعد فقدان اتصال WebGL، لكن تصميمك ما ضاع.',
          model: 'ما گدرنا نعرض موديل القطعة 3D، وتگدر تكمل مراجعة التصميم محلياً بمعاينة 2D.',
          retry: 'جرّب معاينة 3D من جديد',
          surface: 'مساحة الطباعة',
          noArtwork: 'ماكو طبقة ظاهرة على هذه الجهة.',
          local: 'مراجعة محلية فقط',
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
          local: 'Local review only',
        };

  const reasonText = {
    manual: copy.manual,
    unsupported: copy.unsupported,
    'context-lost': copy.lost,
    'model-error': copy.model,
  }[reason];
  const surfaceLabel = t(surface.labelKey);
  const visualLabel = `${productName} — ${copy.surface}: ${surfaceLabel}`;

  return (
    <section
      className="relative isolate flex h-full min-h-[45vh] items-center justify-center overflow-hidden bg-[#090909] p-4 text-white sm:p-6"
      aria-labelledby="fallback-preview-title"
      aria-describedby="fallback-preview-description"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />
      <div
        className="pointer-events-none absolute -end-24 -top-28 h-80 w-80 rounded-full bg-red-600/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -start-36 h-96 w-96 rounded-full bg-white/5 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute start-4 top-4 z-30 max-w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-white/12 bg-black/72 p-4 shadow-2xl backdrop-blur-xl sm:start-6 sm:top-6"
        role="status"
      >
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,.8)]" />
          <div>
            <p
              id="fallback-preview-title"
              className="text-xs font-black uppercase tracking-[0.16em] text-white"
            >
              {copy.title}
            </p>
            <p
              id="fallback-preview-description"
              className="mt-1.5 text-xs leading-5 text-white/58"
            >
              {reasonText}
            </p>
          </div>
        </div>
        {canRetry3d && (
          <button
            type="button"
            onClick={onRetry3d}
            className="mt-3 min-h-11 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-black transition-transform hover:-translate-y-0.5"
          >
            {copy.retry}
          </button>
        )}
      </div>

      <div
        className="relative mt-28 aspect-[5/6] w-[min(88vw,34rem)] sm:mt-20"
        role="img"
        aria-label={visualLabel}
        data-garment-preview={productId}
        data-surface-side={surface.side}
      >
        <div
          className="pointer-events-none absolute inset-x-[13%] bottom-[4%] h-[10%] rounded-full bg-black/80 blur-2xl"
          aria-hidden="true"
        />

        <svg
          viewBox={definition.viewBox}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={fabricGradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.38" />
              <stop offset="0.2" stopColor={color} />
              <stop offset="0.72" stopColor={color} />
              <stop offset="1" stopColor="#000000" stopOpacity="0.52" />
            </linearGradient>
            <linearGradient id={sheenGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="0.42" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="0.72" stopColor="#ffffff" stopOpacity="0.02" />
              <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
            </linearGradient>
            <filter id={shadowFilterId} x="-30%" y="-30%" width="160%" height="170%">
              <feDropShadow dx="0" dy="24" stdDeviation="20" floodColor="#000000" floodOpacity="0.72" />
            </filter>
          </defs>

          <g filter={`url(#${shadowFilterId})`}>
            <path
              d={definition.silhouettePath}
              fill={`url(#${fabricGradientId})`}
              stroke="rgba(255,255,255,.28)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d={definition.silhouettePath} fill={`url(#${sheenGradientId})`} opacity="0.8" />
            {definition.secondaryPath && (
              <>
                <path
                  d={definition.secondaryPath}
                  fill={`url(#${fabricGradientId})`}
                  stroke="rgba(255,255,255,.25)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path d={definition.secondaryPath} fill={`url(#${sheenGradientId})`} opacity="0.7" />
              </>
            )}
            {definition.detailPaths.map((path) => (
              <path
                key={path}
                d={path}
                fill="none"
                stroke="rgba(255,255,255,.28)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        </svg>

        <div
          className="absolute overflow-hidden border border-dashed border-red-400/90 bg-black/8 shadow-[0_0_0_1px_rgba(0,0,0,.18),0_0_28px_rgba(239,68,68,.08)]"
          style={{
            left: `${definition.artworkFrame.left}%`,
            top: `${definition.artworkFrame.top}%`,
            width: `${definition.artworkFrame.width}%`,
            height: `${definition.artworkFrame.height}%`,
            borderRadius: `${definition.artworkFrame.radius}%`,
          }}
        >
          <span className="absolute start-2 top-2 z-20 rounded-md bg-black/70 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white/76 backdrop-blur">
            {surfaceLabel}
          </span>
          <span className="pointer-events-none absolute start-0 top-0 h-6 w-6 border-s-2 border-t-2 border-red-400" />
          <span className="pointer-events-none absolute end-0 top-0 h-6 w-6 border-e-2 border-t-2 border-red-400" />
          <span className="pointer-events-none absolute bottom-0 start-0 h-6 w-6 border-b-2 border-s-2 border-red-400" />
          <span className="pointer-events-none absolute bottom-0 end-0 h-6 w-6 border-b-2 border-e-2 border-red-400" />

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
                  layer.id === activeDecalId
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black/45'
                    : ''
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
            <p className="absolute inset-0 flex items-center justify-center p-5 text-center text-[10px] font-bold leading-5 text-white/58">
              {copy.noArtwork}
            </p>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 px-[12%] pb-1 text-white">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/38">
              {copy.local}
            </p>
            <p className="mt-1 max-w-56 truncate text-sm font-black" dir="auto">
              {productName}
            </p>
          </div>
          <div className="text-end">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/38">
              {copy.surface}
            </p>
            <p className="mt-1 font-mono text-xs font-black uppercase text-white/82">
              {surfaceLabel}
            </p>
          </div>
        </div>
      </div>

      <span className="sr-only">{copy.label}</span>
    </section>
  );
};
