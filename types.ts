
export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export enum ProductType {
  TSHIRT = 'T-Shirt',
  HOODIE = 'Hoodie',
  VEST = 'Vest'
}

export enum Size {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL'
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  basePrice: number;
  colors: string[];
  image: string;
  inStock: boolean;
}

export interface CustomizationState {
  productId: string | null;
  size: Size;
  color: string;
  decalImage: string | null; // Base64 or URL
  decalPosition: [number, number, number];
  decalRotation: [number, number, number];
  decalScale: number;
  notes: string;
}

// Data passed from Customizer to Checkout
export interface PendingOrder extends CustomizationState {
  productName: string;
  basePrice: number;
}

export interface OrderDetails {
  fullName: string;
  phone: string;
  area: string;
  street: string;
  house: string;
}

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Order extends PendingOrder, OrderDetails {
  id: string;
  date: string; // ISO String
  status: OrderStatus;
}

export type ViewState = 'HOME' | 'CATALOG' | 'CUSTOMIZER' | 'CHECKOUT' | 'SUCCESS' | 'ADMIN';

export interface AppContextType {
  language: Language;
  theme: Theme;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}
