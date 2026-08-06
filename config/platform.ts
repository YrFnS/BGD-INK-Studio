import { Language } from '../types';
import { LocalizedText } from './brand';

const requestedDataSource = import.meta.env.VITE_PLATFORM_DATA_SOURCE?.trim().toLowerCase();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const frappeRequested = requestedDataSource === 'frappe';
const frappeConfigured = frappeRequested && apiBaseUrl.length > 0;

export const PLATFORM_RUNTIME = {
  requestedDataSource: frappeRequested ? 'frappe' : 'local-prototype',
  dataSource: frappeConfigured ? 'frappe' : 'local-prototype',
  apiBaseUrl,
  configurationWarning:
    frappeRequested && !frappeConfigured
      ? 'VITE_API_BASE_URL is required when VITE_PLATFORM_DATA_SOURCE is set to frappe.'
      : null,
} as const;

export const PLATFORM_STATUS = {
  phase: PLATFORM_RUNTIME.dataSource === 'frappe' ? 'integration' : 'prototype',
  backendConnected: PLATFORM_RUNTIME.dataSource === 'frappe',
  localOrderStorageEnabled: PLATFORM_RUNTIME.dataSource === 'local-prototype',
  adminPortalEnabled: false,
  pwaEnabled: false,
  notice: {
    en: 'Preview mode — drafts stay in this browser and are not sent to the studio yet.',
    ar: 'نسخة تجريبية — المسودات تبقى بهذا المتصفح ولا تُرسل إلى المتجر حالياً.',
  } satisfies LocalizedText,
  savedDraftTitle: {
    en: 'Design draft saved',
    ar: 'تم حفظ مسودة التصميم',
  } satisfies LocalizedText,
  savedDraftMessage: {
    en: 'This draft is stored only on this device. It is not a confirmed order and has not been sent to BGD/INK.',
    ar: 'هذه المسودة محفوظة على هذا الجهاز فقط. ليست طلباً مؤكداً ولم تُرسل إلى BGD/INK.',
  } satisfies LocalizedText,
  draftIdLabel: {
    en: 'Draft ID',
    ar: 'رقم المسودة',
  } satisfies LocalizedText,
} as const;

export const getPlatformText = (
  text: LocalizedText,
  language: Language,
): string => text[language];
