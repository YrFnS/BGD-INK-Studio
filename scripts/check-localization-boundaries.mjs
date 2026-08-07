import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = [
  'src/contexts/AppContext.tsx',
  'src/styles.css',
  'src/translations.ts',
  'src/config/platform.ts',
  'src/components/layout/Footer.tsx',
  'src/features/hero/Hero.tsx',
  'src/features/designs/Designs.tsx',
];

const contentsByFile = new Map();
for (const relativePath of files) {
  contentsByFile.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const failures = [];

const requirePattern = (relativePath, pattern, message) => {
  const contents = contentsByFile.get(relativePath) ?? '';
  if (!pattern.test(contents)) failures.push(`${relativePath}: ${message}`);
};

const forbidPattern = (relativePath, pattern, message) => {
  const contents = contentsByFile.get(relativePath) ?? '';
  if (pattern.test(contents)) failures.push(`${relativePath}: ${message}`);
};

requirePattern(
  'src/contexts/AppContext.tsx',
  /LANGUAGE_STORAGE_KEY\s*=\s*['"]bgd-ink-language['"]/,
  'the language preference must have a stable browser-storage key',
);
requirePattern(
  'src/contexts/AppContext.tsx',
  /localStorage\.setItem\(LANGUAGE_STORAGE_KEY,\s*language\)/,
  'Arabic or English selection must persist across refreshes',
);
requirePattern(
  'src/contexts/AppContext.tsx',
  /root\.dataset\.language\s*=\s*language/,
  'the document must expose its active language for layout and browser checks',
);
requirePattern(
  'src/styles.css',
  /:root\[lang=['"]ar['"]\]/,
  'Arabic typography must be selected from the document language',
);
requirePattern(
  'src/styles.css',
  /\.technical-ltr/,
  'mixed technical values need a reusable direction-isolation primitive',
);
requirePattern(
  'src/styles.css',
  /input\[type=['"]tel['"]\]/,
  'phone fields must remain left-to-right inside RTL forms',
);
requirePattern(
  'src/translations.ts',
  /['"]nav\.catalog['"]:\s*['"]القطع['"]/,
  'the reviewed Iraqi-Arabic catalog label must remain the source of truth',
);
requirePattern(
  'src/features/hero/Hero.tsx',
  /localized\(evidence\.readyBadge\)/,
  'the ready-state badge must be localized',
);
requirePattern(
  'src/features/hero/Hero.tsx',
  /localized\(evidence\.guardrailBadge\)/,
  'the guardrail badge must be localized',
);
requirePattern(
  'src/features/designs/Designs.tsx',
  /prepared:\s*['"]Prepared locally['"]/,
  'browser-local receipts must be labelled as prepared locally, not submitted',
);
requirePattern(
  'src/features/designs/Designs.tsx',
  /quantity:\s*['"]Quantity['"]/,
  'saved-draft cards must expose their prepared quantity',
);
requirePattern(
  'src/components/layout/Footer.tsx',
  /contactNavigation/,
  'the footer contact navigation must have localized accessibility copy',
);

forbidPattern(
  'src/translations.ts',
  /Continue to Draft Details|معلومات المسودة/,
  'the local flow must use draft-preparation language instead of obsolete checkout/detail wording',
);
forbidPattern(
  'src/features/designs/Designs.tsx',
  /['"]Submitted['"]|['"]تم الإرسال['"]|server storage is connected|ربط التخزين بالسيرفر/,
  'the local workspace must not imply transmission or promised server synchronization',
);
forbidPattern(
  'src/features/hero/Hero.tsx',
  />\s*(?:Live|Honest)\s*</,
  'English-only status badges are not allowed in the bilingual storefront',
);
forbidPattern(
  'src/config/platform.ts',
  /المتجر/,
  'prototype copy should consistently refer to the studio, not an unconfigured store operation',
);

if (failures.length > 0) {
  console.error('\nLocalization and RTL validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Localization and RTL validation passed: language persistence, Iraqi-Arabic terminology, truthful local-draft status, localized badges, and direction-isolation primitives are present.',
);
