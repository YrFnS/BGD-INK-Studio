import { useEffect } from 'react';
import { BRAND } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';

const applyBrandTokens = (value: string): string => {
  const brandedValue = value
    .replaceAll('{{brand}}', BRAND.displayName)
    .replaceAll('{{product}}', BRAND.productName);

  return BRAND.legacyNames.reduce(
    (result, legacyName) => result.replaceAll(legacyName, BRAND.displayName),
    brandedValue,
  );
};

export const useSEO = (titleKey: string, descriptionKey: string) => {
  const { t } = useAppContext();
  const title = applyBrandTokens(t(titleKey));
  const description = applyBrandTokens(t(descriptionKey));

  useEffect(() => {
    document.title = title;

    let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
  }, [description, title]);
};
