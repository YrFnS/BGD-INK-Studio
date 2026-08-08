import { describe, expect, it } from 'vitest';
import {
  calculateMultiPointerTransform,
  calculateSinglePointerTransform,
  getPointerAngle,
  getPointerDistance,
} from './interactionGestures';

describe('artwork transform gestures', () => {
  it('maps one-pointer movement to rotation and scale', () => {
    const transform = calculateSinglePointerTransform(
      { scale: 0.2, rotation: 0.5 },
      { x: 100, y: 100 },
      { x: 150, y: 50 },
    );

    expect(transform.rotation).toBeCloseTo(1.1);
    expect(transform.scale).toBeGreaterThan(0.2);
  });

  it('maps two-pointer pinch and twist to scale and rotation', () => {
    const transform = calculateMultiPointerTransform(
      { scale: 0.2, rotation: 0 },
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 200 },
    );

    expect(transform.scale).toBeCloseTo(0.4);
    expect(transform.rotation).toBeCloseTo(Math.PI / 2);
  });

  it('calculates stable pointer distance and angle helpers', () => {
    expect(getPointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(getPointerAngle({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
  });
});
