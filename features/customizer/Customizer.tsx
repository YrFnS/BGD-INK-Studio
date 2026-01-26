
import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Scene } from './Scene';
import { Controls } from './Controls';
import { PRODUCTS } from '../../data/products';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { Size, PendingOrder } from '../../types';
import { useSEO } from '../../hooks/useSEO';

interface CustomizerProps {
  productId: string | null;
  onCheckout: (order: PendingOrder) => void;
}

export const Customizer: React.FC<CustomizerProps> = ({ productId, onCheckout }) => {
  const { theme, t, language } = useAppContext();
  const { showToast } = useToast();
  
  useSEO('seo.customizer.title', 'seo.customizer.description');

  // Find product or default to first
  const product = PRODUCTS.find(p => p.id === productId) || PRODUCTS[0];
  
  // Customization State
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<Size>(Size.L);
  const [decalImage, setDecalImage] = useState<string | null>(null);
  
  // Position [x, y, z] and Rotation [x, y, z]
  const [decalPosition, setDecalPosition] = useState<[number, number, number]>([0, 0.04, 0.15]);
  const [decalRotation, setDecalRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [decalScale, setDecalScale] = useState<number>(0.15);
  const [notes, setNotes] = useState('');
  
  // Interaction State
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDraggingDecal, setIsDraggingDecal] = useState(false);

  // Animation Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 3D Viewer Appearance (Scale + Fade)
      gsap.from(viewerRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2
      });

      // Controls Slide in (Direction depends on Language)
      const xOffset = language === 'ar' ? -50 : 50;
      gsap.from(controlsRef.current, {
        x: xOffset,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.4
      });
      
    }, containerRef);

    return () => ctx.revert();
  }, [language]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size too large. Max 5MB.', 'error');
      return;
    }

    const url = URL.createObjectURL(file);
    setDecalImage(url);
    // Reset position slightly on new upload to default front
    setDecalPosition([0, 0.04, 0.15]);
    setDecalRotation([0, 0, 0]);
    showToast('Design uploaded successfully', 'success');
  };

  const handleRemoveDecal = () => {
    setDecalImage(null);
    showToast('Design removed', 'info');
  };

  const handleDecalChange = (pos: [number, number, number], rot: [number, number, number]) => {
    setDecalPosition(pos);
    setDecalRotation(rot);
  };

  const handleCheckout = () => {
    onCheckout({
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      color: selectedColor,
      size: selectedSize,
      decalImage,
      decalPosition,
      decalRotation,
      decalScale,
      notes
    });
  };

  return (
    <div ref={containerRef} className="min-h-screen pt-20 md:pt-24 p-4 md:p-8 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-80px)]">
      
      {/* 3D Visualizer Area */}
      <div ref={viewerRef} className="flex-1 min-h-[40vh] bg-gray-100 dark:bg-zinc-900 rounded-2xl relative overflow-hidden transition-colors duration-300 border border-gray-200 dark:border-zinc-800">
        
        {/* Overlay Info */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <h2 className="text-3xl font-bold text-black dark:text-white opacity-50 uppercase tracking-tighter">
            {t(product.name)}
          </h2>
          <div className="mt-2 flex gap-2">
            <span className="text-xs font-bold bg-white dark:bg-black px-2 py-1 rounded">
              {selectedSize}
            </span>
            <span className="text-xs font-bold bg-white dark:bg-black px-2 py-1 rounded">
              {selectedColor}
            </span>
          </div>
        </div>

        {/* Interaction Guard Overlay (Scroll Trap Solution) */}
        {!isInteracting && (
          <div 
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[2px] cursor-pointer transition-all hover:bg-black/10 dark:hover:bg-white/10"
            onClick={() => setIsInteracting(true)}
          >
            <button className="bg-white dark:bg-black text-black dark:text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transform transition-transform hover:scale-105 interactive">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {t('customizer.interact')}
            </button>
          </div>
        )}

        {/* Exit Interaction Mode Button */}
        {isInteracting && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsInteracting(false); }}
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors shadow-lg interactive"
            aria-label={t('customizer.exitInteract')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
        )}

        {/* The 3D Canvas */}
        <div className={`w-full h-full ${isDraggingDecal ? 'cursor-grabbing' : ''}`}>
          <Scene 
            productType={product.type} 
            color={selectedColor} 
            theme={theme}
            decalImage={decalImage}
            decalPosition={decalPosition}
            decalRotation={decalRotation}
            decalScale={decalScale}
            enableControls={isInteracting && !isDraggingDecal}
            onDecalChange={handleDecalChange}
            setDraggingDecal={setIsDraggingDecal}
          />
        </div>
      </div>

      {/* Sidebar Controls */}
      <div ref={controlsRef} className="lg:w-[400px] h-full">
        <Controls 
          product={product}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          decalImage={decalImage}
          onUpload={handleFileUpload}
          onRemoveDecal={handleRemoveDecal}
          decalScale={decalScale}
          onScaleChange={setDecalScale}
          notes={notes}
          onNotesChange={setNotes}
          onCheckout={handleCheckout}
        />
      </div>

    </div>
  );
};
