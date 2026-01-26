
import React, { useRef } from 'react';
import { Product, Size, DecalLayer } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface ControlsProps {
  product: Product;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedSize: Size;
  onSizeChange: (size: Size) => void;
  
  decals: DecalLayer[];
  activeDecalId: string | null;
  onSetActiveDecal: (id: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDecal: (id: string) => void;
  onUpdateDecal: (id: string, updates: Partial<DecalLayer>) => void;
  
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
  decals,
  activeDecalId,
  onSetActiveDecal,
  onUpload,
  onRemoveDecal,
  onUpdateDecal,
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
  const activeDecal = decals.find(d => d.id === activeDecalId);

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
              >
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

        {/* Layers & Upload */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('customizer.upload')} ({decals.length})
            </label>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={onUpload}
            />
            <button 
              onClick={triggerFileUpload}
              className="text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-full font-bold hover:opacity-80 transition-opacity"
            >
              + Add Layer
            </button>
          </div>

          {decals.length === 0 ? (
            <div 
              onClick={triggerFileUpload}
              className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-accent dark:hover:border-accent transition-colors group bg-gray-50 dark:bg-zinc-900/50 cursor-pointer"
            >
              <span className="text-sm text-gray-500 font-medium group-hover:text-accent">Upload Image</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Layers List */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {decals.map((layer, index) => (
                  <div 
                    key={layer.id}
                    onClick={() => onSetActiveDecal(layer.id)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                      activeDecalId === layer.id 
                        ? 'border-accent ring-2 ring-accent/20' 
                        : 'border-gray-200 dark:border-zinc-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={layer.url} alt={`Layer ${index}`} className="w-full h-full object-cover" />
                    {activeDecalId === layer.id && (
                       <div className="absolute inset-0 bg-accent/10 pointer-events-none"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Layer Controls */}
              {activeDecal && (
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 animate-fade-in space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Selected Layer</span>
                    <button 
                      onClick={() => onRemoveDecal(activeDecal.id)}
                      className="text-red-500 hover:text-red-600 text-xs font-bold"
                    >
                      {t('customizer.remove')}
                    </button>
                  </div>

                  {/* Size Control */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Size</label>
                      <span className="text-[10px] font-mono text-gray-400">{Math.round(activeDecal.scale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.4"
                      step="0.01"
                      value={activeDecal.scale}
                      onChange={(e) => onUpdateDecal(activeDecal.id, { scale: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>

                  {/* Rotation Control */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Rotation</label>
                      <span className="text-[10px] font-mono text-gray-400">{Math.round((activeDecal.userRotation || 0) * (180/Math.PI))}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.PI * 2}
                      step="0.1"
                      value={activeDecal.userRotation || 0}
                      onChange={(e) => onUpdateDecal(activeDecal.id, { userRotation: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    Drag on shirt to move • Use sliders to resize/rotate
                  </p>
                </div>
              )}
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
