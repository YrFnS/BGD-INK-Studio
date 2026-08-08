import { DecalLayer, OrderDetails, PrintSurfaceId, Size } from '@/types';

export const DESIGN_DRAFT_VERSION = 5 as const;

export interface StoredArtworkAsset {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  byteSize: number;
  lastModified: number;
  createdAt: string;
}

export interface StoredDecalLayer {
  id: string;
  name: string;
  visible: boolean;
  assetId: string;
  fileName: string;
  mimeType: string;
  surfaceId: PrintSurfaceId;
  position: [number, number, number];
  rotation: [number, number, number];
  userRotation: number;
  scale: number;
  pixelWidth?: number;
  pixelHeight?: number;
  aspectRatio?: number;
  hasTransparency?: boolean;
  transparentPixelRatio?: number;
  transparentPaddingRatio?: number;
}

export interface DesignDraftRecord {
  version: typeof DESIGN_DRAFT_VERSION;
  id: string;
  name: string;
  productId: string;
  color: string;
  size: Size;
  quantity: number;
  notes: string;
  activeDecalId: string | null;
  decals: StoredDecalLayer[];
  assetIds: string[];
  checkoutDetails: OrderDetails;
  submittedOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HydratedDesignDraft extends Omit<DesignDraftRecord, 'decals'> {
  decals: DecalLayer[];
  missingAssetCount: number;
}

export interface DesignDraftSummary {
  id: string;
  name: string;
  productId: string;
  color: string;
  size: Size;
  quantity: number;
  layerCount: number;
  previewUrl: string | null;
  submittedOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignDraftInput {
  productId: string;
  color: string;
  size?: Size;
  quantity?: number;
}

export interface DesignDraftSnapshot {
  color: string;
  size: Size;
  notes: string;
  activeDecalId: string | null;
  decals: DecalLayer[];
}

export type DraftLoadStatus = 'loading' | 'ready' | 'missing' | 'error';
export type DraftSaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

export class DraftStorageError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DraftStorageError';
    this.code = code;
  }
}
