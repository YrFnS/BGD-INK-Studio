import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

let objectUrlSequence = 0;
let animationFrameSequence = 0;
const animationFrameTimers = new Map<number, ReturnType<typeof setTimeout>>();

Object.defineProperty(globalThis, 'Blob', {
  configurable: true,
  value: NodeBlob,
});
Object.defineProperty(globalThis, 'File', {
  configurable: true,
  value: NodeFile,
});
Object.defineProperty(window, 'Blob', {
  configurable: true,
  value: NodeBlob,
});
Object.defineProperty(window, 'File', {
  configurable: true,
  value: NodeFile,
});

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: vi.fn(() => `blob:test-${++objectUrlSequence}`),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  })),
});

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'requestAnimationFrame', {
  configurable: true,
  value: (callback: FrameRequestCallback) => {
    const id = ++animationFrameSequence;
    const timer = setTimeout(() => {
      animationFrameTimers.delete(id);
      callback(performance.now());
    }, 0);
    animationFrameTimers.set(id, timer);
    return id;
  },
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  configurable: true,
  value: (id: number) => {
    const timer = animationFrameTimers.get(id);
    if (timer) clearTimeout(timer);
    animationFrameTimers.delete(id);
  },
});

class ResizeObserverMock implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
});
Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
});

beforeEach(() => {
  objectUrlSequence = 0;
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  animationFrameTimers.forEach((timer) => clearTimeout(timer));
  animationFrameTimers.clear();
  cleanup();
});
