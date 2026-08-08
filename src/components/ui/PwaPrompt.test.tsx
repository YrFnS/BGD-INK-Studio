import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { PWA_UPDATE_EVENT } from '@/pwa/registerServiceWorker';
import { PwaPrompt } from './PwaPrompt';

const renderPrompt = () =>
  render(
    <AppProvider>
      <PwaPrompt />
    </AppProvider>,
  );

const setOnlineState = (value: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  setOnlineState(true);
});

describe('PWA prompt', () => {
  it('offers installation without claiming that drafts leave the browser', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = Object.assign(new Event('beforeinstallprompt'), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    });

    renderPrompt();
    window.dispatchEvent(installEvent);

    expect(await screen.findByRole('heading', { name: 'Keep the Studio close.' })).toBeVisible();
    expect(screen.getByText(/Designs still remain only in this browser/)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Install app' }));

    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Keep the Studio close.' })).not.toBeInTheDocument(),
    );
  });

  it('lets the user explicitly activate a waiting service worker', async () => {
    const postMessage = vi.fn();
    const registration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration;

    renderPrompt();
    window.dispatchEvent(
      new CustomEvent(PWA_UPDATE_EVENT, {
        detail: { registration },
      }),
    );

    expect(await screen.findByRole('heading', { name: 'A newer build is ready.' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Update now' }));

    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('explains the limits of cached offline access without promising full availability', async () => {
    renderPrompt();
    setOnlineState(false);
    window.dispatchEvent(new Event('offline'));

    expect(await screen.findByRole('heading', { name: 'You are offline.' })).toBeVisible();
    expect(screen.getByText(/Previously opened screens and files may work/)).toBeVisible();
    expect(screen.getByText(/New or uncached content still needs a connection/)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('heading', { name: 'You are offline.' })).not.toBeInTheDocument();
  });
});
