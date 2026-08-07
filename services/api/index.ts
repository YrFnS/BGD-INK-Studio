import { localPlatformApi } from './local';

export const platformApi = localPlatformApi;

export type {
  PlatformApi,
  SubmitOrderInput,
  SubmitOrderResult,
  SubmissionStatus,
} from './types';
export { isAbortError, PlatformApiError } from './types';
