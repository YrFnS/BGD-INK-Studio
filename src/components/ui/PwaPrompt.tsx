import React, { useEffect, useState } from 'react';
import { BRAND } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';
import {
  PWA_UPDATE_EVENT,
  applyServiceWorkerUpdate,
  type PwaUpdateEventDetail,
} from '@/pwa/registerServiceWorker';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

const INSTALL_DISMISSED_KEY = 'bgd-ink-install-dismissed';

export const PwaPrompt: React.FC = () => {
  const { language } = useAppContext();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateRegistration, setUpdateRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (window.sessionStorage.getItem(INSTALL_DISMISSED_KEY) === 'true') return;
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      window.sessionStorage.removeItem(INSTALL_DISMISSED_KEY);
    };

    const handleUpdateAvailable = (event: Event) => {
      const updateEvent = event as CustomEvent<PwaUpdateEventDetail>;
      setUpdateRegistration(updateEvent.detail.registration);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener(PWA_UPDATE_EVENT, handleUpdateAvailable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener(PWA_UPDATE_EVENT, handleUpdateAvailable);
    };
  }, []);

  const mode = updateRegistration ? 'update' : installPrompt ? 'install' : null;
  if (!mode) return null;

  const copy =
    language === 'ar'
      ? mode === 'update'
        ? {
            eyebrow: 'تحديث الستوديو',
            title: 'نسخة أحدث جاهزة.',
            description:
              'حدّث بعد ما تخلص من أي تعديل مفتوح. المسودات المحلية تبقى محفوظة على هذا الجهاز.',
            action: 'حدّث هسه',
            dismiss: 'بعدين',
          }
        : {
            eyebrow: 'ثبّت الستوديو',
            title: 'خلي الستوديو قريب منك.',
            description:
              'ثبّت اختصار واحفظ الواجهة الخفيفة للفتح الأسرع. تصاميمك تبقى داخل هذا المتصفح فقط.',
            action: 'ثبّت التطبيق',
            dismiss: 'مو هسه',
          }
      : mode === 'update'
        ? {
            eyebrow: 'Studio update',
            title: 'A newer build is ready.',
            description:
              'Refresh after finishing any active edit. Browser-local drafts remain on this device.',
            action: 'Update now',
            dismiss: 'Later',
          }
        : {
            eyebrow: 'Install the Studio',
            title: 'Keep the Studio close.',
            description:
              'Install a shortcut and cache the lightweight shell for faster access. Designs still remain only in this browser.',
            action: 'Install app',
            dismiss: 'Not now',
          };

  const handlePrimaryAction = async () => {
    if (updateRegistration) {
      applyServiceWorkerUpdate(updateRegistration);
      return;
    }

    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'dismissed') {
      window.sessionStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    }
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    if (mode === 'install') {
      window.sessionStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
      setInstallPrompt(null);
    } else {
      setUpdateRegistration(null);
    }
  };

  return (
    <aside
      className="fixed inset-x-3 z-50 mx-auto max-w-lg rounded-3xl border border-black/10 bg-paper p-4 text-ink shadow-2xl dark:border-white/10 dark:bg-surface dark:text-primary sm:inset-x-6 sm:p-5"
      style={{ bottom: 'max(0.75rem, calc(0.5rem + var(--safe-area-bottom)))' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-display text-xs font-black text-white dark:bg-paper dark:text-black"
          dir="ltr"
          aria-hidden="true"
        >
          B/I
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-accent">{copy.eyebrow}</p>
          <h2 className="mt-1 text-lg font-black">{copy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-black/60 dark:text-white/60" dir="auto">
            {copy.description}
          </p>
          <p className="mt-2 text-xs font-semibold text-black/40 dark:text-white/40">
            <bdi dir="ltr">{BRAND.productName}</bdi>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-11 rounded-full border border-black/10 px-5 text-xs font-black transition-colors hover:border-black/30 hover:bg-white dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/5"
        >
          {copy.dismiss}
        </button>
        <button
          type="button"
          onClick={() => void handlePrimaryAction()}
          className="min-h-11 rounded-full bg-accent px-5 text-xs font-black text-white transition-transform hover:-translate-y-0.5"
        >
          {copy.action}
        </button>
      </div>
    </aside>
  );
};
