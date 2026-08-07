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
  'src/data/studioGuide.ts',
  'src/features/guide/Guide.tsx',
  'src/features/checkout/Checkout.tsx',
  'src/features/checkout/validation.ts',
  'src/features/customizer/Controls.tsx',
  'src/features/customizer/InteractionModeToolbar.tsx',
  'src/features/customizer/ArtworkQualityOverlay.tsx',
  'src/features/customizer/FallbackPreview.tsx',
  'src/features/customizer/ProductionExportPanel.tsx',
  'src/features/customizer/ProductionExportDock.tsx',
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

requirePattern(
  'src/data/studioGuide.ts',
  /navigation:\s*\{/,
  'the long-form Guide must retain its mobile-friendly section navigator',
);
requirePattern(
  'src/data/studioGuide.ts',
  /هل حفظ المسودة يرسل طلب حقيقي؟/,
  'the Guide FAQ must describe saving a local draft rather than checkout transmission',
);
requirePattern(
  'src/data/studioGuide.ts',
  /مرجع عام/,
  'print-method cards must retain the reviewed reference-only Iraqi-Arabic label',
);
requirePattern(
  'src/features/guide/Guide.tsx',
  /data-guide-section=['"]methods['"]/,
  'dense Guide sections must expose stable anchors for mobile navigation',
);
requirePattern(
  'src/features/guide/Guide.tsx',
  /<bdi className=['"][^'"]*technical-ltr/,
  'Guide indices and technical values must remain direction-isolated',
);
requirePattern(
  'src/features/guide/Guide.tsx',
  /overflow-x-clip/,
  'the long-form Guide must guard against page-level RTL overflow',
);

requirePattern(
  'src/features/checkout/validation.ts',
  /ar:\s*['"]المنصور['"]/,
  'Baghdad area options must include reviewed Arabic labels',
);
requirePattern(
  'src/features/checkout/Checkout.tsx',
  /BAGHDAD_AREA_OPTIONS\.map/,
  'draft preparation must render localized Baghdad area labels',
);
requirePattern(
  'src/features/checkout/Checkout.tsx',
  /data-testid=['"]preparation-validation-summary['"]/,
  'draft preparation must expose an accessible validation summary',
);
requirePattern(
  'src/features/checkout/Checkout.tsx',
  /data-testid=['"]preparation-save-warning['"]/,
  'draft preparation must expose a recoverable browser-storage warning',
);
requirePattern(
  'src/features/checkout/Checkout.tsx',
  /retryLoad/,
  'draft preparation load failures must provide a retry path',
);
requirePattern(
  'src/features/checkout/Checkout.tsx',
  /dir=['"]ltr['"][\s\S]{0,120}placeholder=['"]07xxxxxxxxx['"]/,
  'the Iraqi phone field must remain left-to-right in Arabic',
);
requirePattern(
  'src/features/checkout/Checkout.tsx',
  /<bdi className=['"][^'"]*technical-ltr/,
  'prices, sizes, quantities, and colour codes must remain direction-isolated',
);

requirePattern(
  'src/features/customizer/Controls.tsx',
  /layersTitle:\s*['"]طبقات التصميم['"]/,
  'the dense editor must use reviewed Iraqi-Arabic layer terminology',
);
requirePattern(
  'src/features/customizer/Controls.tsx',
  /type=['"]range['"][\s\S]{0,80}dir=['"]ltr['"]/,
  'range controls must keep a stable technical direction inside RTL layouts',
);
requirePattern(
  'src/features/customizer/InteractionModeToolbar.tsx',
  /toolbar:\s*['"]أوضاع التحكم بالمحرر['"]/,
  'customizer interaction modes must use reviewed Iraqi-Arabic terminology',
);
requirePattern(
  'src/features/customizer/ArtworkQualityOverlay.tsx',
  /جودة التصميم للطباعة/,
  'artwork-quality guidance must use the reviewed Arabic title',
);
requirePattern(
  'src/features/customizer/ArtworkQualityOverlay.tsx',
  /<bdi className=['"]technical-ltr['"] dir=['"]ltr['"]>/,
  'artwork measurements must remain direction-isolated in Arabic',
);
requirePattern(
  'src/features/customizer/FallbackPreview.tsx',
  /aria-labelledby=['"]fallback-preview-title['"]/,
  'the 2D recovery surface must expose an accessible region label',
);
requirePattern(
  'src/features/customizer/FallbackPreview.tsx',
  /المعاينة الآمنة 2D/,
  'the 2D recovery surface must use reviewed Iraqi-Arabic wording',
);
requirePattern(
  'src/features/customizer/ProductionExportPanel.tsx',
  /localBadge:\s*['"]على هذا الجهاز['"]/,
  'the export panel local-only badge must be localized',
);
requirePattern(
  'src/features/customizer/ProductionExportDock.tsx',
  /open:\s*['"]ملفات التسليم المحلية['"]/,
  'the export entry point must use truthful local-handoff terminology',
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
forbidPattern(
  'src/data/studioGuide.ts',
  /Does checkout send a real order|marks the design as submitted|تعلّم التصميم كمرسل|صفحة الطلب ترسل طلب حقيقي/,
  'the Guide must not imply that a browser-local receipt is transmitted or submitted',
);
forbidPattern(
  'src/features/checkout/Checkout.tsx',
  /BAGHDAD_AREAS\.map|تعذر حفظ آخر تغييرات المعلومات أو الكمية تلقائياً/,
  'draft preparation must keep localized area labels and the actionable storage-retry state',
);
forbidPattern(
  'src/features/customizer/Controls.tsx',
  /الطبقة المحددة|جاري حفظ الصورة/,
  'obsolete literal editor wording must not return',
);
forbidPattern(
  'src/features/customizer/ProductionExportPanel.tsx',
  />\s*Local\s*</,
  'the Arabic export panel must not contain an English-only local badge',
);

if (failures.length > 0) {
  console.error('\nLocalization and RTL validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Localization and RTL validation passed: language persistence, Iraqi-Arabic storefront and Guide copy, truthful local-draft preparation, recoverable edge states, dense editor guidance, localized handoff tools, and direction-isolation primitives are present.',
);