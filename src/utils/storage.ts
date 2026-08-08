import { BRAND } from '@/config/brand';
import { PRODUCTS as INITIAL_PRODUCTS } from '@/data/products';
import { Product } from '@/types';

const LEGACY_CONFIGURATION_KEYS = [
  `${BRAND.storageNamespace}:products`,
  `${BRAND.storageNamespace}:gallery`,
  'ashus_products',
  'ashus_gallery',
] as const;
const LEGACY_RECEIPT_KEYS = [`${BRAND.storageNamespace}:orders`, 'ashus_orders'] as const;
const CLEANUP_KEY = `${BRAND.storageNamespace}:local-configuration-cleanup:v2`;

const INITIAL_GALLERY = [
  '/brand/products/classic-tshirt.svg',
  '/brand/products/oversized-tee.svg',
  '/brand/products/premium-hoodie.svg',
  '/brand/products/urban-vest.svg',
];

const getBrowserStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Browser storage is unavailable:', error);
    return null;
  }
};

const cleanLegacyConfigurationAndReceipts = (): void => {
  const storage = getBrowserStorage();
  if (!storage || storage.getItem(CLEANUP_KEY)) return;

  try {
    [...LEGACY_CONFIGURATION_KEYS, ...LEGACY_RECEIPT_KEYS].forEach((key) =>
      storage.removeItem(key),
    );
    storage.setItem(CLEANUP_KEY, new Date().toISOString());
  } catch (error) {
    console.warn('Unable to clean obsolete browser configuration:', error);
  }
};

const cloneInitialProducts = (): Product[] =>
  INITIAL_PRODUCTS.map((product) => ({
    ...product,
    colors: [...product.colors],
  }));

export const getProducts = (): Product[] => {
  cleanLegacyConfigurationAndReceipts();
  return cloneInitialProducts();
};

export const getGallery = (): string[] => {
  cleanLegacyConfigurationAndReceipts();
  return [...INITIAL_GALLERY];
};
