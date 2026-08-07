import { createHash } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const distDirectory = path.join(root, 'dist');
const indexPath = path.join(distDirectory, 'index.html');
const manifestPath = path.join(distDirectory, '.vite', 'manifest.json');
const DELIVERY_HEAD_PATTERN =
  /<!-- delivery:head:start -->[\s\S]*?<!-- delivery:head:end -->/;

const PUBLIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly', priority: '1.0' },
  { path: '/catalog', changeFrequency: 'weekly', priority: '0.9' },
  { path: '/guide', changeFrequency: 'monthly', priority: '0.8' },
];

const STABLE_SHELL_ASSETS = [
  '/manifest.webmanifest',
  '/brand/app/favicon-32.png',
  '/brand/app/apple-touch-icon.png',
  '/brand/app/icon-192.png',
  '/brand/app/icon-512.png',
  '/brand/app/icon-maskable-512.png',
  '/brand/products/classic-tshirt.svg',
  '/brand/products/hoodie-premium.svg',
  '/brand/products/oversized-tee.svg',
  '/brand/products/urban-vest.svg',
];

const normalizeSiteUrl = (candidate) => {
  const value = candidate?.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

const siteUrl =
  normalizeSiteUrl(process.env.VITE_PUBLIC_SITE_URL) ??
  normalizeSiteUrl(process.env.URL) ??
  (process.env.CONTEXT === 'production'
    ? normalizeSiteUrl(process.env.DEPLOY_PRIME_URL)
    : null);
const indexable =
  Boolean(siteUrl) &&
  (process.env.VITE_INDEXABLE_BUILD === 'true' || process.env.CONTEXT === 'production');

const escapeAttribute = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const absoluteUrl = (pathname) => (siteUrl ? new URL(pathname, `${siteUrl}/`).toString() : null);

const buildDeliveryHead = () => {
  const title = 'BGD/INK Studio | Local Apparel Design in Baghdad';
  const description =
    'Prepare a browser-local custom apparel draft with model-aware 3D placement, physical dimensions, image-quality guidance, and local production files.';
  const robots = indexable
    ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    : 'noindex,nofollow,noarchive';
  const canonical = absoluteUrl('/');
  const socialImage = absoluteUrl('/brand/social/og-default.png') ?? '/brand/social/og-default.png';

  const tags = [
    '<!-- delivery:head:start -->',
    `    <meta name="bgd:indexing" content="${indexable ? 'indexable' : 'preview'}" />`,
    siteUrl ? `    <meta name="bgd:site-url" content="${escapeAttribute(siteUrl)}" />` : '',
    `    <meta name="robots" content="${robots}" />`,
    `    <meta name="googlebot" content="${robots}" />`,
    canonical ? `    <link rel="canonical" href="${escapeAttribute(canonical)}" />` : '',
    '    <meta property="og:type" content="website" />',
    '    <meta property="og:site_name" content="BGD/INK Studio" />',
    `    <meta property="og:title" content="${escapeAttribute(title)}" />`,
    `    <meta property="og:description" content="${escapeAttribute(description)}" />`,
    canonical ? `    <meta property="og:url" content="${escapeAttribute(canonical)}" />` : '',
    `    <meta property="og:image" content="${escapeAttribute(socialImage)}" />`,
    '    <meta property="og:image:type" content="image/png" />',
    '    <meta property="og:image:width" content="1200" />',
    '    <meta property="og:image:height" content="630" />',
    '    <meta property="og:image:alt" content="BGD/INK Studio — Design it. Wear it." />',
    '    <meta property="og:locale" content="en_US" />',
    '    <meta property="og:locale:alternate" content="ar_IQ" />',
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    `    <meta name="twitter:description" content="${escapeAttribute(description)}" />`,
    `    <meta name="twitter:image" content="${escapeAttribute(socialImage)}" />`,
    '    <meta name="twitter:image:alt" content="BGD/INK Studio — Design it. Wear it." />',
    '    <!-- delivery:head:end -->',
  ];

  return tags.filter(Boolean).join('\n');
};

const injectStaticMetadata = async () => {
  const source = await readFile(indexPath, 'utf8');
  if (!DELIVERY_HEAD_PATTERN.test(source)) {
    throw new Error('index.html is missing the delivery metadata markers.');
  }
  await writeFile(indexPath, source.replace(DELIVERY_HEAD_PATTERN, buildDeliveryHead()));
};

const writeRobots = async () => {
  const content = indexable
    ? [
        'User-agent: *',
        'Allow: /',
        'Disallow: /designs',
        'Disallow: /studio/',
        'Disallow: /checkout/',
        'Disallow: /draft/',
        `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
        '',
      ].join('\n')
    : [
        '# Preview-safe build. Configure a verified public URL before indexing.',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n');

  await writeFile(path.join(distDirectory, 'robots.txt'), content);
};

const writeSitemap = async () => {
  if (!indexable || !siteUrl) return;

  const urls = PUBLIC_ROUTES.map(
    (route) => `  <url>\n    <loc>${absoluteUrl(route.path)}</loc>\n    <changefreq>${route.changeFrequency}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`,
  ).join('\n');
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');

  await writeFile(path.join(distDirectory, 'sitemap.xml'), sitemap);
};

const pathExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const urlToDistPath = (url) =>
  url === '/' ? indexPath : path.join(distDirectory, decodeURIComponent(url.replace(/^\//, '')));

const collectEntryAssets = async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const entry = Object.entries(manifest).find(([, value]) => value.isEntry);
  if (!entry) throw new Error('The Vite manifest does not contain an application entry.');

  const urls = new Set(['/']);
  const visited = new Set();

  const visit = (key) => {
    if (visited.has(key)) return;
    visited.add(key);
    const item = manifest[key];
    if (!item) return;

    if (item.file) urls.add(`/${item.file}`);
    for (const css of item.css ?? []) urls.add(`/${css}`);
    for (const asset of item.assets ?? []) urls.add(`/${asset}`);
    for (const importedKey of item.imports ?? []) visit(importedKey);
  };

  visit(entry[0]);

  for (const stableAsset of STABLE_SHELL_ASSETS) {
    if (await pathExists(urlToDistPath(stableAsset))) urls.add(stableAsset);
  }

  return [...urls].sort();
};

const createShellVersion = async (urls) => {
  const hash = createHash('sha256');
  for (const url of urls) {
    hash.update(url);
    const filePath = urlToDistPath(url);
    if (await pathExists(filePath)) hash.update(await readFile(filePath));
  }
  return hash.digest('hex').slice(0, 16);
};

const createServiceWorker = (urls, version) => `const CACHE_PREFIX = 'bgd-ink-shell-';
const CACHE_NAME = \`\${CACHE_PREFIX}${version}\`;
const PRECACHE_URLS = ${JSON.stringify(urls, null, 2)};
const CACHEABLE_DESTINATIONS = new Set(['script', 'style', 'image', 'font', 'manifest', 'worker']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          const response = await fetch(new Request(url, { cache: 'reload' }));
          if (response.ok) await cache.put(url, response.clone());
        }),
      );
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

const networkFirstNavigation = async (request) => {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/', response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error();
  }
};

const cacheFirstAsset = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const isRuntimeAsset =
    CACHEABLE_DESTINATIONS.has(request.destination) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/brand/') ||
    url.pathname === '/manifest.webmanifest';

  if (isRuntimeAsset) event.respondWith(cacheFirstAsset(request));
});
`;

const writeServiceWorker = async () => {
  const urls = await collectEntryAssets();
  const version = await createShellVersion(urls);
  await writeFile(path.join(distDirectory, 'sw.js'), createServiceWorker(urls, version));
  return { urls, version };
};

await injectStaticMetadata();
await writeRobots();
await writeSitemap();
const serviceWorker = await writeServiceWorker();

console.log(
  `Delivery assets generated: ${indexable ? 'indexable production' : 'noindex preview'} metadata, ` +
    `${serviceWorker.urls.length} shell asset(s), cache ${serviceWorker.version}.`,
);
