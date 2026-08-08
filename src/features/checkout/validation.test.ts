import { describe, expect, it } from 'vitest';
import { checkoutSchema } from './validation';

describe('checkout validation', () => {
  it('normalizes a valid Iraqi delivery form', () => {
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
});
