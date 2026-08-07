import { afterEach, describe, expect, it, vi } from 'vitest';
import gsap from './gsap-lite';

afterEach(() => {
  vi.useRealTimers();
});

describe('lightweight motion compatibility layer', () => {
  it('supports the combined translate and opacity fromTo animation used by toasts', () => {
    vi.useFakeTimers();
    const element = document.createElement('div');
    const onComplete = vi.fn();
    Object.defineProperty(element, 'animate', {
      configurable: true,
      value: undefined,
    });

    gsap.fromTo(
      element,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.2)', onComplete },
    );

    expect(element.style.getPropertyValue('translate')).toBe('50px 0px');
    expect(element.style.opacity).toBe('0');

    vi.runAllTimers();

    expect(element.style.getPropertyValue('translate')).toBe('0px 0px');
    expect(element.style.opacity).toBe('1');
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('restores inline styles when a scoped context is reverted', () => {
    const element = document.createElement('div');
    element.style.opacity = '0.75';

    const motionContext = gsap.context(() => {
      gsap.set(element, { x: 12, opacity: 0.25 });
    }, element);

    expect(element.style.getPropertyValue('translate')).toBe('12px 0px');
    expect(element.style.opacity).toBe('0.25');

    motionContext.revert();

    expect(element.style.getPropertyValue('translate')).toBe('');
    expect(element.style.opacity).toBe('0.75');
  });
});
