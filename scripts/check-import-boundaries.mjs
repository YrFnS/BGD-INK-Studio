import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = path.resolve('src');

const walk = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const filePath = path.join(directory, entry);
    return statSync(filePath).isDirectory() ? walk(filePath) : [filePath];
  });

const resolveTarget = (importer, specifier) => {
  if (specifier.startsWith('@/')) {
    return path.resolve(SOURCE_ROOT, specifier.slice(2));
  }
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(importer), specifier);
  }
  return null;
};

const importSpecifiers = (content) => {
  const specifiers = [];
  const pattern = /(?:from\s+|import\s*\(\s*|import\s+)(['"])([^'"]+)\1/g;
  let match;
  while ((match = pattern.exec(content))) {
    specifiers.push(match[2]);
  }
  return specifiers;
};

const disallowedTargets = {
  config: new Set(['components', 'contexts', 'features', 'hooks', 'routing', 'services', 'utils']),
  data: new Set(['components', 'contexts', 'features', 'hooks', 'routing', 'services', 'utils']),
  services: new Set(['components', 'contexts', 'features', 'hooks']),
  utils: new Set(['components', 'contexts', 'features', 'hooks']),
  routing: new Set(['components', 'contexts', 'features', 'hooks', 'services', 'utils']),
  contexts: new Set(['components', 'features', 'hooks', 'services']),
  hooks: new Set(['components', 'features', 'services']),
  components: new Set(['features']),
};

const failures = [];

for (const importer of walk(SOURCE_ROOT)) {
  if (!/\.(ts|tsx)$/.test(importer)) continue;
  const importerRelative = path.relative(SOURCE_ROOT, importer).replaceAll('\\', '/');
  const importerParts = importerRelative.split('/');
  const importerTop = importerParts[0];
  const importerFeature = importerTop === 'features' ? importerParts[1] : null;

  for (const specifier of importSpecifiers(readFileSync(importer, 'utf8'))) {
    if (specifier.startsWith('../')) {
      failures.push(
        `${importerRelative} uses parent-relative import "${specifier}"; use @/ instead.`,
      );
    }

    const target = resolveTarget(importer, specifier);
    if (!target || !target.startsWith(SOURCE_ROOT)) continue;

    const targetRelative = path.relative(SOURCE_ROOT, target).replaceAll('\\', '/');
    const targetParts = targetRelative.split('/');
    const targetTop = targetParts[0];
    const targetFeature = targetTop === 'features' ? targetParts[1] : null;

    if (
      targetTop === 'features' &&
      importerRelative !== 'App.tsx' &&
      (importerTop !== 'features' || importerFeature !== targetFeature)
    ) {
      failures.push(
        `${importerRelative} imports feature internals from ${targetRelative}; only App.tsx may compose features.`,
      );
    }

    const disallowed = disallowedTargets[importerTop];
    if (disallowed?.has(targetTop)) {
      failures.push(
        `${importerRelative} crosses the ${importerTop} boundary by importing ${targetRelative}.`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('Import-boundary validation failed:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Import-boundary validation passed.');
}
