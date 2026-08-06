import { Language } from '../types';

export type LocalizedText = Record<Language, string>;

export const BRAND = {
  id: 'bgd-ink',
  name: 'BGD INK',
  displayName: 'BGD/INK',
  productName: 'BGD/INK Studio',
  repositoryName: 'bgd-ink-studio',
  orderPrefix: 'BGD',
  storageNamespace: 'bgd_ink',
  legacyNames: ['ASHUS', 'اشوز'] as const,
  location: {
    en: 'Baghdad, Iraq',
    ar: 'بغداد، العراق',
  } satisfies LocalizedText,
  tagline: {
    en: 'Design it. Wear it.',
    ar: 'صمّمها والبسها',
  } satisfies LocalizedText,
  description: {
    en: 'Design and preview custom-printed apparel in Baghdad.',
    ar: 'صمّم وعاين ملابسك بطباعة مخصصة في بغداد.',
  } satisfies LocalizedText,
  contact: {
    instagramUrl: '' as string,
    whatsappNumber: '' as string,
    email: '' as string,
  },
} as const;

export const getLocalizedBrandText = (
  text: LocalizedText,
  language: Language,
): string => text[language];

export const getConfiguredWhatsAppNumber = (): string | null => {
  const normalized = BRAND.contact.whatsappNumber.replace(/\D/g, '');
  return normalized.length >= 10 ? normalized : null;
};
