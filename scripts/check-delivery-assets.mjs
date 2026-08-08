import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];

const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};

const requireFile = async (relativePath) => {
  try {
    await access(path.join(dist, relativePath));
  } catch {
    failures.push(`dist/${relativePath} is missing`);
  }
};

const index = await readFile(path.join(dist, 'index.html'), 'utf8');
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
const serviceWorker = await readFile(path.join(dist, 'sw.js'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.webmanifest'), 'utf8'));
const indexable = /name="bgd:indexing" content="indexable"/.test(index);

requirePattern(
  index,
  /rel="manifest" href="\/manifest\.webmanifest"/,
  'index.html must link the web manifest',
);
requirePattern(index, /rel="apple-touch-icon"/, 'index.html must expose an Apple touch icon');
requirePattern(index, /name="robots"/, 'index.html must contain a robots directive');
requirePattern(index, /property="og:image"/, 'index.html must contain Open Graph image metadata');
requirePattern(
  index,
  /name="twitter:card" content="summary_large_image"/,
  'index.html must contain Twitter card metadata',
);
requirePattern(index, /name="bgd:indexing"/, 'index.html must expose the build indexing mode');

requirePattern(
  serviceWorker,
  /bgd-ink-shell-/,
  'the service worker must use a versioned cache namespace',
);
requirePattern(
  serviceWorker,
  /SKIP_WAITING/,
  'the service worker must support explicit update activation',
);
requirePattern(
  serviceWorker,
  /clients\.claim\(\)/,
  'the service worker must claim clients after activation',
);
requirePattern(
  serviceWorker,
  /networkFirstNavigation/,
  'the service worker must use network-first navigation',
);
requirePattern(
  serviceWorker,
  /cacheFirstAsset/,
  'the service worker must cache visited static assets',
);
if (/\.glb/.test(serviceWorker) || /three-core/.test(serviceWorker)) {
  failures.push('the lightweight install shell must not precache Three.js or garment GLB assets');
}

if (manifest.name !== 'BGD/INK Studio') failures.push('the manifest must use the product name');
if (manifest.orientation !== 'any')
  failures.push('the manifest must allow phone and tablet rotation');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 3) {
  failures.push('the manifest must provide standard and maskable application icons');
}
if (!Array.isArray(manifest.shortcuts) || manifest.shortcuts.length < 3) {
  failures.push('the manifest must provide catalog, designs, and Guide shortcuts');
}

for (const relativePath of [
  'brand/app/favicon-32.png',
  'brand/app/apple-touch-icon.png',
  'brand/app/icon-192.png',
  'brand/app/icon-512.png',
  'brand/app/icon-maskable-512.png',
  'brand/social/og-default.png',
  'brand/products/classic-tshirt.svg',
  'brand/products/premium-hoodie.svg',
  'brand/products/oversized-tee.svg',
  'brand/products/urban-vest.svg',
]) {
  await requireFile(relativePath);
}

if (indexable) {
  requirePattern(
    index,
    /rel="canonical" href="https?:\/\//,
    'an indexable build must have an absolute canonical URL',
  );
  requirePattern(robots, /Allow:\s*\//, 'an indexable build must allow public crawling');
  requirePattern(
    robots,
    /Disallow:\s*\/studio\//,
    'browser-local Studio routes must stay excluded',
  );
  requirePattern(
    robots,
    /Sitemap:\s*https?:\/\//,
    'an indexable build must publish its sitemap URL',
  );
  await requireFile('sitemap.xml');
} else {
  requirePattern(robots, /Disallow:\s*\//, 'a preview build must block crawling');
  if (/rel="canonical"/.test(index))
    failures.push('a preview build must not publish a canonical URL');
  if (/name="bgd:site-url"/.test(index))
    failures.push('a preview build must not expose a public site URL');
}

if (failures.length > 0) {
  console.error('\nDelivery-asset validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  `Delivery assets validated: ${indexable ? 'indexable production' : 'noindex preview'} metadata, install icons, social card, manifest, and versioned service worker.`,
);
