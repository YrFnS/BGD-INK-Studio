import { PLATFORM_RUNTIME } from '../../config/platform';
import { createFrappePlatformApi } from './frappe';
import { localPlatformApi } from './local';
import { PlatformApi } from './types';

const createPlatformApi = (): PlatformApi => {
  if (PLATFORM_RUNTIME.dataSource === 'frappe') {
    return createFrappePlatformApi(PLATFORM_RUNTIME.apiBaseUrl);
  }

  if (PLATFORM_RUNTIME.configurationWarning && import.meta.env.DEV) {
    console.warn(PLATFORM_RUNTIME.configurationWarning);
  }

  return localPlatformApi;
};

export const platformApi = createPlatformApi();
export type {
  PlatformApi,
  PlatformDataSource,
  SubmitOrderInput,
  SubmitOrderResult,
  SubmissionStatus,
} from './types';
export { isAbortError, PlatformApiError } from './types';
