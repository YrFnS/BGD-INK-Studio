import { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

export const useSEO = (titleKey: string, descKey: string) => {
  const { t } = useAppContext();

  useEffect(() => {
    // Update Title
    document.title = t(titleKey);

    // Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', t(descKey));
    } else {
      // Create if missing (fallback)
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = t(descKey);
      document.head.appendChild(meta);
    }
  }, [t, titleKey, descKey]);
};