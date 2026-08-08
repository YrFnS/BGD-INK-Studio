import { OrderDetails, PendingOrder, Product } from '@/types';

export type SubmissionStatus = 'DRAFT';

export interface SubmitOrderInput {
  designDraftId: string;
  pendingOrder: PendingOrder;
  details: OrderDetails;
}

export interface SubmitOrderResult {
  success: true;
  orderId: string;
  persistence: 'local-prototype';
  status: SubmissionStatus;
}

export interface CatalogApi {
  listProducts: (signal?: AbortSignal) => Promise<Product[]>;
}

export interface OrdersApi {
  submitOrder: (input: SubmitOrderInput, signal?: AbortSignal) => Promise<SubmitOrderResult>;
}

export interface PlatformApi {
  source: 'local-prototype';
  catalog: CatalogApi;
  orders: OrdersApi;
}

interface PlatformApiErrorOptions {
  code: string;
  message: string;
  status?: number;
  retryable?: boolean;
  cause?: unknown;
}

export class PlatformApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly retryable: boolean;

  constructor({ code, message, status, retryable = false, cause }: PlatformApiErrorOptions) {
    super(message, { cause });
    this.name = 'PlatformApiError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';
