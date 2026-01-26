
import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import gsap from 'gsap';
import { PendingOrder, OrderDetails } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { PRODUCTS } from '../../data/products';
import { submitOrder } from './services';

interface CheckoutProps {
  order: PendingOrder | null;
  onBack: () => void;
  onSuccess: (orderId: string, details: OrderDetails) => void;
}

const BAGHDAD_AREAS = [
  'Al-Mansour',
  'Al-Karrada',
  'Al-Jadriya',
  'Al-Yarmouk',
  'Al-Dora',
  'Zayouna',
  'Al-Adhamiya',
  'Al-Shaab',
  'Baghdad Al-Jadida',
  'Al-Hurriya',
  'Al-Ghazaliya',
  'Hayy Al-Jamia',
  'Al-Amiriya',
  'Al-Saydiya',
  'Other'
];

export const Checkout: React.FC<CheckoutProps> = ({ order, onBack, onSuccess }) => {
  const { t, isRTL } = useAppContext();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<OrderDetails>({
    fullName: '',
    phone: '',
    area: '',
    street: '',
    house: ''
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(containerRef.current, { opacity: 0, duration: 0.5 });
      const formElements = formRef.current?.querySelectorAll('.form-group');
      if (formElements) {
        tl.from(formElements, { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.2');
      }
      tl.from('.order-summary', { x: isRTL ? -30 : 30, opacity: 0, duration: 0.8 }, '-=0.6');
    }, containerRef);
    return () => ctx.revert();
  }, [isRTL]);

  const schema = z.object({
    fullName: z.string().min(3, 'error.min'),
    phone: z.string().regex(/^07\d{9}$/, 'error.phone'),
    area: z.string().min(1, 'error.required'),
    street: z.string().min(1, 'error.required'),
    house: z.string().optional()
  });

  const handleChange = (field: keyof OrderDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSubmitting(true);
    try {
      schema.parse(formData);
      const result = await submitOrder(order, formData);
      if (result.success) {
        onSuccess(result.orderId, formData);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  const product = PRODUCTS.find(p => p.id === order.productId);

  return (
    <div ref={containerRef} className="min-h-screen pt-20 md:pt-28 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Left Column: Form */}
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white mb-8 transition-colors group"
          >
            <svg className={`w-5 h-5 transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">{t('common.back')}</span>
          </button>

          <h2 className="text-3xl font-bold mb-8 uppercase tracking-tight">{t('checkout.title')}</h2>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">{t('checkout.name')}</label>
              <input type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className={`w-full bg-gray-50 dark:bg-zinc-900 border ${errors.fullName ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all`} />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{t(errors.fullName)}</p>}
            </div>
            <div className="form-group">
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">{t('checkout.phone')}</label>
              <input type="tel" placeholder="07xxxxxxxxx" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={`w-full bg-gray-50 dark:bg-zinc-900 border ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all`} />
               {errors.phone && <p className="text-red-500 text-xs mt-1">{t(errors.phone)}</p>}
            </div>
            <div className="form-group">
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">{t('checkout.area')}</label>
              <div className="relative">
                <select value={formData.area} onChange={(e) => handleChange('area', e.target.value)} className={`w-full appearance-none bg-gray-50 dark:bg-zinc-900 border ${errors.area ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all`}>
                  <option value="">{t('checkout.selectArea')}</option>
                  {BAGHDAD_AREAS.map(area => (<option key={area} value={area}>{area}</option>))}
                </select>
                <div className={`absolute inset-y-0 ${isRTL ? 'left-4' : 'right-4'} flex items-center pointer-events-none text-gray-500`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {errors.area && <p className="text-red-500 text-xs mt-1">{t(errors.area)}</p>}
            </div>
            <div className="form-group">
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">{t('checkout.address')}</label>
              <textarea value={formData.street} onChange={(e) => handleChange('street', e.target.value)} className={`w-full bg-gray-50 dark:bg-zinc-900 border ${errors.street ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-accent transition-all h-32 resize-none`} />
              {errors.street && <p className="text-red-500 text-xs mt-1">{t(errors.street)}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className={`form-group w-full bg-accent text-white py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isSubmitting ? '...' : t('checkout.submit')}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="order-summary bg-gray-50 dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 h-fit">
          <h3 className="text-xl font-bold mb-6 uppercase tracking-tight">{t('checkout.summary')}</h3>
          
          {/* Visual Preview */}
          <div className="relative aspect-square bg-white dark:bg-black rounded-2xl overflow-hidden mb-6 border border-gray-100 dark:border-zinc-800">
             <img src={product?.image} alt="Product Base" className="w-full h-full object-cover opacity-80" />
             <div className="absolute inset-0 mix-blend-multiply opacity-50" style={{ backgroundColor: order.color }}></div>
             
             {/* Render all layers */}
             {order.decals.map(layer => (
               <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <img 
                   src={layer.url} 
                   alt="Custom Print" 
                   style={{ 
                     width: `${layer.scale * 300}%`,
                     // Invert Y for 2D preview approximation and apply rotation
                     transform: `translate(${layer.position[0] * 100}px, ${-layer.position[1] * 100}px) rotate(${layer.userRotation || 0}rad)`
                   }}
                   className="object-contain"
                 />
               </div>
             ))}
          </div>

          {/* Details List */}
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-zinc-800">
              <span className="text-gray-500 dark:text-gray-400">{t('product.classic_tshirt')}</span> 
              <span className="font-bold">{t(order.productName)}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-zinc-800">
              <span className="text-gray-500 dark:text-gray-400">{t('customizer.size')}</span>
              <span className="font-bold">{order.size}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-zinc-800">
              <span className="text-gray-500 dark:text-gray-400">{t('customizer.color')}</span>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: order.color }}></span>
                <span className="font-bold uppercase">{order.color}</span>
              </div>
            </div>

            {order.decals.length > 0 && (
              <div className="flex justify-between py-3 border-b border-gray-200 dark:border-zinc-800">
                 <span className="text-gray-500 dark:text-gray-400">Designs Added</span>
                 <span className="font-bold">{order.decals.length}</span>
              </div>
            )}

            {order.notes && (
              <div className="py-3 border-b border-gray-200 dark:border-zinc-800">
                <span className="block text-gray-500 dark:text-gray-400 mb-1">{t('customizer.notes')}</span>
                <p className="font-medium italic text-gray-600 dark:text-gray-300">"{order.notes}"</p>
              </div>
            )}
            
            <div className="pt-4 flex justify-between items-center text-lg">
              <span className="font-bold">{t('checkout.total')}</span>
              <span className="font-bold text-2xl">
                {new Intl.NumberFormat('en-US').format(order.basePrice)} {t('common.price')}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
