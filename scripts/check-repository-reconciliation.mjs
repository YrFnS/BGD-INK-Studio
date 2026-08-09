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
} catch {
  failures.push('package.json must be valid JSON');
}

try {
  lockJson = JSON.parse(files.lock);
} catch {
  failures.push('package-lock.json must be valid JSON');
}

try {
  budgetJson = JSON.parse(files.budgets);
} catch {
  failures.push('runtime-performance-budgets.json must be valid JSON');
}

try {
  vercelJson = JSON.parse(files.vercel);
} catch {
  failures.push('vercel.json must be valid JSON');
}

if (packageJson && lockJson) {
  if (packageJson.private !== true) {
    failures.push('the prototype package must remain private');
  }

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
    'README must state the current private package version',
  );

  if (packageJson.scripts?.['check:repository'] !== 'node scripts/check-repository-reconciliation.mjs') {
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
    'the repository-reconciliation gate must run inside npm run check',
  );
}

if (budgetJson) {
  const requiredPositiveBudgets = [
    budgetJson.timingMs?.homepageInteractiveMedian,
    budgetJson.timingMs?.routeTransitionMedian,
    budgetJson.timingMs?.studioReady,
    budgetJson.timingMs?.largeArtworkReady,
    budgetJson.timingMs?.constrainedArtworkReady,
    budgetJson.throttling?.cpuRate,
  ];

  if (requiredPositiveBudgets.some((value) => typeof value !== 'number' || value <= 0)) {
    failures.push('runtime budgets must retain positive production limits');
  }
}

requireText(files.readme, 'main\n└── agent/p6-runtime-stability', 'README must show the single active P6 branch');
requireText(files.readme, 'npm run test:performance', 'README must document production performance tests');
requireText(files.readme, 'npm run verify:p6', 'README must document the complete P6 exit command');
requireText(files.readme, 'docs/DEPLOYMENT.md', 'README must link deployment guidance');
requireText(files.readme, 'docs/TROUBLESHOOTING.md', 'README must link troubleshooting guidance');
requireText(files.tasks, 'agent/p6-runtime-stability', 'tasks must identify the active P6 branch');
requireText(files.tasks, 'Production Branch is `main`', 'tasks must retain the external production-branch gate');

const livingStatus = `${files.readme}\n${files.tasks}`;
forbidPattern(
  livingStatus,
  /main\s*\n\s*└──\s*agent\/bgd-ink-p0-foundation/,
  'living status documents must not restore the obsolete active P0-P5 branch stack',
);
forbidPattern(
  livingStatus,
  /\b\d+\s+(?:unit\/component\/accessibility tests|functional Chromium journeys|Chromium journeys|production-only PWA Chromium journey)/i,
  'living status documents must not hard-code volatile validation totals',
);

requireText(
  files.troubleshooting,
  'Draft schema version is 6',
  'troubleshooting must state the current persisted draft schema',
);
requireText(
  files.troubleshooting,
  'npm run test:performance',
  'troubleshooting must cover production performance tests',
);
requirePattern(
  files.troubleshooting,
  /Reduced motion[\s\S]*demand rendering/i,
  'troubleshooting must cover reduced motion and demand rendering',
);
requirePattern(
  files.troubleshooting,
  /2D fallback[\s\S]*WebGL/i,
  'troubleshooting must cover the safe 2D/WebGL recovery path',
);
requireText(
  files.troubleshooting,
  '786,432 pixels',
  'troubleshooting must retain the low-power decoded-pixel limit',
);
requireText(
  files.troubleshooting,
  '3,145,728 pixels',
  'troubleshooting must retain the high-capability decoded-pixel limit',
);
requireText(
  files.troubleshooting,
  'Do not raise a runtime budget',
  'troubleshooting must reject budget inflation as a CI workaround',
);

requireText(files.deployment, 'Production branch: `main`', 'deployment docs must name main as production');
requireText(
  files.deployment,
  'agent/p6-runtime-stability',
  'deployment docs must distinguish the PR preview branch',
);
requireText(files.deployment, 'Vercel', 'deployment docs must cover Vercel');
requireText(files.deployment, 'Netlify', 'deployment docs must cover Netlify');
requireText(
  files.deployment,
  'VITE_PUBLIC_SITE_URL',
  'deployment docs must cover the verified public URL',
);
requireText(
  files.deployment,
  'VITE_INDEXABLE_BUILD',
  'deployment docs must cover explicit indexing approval',
);
requireText(
  files.deployment,
  'Historical phase branches are not deployment targets',
  'deployment docs must exclude historical phase branches',
);

requireText(
  files.p6Plan,
  'P6.6 repository and release reconciliation is implemented',
  'the P6 plan must reflect implemented reconciliation work',
);
requireText(
  files.p66,
  'Implementation complete; final exit validation',
  'the P6.6 record must distinguish implementation from final validation',
);
requireText(files.p66, 'version: 0.4.0', 'the P6.6 record must state the reconciled version');
requireText(
  files.p66,
  'Production branch: main',
  'the P6.6 record must state the deployment branch decision',
);

if (vercelJson) {
  if (vercelJson.framework !== 'vite') failures.push('Vercel must declare the Vite framework');
  if (vercelJson.installCommand !== 'npm ci --include=dev --no-audit --no-fund') {
    failures.push('Vercel must use the clean locked install command');
  }
  if (vercelJson.buildCommand !== 'npm run build') {
    failures.push('Vercel must use the deterministic production build command');
  }
  if (vercelJson.outputDirectory !== 'dist') {
    failures.push('Vercel must publish the dist directory');
  }
  forbidPattern(
    JSON.stringify(vercelJson),
    /agent\//,
    'Vercel repository configuration must remain branch-neutral',
  );
}

requirePattern(
  files.netlify,
  /command\s*=\s*"npm run build"/,
  'Netlify must use the deterministic production build command',
);
requirePattern(files.netlify, /publish\s*=\s*"dist"/, 'Netlify must publish the dist directory');
requirePattern(
  files.netlify,
  /NODE_VERSION\s*=\s*"22\.23\.1"/,
  'Netlify must retain the pinned Node runtime',
);
forbidPattern(files.netlify, /agent\//, 'Netlify repository configuration must remain branch-neutral');
requireText(files.redirects, '/* /index.html 200', 'Netlify must retain the SPA route fallback');

requirePattern(
  files.workflow,
  /name:\s*Production runtime performance budgets[\s\S]*npm run test:performance/,
  'CI must retain the independent production runtime-performance job',
);

if (failures.length > 0) {
  console.error('\nRepository reconciliation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Repository reconciliation passed: package metadata, branch policy, deployment contracts, living validation claims, troubleshooting, and the P6 exit command agree.',
);
