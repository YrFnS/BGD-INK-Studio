import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = {
  app: await readFile(path.join(root, 'src/App.tsx'), 'utf8'),
  styles: await readFile(path.join(root, 'src/styles.css'), 'utf8'),
  pageTransition: await readFile(
    path.join(root, 'src/components/layout/PageTransition.tsx'),
    'utf8',
  ),
  magnetic: await readFile(path.join(root, 'src/components/ui/Magnetic.tsx'), 'utf8'),
  runtimeJourney: await readFile(path.join(root, 'e2e/runtime-shell.spec.ts'), 'utf8'),
};

const failures = [];

const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};

const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

for (const relativePath of [
  'src/components/ui/Cursor.tsx',
  'src/components/ui/Noise.tsx',
  'src/components/ui/Preloader.tsx',
]) {
  try {
    await access(path.join(root, relativePath));
    failures.push(`${relativePath} must stay removed from the runtime shell`);
  } catch {
    // The obsolete effect is absent as required.
  }
}

forbidPattern(
  files.app,
  /components\/ui\/(?:Cursor|Noise|Preloader)/,
  'the application shell must not import the cursor, noise, or artificial preloader effects',
);
forbidPattern(
  files.app,
  /<(?:Cursor|Noise|Preloader)\s*\/>/,
  'the application shell must not mount the cursor, noise, or artificial preloader effects',
);
forbidPattern(
  files.styles,
  /cursor:\s*none/,
  'the runtime shell must preserve the browser-native cursor',
);
requirePattern(
  files.styles,
  /\.page-transition\s*\{[\s\S]*animation:\s*page-enter/,
  'route motion must use the lightweight page-enter animation',
);
requirePattern(
  files.styles,
  /prefers-reduced-motion:\s*reduce[\s\S]*\.page-transition\s*\{[\s\S]*animation:\s*none/,
  'route motion must disappear completely for reduced-motion users',
);
requirePattern(
  files.pageTransition,
  /key=\{viewKey\}/,
  'route transitions must be keyed only by the stable route key',
);
requirePattern(
  files.pageTransition,
  /data-page-transition-key=\{viewKey\}/,
  'route transitions must expose their stable key for browser regression tests',
);
forbidPattern(
  files.pageTransition,
  /useState|useEffect|onTransitionEnd|transition-all/,
  'route transitions must not keep stale child state or depend on transition events',
);
forbidPattern(
  files.magnetic,
  /mousemove|getBoundingClientRect|quickTo|from ['"]gsap['"]|useEffect|useRef/,
  'primary actions must not perform layout-driven pointer animation work',
);
requirePattern(
  files.runtimeJourney,
  /not\.toHaveCSS\('cursor', 'none'\)/,
  'the Chromium runtime journey must verify native cursor behavior',
);
requirePattern(
  files.runtimeJourney,
  /data-runtime-marker/,
  'the Chromium runtime journey must prove same-route rerenders preserve the route container',
);
requirePattern(
  files.runtimeJourney,
  /page\.goBack\(\)[\s\S]*page\.goForward\(\)/,
  'the Chromium runtime journey must cover browser Back and Forward navigation',
);

if (failures.length > 0) {
  console.error('\nRuntime-shell validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Runtime-shell validation passed: native cursors, immediate startup, lightweight route motion, stable history navigation, and layout-free primary actions are enforced.',
);
