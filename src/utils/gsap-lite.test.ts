import { describe, expect, it, vi } from 'vitest';
import gsap from './gsap-lite';

const waitForMotionTick = () =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });

describe('lightweight motion compatibility layer', () => {
  it('supports the combined translate and opacity fromTo animation used by toasts', async () => {
    const element = document.createElement('div');
    const onComplete = vi.fn();
    Object.defineProperty(element, 'animate', {
      configurable: true,
      value: undefined,
    });

    gsap.fromTo(
      element,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0, ease: 'back.out(1.2)', onComplete },
    );

    expect(element.style.getPropertyValue('translate')).toBe('50px 0px');
    expect(element.style.opacity).toBe('0');

    await waitForMotionTick();

    expect(element.style.getPropertyValue('translate')).toBe('0px 0px');
    expect(element.style.opacity).toBe('1');
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('supports timeline fromTo, stagger-compatible transforms, and clearProps', async () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'animate', {
      configurable: true,
      value: undefined,
    });

    gsap
      .timeline({ defaults: { ease: 'power4.out' } })
      .fromTo(
        element,
        { y: 54, opacity: 0, scale: 0.975, skewY: 2 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          skewY: 0,
          duration: 0,
          clearProps: 'transform',
        },
      );

    expect(element.style.getPropertyValue('translate')).toBe('0px 54px');
    expect(element.style.opacity).toBe('0');
    expect(element.style.transform).toContain('skewY(2deg)');

    await waitForMotionTick();

    expect(element.style.getPropertyValue('translate')).toBe('');
    expect(element.style.transform).toBe('');
    expect(element.style.opacity).toBe('1');
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
