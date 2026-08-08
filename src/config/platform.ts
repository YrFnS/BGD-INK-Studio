import { Language } from '@/types';
import { BRAND } from './brand';
import { LocalizedText } from './brand';

export const PLATFORM_STATUS = {
  phase: 'prototype',
  localOrderStorageEnabled: true,
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
    en: `This draft is stored only on this device. It is not a confirmed order and has not been sent to ${BRAND.displayName}.`,
    ar: `هذه المسودة محفوظة على هذا الجهاز فقط. ليست طلباً مؤكداً ولم تُرسل إلى ${BRAND.displayName}.`,
  } satisfies LocalizedText,
  draftIdLabel: {
    en: 'Draft ID',
    ar: 'رقم المسودة',
  } satisfies LocalizedText,
} as const;

export const getPlatformText = (text: LocalizedText, language: Language): string => text[language];
