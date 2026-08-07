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

  const copy =
    language === 'ar'
      ? {
          statement: 'ستوديو محلي لتجهيز ومعاينة مسودات الطباعة على الملابس.',
          local: 'المسودات والتصاميم تبقى على هذا الجهاز',
          noAccount: 'بدون حساب',
          prototype: 'النسخة الحالية لا تستلم طلبات حقيقية',
          rights: 'جميع الحقوق محفوظة',
          contactPending: 'قنوات التواصل الرسمية تضاف بعد تأكيدها',
        }
      : {
          statement: 'A local studio for preparing and reviewing custom-apparel print drafts.',
          local: 'Drafts and artwork stay on this device',
          noAccount: 'No account required',
          prototype: 'The current preview does not accept real orders',
          rights: 'All rights reserved',
          contactPending: 'Official contact channels will appear after verification',
        };

  return (
    <footer className="border-t border-black/10 bg-[#111111] py-12 text-[#f4f1ea] dark:border-white/10 sm:py-16">
      <div className="mx-auto max-w-[1450px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-20">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f4f1ea] font-display text-[10px] font-black tracking-[-0.05em] text-black">
                B/I
              </span>
              <div>
                <h2 className="font-display text-xl font-black tracking-[-0.045em]">
                  {BRAND.displayName}
                </h2>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/35">
                  {getLocalizedBrandText(BRAND.location, language)}
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/52 sm:text-lg sm:leading-8">
              {copy.statement}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[copy.local, copy.noAccount, copy.prototype].map((item, index) => (
              <div
                key={item}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${index === 2 ? 'bg-accent' : 'bg-emerald-400'}`}
                />
                <span className="text-xs font-semibold leading-5 text-white/55">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          {links.length > 0 ? (
            <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Contact links">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="text-xs font-black uppercase tracking-[0.13em] text-white/42 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          ) : (
            <p className="text-xs font-semibold text-white/35">{copy.contactPending}</p>
          )}

          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/28">
            © {year} {BRAND.productName} · {copy.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};