import { describe, expect, it } from 'vitest';
import { Size } from '@/types';
import { buildWhatsAppDraftMessage } from './services';

const order = {
  productId: 'tshirt-classic',
  productName: 'product.classic_tshirt',
  basePrice: 15000,
  color: '#000000',
  size: Size.L,
  quantity: 2,
  decals: [],
  notes: '',
};
const details = {
  fullName: 'Test Customer',
  phone: '07700000000',
  area: 'Al-Mansour',
  street: 'Street 1',
  house: '',
};

describe('WhatsApp draft handoff', () => {
  it('uses the translated garment name instead of the translation key', () => {
    const message = buildWhatsAppDraftMessage('BGD-1234', order, details, 'en', 'Classic T-shirt');

    expect(message).toContain('*Item:* Classic T-shirt');
    expect(message).not.toContain('product.classic_tshirt');
  });

  it('localizes the field labels for Iraqi Arabic handoff', () => {
    const message = buildWhatsAppDraftMessage('BGD-1234', order, details, 'ar', 'تيشيرت كلاسيك');

    expect(message).toContain('*القطعة:* تيشيرت كلاسيك');
    expect(message).toContain('*الكمية:* 2');
  });
});
