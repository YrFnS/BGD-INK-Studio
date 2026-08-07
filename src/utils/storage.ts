import { BRAND } from '@/config/brand';
import { PLATFORM_STATUS } from '@/config/platform';
import { PRODUCTS as INITIAL_PRODUCTS } from '@/data/products';
import { Order, Product } from '@/types';

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

const normalizeStoredProducts = (storedProducts: Product[]): Product[] =>
  INITIAL_PRODUCTS.map((canonical) => {
    const stored = storedProducts.find((candidate) => candidate.id === canonical.id);
    const storedColors = Array.isArray(stored?.colors)
      ? stored.colors.filter((color): color is string => typeof color === 'string' && color.length > 0)
      : [];
    const storedPrice =
      typeof stored?.basePrice === 'number' && Number.isFinite(stored.basePrice) && stored.basePrice >= 0
        ? stored.basePrice
        : canonical.basePrice;

    return {
      ...canonical,
      basePrice: storedPrice,
      colors: storedColors.length > 0 ? storedColors : [...canonical.colors],
      inStock: typeof stored?.inStock === 'boolean' ? stored.inStock : canonical.inStock,
      // Identity, product type, and customer-facing artwork remain canonical so legacy
      // stock-photo URLs cannot return after the P3 owned-asset migration.
      name: canonical.name,
      type: canonical.type,
      image: canonical.image,
    };
  });

export const getProducts = (): Product[] => {
  const fallback = cloneInitialProducts();
  const stored = readJson<Product[]>(KEYS.products, fallback);
  const normalized = normalizeStoredProducts(Array.isArray(stored) ? stored : fallback);

  if (JSON.stringify(stored) !== JSON.stringify(normalized)) {
    writeJson(KEYS.products, normalized);
  }

  return normalized;
};

const normalizeGallery = (gallery: string[]): string[] => {
  const normalized = gallery
    .filter((item): item is string => typeof item === 'string' && item.length > 0)
    .map((item, index) =>
      /images\.unsplash\.com/i.test(item) ? INITIAL_GALLERY[index % INITIAL_GALLERY.length] : item,
    );

  return normalized.length > 0 ? normalized : [...INITIAL_GALLERY];
};

export const getGallery = (): string[] => {
  const fallback = [...INITIAL_GALLERY];
  const stored = readJson<string[]>(KEYS.gallery, fallback);
  const normalized = normalizeGallery(Array.isArray(stored) ? stored : fallback);

  if (JSON.stringify(stored) !== JSON.stringify(normalized)) {
    writeJson(KEYS.gallery, normalized);
  }

  return normalized;
};

export const getOrders = (): Order[] => readJson<Order[]>(KEYS.orders, []);

export const saveOrder = (order: Order): boolean => {
  if (!PLATFORM_STATUS.localOrderStorageEnabled) return false;

  const orders = getOrders();
  return writeJson(KEYS.orders, [order, ...orders]);
};