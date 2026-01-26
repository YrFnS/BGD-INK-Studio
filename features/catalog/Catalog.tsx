import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAppContext } from '../../contexts/AppContext';
import { Product } from '../../types';
import { useSEO } from '../../hooks/useSEO';
import { getProducts } from '../../utils/storage';
import { ImageReveal } from '../../components/ui/ImageReveal';

interface CatalogProps {
  onSelectProduct: (productId: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onSelectProduct }) => {
  const { t, language } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  
  useSEO('seo.catalog.title', 'seo.catalog.description');

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // Header Animation
      tl.fromTo(titleRef.current,
        { y: 50, opacity: 0, skewY: 5 },
        { y: 0, opacity: 1, skewY: 0, duration: 1 }
      );

      // Grid Items Animation (Staggered Pop-in)
      if (gridRef.current && gridRef.current.children.length > 0) {
        tl.fromTo(gridRef.current.children,
          { y: 100, opacity: 0, scale: 0.9 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1, 
            duration: 1.2, 
            stagger: 0.1,
            clearProps: 'all' // Clear transform after animation to prevent blur/stacking issues
          },
          '-=0.6'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  return (
    <div ref={containerRef} className="min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Catalog Header */}
      <div className="mb-12 md:mb-16 text-center md:text-start" ref={titleRef}>
        <h2 className={`text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-black dark:text-white ${language === 'en' ? 'font-display' : ''}`}>
          {t('catalog.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl text-lg">
          {t('catalog.subtitle')}
        </p>
      </div>

      {/* Product Grid */}
      <div 
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
      >
        {products.map((product: Product) => (
          <div 
            key={product.id} 
            onClick={() => product.inStock && onSelectProduct(product.id)}
            className={`group relative bg-white dark:bg-zinc-900 border ${product.inStock ? 'border-gray-200 dark:border-zinc-800 hover:border-accent dark:hover:border-accent cursor-pointer' : 'border-gray-100 dark:border-zinc-800 opacity-70 cursor-not-allowed'} rounded-2xl overflow-hidden transition-all duration-500 flex flex-col hover:shadow-2xl hover:-translate-y-2`}
          >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-zinc-800">
              <ImageReveal 
                src={product.image} 
                alt={t(product.name)}
                containerClassName="w-full h-full"
                className={`${product.inStock ? 'group-hover:scale-110 grayscale group-hover:grayscale-0' : 'grayscale'}`}
              />
              
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                  <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-full uppercase tracking-widest text-sm transform -rotate-12 border-2 border-white">
                    {t('catalog.soldOut')}
                  </span>
                </div>
              )}

              {/* Overlay Action Button - Purely visual now, since parent has click handler */}
              {product.inStock && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 pointer-events-none">
                  <span
                    className="w-full bg-accent text-white font-bold py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl text-center"
                  >
                    {t('catalog.startDesign')}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className={`text-xl font-bold tracking-tight ${product.inStock ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {t(product.name)}
                </h3>
              </div>
              
              <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-100 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {product.colors.length} Color{product.colors.length > 1 ? 's' : ''}
                </span>
                <span className={`font-bold ${product.inStock ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                  {formatPrice(product.basePrice)} {t('common.price')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};