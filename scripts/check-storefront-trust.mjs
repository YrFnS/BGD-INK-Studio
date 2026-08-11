import { access, readFile, stat } from 'node:fs/promises';
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
const renderConfigurationPath = 'src/features/customizer/garmentPreview.ts';
const requiredRenderPaths = [
  '/brand/products/renders/classic-tshirt-front.svg',
  '/brand/products/renders/classic-tshirt-back.svg',
  '/brand/products/renders/oversized-tee-front.svg',
  '/brand/products/renders/oversized-tee-back.svg',
  '/brand/products/renders/premium-hoodie-front.svg',
  '/brand/products/renders/premium-hoodie-back.svg',
  '/brand/products/renders/urban-vest-front.svg',
  '/brand/products/renders/urban-vest-back.svg',
];
const maximumRenderBytes = 160 * 1024;

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

const hasRemoteAssetReference = (asset) =>
  /(?:href|src)\s*=\s*["']https?:\/\//i.test(asset) ||
  /url\(\s*["']?https?:\/\//i.test(asset);

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
const imagePaths = Array.from(
  productsSource.matchAll(/image:\s*['"]([^'"]+)['"]/g),
  (match) => match[1],
);
if (imagePaths.length === 0) {
  failures.push('src/data/products.ts: no product artwork paths were found');
}

for (const imagePath of imagePaths) {
  if (!imagePath.startsWith('/brand/products/') || !imagePath.endsWith('.svg')) {
    failures.push(
      `src/data/products.ts: product artwork must be an owned /brand/products/*.svg asset, received ${imagePath}`,
    );
    continue;
  }

  const assetPath = path.join(root, 'public', imagePath.slice(1));
  try {
    await access(assetPath);
    const asset = await readFile(assetPath, 'utf8');
    if (!asset.includes('<svg')) {
      failures.push(`${assetPath}: owned product artwork must be a valid SVG source file`);
    }
    if (hasRemoteAssetReference(asset)) {
      failures.push(`${assetPath}: product artwork must not load remote imagery`);
    }
  } catch {
    failures.push(`${assetPath}: referenced owned product artwork does not exist`);
  }
}

const renderConfiguration = await readFile(
  path.join(root, renderConfigurationPath),
  'utf8',
);

for (const renderPath of requiredRenderPaths) {
  if (!renderConfiguration.includes(renderPath)) {
    failures.push(`${renderConfigurationPath}: missing render mapping for ${renderPath}`);
  }

  const assetPath = path.join(root, 'public', renderPath.slice(1));
  try {
    const [asset, metadata] = await Promise.all([
      readFile(assetPath, 'utf8'),
      stat(assetPath),
    ]);

    if (!asset.includes('<svg') || !asset.includes('viewBox="0 0 600 750"')) {
      failures.push(`${assetPath}: garment render must be a 600 × 750 SVG wrapper`);
    }
    if (!asset.includes('data:image/webp;base64,')) {
      failures.push(`${assetPath}: garment render must embed an owned WebP payload`);
    }
    if (hasRemoteAssetReference(asset)) {
      failures.push(`${assetPath}: garment render must not load remote imagery`);
    }
    if (metadata.size > maximumRenderBytes) {
      failures.push(
        `${assetPath}: ${metadata.size} bytes exceeds the ${maximumRenderBytes}-byte render budget`,
      );
    }
  } catch {
    failures.push(`${assetPath}: required garment render does not exist`);
  }
}

if (failures.length > 0) {
  console.error('\nStorefront trust validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  `Storefront trust validation passed: ${imagePaths.length} catalog assets and ${requiredRenderPaths.length} owned garment renders, with no stock-photo references, fabricated testimonials, emoji process icons, unsupported production promises, or remote imagery.`,
);
