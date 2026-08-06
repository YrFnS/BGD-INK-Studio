import { z } from 'zod';
import { ProductType } from '../../types';
import { PlatformApi, PlatformApiError, SubmitOrderInput } from './types';

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(ProductType),
  basePrice: z.number().nonnegative(),
  colors: z.array(z.string().min(1)),
  image: z.string().min(1),
  inStock: z.boolean(),
});

const productListSchema = z.array(productSchema);
const orderResponseSchema = z.object({
  order_id: z.string().min(1),
  status: z.enum(['DRAFT', 'PENDING']).default('PENDING'),
});

const unwrapFrappeMessage = (payload: unknown): unknown => {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    return (payload as { message: unknown }).message;
  }

  return payload;
};

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') return fallback;

  const candidate = payload as Record<string, unknown>;
  for (const key of ['message', 'exception', 'exc_type']) {
    if (typeof candidate[key] === 'string' && candidate[key]) {
      return candidate[key];
    }
  }

  return fallback;
};

const parseJson = (value: string): unknown => {
  if (!value) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const buildUrl = (baseUrl: string, path: string): string => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  if (!normalizedBaseUrl) {
    throw new PlatformApiError({
      code: 'API_BASE_URL_MISSING',
      message: 'The Frappe API base URL is not configured.',
    });
  }

  return new URL(path, `${normalizedBaseUrl}/`).toString();
};

const request = async <Schema extends z.ZodTypeAny>(
  baseUrl: string,
  path: string,
  schema: Schema,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<z.infer<Schema>> => {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(baseUrl, path), {
      ...init,
      headers,
      signal,
      credentials: 'include',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;

    throw new PlatformApiError({
      code: 'NETWORK_ERROR',
      message: 'The platform could not reach the Frappe server.',
      retryable: true,
      cause: error,
    });
  }

  const payload = parseJson(await response.text());
  if (!response.ok) {
    throw new PlatformApiError({
      code: `HTTP_${response.status}`,
      message: extractErrorMessage(payload, 'The Frappe request failed.'),
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  const parsed = schema.safeParse(unwrapFrappeMessage(payload));
  if (!parsed.success) {
    throw new PlatformApiError({
      code: 'INVALID_API_RESPONSE',
      message: 'The Frappe server returned data in an unexpected format.',
      cause: parsed.error,
    });
  }

  return parsed.data;
};

const assertArtworkIsDurable = ({ pendingOrder }: SubmitOrderInput): void => {
  const hasTemporaryArtwork = pendingOrder.decals.some((layer) => layer.url.startsWith('blob:'));
  if (hasTemporaryArtwork) {
    throw new PlatformApiError({
      code: 'ARTWORK_NOT_UPLOADED',
      message: 'Artwork must be uploaded to durable storage before creating a real order.',
    });
  }
};

export const createFrappePlatformApi = (baseUrl: string): PlatformApi => ({
  source: 'frappe',
  catalog: {
    listProducts: (signal) =>
      request(
        baseUrl,
        '/api/method/bgd_ink.api.catalog.list_products',
        productListSchema,
        { method: 'GET' },
        signal,
      ),
  },
  orders: {
    submitOrder: async (input, signal) => {
      assertArtworkIsDurable(input);

      const result = await request(
        baseUrl,
        '/api/method/bgd_ink.api.orders.create',
        orderResponseSchema,
        {
          method: 'POST',
          body: JSON.stringify({
            pending_order: input.pendingOrder,
            customer: input.details,
          }),
        },
        signal,
      );

      return {
        success: true,
        orderId: result.order_id,
        persistence: 'frappe',
        status: result.status,
      };
    },
  },
});
