import { useEffect } from 'react';
import { BRAND } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';
import {
  DEFAULT_SOCIAL_IMAGE_PATH,
  buildRouteStructuredData,
  createAbsoluteSiteUrl,
  getCanonicalUrl,
  isIndexableBuild,
  isPublicIndexablePath,
} from '@/utils/seo';

const SEO_MARKER = 'data-bgd-seo';
const STRUCTURED_DATA_ID = 'bgd-ink-structured-data';

const applyBrandTokens = (value: string): string => {
  const brandedValue = value
    .replaceAll('{{brand}}', BRAND.displayName)
    .replaceAll('{{product}}', BRAND.productName);

  return BRAND.legacyNames.reduce(
    (result, legacyName) => result.replaceAll(legacyName, BRAND.displayName),
    brandedValue,
  );
};

const upsertMeta = (
  attribute: 'name' | 'property',
  key: string,
  content: string,
): HTMLMetaElement => {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
  element.setAttribute(SEO_MARKER, 'true');
  return element;
};

const removeMeta = (attribute: 'name' | 'property', key: string): void => {
  document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)?.remove();
};

const upsertCanonical = (href: string): void => {
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }

  canonical.href = href;
  canonical.setAttribute(SEO_MARKER, 'true');
};

const removeCanonical = (): void => {
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.remove();
};

export const useSEO = (titleKey: string, descriptionKey: string) => {
  const { t, language } = useAppContext();
  const title = applyBrandTokens(t(titleKey));
  const description = applyBrandTokens(t(descriptionKey));

  useEffect(() => {
    const pathname = window.location.pathname;
    const isPublicRoute = isPublicIndexablePath(pathname);
    const isIndexable = isPublicRoute && isIndexableBuild();
    const canonicalUrl = getCanonicalUrl(pathname);
    const socialImageUrl = createAbsoluteSiteUrl(DEFAULT_SOCIAL_IMAGE_PATH);
    const locale = language === 'ar' ? 'ar_IQ' : 'en_US';
    const alternateLocale = language === 'ar' ? 'en_US' : 'ar_IQ';
    const robots = isIndexable
      ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      : 'noindex,nofollow,noarchive';

    document.title = title;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'application-name', BRAND.productName);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'googlebot', robots);

    upsertMeta('property', 'og:site_name', BRAND.productName);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', socialImageUrl);
    upsertMeta('property', 'og:image:alt', `${BRAND.productName} — ${BRAND.tagline.en}`);
    upsertMeta('property', 'og:locale', locale);
    upsertMeta('property', 'og:locale:alternate', alternateLocale);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', socialImageUrl);
    upsertMeta('name', 'twitter:image:alt', `${BRAND.productName} — ${BRAND.tagline.en}`);

    if (canonicalUrl) {
      upsertCanonical(canonicalUrl);
      upsertMeta('property', 'og:url', canonicalUrl);
    } else {
      removeCanonical();
      removeMeta('property', 'og:url');
    }

    const structuredData = buildRouteStructuredData({
      path: pathname,
      language,
      title,
      description,
      translate: t,
    });
    let structuredDataElement = document.getElementById(STRUCTURED_DATA_ID);

    if (structuredData) {
      if (!(structuredDataElement instanceof HTMLScriptElement)) {
        structuredDataElement?.remove();
        structuredDataElement = document.createElement('script');
        structuredDataElement.id = STRUCTURED_DATA_ID;
        structuredDataElement.type = 'application/ld+json';
        structuredDataElement.setAttribute(SEO_MARKER, 'true');
        document.head.appendChild(structuredDataElement);
      }
      structuredDataElement.textContent = JSON.stringify(structuredData);
    } else {
      structuredDataElement?.remove();
    }
  }, [description, language, t, title]);
};
