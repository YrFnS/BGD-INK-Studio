import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = {
  scene: await readFile(path.join(root, 'src/features/customizer/Scene.tsx'), 'utf8'),
  shirt: await readFile(path.join(root, 'src/features/customizer/ShirtModel.tsx'), 'utf8'),
  capabilities: await readFile(
    path.join(root, 'src/features/customizer/renderingCapabilities.ts'),
    'utf8',
  ),
  environment: await readFile(
    path.join(root, 'src/features/customizer/useRenderingEnvironment.ts'),
    'utf8',
  ),
  texture: await readFile(path.join(root, 'src/features/customizer/artworkTexture.ts'), 'utf8'),
  toolbar: await readFile(
    path.join(root, 'src/features/customizer/InteractionModeToolbar.tsx'),
    'utf8',
  ),
  journey: await readFile(path.join(root, 'e2e/rendering-profile.spec.ts'), 'utf8'),
};

const failures = [];
const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};
const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

requirePattern(
  files.scene,
  /frameloop=\{isPageVisible\s*\?\s*'demand'\s*:\s*'never'\}/,
  'the 3D canvas must use demand rendering while visible and stop while hidden',
);
forbidPattern(
  `${files.scene}\n${files.shirt}\n${files.capabilities}`,
  /frameloop=\{?['"]always['"]|idleAnimation|useFrame/,
  'continuous frame loops and idle garment animation must stay removed',
);
requirePattern(
  files.scene,
  /DemandRenderCoordinator[\s\S]*setDpr[\s\S]*shadowMap\.enabled[\s\S]*invalidate\(\)/,
  'profile, visibility, and committed scene changes must explicitly coordinate renderer updates',
);
requirePattern(
  files.scene,
  /const requestFrame = \(\) => \{[\s\S]*invalidate\(\);[\s\S]*onStart=\{requestFrame\}[\s\S]*onChange=\{requestFrame\}[\s\S]*onEnd=\{requestFrame\}/,
  'camera controls must request demand frames through their full interaction lifecycle',
);
requirePattern(
  files.shirt,
  /applyDecalTransformToObject[\s\S]*invalidate\(\)/,
  'live artwork previews must continue requesting a frame after imperative transforms',
);
requirePattern(
  files.texture,
  /lease\.texture\.then[\s\S]*setResolvedTexture\(\{ key: cacheKey, texture \}\)[\s\S]*invalidate\(\)/,
  'texture readiness must request a demand frame',
);
forbidPattern(
  files.capabilities,
  /maximumDpr:\s*2|shadowMapSize:\s*1024/,
  'ordinary rendering profiles must not restore DPR 2 or 1024 shadow maps',
);
requirePattern(
  files.capabilities,
  /quality:\s*'balanced'[\s\S]*maximumDpr:\s*1\.25[\s\S]*shadows:\s*false/,
  'the ordinary desktop profile must default to balanced GPU cost',
);
requirePattern(
  files.capabilities,
  /quality:\s*'high'[\s\S]*maximumDpr:\s*1\.5[\s\S]*shadowMapSize:\s*512/,
  'high quality must remain bounded to DPR 1.5 and a 512 shadow map',
);
requirePattern(
  files.environment,
  /addEventListener\('resize'[\s\S]*addEventListener\('orientationchange'/,
  'rendering capabilities must react to viewport and orientation changes',
);
requirePattern(
  files.environment,
  /\(pointer: coarse\)[\s\S]*prefers-reduced-motion: reduce/,
  'rendering capabilities must react to pointer and reduced-motion media queries',
);
requirePattern(
  files.environment,
  /devicePixelRatio[\s\S]*resolution:[\s\S]*connection\?\.addEventListener\('change'/,
  'rendering capabilities must react to display DPR and Save-Data changes',
);
requirePattern(
  files.environment,
  /const handleVisibilityChange[\s\S]*refreshCapabilities\(\)[\s\S]*addEventListener\('visibilitychange'/,
  'returning to a visible document must refresh the rendering environment',
);
requirePattern(
  files.toolbar,
  /data-rendering-quality=\{renderingQuality\}/,
  'the adaptive quality state must remain observable for browser regression coverage',
);
requirePattern(
  files.journey,
  /reducedMotion:\s*'reduce'[\s\S]*reducedMotion:\s*'no-preference'/,
  'the browser journey must exercise reduced-motion profile changes',
);
requirePattern(
  files.journey,
  /data-rendering-quality',\s*'low'[\s\S]*data-rendering-quality',\s*'balanced'[\s\S]*data-rendering-quality',\s*'high'/,
  'the browser journey must prove low, balanced, and high profiles react in place',
);
requirePattern(
  files.journey,
  /getByLabel\('Layer name'\)[\s\S]*page\.reload\(\)[\s\S]*Adaptive mark/,
  'the browser journey must prove profile changes and reload preserve the active draft',
);

if (failures.length > 0) {
  console.error('\nDemand-rendering validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Demand-rendering validation passed: the canvas idles by default, hidden documents stop rendering, adaptive profiles stay bounded and reactive, and draft state survives profile changes.',
);
