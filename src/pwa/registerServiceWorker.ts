export const PWA_UPDATE_EVENT = 'bgd-ink:pwa-update-available';

export interface PwaUpdateEventDetail {
  registration: ServiceWorkerRegistration;
}

const announceWaitingWorker = (registration: ServiceWorkerRegistration): void => {
  window.dispatchEvent(
    new CustomEvent<PwaUpdateEventDetail>(PWA_UPDATE_EVENT, {
      detail: { registration },
    }),
  );
};

const watchRegistration = (registration: ServiceWorkerRegistration): void => {
  if (registration.waiting) announceWaitingWorker(registration);

  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        announceWaitingWorker(registration);
      }
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void registration.update();
  });
};

export const registerServiceWorker = (): void => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const hadControllerAtStartup = Boolean(navigator.serviceWorker.controller);
  let reloadingForUpdate = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtStartup || reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener(
    'load',
    () => {
      void navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then(watchRegistration)
        .catch(() => undefined);
    },
    { once: true },
  );
};

export const applyServiceWorkerUpdate = (registration: ServiceWorkerRegistration): void => {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
};
