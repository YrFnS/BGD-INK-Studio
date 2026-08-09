import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const files = {
  readme: await read('README.md'),
  tasks: await read('tasks.md'),
  troubleshooting: await read('docs/TROUBLESHOOTING.md'),
  deployment: await read('docs/DEPLOYMENT.md'),
  p6Plan: await read('docs/P6-RUNTIME-STABILITY-PLAN.md'),
  p66: await read('docs/P6-6-REPOSITORY-RECONCILIATION.md'),
  package: await read('package.json'),
  lock: await read('package-lock.json'),
  budgets: await read('src/config/runtime-performance-budgets.json'),
  netlify: await read('netlify.toml'),
  vercel: await read('vercel.json'),
  redirects: await read('public/_redirects'),
  workflow: await read('.github/workflows/ci.yml'),
};

const failures = [];
const requireText = (source, text, message) => {
  if (!source.includes(text)) failures.push(message);
};
const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};
const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

let packageJson;
let lockJson;
let budgetJson;
let vercelJson;

try {
  packageJson = JSON.parse(files.package);
  lockJson = JSON.parse(files.lock);
  budgetJson = JSON.parse(files.budgets);
  vercelJson = JSON.parse(files.vercel);
} catch {
  failures.push('repository metadata JSON must be valid');
}

if (packageJson && lockJson) {
  if (packageJson.private !== true) failures.push('the prototype package must remain private');
  if (packageJson.name !== lockJson.name || packageJson.name !== lockJson.packages?.['']?.name) {
    failures.push('package and lockfile names must agree');
  }
  if (
    packageJson.version !== lockJson.version ||
    packageJson.version !== lockJson.packages?.['']?.version
  ) {
    failures.push('package and lockfile versions must agree');
  }
  requireText(
    files.readme,
    `Current private package version: \`${packageJson.version}\``,
    'README must state the private package version',
  );
  if (
    packageJson.scripts?.['check:repository'] !== 'node scripts/check-repository-reconciliation.mjs'
  ) {
    failures.push('package scripts must expose check:repository');
  }
  if (
    packageJson.scripts?.['verify:p6'] !==
    'npm run check && npm run test:e2e && npm run test:pwa && npm run test:performance'
  ) {
    failures.push('package scripts must expose the complete P6 exit sequence');
  }
  requireText(
    packageJson.scripts?.check ?? '',
    'npm run check:repository',
    'check:repository must run inside npm run check',
  );
}

if (budgetJson) {
  const values = [
    budgetJson.timingMs?.homepageInteractiveMedian,
    budgetJson.timingMs?.routeTransitionMedian,
    budgetJson.timingMs?.studioReady,
    budgetJson.timingMs?.largeArtworkReady,
    budgetJson.timingMs?.constrainedArtworkReady,
    budgetJson.throttling?.cpuRate,
  ];
  if (values.some((value) => typeof value !== 'number' || value <= 0)) {
    failures.push('runtime budgets must retain positive production limits');
  }
}

const mergeSha = '03d78a08febd8428555d6f1b657848f2a520eddc';
requirePattern(
  files.readme,
  /The authoritative repository state is:\s*```text\s*main\s*```/,
  'README must show main as the sole authoritative branch',
);
requireText(files.readme, mergeSha, 'README must retain the P6 merge commit');
requireText(
  files.readme,
  'P6.1 through P6.6 are implemented, validated, merged, and consolidated in `main`.',
  'README must state the merged P6 status',
);
requireText(files.readme, 'npm run test:performance', 'README must document performance tests');
requireText(files.readme, 'npm run verify:p6', 'README must document the P6 exit command');
requireText(files.readme, 'docs/DEPLOYMENT.md', 'README must link deployment guidance');
requireText(files.readme, 'docs/TROUBLESHOOTING.md', 'README must link troubleshooting');

requireText(
  files.tasks,
  'All superseded phase branches were deleted',
  'tasks must state branch cleanup',
);
requireText(
  files.tasks,
  '| P6.1–P6.6 | Merged into `main` and validated |',
  'tasks must state the merged P6 phase status',
);
requireText(files.tasks, mergeSha, 'tasks must retain the merge commit');
requireText(files.tasks, 'Production Branch is `main`', 'tasks must retain provider checks');

const livingStatus = `${files.readme}\n${files.tasks}`;
forbidPattern(
  livingStatus,
  /agent\/(?:bgd-ink|p6-runtime-stability)|draft PR #6|PR #6 remains draft|draft and unmerged/i,
  'living status documents must not restore deleted branches or pre-merge P6 claims',
);
forbidPattern(
  livingStatus,
  /\b\d+\s+(?:unit\/component\/accessibility tests|functional Chromium journeys|Chromium journeys|production-only PWA Chromium journey)/i,
  'living status documents must not hard-code volatile validation totals',
);

requireText(
  files.troubleshooting,
  'Draft schema version is 6',
  'troubleshooting must state draft schema 6',
);
requireText(
  files.troubleshooting,
  'npm run test:performance',
  'troubleshooting must cover performance tests',
);
requirePattern(
  files.troubleshooting,
  /Reduced motion[\s\S]*demand rendering/i,
  'troubleshooting must cover reduced motion',
);
requirePattern(
  files.troubleshooting,
  /2D fallback[\s\S]*WebGL/i,
  'troubleshooting must cover WebGL recovery',
);
requireText(
  files.troubleshooting,
  '786,432 pixels',
  'troubleshooting must retain low-power texture limits',
);
requireText(
  files.troubleshooting,
  '3,145,728 pixels',
  'troubleshooting must retain high texture limits',
);
requireText(
  files.troubleshooting,
  'Do not raise a runtime budget',
  'troubleshooting must reject budget inflation',
);

requireText(
  files.deployment,
  'Production branch: `main`',
  'deployment docs must name main as production',
);
requireText(
  files.deployment,
  'All superseded phase branches were deleted',
  'deployment docs must state branch cleanup',
);
forbidPattern(
  files.deployment,
  /agent\/(?:bgd-ink|p6-runtime-stability)/,
  'deployment docs must not restore phase refs',
);
requireText(files.deployment, 'Vercel', 'deployment docs must cover Vercel');
requireText(files.deployment, 'Netlify', 'deployment docs must cover Netlify');
requireText(files.deployment, 'VITE_PUBLIC_SITE_URL', 'deployment docs must cover the public URL');
requireText(
  files.deployment,
  'VITE_INDEXABLE_BUILD',
  'deployment docs must cover indexing approval',
);

requireText(
  files.p6Plan,
  'P6.1 through P6.6 are complete, validated, and merged into `main`.',
  'the P6 plan must state its merged status',
);
requireText(files.p6Plan, mergeSha, 'the P6 plan must retain the merge commit');
forbidPattern(
  files.p6Plan,
  /PR #6 remains draft|draft and unmerged/i,
  'the P6 plan must not retain pre-merge status',
);

requireText(
  files.p66,
  '**Complete, validated, merged, and consolidated**',
  'P6.6 must state merged status',
);
requireText(files.p66, mergeSha, 'P6.6 must retain the merge commit');
requireText(files.p66, 'All phase branches were deleted', 'P6.6 must retain branch cleanup');
requireText(files.p66, '31308581420', 'P6.6 must retain the validated CI run');
requireText(files.p66, 'version: 0.4.0', 'P6.6 must state the reconciled version');
requireText(files.p66, 'Production branch: main', 'P6.6 must state the deployment branch decision');

if (vercelJson) {
  if (vercelJson.framework !== 'vite') failures.push('Vercel must declare Vite');
  if (vercelJson.installCommand !== 'npm ci --include=dev --no-audit --no-fund') {
    failures.push('Vercel must use the clean locked install command');
  }
  if (vercelJson.buildCommand !== 'npm run build') failures.push('Vercel must use npm run build');
  if (vercelJson.outputDirectory !== 'dist') failures.push('Vercel must publish dist');
  forbidPattern(JSON.stringify(vercelJson), /agent\//, 'Vercel config must be branch-neutral');
}

requirePattern(files.netlify, /command\s*=\s*"npm run build"/, 'Netlify must use npm run build');
requirePattern(files.netlify, /publish\s*=\s*"dist"/, 'Netlify must publish dist');
requirePattern(files.netlify, /NODE_VERSION\s*=\s*"22\.23\.1"/, 'Netlify must retain pinned Node');
forbidPattern(files.netlify, /agent\//, 'Netlify config must be branch-neutral');
requireText(files.redirects, '/* /index.html 200', 'Netlify must retain SPA fallback');
requirePattern(
  files.workflow,
  /name:\s*Production runtime performance budgets[\s\S]*npm run test:performance/,
  'CI must retain the performance job',
);

if (failures.length > 0) {
  console.error('\nRepository reconciliation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Repository reconciliation passed: package metadata, main-only branch status, deployment contracts, living claims, troubleshooting, merge evidence, and the P6 exit command agree.',
);
