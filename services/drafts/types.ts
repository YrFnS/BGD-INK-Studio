import { DecalLayer, OrderDetails, Size } from '../../types';

export const DESIGN_DRAFT_VERSION = 1 as const;

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
  assetId: string;
  fileName: string;
  mimeType: string;
  position: [number, number, number];
  rotation: [number, number, number];
  userRotation: number;
  scale: number;
}

export interface DesignDraftRecord {
  version: typeof DESIGN_DRAFT_VERSION;
  id: string;
  productId: string;
  color: string;
  size: Size;
  notes: string;
  activeDecalId: string | null;
  decals: StoredDecalLayer[];
  checkoutDetails: OrderDetails;
  submittedOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HydratedDesignDraft
  extends Omit<DesignDraftRecord, 'decals'> {
  decals: DecalLayer[];
  missingAssetCount: number;
}

export interface CreateDesignDraftInput {
  productId: string;
  color: string;
  size?: Size;
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
