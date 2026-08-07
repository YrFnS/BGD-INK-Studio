import React from 'react';
import { BRAND, getConfiguredWhatsAppNumber, getLocalizedBrandText } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';

interface ContactLink {
  label: string;
  href: string;
}

export const Footer: React.FC = () => {
  const { language } = useAppContext();
  const year = new Date().getFullYear();
  const whatsappNumber = getConfiguredWhatsAppNumber();

  const links: ContactLink[] = [
    BRAND.contact.instagramUrl ? { label: 'Instagram', href: BRAND.contact.instagramUrl } : null,
    whatsappNumber ? { label: 'WhatsApp', href: `https://wa.me/${whatsappNumber}` } : null,
    BRAND.contact.email ? { label: 'Email', href: `mailto:${BRAND.contact.email}` } : null,
  ].filter((link): link is ContactLink => Boolean(link));

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-colors duration-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-start">
            <h2 className="text-2xl font-bold tracking-tighter text-black dark:text-white font-display">
              {BRAND.displayName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getLocalizedBrandText(BRAND.tagline, language)} ·{' '}
              {getLocalizedBrandText(BRAND.location, language)}
            </p>
          </div>

          {links.length > 0 && (
            <nav className="flex gap-6" aria-label="Contact links">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-900 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            &copy; {year} {BRAND.productName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
