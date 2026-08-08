import { Product, ProductType } from '@/types';

export const PRODUCTS: Product[] = [
  {
    id: 'tshirt-classic',
    name: 'product.classic_tshirt',
    type: ProductType.TSHIRT,
    basePrice: 15000,
    colors: ['#000000', '#FFFFFF', '#1F1F1F'],
    image: '/brand/products/classic-tshirt.svg',
    inStock: true,
  },
  {
    id: 'hoodie-premium',
    name: 'product.premium_hoodie',
    type: ProductType.HOODIE,
    basePrice: 25000,
    colors: ['#000000', '#FFFFFF', '#333333'],
    image: '/brand/products/premium-hoodie.svg',
    inStock: true,
  },
  {
    id: 'tee-oversized',
    name: 'product.oversized_tee',
    type: ProductType.TSHIRT,
    basePrice: 18000,
    colors: ['#000000', '#FFFFFF'],
    image: '/brand/products/oversized-tee.svg',
    inStock: true,
  },
  {
    id: 'vest-urban',
    name: 'product.urban_vest',
    type: ProductType.VEST,
    basePrice: 20000,
    colors: ['#000000'],
    image: '/brand/products/urban-vest.svg',
    inStock: false,
  },
];
