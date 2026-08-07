import { z } from 'zod';

export const BAGHDAD_AREAS = [
  'Al-Mansour',
  'Al-Karrada',
  'Al-Jadriya',
  'Al-Yarmouk',
  'Al-Dora',
  'Zayouna',
  'Al-Adhamiya',
  'Al-Shaab',
  'Baghdad Al-Jadida',
  'Al-Hurriya',
  'Al-Ghazaliya',
  'Hayy Al-Jamia',
  'Al-Amiriya',
  'Al-Saydiya',
  'Other',
] as const;

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(3, 'error.min'),
  phone: z
    .string()
    .trim()
    .regex(/^07\d{9}$/, 'error.phone'),
  area: z.string().min(1, 'error.required'),
  street: z.string().trim().min(1, 'error.required'),
  house: z.string().trim(),
});
