
import { Order, Product, ProductType } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';

const KEYS = {
  ORDERS: 'ashus_orders',
  PRODUCTS: 'ashus_products',
  GALLERY: 'ashus_gallery',
};

// Initial Gallery Data
const INITIAL_GALLERY = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1503342394128-c104d54dba01?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
];

// --- PRODUCTS ---
export const getProducts = (): Product[] => {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  const stored = localStorage.getItem(KEYS.PRODUCTS);
  if (!stored) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(stored);
};

export const toggleProductStock = (id: string): Product[] => {
  const products = getProducts();
  const updated = products.map(p => 
    p.id === id ? { ...p, inStock: !p.inStock } : p
  );
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updated));
  return updated;
};

// --- ORDERS ---
export const getOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(KEYS.ORDERS);
  return stored ? JSON.parse(stored) : [];
};

export const saveOrder = (order: Order) => {
  const orders = getOrders();
  // Add new order to beginning of list
  const updated = [order, ...orders];
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(updated));
};

export const updateOrderStatus = (id: string, status: Order['status']): Order[] => {
  const orders = getOrders();
  const updated = orders.map(o => o.id === id ? { ...o, status } : o);
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(updated));
  return updated;
};

// --- GALLERY ---
export const getGallery = (): string[] => {
  if (typeof window === 'undefined') return INITIAL_GALLERY;
  const stored = localStorage.getItem(KEYS.GALLERY);
  if (!stored) {
    localStorage.setItem(KEYS.GALLERY, JSON.stringify(INITIAL_GALLERY));
    return INITIAL_GALLERY;
  }
  return JSON.parse(stored);
};

export const addToGallery = (url: string): string[] => {
  const gallery = getGallery();
  const updated = [url, ...gallery];
  localStorage.setItem(KEYS.GALLERY, JSON.stringify(updated));
  return updated;
};

export const removeFromGallery = (index: number): string[] => {
  const gallery = getGallery();
  const updated = gallery.filter((_, i) => i !== index);
  localStorage.setItem(KEYS.GALLERY, JSON.stringify(updated));
  return updated;
};
