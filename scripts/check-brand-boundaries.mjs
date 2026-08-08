import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = path.resolve('src');
const ALLOWED_FILE = path.join(SOURCE_ROOT, 'config', 'brand.ts');
const patterns = [
  ['legacy English brand', /\bASHUS\b/g],
  ['legacy Arabic brand', /اشوز/g],
  ['hard-coded display brand', /BGD\/INK/g],
  ['hard-coded plain brand', /BGD INK/g],
];

const walk = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const filePath = path.join(directory, entry);
    return statSync(filePath).isDirectory() ? walk(filePath) : [filePath];
  });

const failures = [];

for (const filePath of walk(SOURCE_ROOT)) {
  if (
    !/\.(ts|tsx)$/.test(filePath) ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.tsx')
  ) {
    continue;
  }
  if (filePath === ALLOWED_FILE) continue;

  const content = readFileSync(filePath, 'utf8');
  for (const [label, pattern] of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      failures.push(`${path.relative(process.cwd(), filePath)} contains a ${label} literal.`);
    }
  }
}

if (failures.length > 0) {
  console.error('Brand source-of-truth validation failed:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Brand source-of-truth validation passed.');
}
