import { BRAND, getLocalizedBrandText } from '@/config/brand';
import { PRODUCTS } from '@/data/products';
import { getProductPresentation } from '@/data/storefront';
import type { Language } from '@/types';

export const DEFAULT_SOCIAL_IMAGE_PATH = '/brand/social/og-default.png';
export const PUBLIC_INDEXABLE_PATHS = ['/', '/catalog', '/guide'] as const;

export type PublicIndexablePath = (typeof PUBLIC_INDEXABLE_PATHS)[number];

type Translate = (key: string) => string;
type StructuredData = Record<string, unknown>;

interface StructuredDataOptions {
  path: string;
  language: Language;
  title: string;
  description: string;
  translate: Translate;
}

const normalizePath = (pathname: string): string => {
  const withoutTrailingSlash = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return withoutTrailingSlash || '/';
};

const normalizeSiteUrl = (candidate: string | null | undefined): string | null => {
  const value = candidate?.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

const readMetaContent = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? null;
};

export const getPublicSiteUrl = (): string => {
  const configured = normalizeSiteUrl(import.meta.env.VITE_PUBLIC_SITE_URL);
  if (configured) return configured;

  const buildInjected = normalizeSiteUrl(readMetaContent('bgd:site-url'));
  if (buildInjected) return buildInjected;

  if (typeof window !== 'undefined') {
    const currentOrigin = normalizeSiteUrl(window.location.origin);
    if (currentOrigin) return currentOrigin;
  }

  return 'https://bgd-ink.example';
};

export const isIndexableBuild = (): boolean => {
  if (import.meta.env.VITE_INDEXABLE_BUILD === 'true') return true;
  return readMetaContent('bgd:indexing') === 'indexable';
};

export const isPublicIndexablePath = (pathname: string): pathname is PublicIndexablePath =>
  PUBLIC_INDEXABLE_PATHS.includes(normalizePath(pathname) as PublicIndexablePath);

export const createAbsoluteSiteUrl = (pathname: string): string =>
  new URL(pathname, `${getPublicSiteUrl()}/`).toString();

export const getCanonicalUrl = (pathname: string): string | null => {
  const normalized = normalizePath(pathname);
  return isPublicIndexablePath(normalized) ? createAbsoluteSiteUrl(normalized) : null;
};

const getLanguageTag = (language: Language): string => (language === 'ar' ? 'ar-IQ' : 'en');

const getEditorStatus = (productId: string, language: Language): string => {
  const isReady = productId === 'tshirt-classic';
  if (language === 'ar') return isReady ? 'المحرر الكامل متاح' : 'الموديل قيد التجهيز';
  return isReady ? 'Complete editor available' : 'Matching 3D model pending';
};

export const buildRouteStructuredData = ({
  path,
  language,
  title,
  description,
  translate,
}: StructuredDataOptions): StructuredData | null => {
  const normalizedPath = normalizePath(path);
  if (!isPublicIndexablePath(normalizedPath)) return null;

  const siteUrl = getPublicSiteUrl();
  const canonicalUrl = createAbsoluteSiteUrl(normalizedPath);
  const languageTag = getLanguageTag(language);
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const pageId = `${canonicalUrl}#webpage`;

  const organization: StructuredData = {
    '@type': 'Organization',
    '@id': organizationId,
    name: BRAND.displayName,
    alternateName: BRAND.name,
    url: createAbsoluteSiteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: createAbsoluteSiteUrl('/brand/app/icon-512.png'),
      width: 512,
      height: 512,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: getLocalizedBrandText(BRAND.location, language),
    },
  };

  const website: StructuredData = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: createAbsoluteSiteUrl('/'),
    name: BRAND.productName,
    alternateName: BRAND.displayName,
    description: getLocalizedBrandText(BRAND.description, language),
    publisher: { '@id': organizationId },
    inLanguage: languageTag,
  };

  const page: StructuredData = {
    '@type': normalizedPath === '/catalog' ? 'CollectionPage' : 'WebPage',
    '@id': pageId,
    url: canonicalUrl,
    name: title,
    description,
    isPartOf: { '@id': websiteId },
    about: { '@id': organizationId },
    inLanguage: languageTag,
  };

  const graph: StructuredData[] = [organization, website, page];

  if (normalizedPath === '/') {
    graph.push({
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#application`,
      name: BRAND.productName,
      url: createAbsoluteSiteUrl('/'),
      description,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any',
      browserRequirements: 'JavaScript and IndexedDB; WebGL is used for the full 3D preview.',
      isAccessibleForFree: true,
      inLanguage: ['en', 'ar-IQ'],
      publisher: { '@id': organizationId },
      featureList:
        language === 'ar'
          ? [
              'معاينة ملابس ثلاثية الأبعاد حسب الموديل المتاح',
              'قياسات تصميم بالسنتيمتر وتحليل جودة الصورة',
              'حفظ مسودات وملفات التصميم على نفس الجهاز',
              'تصدير إثبات PNG ومواصفات JSON محلية',
            ]
          : [
              'Model-aware 3D apparel preview',
              'Centimeter artwork sizing and image-quality analysis',
              'Browser-local drafts and retained artwork files',
              'Local PNG proof and JSON specification exports',
            ],
    });
  }

  if (normalizedPath === '/catalog') {
    const itemListId = `${canonicalUrl}#garments`;
    graph.push({
      '@type': 'ItemList',
      '@id': itemListId,
      name: language === 'ar' ? 'قطع BGD/INK المحلية' : 'BGD/INK local garments',
      numberOfItems: PRODUCTS.length,
      itemListElement: PRODUCTS.map((product, index) => {
        const presentation = getProductPresentation(product.id);
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            '@id': `${canonicalUrl}#${product.id}`,
            name: translate(product.name),
            description: getLocalizedBrandText(presentation.description, language),
            image: [createAbsoluteSiteUrl(product.image)],
            sku: product.id,
            category: product.type,
            color: product.colors,
            brand: { '@id': organizationId },
            itemCondition: 'https://schema.org/NewCondition',
            additionalProperty: [
              {
                '@type': 'PropertyValue',
                name: language === 'ar' ? 'حالة المحرر' : 'Editor status',
                value: getEditorStatus(product.id, language),
              },
            ],
          },
        };
      }),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
};
