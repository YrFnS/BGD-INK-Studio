import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const rootDirectory = process.cwd();
const distDirectory = path.join(rootDirectory, 'dist');
const manifestPath = path.join(distDirectory, '.vite', 'manifest.json');
const budgetPath = path.join(rootDirectory, 'src', 'config', 'bundle-budgets.json');

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));
const toKiB = (bytes) => bytes / 1024;
const formatKiB = (bytes) => `${toKiB(bytes).toFixed(2)} KiB`;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const maximum = (values) => (values.length === 0 ? 0 : Math.max(...values));

const [manifest, budgets] = await Promise.all([
  readJson(manifestPath).catch((error) => {
    throw new Error(
      `Vite manifest was not found at ${manifestPath}. Run npm run build before checking budgets.`,
      { cause: error },
    );
  }),
  readJson(budgetPath),
]);

const manifestEntries = Object.entries(manifest);
const entryKeys = manifestEntries.filter(([, chunk]) => chunk.isEntry).map(([key]) => key);

if (entryKeys.length === 0) {
  throw new Error('The Vite manifest does not contain an application entry chunk.');
}

const initialFiles = new Set();
const visitedManifestKeys = new Set();

const collectInitialFiles = (manifestKey) => {
  if (visitedManifestKeys.has(manifestKey)) return;
  visitedManifestKeys.add(manifestKey);

  const chunk = manifest[manifestKey];
  if (!chunk) return;

  if (typeof chunk.file === 'string') initialFiles.add(chunk.file);
  for (const cssFile of chunk.css ?? []) initialFiles.add(cssFile);
  for (const importedKey of chunk.imports ?? []) collectInitialFiles(importedKey);
};

entryKeys.forEach(collectInitialFiles);

const emittedFiles = new Set();
for (const [, chunk] of manifestEntries) {
  if (typeof chunk.file === 'string') emittedFiles.add(chunk.file);
  for (const cssFile of chunk.css ?? []) emittedFiles.add(cssFile);
}

const measuredAssets = [];
for (const relativePath of emittedFiles) {
  const extension = path.extname(relativePath);
  if (extension !== '.js' && extension !== '.css') continue;

  const contents = await readFile(path.join(distDirectory, relativePath));
  measuredAssets.push({
    file: relativePath,
    type: extension === '.js' ? 'javascript' : 'css',
    initial: initialFiles.has(relativePath),
    bytes: contents.byteLength,
    gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
  });
}

const javascriptAssets = measuredAssets.filter((asset) => asset.type === 'javascript');
const cssAssets = measuredAssets.filter((asset) => asset.type === 'css');
const initialJavaScriptAssets = javascriptAssets.filter((asset) => asset.initial);
const asyncJavaScriptAssets = javascriptAssets.filter((asset) => !asset.initial);
const initialCssAssets = cssAssets.filter((asset) => asset.initial);

const checks = [
  {
    label: 'Initial JavaScript (gzip)',
    actualBytes: sum(initialJavaScriptAssets.map((asset) => asset.gzipBytes)),
    limitKiB: budgets.initialJavaScriptGzipKiB,
  },
  {
    label: 'Initial CSS (gzip)',
    actualBytes: sum(initialCssAssets.map((asset) => asset.gzipBytes)),
    limitKiB: budgets.initialCssGzipKiB,
  },
  {
    label: 'Largest async JavaScript chunk (gzip)',
    actualBytes: maximum(asyncJavaScriptAssets.map((asset) => asset.gzipBytes)),
    limitKiB: budgets.maximumAsyncJavaScriptChunkGzipKiB,
  },
  {
    label: 'Largest JavaScript chunk',
    actualBytes: maximum(javascriptAssets.map((asset) => asset.bytes)),
    limitKiB: budgets.maximumJavaScriptChunkKiB,
  },
  {
    label: 'Total JavaScript (gzip)',
    actualBytes: sum(javascriptAssets.map((asset) => asset.gzipBytes)),
    limitKiB: budgets.totalJavaScriptGzipKiB,
  },
  {
    label: 'Total JavaScript',
    actualBytes: sum(javascriptAssets.map((asset) => asset.bytes)),
    limitKiB: budgets.totalJavaScriptKiB,
  },
  {
    label: 'Total CSS (gzip)',
    actualBytes: sum(cssAssets.map((asset) => asset.gzipBytes)),
    limitKiB: budgets.totalCssGzipKiB,
  },
];

console.log('\nProduction bundle assets');
for (const asset of [...measuredAssets].sort((left, right) => right.gzipBytes - left.gzipBytes)) {
  const loadingClass = asset.initial ? 'initial' : 'async';
  console.log(
    `  ${asset.file.padEnd(48)} ${formatKiB(asset.bytes).padStart(12)} raw  ${formatKiB(asset.gzipBytes).padStart(12)} gzip  ${loadingClass}`,
  );
}

console.log('\nBundle budget summary');
const failures = [];
for (const check of checks) {
  const limitBytes = check.limitKiB * 1024;
  const passed = check.actualBytes <= limitBytes;
  console.log(
    `  ${passed ? 'PASS' : 'FAIL'}  ${check.label.padEnd(40)} ${formatKiB(check.actualBytes).padStart(12)} / ${check.limitKiB.toFixed(0)} KiB`,
  );

  if (!passed) failures.push(check);
}

if (failures.length > 0) {
  console.error('\nBundle budget exceeded:');
  for (const failure of failures) {
    console.error(
      `  - ${failure.label}: ${formatKiB(failure.actualBytes)} exceeds ${failure.limitKiB} KiB.`,
    );
  }
  console.error(
    `\nReduce the affected bundle or intentionally update ${path.relative(rootDirectory, budgetPath)} with a reviewed reason.`,
  );
  process.exitCode = 1;
} else {
  console.log('\nAll production bundle budgets passed.');
}
