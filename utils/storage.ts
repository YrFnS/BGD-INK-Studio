import { BRAND } from '../config/brand';
import { PLATFORM_STATUS } from '../config/platform';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import { Order, Product } from '../types';

const KEYS = {
  orders: `${BRAND.storageNamespace}:orders`,
  products: `${BRAND.storageNamespace}:products`,
  gallery: `${BRAND.storageNamespace}:gallery`,
  migration: `${BRAND.storageNamespace}:migration:v1`,
} as const;

const LEGACY_KEYS = {
  orders: 'ashus_orders',
  products: 'ashus_products',
  gallery: 'ashus_gallery',
} as const;

const INITIAL_GALLERY = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1503342394128-c104d54dba01?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
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

const migrateLegacyStorage = (storage: Storage) => {
  if (storage.getItem(KEYS.migration)) return;

  (Object.keys(LEGACY_KEYS) as Array<keyof typeof LEGACY_KEYS>).forEach((name) => {
    const nextKey = KEYS[name];
    const legacyValue = storage.getItem(LEGACY_KEYS[name]);

    if (!storage.getItem(nextKey) && legacyValue) {
      storage.setItem(nextKey, legacyValue);
    }
  });

  storage.setItem(KEYS.migration, new Date().toISOString());
};

const readJson = <T>(key: string, fallback: T): T => {
  const storage = getBrowserStorage();
  if (!storage) return fallback;

  try {
    migrateLegacyStorage(storage);
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch (error) {
    console.warn(`Unable to read browser data for ${key}:`, error);
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): boolean => {
  const storage = getBrowserStorage();
  if (!storage) return false;

  try {
    migrateLegacyStorage(storage);
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to save browser data for ${key}:`, error);
    return false;
  }
};

const cloneInitialProducts = (): Product[] =>
  INITIAL_PRODUCTS.map((product) => ({
    ...product,
    colors: [...product.colors],
  }));

export const getProducts = (): Product[] => {
  const fallback = cloneInitialProducts();
  const products = readJson<Product[]>(KEYS.products, fallback);

  if (products === fallback) {
    writeJson(KEYS.products, fallback);
  }

  return products;
};

export const getGallery = (): string[] => {
  const fallback = [...INITIAL_GALLERY];
  const gallery = readJson<string[]>(KEYS.gallery, fallback);

  if (gallery === fallback) {
    writeJson(KEYS.gallery, fallback);
  }

  return gallery;
};

export const getOrders = (): Order[] => readJson<Order[]>(KEYS.orders, []);

export const saveOrder = (order: Order): boolean => {
  if (!PLATFORM_STATUS.localOrderStorageEnabled) return false;

  const orders = getOrders();
  return writeJson(KEYS.orders, [order, ...orders]);
};
