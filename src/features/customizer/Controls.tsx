import React, { useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { PrintSurfaceDefinition } from '@/data/assets3d';
import { DraftSaveStatus } from '@/services/drafts';
import { DecalLayer, PrintSurfaceId, Product, Size } from '@/types';
import { getSurfaceScaleLimits, scaleToArtworkWidthCm } from './printArea';

interface ControlsProps {
  product: Product;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedSize: Size;
  onSizeChange: (size: Size) => void;
  surfaces: readonly PrintSurfaceDefinition[];
  selectedSurfaceId: PrintSurfaceId;
  onSurfaceChange: (surfaceId: PrintSurfaceId) => void;
  decals: DecalLayer[];
  activeDecalId: string | null;
  onSetActiveDecal: (id: string) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onRemoveDecal: (id: string) => void;
  onUpdateDecal: (id: string, updates: Partial<DecalLayer>) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  saveStatus: DraftSaveStatus;
  isUploading: boolean;
  onCheckout: () => void | Promise<void>;
}

export const Controls: React.FC<ControlsProps> = ({
  product,
  selectedColor,
  onColorChange,
  selectedSize,
  onSizeChange,
  surfaces,
  selectedSurfaceId,
  onSurfaceChange,
  decals,
  activeDecalId,
  onSetActiveDecal,
  onUpload,
  onRemoveDecal,
  onUpdateDecal,
  notes,
  onNotesChange,
  saveStatus,
  isUploading,
  onCheckout,
}) => {
  const { t, language } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileUpload = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const sizes = Object.values(Size);
  const activeDecal = decals.find((decal) => decal.id === activeDecalId);
  const selectedSurface =
    surfaces.find((surface) => surface.id === selectedSurfaceId) ?? surfaces[0];
  const activeSurface = activeDecal
    ? (surfaces.find((surface) => surface.id === activeDecal.surfaceId) ?? selectedSurface)
    : selectedSurface;
  const activeScaleLimits = activeSurface ? getSurfaceScaleLimits(activeSurface) : null;
  const activeArtworkWidthCm =
    activeDecal && activeSurface
      ? scaleToArtworkWidthCm(activeDecal.scale, activeSurface)
      : null;
  const uploadText = language === 'ar' ? 'إضافة طبقة' : 'Add layer';
  const uploadingText = language === 'ar' ? 'جاري حفظ الصورة…' : 'Saving artwork…';
  const selectedLayerText = language === 'ar' ? 'الطبقة المحددة' : 'Selected layer';
  const rotationText = language === 'ar' ? 'الدوران' : 'Rotation';
  const dragHelpText =
    language === 'ar'
      ? 'اسحب التصميم داخل حدود مساحة الطباعة، واستخدم المؤشرات لتغيير الحجم والدوران.'
      : 'Drag the artwork inside the print-area boundary, then resize or rotate it.';

  const saveStatusText: Record<DraftSaveStatus, string> = {
    saved: language === 'ar' ? 'محفوظ على هذا الجهاز' : 'Saved on this device',
    unsaved: language === 'ar' ? 'تغييرات بانتظار الحفظ' : 'Changes waiting to save',
    saving: language === 'ar' ? 'جاري الحفظ…' : 'Saving…',
    error: language === 'ar' ? 'تعذر حفظ المسودة' : 'Draft could not be saved',
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="no-scrollbar flex-grow space-y-8 overflow-y-auto p-6">
        <fieldset>
          <legend className="mb-3 block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('customizer.color')}
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => {
              const isLightColor = ['#ffffff', '#fff'].includes(color.toLowerCase());
              return (
                <button
                  type="button"
                  key={color}
                  onClick={() => onColorChange(color)}
                  aria-label={`${t('customizer.color')}: ${color}`}
                  aria-pressed={selectedColor === color}
                  className={`relative h-10 w-10 rounded-full border transition-all duration-300 ${
                    selectedColor === color
                      ? 'scale-110 border-blue-500 shadow-lg ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black'
                      : 'border-gray-200 hover:scale-105 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <span
                      className={`absolute inset-0 flex items-center justify-center ${isLightColor ? 'text-black' : 'text-white'}`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('customizer.size')}
          </legend>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => onSizeChange(size)}
                aria-pressed={selectedSize === size}
                className={`rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                  selectedSize === size
                    ? 'scale-105 bg-black text-white shadow-md dark:bg-white dark:text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('customizer.surface')}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {surfaces.map((surface) => (
              <button
                type="button"
                key={surface.id}
                onClick={() => onSurfaceChange(surface.id)}
                aria-pressed={selectedSurfaceId === surface.id}
                className={`rounded-xl border p-3 text-start transition-all ${
                  selectedSurfaceId === surface.id
                    ? 'border-accent bg-accent/10 text-accent shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300'
                }`}
              >
                <span className="block text-sm font-bold">{t(surface.labelKey)}</span>
                <span className="mt-1 block font-mono text-[10px] opacity-70">
                  {surface.physicalWidthCm} × {surface.physicalHeightCm} cm
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <section aria-labelledby="artwork-layers-label">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3
              id="artwork-layers-label"
              className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              {t('customizer.upload')} ({decals.length})
            </h3>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => void onUpload(event)}
            />
            <button
              type="button"
              onClick={triggerFileUpload}
              disabled={isUploading}
              className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {isUploading ? uploadingText : `+ ${uploadText}`}
            </button>
          </div>

          {decals.length === 0 ? (
            <button
              type="button"
              onClick={triggerFileUpload}
              disabled={isUploading}
              className="group flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-accent disabled:cursor-wait dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-accent"
            >
              <span className="text-sm font-medium text-gray-500 group-hover:text-accent">
                {isUploading ? uploadingText : t('customizer.upload')}
              </span>
              {selectedSurface && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t(selectedSurface.labelKey)}
                </span>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div
                className="no-scrollbar flex gap-2 overflow-x-auto pb-2"
                aria-label={t('customizer.upload')}
              >
                {decals.map((layer, index) => {
                  const layerSurface = surfaces.find((surface) => surface.id === layer.surfaceId);
                  return (
                    <button
                      type="button"
                      key={layer.id}
                      onClick={() => onSetActiveDecal(layer.id)}
                      aria-label={`${selectedLayerText} ${index + 1}${layerSurface ? ` — ${t(layerSurface.labelKey)}` : ''}`}
                      aria-pressed={activeDecalId === layer.id}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeDecalId === layer.id
                          ? 'border-accent ring-2 ring-accent/20'
                          : 'border-gray-200 opacity-70 hover:opacity-100 dark:border-zinc-700'
                      }`}
                    >
                      <img
                        src={layer.url}
                        alt={layer.fileName ?? `${selectedLayerText} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {layerSurface && (
                        <span className="pointer-events-none absolute inset-x-1 bottom-1 truncate rounded bg-black/75 px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                          {t(layerSurface.labelKey)}
                        </span>
                      )}
                      {activeDecalId === layer.id && (
                        <span className="pointer-events-none absolute inset-0 bg-accent/10" />
                      )}
                    </button>
                  );
                })}
              </div>

              {activeDecal && activeSurface && activeScaleLimits && (
                <div className="animate-fade-in space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs font-bold uppercase text-gray-500">
                        {selectedLayerText}
                      </span>
                      <span className="mt-1 block text-[10px] font-medium text-gray-400">
                        {t(activeSurface.labelKey)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveDecal(activeDecal.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-600"
                    >
                      {t('customizer.remove')}
                    </button>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor={`layer-size-${activeDecal.id}`}
                        className="text-[10px] font-bold uppercase text-gray-400"
                      >
                        {t('customizer.artworkWidth')}
                      </label>
                      <span className="font-mono text-[10px] text-gray-400">
                        {activeArtworkWidthCm?.toFixed(1)} cm
                      </span>
                    </div>
                    <input
                      id={`layer-size-${activeDecal.id}`}
                      type="range"
                      min={activeScaleLimits.minimum}
                      max={activeScaleLimits.maximum}
                      step="0.005"
                      value={activeDecal.scale}
                      onChange={(event) =>
                        onUpdateDecal(activeDecal.id, {
                          scale: Number.parseFloat(event.target.value),
                        })
                      }
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-accent dark:bg-zinc-700"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor={`layer-rotation-${activeDecal.id}`}
                        className="text-[10px] font-bold uppercase text-gray-400"
                      >
                        {rotationText}
                      </label>
                      <span className="font-mono text-[10px] text-gray-400">
                        {Math.round(activeDecal.userRotation * (180 / Math.PI))}°
                      </span>
                    </div>
                    <input
                      id={`layer-rotation-${activeDecal.id}`}
                      type="range"
                      min="0"
                      max={Math.PI * 2}
                      step="0.1"
                      value={activeDecal.userRotation}
                      onChange={(event) =>
                        onUpdateDecal(activeDecal.id, {
                          userRotation: Number.parseFloat(event.target.value),
                        })
                      }
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-accent dark:bg-zinc-700"
                    />
                  </div>

                  <p className="mt-2 text-[10px] italic text-gray-400">{dragHelpText}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <div>
          <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('customizer.notes')}
          </label>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder={t('customizer.notesPlaceholder')}
            className="h-24 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p
          className={`mb-3 text-center text-xs font-medium ${saveStatus === 'error' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
          role="status"
          aria-live="polite"
        >
          {saveStatusText[saveStatus]}
        </p>
        <button
          type="button"
          onClick={() => void onCheckout()}
          disabled={isUploading}
          className="w-full rounded-full bg-accent py-4 text-lg font-bold text-white shadow-xl shadow-red-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {t('customizer.addToCart')}
        </button>
      </div>
    </div>
  );
};
