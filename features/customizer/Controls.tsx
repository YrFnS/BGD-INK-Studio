
import React, { useRef } from 'react';
import { Product, Size } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface ControlsProps {
  product: Product;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedSize: Size;
  onSizeChange: (size: Size) => void;
  decalImage: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDecal: () => void;
  decalScale: number;
  onScaleChange: (scale: number) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onCheckout: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  product,
  selectedColor,
  onColorChange,
  selectedSize,
  onSizeChange,
  decalImage,
  onUpload,
  onRemoveDecal,
  decalScale,
  onScaleChange,
  notes,
  onNotesChange,
  onCheckout
}) => {
  const { t } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const sizes = Object.values(Size);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      
      <div className="flex-grow p-6 overflow-y-auto no-scrollbar space-y-8">
        
        {/* Color Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            {t('customizer.color')}
          </label>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-10 h-10 rounded-full border transition-all duration-300 relative ${
                  selectedColor === color 
                    ? 'border-blue-500 scale-110 shadow-lg ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black' 
                    : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              >
                {/* Checkmark for active state visibility even on white/black */}
                {selectedColor === color && (
                  <span className={`absolute inset-0 flex items-center justify-center ${['#FFFFFF', '#fff'].includes(color.toLowerCase()) ? 'text-black' : 'text-white'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Size Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            {t('customizer.size')}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => onSizeChange(size)}
                className={`py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedSize === size
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md scale-105'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Upload & Decal Controls */}
        <div>
          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            {t('customizer.upload')}
          </label>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={onUpload}
          />

          {!decalImage ? (
            <button 
              onClick={triggerFileUpload}
              className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-accent dark:hover:border-accent transition-colors group bg-gray-50 dark:bg-zinc-900/50"
            >
              <svg className="w-8 h-8 text-gray-400 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-500 font-medium">{t('customizer.upload')}</span>
            </button>
          ) : (
            <div className="space-y-6">
              {/* Image Preview & Remove */}
              <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-black h-32">
                <img src={decalImage} alt="Preview" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button 
                    onClick={triggerFileUpload} 
                    className="text-white text-xs font-bold border border-white/50 px-3 py-1 rounded-full hover:bg-white hover:text-black transition-colors"
                  >
                    {t('customizer.change')}
                  </button>
                  <button 
                    onClick={onRemoveDecal} 
                    className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors"
                  >
                    {t('customizer.remove')}
                  </button>
                </div>
              </div>

              {/* Adjustments Section */}
              <div className="space-y-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                   <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                   </svg>
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Adjustments</span>
                </div>

                <div className="mb-2">
                  <p className="text-[10px] text-gray-400 mb-2">
                    Tip: Drag the logo on the shirt to move it.
                  </p>
                </div>

                {/* Scale Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Size</label>
                    <span className="text-[10px] font-mono text-gray-400">{Math.round(decalScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.4"
                    step="0.01"
                    value={decalScale}
                    onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            {t('customizer.notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={t('customizer.notesPlaceholder')}
            className="w-full h-24 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none text-sm"
          />
        </div>

      </div>

      {/* Footer Action */}
      <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
        <button 
          onClick={onCheckout}
          className="w-full bg-accent text-white py-4 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-900/20"
        >
          {t('customizer.addToCart')}
        </button>
      </div>
    </div>
  );
};
