import { afterEach, describe, expect, it, vi } from 'vitest';
import { installAnchorNavigation } from './anchorNavigation';

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.history.replaceState(null, '', '/');
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('same-page anchor navigation', () => {
  it('scrolls to the destination, respects reduced motion, and updates the hash', () => {
    const anchor = document.createElement('a');
    anchor.href = '#faq';
    const nestedLabel = document.createElement('span');
    nestedLabel.textContent = 'FAQ';
    anchor.appendChild(nestedLabel);

    const destination = document.createElement('section');
    destination.id = 'faq';
    const scrollIntoView = vi.fn();
    destination.scrollIntoView = scrollIntoView;

    document.body.append(anchor, destination);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const removeNavigation = installAnchorNavigation();

    nestedLabel.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
      inline: 'nearest',
    });
    expect(replaceState).toHaveBeenCalledWith(window.history.state, '', '/#faq');
    expect(window.location.hash).toBe('#faq');

    removeNavigation();
  });

  it('leaves modified clicks and missing destinations to the browser', () => {
    const anchor = document.createElement('a');
    anchor.href = '#missing';
    document.body.append(anchor);
    const removeNavigation = installAnchorNavigation();

    const modifiedClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: true,
    });
    anchor.dispatchEvent(modifiedClick);

    expect(modifiedClick.defaultPrevented).toBe(false);
    expect(window.location.hash).toBe('');

    removeNavigation();
  });
});
