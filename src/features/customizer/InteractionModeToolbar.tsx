import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { CustomizerInteractionMode } from './interactionGestures';
import type { PreviewMode, RenderingQuality, WebGLSupport } from './renderingCapabilities';

interface InteractionModeToolbarProps {
  mode: CustomizerInteractionMode;
  onModeChange: (mode: CustomizerInteractionMode) => void;
  hasActiveLayer: boolean;
  previewMode: PreviewMode;
  onTogglePreview: () => void;
  renderingQuality: RenderingQuality;
  webglSupport: WebGLSupport;
}

export const InteractionModeToolbar: React.FC<InteractionModeToolbarProps> = ({
  mode,
  onModeChange,
  hasActiveLayer,
  previewMode,
  onTogglePreview,
  renderingQuality,
  webglSupport,
}) => {
  const { language } = useAppContext();
  const is3d = previewMode === '3d';

  const copy =
    language === 'ar'
      ? {
          toolbar: 'أوضاع التحكم بالمحرر',
          view: 'عرض القطعة',
          move: 'تحريك التصميم',
          transform: 'تغيير الحجم والتدوير',
          twoD: 'استخدم المعاينة 2D',
          threeD: 'جرّب المعاينة 3D',
          noLayer: 'اختار طبقة ظاهرة حتى تگدر تحركها أو تغيّر حجمها.',
          viewHelp: 'اسحب حتى تدوّر القطعة، وقرّب أو بعّد بإصبعين.',
          moveHelp: 'اسحب بإصبع واحد حتى تحرّك التصميم داخل حدود الطباعة.',
          transformHelp: 'اسحب أفقياً للتدوير وعمودياً لتغيير الحجم، أو استخدم إصبعين.',
          quality: 'جودة العرض',
          high: 'عالية',
          balanced: 'متوازنة',
          low: 'موفّرة',
        }
      : {
          toolbar: 'Interaction mode',
          view: 'View garment',
          move: 'Move design',
          transform: 'Resize or rotate design',
          twoD: 'Switch to 2D preview',
          threeD: 'Try 3D preview',
          noLayer: 'Select a visible layer before moving or transforming it.',
          viewHelp: 'Drag to orbit the garment and pinch to zoom.',
          moveHelp: 'Drag with one pointer to move artwork inside the print area.',
          transformHelp:
            'Drag horizontally to rotate and vertically to resize, or use two pointers.',
          quality: 'Quality',
          high: 'High',
          balanced: 'Balanced',
          low: 'Low power',
        };

  const qualityLabel = {
    high: copy.high,
    balanced: copy.balanced,
    low: copy.low,
  }[renderingQuality];

  const help =
    !hasActiveLayer && mode !== 'view'
      ? copy.noLayer
      : mode === 'move'
        ? copy.moveHelp
        : mode === 'transform'
          ? copy.transformHelp
          : copy.viewHelp;

  const modes: Array<{
    id: CustomizerInteractionMode;
    label: string;
    symbol: string;
    requiresLayer: boolean;
  }> = [
    { id: 'view', label: copy.view, symbol: '◉', requiresLayer: false },
    { id: 'move', label: copy.move, symbol: '✥', requiresLayer: true },
    { id: 'transform', label: copy.transform, symbol: '⤢', requiresLayer: true },
  ];
  const previewLabel = is3d ? copy.twoD : copy.threeD;

  return (
    <div
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-30 mx-auto max-w-2xl"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="rounded-2xl border border-white/20 bg-black/75 p-2 text-white shadow-2xl backdrop-blur-xl">
        <div
          className="grid grid-cols-4 gap-1"
          role="toolbar"
          aria-label={copy.toolbar}
          aria-describedby="interaction-mode-help"
          data-interaction-mode={mode}
        >
          {modes.map((item) => {
            const disabled = !is3d || (item.requiresLayer && !hasActiveLayer);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onModeChange(item.id)}
                disabled={disabled}
                aria-pressed={is3d && mode === item.id}
                aria-label={item.label}
                className={`min-h-12 rounded-xl px-2 py-2 text-center text-[10px] font-bold transition-colors sm:text-xs ${
                  is3d && mode === item.id
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35'
                }`}
              >
                <span className="mb-1 block text-base" aria-hidden="true">
                  {item.symbol}
                </span>
                <span className="block leading-tight">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onTogglePreview}
            disabled={!is3d && webglSupport === 'unsupported'}
            aria-label={previewLabel}
            aria-pressed={!is3d}
            className={`min-h-12 rounded-xl px-2 py-2 text-center text-[10px] font-bold transition-colors sm:text-xs ${
              !is3d
                ? 'bg-white text-black'
                : 'bg-white/5 text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35'
            }`}
          >
            <bdi className="technical-ltr mb-1 block text-base" dir="ltr" aria-hidden="true">
              {is3d ? '2D' : '3D'}
            </bdi>
            <bdi className="technical-ltr block leading-tight" dir="ltr">
              {is3d ? '2D' : '3D'}
            </bdi>
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 px-2 text-[10px] text-white/70 sm:text-xs">
          <p id="interaction-mode-help" className="min-w-0 flex-1 text-start">
            {help}
          </p>
          <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 font-semibold">
            {copy.quality}: {qualityLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
