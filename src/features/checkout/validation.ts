import { z } from 'zod';
import type { LocalizedText } from '@/config/brand';
import type { Language } from '@/types';

export interface BaghdadAreaOption {
  value: string;
  label: LocalizedText;
}

export const BAGHDAD_AREA_OPTIONS = [
  { value: 'Al-Mansour', label: { en: 'Al-Mansour', ar: 'المنصور' } },
  { value: 'Al-Karrada', label: { en: 'Al-Karrada', ar: 'الكرادة' } },
  { value: 'Al-Jadriya', label: { en: 'Al-Jadriya', ar: 'الجادرية' } },
  { value: 'Al-Yarmouk', label: { en: 'Al-Yarmouk', ar: 'اليرموك' } },
  { value: 'Al-Dora', label: { en: 'Al-Dora', ar: 'الدورة' } },
  { value: 'Zayouna', label: { en: 'Zayouna', ar: 'زيونة' } },
  { value: 'Al-Adhamiya', label: { en: 'Al-Adhamiya', ar: 'الأعظمية' } },
  { value: 'Al-Shaab', label: { en: 'Al-Shaab', ar: 'الشعب' } },
  { value: 'Baghdad Al-Jadida', label: { en: 'Baghdad Al-Jadida', ar: 'بغداد الجديدة' } },
  { value: 'Al-Hurriya', label: { en: 'Al-Hurriya', ar: 'الحرية' } },
  { value: 'Al-Ghazaliya', label: { en: 'Al-Ghazaliya', ar: 'الغزالية' } },
  { value: 'Hayy Al-Jamia', label: { en: 'Hayy Al-Jamia', ar: 'حي الجامعة' } },
  { value: 'Al-Amiriya', label: { en: 'Al-Amiriya', ar: 'العامرية' } },
  { value: 'Al-Saydiya', label: { en: 'Al-Saydiya', ar: 'السيدية' } },
  { value: 'Other', label: { en: 'Other', ar: 'منطقة ثانية' } },
] as const satisfies readonly BaghdadAreaOption[];

export const BAGHDAD_AREAS = BAGHDAD_AREA_OPTIONS.map((option) => option.value);

export const getBaghdadAreaLabel = (value: string, language: Language): string =>
  BAGHDAD_AREA_OPTIONS.find((option) => option.value === value)?.label[language] ?? value;

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
