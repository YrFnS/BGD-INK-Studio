import React, { useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { DraftSaveStatus } from '@/services/drafts';
import { DecalLayer, Product, Size } from '@/types';

interface ControlsProps {
  product: Product;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedSize: Size;
  onSizeChange: (size: Size) => void;
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
  const uploadText = language === 'ar' ? 'إضافة طبقة' : 'Add layer';
  const uploadingText = language === 'ar' ? 'جاري حفظ الصورة…' : 'Saving artwork…';
  const selectedLayerText = language === 'ar' ? 'الطبقة المحددة' : 'Selected layer';
  const layerSizeText = language === 'ar' ? 'الحجم' : 'Size';
  const rotationText = language === 'ar' ? 'الدوران' : 'Rotation';
  const dragHelpText =
    language === 'ar'
      ? 'اسحب التصميم على القطعة، واستخدم المؤشرات لتغيير الحجم والدوران.'
      : 'Drag the artwork on the garment, then use the sliders to resize or rotate it.';

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
            </button>
          ) : (
            <div className="space-y-4">
              <div
                className="no-scrollbar flex gap-2 overflow-x-auto pb-2"
                aria-label={t('customizer.upload')}
              >
                {decals.map((layer, index) => (
                  <button
                    type="button"
                    key={layer.id}
                    onClick={() => onSetActiveDecal(layer.id)}
                    aria-label={`${selectedLayerText} ${index + 1}`}
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
                    {activeDecalId === layer.id && (
                      <span className="pointer-events-none absolute inset-0 bg-accent/10" />
                    )}
                  </button>
                ))}
              </div>

              {activeDecal && (
                <div className="animate-fade-in space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-gray-500">
                      {selectedLayerText}
                    </span>
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
                        {layerSizeText}
                      </label>
                      <span className="font-mono text-[10px] text-gray-400">
                        {Math.round(activeDecal.scale * 100)}%
                      </span>
                    </div>
                    <input
                      id={`layer-size-${activeDecal.id}`}
                      type="range"
                      min="0.05"
                      max="0.4"
                      step="0.01"
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
