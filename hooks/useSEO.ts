import { useEffect } from 'react';
import { BRAND } from '../config/brand';
import { useAppContext } from '../contexts/AppContext';

const applyCurrentBrand = (value: string): string =>
  BRAND.legacyNames.reduce(
    (result, legacyName) => result.replaceAll(legacyName, BRAND.displayName),
    value,
  );

export const useSEO = (titleKey: string, descriptionKey: string) => {
  const { t } = useAppContext();
  const title = applyCurrentBrand(t(titleKey));
  const description = applyCurrentBrand(t(descriptionKey));

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
