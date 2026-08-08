import { localPlatformApi } from './local';

export const platformApi = localPlatformApi;

export type {
  CatalogApi,
  PlatformApi,
  SubmitOrderInput,
  SubmitOrderResult,
  SubmissionStatus,
} from './types';
export { isAbortError, PlatformApiError } from './types';
