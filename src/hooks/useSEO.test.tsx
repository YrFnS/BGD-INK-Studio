import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { useSEO } from './useSEO';

const SeoHarness = ({
  titleKey,
  descriptionKey,
}: {
  titleKey: string;
  descriptionKey: string;
}) => {
  useSEO(titleKey, descriptionKey);
  return null;
};

const renderSeo = (titleKey: string, descriptionKey: string) =>
  render(
    <AppProvider>
      <SeoHarness titleKey={titleKey} descriptionKey={descriptionKey} />
    </AppProvider>,
  );

const addBuildMeta = (name: string, content: string) => {
  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.head.appendChild(meta);
};

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
  document.title = '';
  document.head
    .querySelectorAll(
      '[data-bgd-seo], meta[name="bgd:indexing"], meta[name="bgd:site-url"], link[rel="canonical"], #bgd-ink-structured-data',
    )
    .forEach((element) => element.remove());
});

describe('route-aware SEO metadata', () => {
  it('publishes canonical, social, and non-commerce product metadata for the catalog', () => {
    addBuildMeta('bgd:indexing', 'indexable');
    addBuildMeta('bgd:site-url', 'https://studio.example');
    window.history.replaceState(null, '', '/catalog');

    renderSeo('seo.catalog.title', 'seo.catalog.description');

    expect(document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toContain(
      'index,follow',
    );
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      'https://studio.example/catalog',
    );
    expect(document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content).toBe(
      'https://studio.example/catalog',
    );
    expect(document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content).toBe(
      'https://studio.example/brand/social/og-default.png',
    );
    expect(document.querySelector<HTMLMetaElement>('meta[name="twitter:card"]')?.content).toBe(
      'summary_large_image',
    );

    const structuredDataElement = document.getElementById('bgd-ink-structured-data');
    const structuredData = JSON.parse(structuredDataElement?.textContent ?? '{}') as {
      '@graph'?: Array<Record<string, unknown>>;
    };
    const itemList = structuredData['@graph']?.find((entry) => entry['@type'] === 'ItemList');

    expect(itemList).toMatchObject({ numberOfItems: 4 });
    expect(structuredDataElement?.textContent).toContain('Product');
    expect(structuredDataElement?.textContent).not.toContain('"offers"');
  });

  it('keeps browser-local draft routes out of search indexes', () => {
    addBuildMeta('bgd:indexing', 'indexable');
    addBuildMeta('bgd:site-url', 'https://studio.example');
    window.history.replaceState(null, '', '/studio/local-draft');

    renderSeo('seo.customizer.title', 'seo.customizer.description');

    expect(document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe(
      'noindex,nofollow,noarchive',
    );
    expect(document.querySelector('link[rel="canonical"]')).not.toBeInTheDocument();
    expect(document.querySelector('meta[property="og:url"]')).not.toBeInTheDocument();
    expect(document.getElementById('bgd-ink-structured-data')).not.toBeInTheDocument();
  });

  it('publishes Iraqi-Arabic locale metadata without changing the public URL', () => {
    window.localStorage.setItem('bgd-ink-language', 'ar');
    addBuildMeta('bgd:indexing', 'indexable');
    addBuildMeta('bgd:site-url', 'https://studio.example');
    window.history.replaceState(null, '', '/guide');

    renderSeo('seo.guide.title', 'seo.guide.description');

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.querySelector<HTMLMetaElement>('meta[property="og:locale"]')?.content).toBe(
      'ar_IQ',
    );
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:locale:alternate"]')?.content,
    ).toBe('en_US');
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      'https://studio.example/guide',
    );
  });
});
