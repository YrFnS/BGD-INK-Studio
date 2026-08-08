import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const customerFacingFiles = [
  'src/features/hero/Hero.tsx',
  'src/features/hero/StudioWorkbench.tsx',
  'src/data/products.ts',
  'src/data/storefront.ts',
  'src/translations.ts',
];

const forbiddenPatterns = [
  {
    pattern: /https?:\/\/(?:images\.)?unsplash\.com/i,
    message: 'remote Unsplash stock imagery is not allowed in the P3 storefront',
  },
  {
    pattern: /Customer\s*#/i,
    message: 'anonymous numbered testimonials are not verifiable customer proof',
  },
  {
    pattern: /home\.reviews\./i,
    message: 'the removed fabricated-review translation namespace must not return',
  },
  {
    pattern: /100%\s+premium\s+cotton/i,
    message: 'material composition must not be claimed before supplier confirmation',
  },
  {
    pattern: /washing-machine\s+safe/i,
    message: 'care-performance claims require real production validation',
  },
  {
    pattern: /best\s+custom/i,
    message: 'unsupported superlative marketing claims are not allowed',
  },
  {
    pattern: /fast\s+delivery/i,
    message: 'delivery promises require an active fulfillment operation',
  },
];

const failures = [];
const contentsByFile = new Map();

for (const relativePath of customerFacingFiles) {
  const absolutePath = path.join(root, relativePath);
  const contents = await readFile(absolutePath, 'utf8');
  contentsByFile.set(relativePath, contents);

  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(contents)) {
      failures.push(`${relativePath}: ${rule.message}`);
    }
  }
}

const heroSource = contentsByFile.get('src/features/hero/Hero.tsx') ?? '';
if (/\p{Extended_Pictographic}/u.test(heroSource)) {
  failures.push('src/features/hero/Hero.tsx: emoji cannot be used as the owned process-icon system');
}

const productsSource = contentsByFile.get('src/data/products.ts') ?? '';
const imagePaths = Array.from(productsSource.matchAll(/image:\s*['"]([^'"]+)['"]/g), (match) => match[1]);
if (imagePaths.length === 0) {
  failures.push('src/data/products.ts: no product artwork paths were found');
}

for (const imagePath of imagePaths) {
  if (!imagePath.startsWith('/brand/products/') || !imagePath.endsWith('.svg')) {
    failures.push(`src/data/products.ts: product artwork must be an owned /brand/products/*.svg asset, received ${imagePath}`);
    continue;
  }

  const assetPath = path.join(root, 'public', imagePath.slice(1));
  try {
    await access(assetPath);
    const asset = await readFile(assetPath, 'utf8');
    if (!asset.includes('<svg')) {
      failures.push(`${assetPath}: owned product artwork must be a valid SVG source file`);
    }
  } catch {
    failures.push(`${assetPath}: referenced owned product artwork does not exist`);
  }
}

if (failures.length > 0) {
  console.error('\nStorefront trust validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  `Storefront trust validation passed: ${imagePaths.length} owned product assets, no stock-photo references, fabricated testimonials, emoji process icons, or unsupported production promises.`,
);
