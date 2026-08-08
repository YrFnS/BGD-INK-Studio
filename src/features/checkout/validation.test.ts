import { describe, expect, it } from 'vitest';
import { BAGHDAD_AREA_OPTIONS, checkoutSchema, getBaghdadAreaLabel } from './validation';

describe('draft-preparation validation', () => {
  it('normalizes a valid Iraqi contact form', () => {
    expect(
      checkoutSchema.parse({
        fullName: '  Yasser Test  ',
        phone: '07701234567',
        area: 'Al-Mansour',
        street: '  Street 10  ',
        house: '  House 4  ',
      }),
    ).toEqual({
      fullName: 'Yasser Test',
      phone: '07701234567',
      area: 'Al-Mansour',
      street: 'Street 10',
      house: 'House 4',
    });
  });

  it('rejects an invalid Iraqi phone number', () => {
    const result = checkoutSchema.safeParse({
      fullName: 'Yasser Test',
      phone: '12345',
      area: 'Al-Mansour',
      street: 'Street 10',
      house: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('error.phone');
    }
  });

  it('requires an area and street address', () => {
    const result = checkoutSchema.safeParse({
      fullName: 'Yasser Test',
      phone: '07701234567',
      area: '',
      street: '',
      house: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['area', 'street']),
      );
    }
  });

  it('keeps stable stored area values while localizing the visible Baghdad labels', () => {
    expect(getBaghdadAreaLabel('Al-Mansour', 'en')).toBe('Al-Mansour');
    expect(getBaghdadAreaLabel('Al-Mansour', 'ar')).toBe('المنصور');
    expect(getBaghdadAreaLabel('Baghdad Al-Jadida', 'ar')).toBe('بغداد الجديدة');
    expect(getBaghdadAreaLabel('Unknown Area', 'ar')).toBe('Unknown Area');

    expect(BAGHDAD_AREA_OPTIONS.map((option) => option.value)).toContain('Other');
    expect(BAGHDAD_AREA_OPTIONS.every((option) => option.label.en && option.label.ar)).toBe(true);
  });
});
