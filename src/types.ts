export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export enum ProductType {
  TSHIRT = 'T-Shirt',
  HOODIE = 'Hoodie',
  VEST = 'Vest',
}

export enum Size {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
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

export interface DecalLayer {
  id: string;
  url: string;
  assetId?: string;
  fileName?: string;
  mimeType?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  userRotation: number;
  scale: number;
}

export interface CustomizationState {
  productId: string | null;
  size: Size;
  color: string;
  decals: DecalLayer[];
  notes: string;
}

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
  date: string;
  status: OrderStatus;
  designDraftId?: string;
}

export type ViewState = 'HOME' | 'CATALOG' | 'DESIGNS' | 'CUSTOMIZER' | 'CHECKOUT' | 'SUCCESS';

export interface AppContextType {
  language: Language;
  theme: Theme;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}
