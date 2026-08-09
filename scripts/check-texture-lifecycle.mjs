import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = {
  budgets: await readFile(path.join(root, 'src/config/asset-budgets.json'), 'utf8'),
  budgetLogic: await readFile(
    path.join(root, 'src/features/customizer/artworkTextureBudget.ts'),
    'utf8',
  ),
  loader: await readFile(
    path.join(root, 'src/features/customizer/artworkTextureLoader.ts'),
    'utf8',
  ),
  cache: await readFile(
    path.join(root, 'src/features/customizer/artworkTextureCache.ts'),
    'utf8',
  ),
  hook: await readFile(path.join(root, 'src/features/customizer/artworkTexture.ts'), 'utf8'),
  shirt: await readFile(path.join(root, 'src/features/customizer/ShirtModel.tsx'), 'utf8'),
  loaderTests: await readFile(
    path.join(root, 'src/features/customizer/artworkTextureLoader.test.ts'),
    'utf8',
  ),
  cacheTests: await readFile(
    path.join(root, 'src/features/customizer/artworkTextureCache.test.ts'),
    'utf8',
  ),
  journey: await readFile(path.join(root, 'e2e/texture-lifecycle.spec.ts'), 'utf8'),
};

const failures = [];
const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};
const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

forbidPattern(
  `${files.loader}\n${files.hook}`,
  /new\s+THREE\.TextureLoader|TextureLoader\(\)\.load|loadOriginalTexture|fallbackTexture/,
  'the original unbounded TextureLoader fallback must stay removed',
);
requirePattern(
  files.budgets,
  /MaximumPixelArea/g,
  'artwork budgets must include decoded pixel-area limits for every quality profile',
);
requirePattern(
  files.budgetLogic,
  /Math\.sqrt\(maximumPixelArea\s*\/\s*sourcePixelArea\)/,
  'texture sizing must enforce pixel area as well as maximum dimensions',
);
requirePattern(
  files.loader,
  /createImageBitmap[\s\S]*resizeWidth[\s\S]*resizeHeight[\s\S]*resizeQuality/,
  'supported browsers must request a bounded ImageBitmap decode',
);
requirePattern(
  files.loader,
  /createBoundedCanvasTexture[\s\S]*isArtworkTextureWithinLimits[\s\S]*CanvasTexture/,
  'every successful decode must pass through the bounded canvas texture constructor',
);
requirePattern(
  files.loader,
  /disposeLateResult[\s\S]*AbortController[\s\S]*timeout/,
  'slow or cancelled decodes must have an abort and late-result disposal path',
);
requirePattern(
  files.loaderTests,
  /explicit timeout failure[\s\S]*code:\s*'timeout'[\s\S]*external cancellation[\s\S]*AbortError/,
  'loader tests must preserve both timeout and external-abort behavior',
);
requirePattern(
  files.cache,
  /references[\s\S]*controller\.abort\(\)[\s\S]*disposeResource/,
  'the texture cache must be reference counted and dispose the final consumer deterministically',
);
requirePattern(
  files.cache,
  /cache\.get\(key\) !== createdEntry[\s\S]*disposeResource\(resource\)/,
  'stale decodes must be rejected and disposed rather than installed into a replacement entry',
);
requirePattern(
  files.hook,
  /assetId[\s\S]*acquireArtworkTexture[\s\S]*lease\.release\(\)/,
  'the React hook must use stable artwork identity and release its cache lease on cleanup',
);
requirePattern(
  files.shirt,
  /useOptimizedArtworkTexture\(layer, renderingQuality, textureAnisotropy\)/,
  'decal layers must provide stable asset identity and source dimensions to the shared texture hook',
);
requirePattern(
  files.cacheTests,
  /shares one compatible texture[\s\S]*final release[\s\S]*late result[\s\S]*retry cleanly/,
  'unit coverage must enforce sharing, final disposal, stale cancellation, and retry behavior',
);
requirePattern(
  files.journey,
  /large-transparent-mark[\s\S]*Duplicate[\s\S]*references[\s\S]*Remove[\s\S]*texturesDisposed/,
  'browser coverage must verify bounded duplicate sharing and repeated final cleanup',
);
requirePattern(
  files.journey,
  /TEXTURE_TEST_DELAY_MS[\s\S]*pending[\s\S]*Guide[\s\S]*cancelledLoads/,
  'browser coverage must verify route-unmount cancellation during a slow decode',
);

if (failures.length > 0) {
  console.error('\nTexture-lifecycle validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Texture-lifecycle validation passed: every GPU preview is bounded, compatible duplicates share a reference-counted texture, and cancellation plus final disposal are enforced.',
);
