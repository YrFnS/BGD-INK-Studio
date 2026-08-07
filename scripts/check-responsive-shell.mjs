import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = {
  index: await readFile(path.join(root, 'index.html'), 'utf8'),
  styles: await readFile(path.join(root, 'src/styles.css'), 'utf8'),
  header: await readFile(path.join(root, 'src/components/layout/Header.tsx'), 'utf8'),
  main: await readFile(path.join(root, 'src/main.tsx'), 'utf8'),
  anchorNavigation: await readFile(path.join(root, 'src/utils/anchorNavigation.ts'), 'utf8'),
  responsiveJourney: await readFile(path.join(root, 'e2e/responsive-shell.spec.ts'), 'utf8'),
};

const failures = [];

const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};

requirePattern(
  files.index,
  /viewport-fit=cover/,
  'index.html must opt into display-cutout safe areas',
);
requirePattern(
  files.index,
  /interactive-widget=resizes-content/,
  'index.html must allow the visual viewport to resize around the software keyboard',
);
requirePattern(
  files.styles,
  /--safe-area-top:\s*env\(safe-area-inset-top/,
  'the shell must expose the top safe-area inset',
);
requirePattern(
  files.styles,
  /--safe-area-bottom:\s*env\(safe-area-inset-bottom/,
  'the shell must expose the bottom safe-area inset',
);
requirePattern(
  files.styles,
  /min-height:\s*100dvh/,
  'the application shell must use the dynamic viewport height',
);
requirePattern(
  files.styles,
  /#mobile-navigation[\s\S]*height:\s*calc\(100dvh - var\(--app-header-height\)\)/,
  'the mobile navigation must fit the live viewport below the safe-area-aware header',
);
requirePattern(
  files.styles,
  /max-height:\s*500px[\s\S]*orientation:\s*landscape/,
  'short landscape viewports need a dedicated mobile-navigation layout',
);
requirePattern(
  files.styles,
  /overscroll-behavior:\s*contain/,
  'the open mobile menu must contain overscroll',
);
requirePattern(
  files.header,
  /h-\[calc\(100dvh-4rem\)\]/,
  'the component fallback must retain dynamic viewport sizing before custom safe-area overrides',
);
requirePattern(
  files.main,
  /installAnchorNavigation\(\)/,
  'the application entry point must install reliable same-page section navigation',
);
requirePattern(
  files.anchorNavigation,
  /prefers-reduced-motion:\s*reduce/,
  'same-page navigation must respect the reduced-motion preference',
);
requirePattern(
  files.anchorNavigation,
  /scrollIntoView\(/,
  'same-page navigation must scroll explicitly to its destination',
);
requirePattern(
  files.anchorNavigation,
  /history\.replaceState/,
  'same-page navigation must keep the URL hash synchronized',
);
requirePattern(
  files.responsiveJourney,
  /iPhone 13/,
  'the responsive journey must cover an iPhone-sized viewport',
);
requirePattern(
  files.responsiveJourney,
  /iPad Mini/,
  'the responsive journey must cover a tablet viewport',
);
requirePattern(
  files.responsiveJourney,
  /setViewportSize/,
  'the responsive journey must exercise an orientation or viewport-size change',
);

if (failures.length > 0) {
  console.error('\nResponsive-shell validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Responsive-shell validation passed: dynamic viewport, safe-area, short-landscape, keyboard-resize, reliable section navigation, and phone/tablet browser boundaries are present.',
);
