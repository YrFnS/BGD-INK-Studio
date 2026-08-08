import { Product, ProductType } from '@/types';

export const PRODUCTS: Product[] = [
  {
    id: 'tshirt-classic',
    name: 'product.classic_tshirt',
    type: ProductType.TSHIRT,
    basePrice: 15000,
    colors: ['#000000', '#FFFFFF', '#1F1F1F'],
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    inStock: true,
  },
  {
    id: 'hoodie-premium',
    name: 'product.premium_hoodie',
    type: ProductType.HOODIE,
    basePrice: 25000,
    colors: ['#000000', '#FFFFFF', '#333333'],
    image:
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    inStock: true,
  },
  {
    id: 'tee-oversized',
    name: 'product.oversized_tee',
    type: ProductType.TSHIRT,
    basePrice: 18000,
    colors: ['#000000', '#FFFFFF'],
    image:
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    inStock: true,
  },
  {
    id: 'vest-urban',
    name: 'product.urban_vest',
    type: ProductType.VEST,
    basePrice: 20000,
    colors: ['#000000'],
    image:
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    inStock: false,
  },
];
