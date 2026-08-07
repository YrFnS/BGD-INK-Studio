/* eslint-disable */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const branchName = 'agent/bgd-ink-p0-foundation';

const absolute = (filePath) => path.join(root, filePath);
const read = (filePath) => readFileSync(absolute(filePath), 'utf8');
const write = (filePath, content) => {
  mkdirSync(path.dirname(absolute(filePath)), { recursive: true });
  writeFileSync(absolute(filePath), content.endsWith('\n') ? content : `${content}\n`);
};

const replaceRequired = (content, searchValue, replacement, label) => {
  if (!content.includes(searchValue)) {
    throw new Error(`Could not update ${label}; expected source text was not found.`);
  }
  return content.replace(searchValue, replacement);
};

const movePath = (source, destination) => {
  if (!existsSync(absolute(source))) return;
  if (existsSync(absolute(destination))) {
    throw new Error(`Cannot move ${source}; ${destination} already exists.`);
  }
  mkdirSync(path.dirname(absolute(destination)), { recursive: true });
  renameSync(absolute(source), absolute(destination));
};

const walk = (directory) => {
  if (!existsSync(absolute(directory))) return [];
  return readdirSync(absolute(directory)).flatMap((entry) => {
    const relativePath = path.posix.join(directory, entry);
    return statSync(absolute(relativePath)).isDirectory() ? walk(relativePath) : [relativePath];
  });
};

console.log(`Finishing P0 and P1 on ${branchName}...`);

mkdirSync(absolute('src'), { recursive: true });

[
  'components',
  'config',
  'contexts',
  'data',
  'features',
  'hooks',
  'routing',
  'services',
  'utils',
].forEach((directory) => movePath(directory, `src/${directory}`));

[
  ['App.tsx', 'src/App.tsx'],
  ['index.tsx', 'src/main.tsx'],
  ['styles.css', 'src/styles.css'],
  ['translations.ts', 'src/translations.ts'],
  ['types.ts', 'src/types.ts'],
].forEach(([source, destination]) => movePath(source, destination));

let indexHtml = read('index.html');
indexHtml = replaceRequired(
  indexHtml,
  '<script type="module" src="/index.tsx"></script>',
  '<script type="module" src="/src/main.tsx"></script>',
  'index.html entry point',
);
write('index.html', indexHtml);

write(
  'tsconfig.json',
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        experimentalDecorators: true,
        useDefineForClassFields: false,
        module: 'ESNext',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
        types: ['node', 'vite/client'],
        moduleResolution: 'bundler',
        isolatedModules: true,
        moduleDetection: 'force',
        strict: true,
        allowJs: false,
        jsx: 'react-jsx',
        forceConsistentCasingInFileNames: true,
        noUncheckedSideEffectImports: true,
        baseUrl: '.',
        paths: {
          '@/*': ['src/*'],
        },
        allowImportingTsExtensions: true,
        noEmit: true,
      },
      include: [
        'src/**/*.ts',
        'src/**/*.tsx',
        'e2e/**/*.ts',
        'test/**/*.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
      ],
      exclude: ['dist', 'node_modules', 'coverage', 'playwright-report', 'test-results'],
    },
    null,
    2,
  ),
);

write(
  'vite.config.ts',
  `import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const THREE_REACT_PACKAGES = [
  '/node_modules/@react-three/',
  '/node_modules/three-stdlib/',
  '/node_modules/@react-spring/',
  '/node_modules/@use-gesture/',
  '/node_modules/maath/',
  '/node_modules/react-reconciler/',
  '/node_modules/suspend-react/',
  '/node_modules/troika-three-text/',
  '/node_modules/troika-worker-utils/',
  '/node_modules/three-mesh-bvh/',
  '/node_modules/zustand/',
];

const manualChunks = (id: string): string | undefined => {
  const normalizedId = id.replaceAll('\\\\', '/');

  if (normalizedId.includes('/node_modules/three/')) {
    return 'three-core';
  }

  if (THREE_REACT_PACKAGES.some((packagePath) => normalizedId.includes(packagePath))) {
    return 'three-react';
  }

  return undefined;
};

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [tailwindcss(), react()],
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
`,
);

write(
  'vitest.config.ts',
  `import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      include: [
        'src/routing/**/*.ts',
        'src/services/drafts/**/*.ts',
        'src/features/designs/**/*.tsx',
        'src/features/catalog/**/*.tsx',
        'src/features/checkout/validation.ts',
        'src/features/customizer/artworkValidation.ts',
        'src/contexts/AppContext.tsx',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/index.ts'],
      thresholds: {
        branches: 60,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
});
`,
);

let eslintConfig = read('eslint.config.mjs');
eslintConfig = eslintConfig.replace(
  "files: ['contexts/**/*.{ts,tsx}']",
  "files: ['src/contexts/**/*.{ts,tsx}']",
);
write('eslint.config.mjs', eslintConfig);

const translationReplacements = new Map([
  ["'seo.home.title': 'ASHUS | Printing on clothes in Baghdad'", "'seo.home.title': '{{brand}} | Printing on clothes in Baghdad'"],
  ["'seo.catalog.title': 'Product Catalog | ASHUS Custom Printing'", "'seo.catalog.title': 'Product Catalog | {{product}}'"],
  ["'seo.customizer.title': '3D Design Tool | ASHUS'", "'seo.customizer.title': '3D Design Tool | {{product}}'"],
  ["'seo.checkout.title': 'Checkout | ASHUS'", "'seo.checkout.title': 'Checkout | {{brand}}'"],
  ["'seo.designs.title': 'My Designs | BGD/INK Studio'", "'seo.designs.title': 'My Designs | {{product}}'"],
  [
    "'seo.designs.description':\n      'Reopen and manage custom apparel designs saved on this browser with BGD/INK Studio.'",
    "'seo.designs.description':\n      'Reopen and manage custom apparel designs saved on this browser with {{product}}.'",
  ],
  ["'seo.home.title': 'اشوز | طباعة ملابس في بغداد'", "'seo.home.title': '{{brand}} | طباعة ملابس في بغداد'"],
  ["'seo.catalog.title': 'الموديلات | اشوز'", "'seo.catalog.title': 'الموديلات | {{product}}'"],
  ["'seo.customizer.title': 'صمم بنفسك | اشوز'", "'seo.customizer.title': 'صمم بنفسك | {{product}}'"],
  ["'seo.checkout.title': 'تأكيد الطلب | اشوز'", "'seo.checkout.title': 'تأكيد المسودة | {{brand}}'"],
  ["'seo.designs.title': 'تصاميمي | BGD/INK Studio'", "'seo.designs.title': 'تصاميمي | {{product}}'"],
  [
    "'seo.designs.description':\n      'افتح وأدر تصاميم الملابس المحفوظة بهذا المتصفح باستخدام BGD/INK Studio.'",
    "'seo.designs.description':\n      'افتح وأدر تصاميم الملابس المحفوظة بهذا المتصفح باستخدام {{product}}.'",
  ],
]);

let translations = read('src/translations.ts');
for (const [legacyValue, brandedValue] of translationReplacements) {
  translations = replaceRequired(
    translations,
    legacyValue,
    brandedValue,
    `translation ${legacyValue}`,
  );
}
write('src/translations.ts', translations);

write(
  'src/hooks/useSEO.ts',
  `import { useEffect } from 'react';
import { BRAND } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';

const applyBrandTokens = (value: string): string => {
  const brandedValue = value
    .replaceAll('{{brand}}', BRAND.displayName)
    .replaceAll('{{product}}', BRAND.productName);

  return BRAND.legacyNames.reduce(
    (result, legacyName) => result.replaceAll(legacyName, BRAND.displayName),
    brandedValue,
  );
};

export const useSEO = (titleKey: string, descriptionKey: string) => {
  const { t } = useAppContext();
  const title = applyBrandTokens(t(titleKey));
  const description = applyBrandTokens(t(descriptionKey));

  useEffect(() => {
    document.title = title;

    let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
  }, [description, title]);
};
`,
);

let designs = read('src/features/designs/Designs.tsx');
if (!designs.includes("import { BRAND } from '@/config/brand';")) {
  designs = designs.replace(
    "import React, {\n",
    "import React, {\n",
  );
  designs = designs.replace(
    "import { useAppContext } from '../../contexts/AppContext';",
    "import { BRAND } from '@/config/brand';\nimport { useAppContext } from '../../contexts/AppContext';",
  );
}
designs = replaceRequired(
  designs,
  '            BGD/INK Studio',
  '            {BRAND.productName}',
  'My Designs brand label',
);
write('src/features/designs/Designs.tsx', designs);

let platformConfig = read('src/config/platform.ts');
if (!platformConfig.includes("import { BRAND } from './brand';")) {
  platformConfig = platformConfig.replace(
    "import { Language } from '../types';",
    "import { Language } from '../types';\nimport { BRAND } from './brand';",
  );
}
platformConfig = platformConfig.replace(
  "    en: 'This draft is stored only on this device. It is not a confirmed order and has not been sent to BGD/INK.',",
  "    en: `This draft is stored only on this device. It is not a confirmed order and has not been sent to ${BRAND.displayName}.`,",
);
platformConfig = platformConfig.replace(
  "    ar: 'هذه المسودة محفوظة على هذا الجهاز فقط. ليست طلباً مؤكداً ولم تُرسل إلى BGD/INK.',",
  "    ar: `هذه المسودة محفوظة على هذا الجهاز فقط. ليست طلباً مؤكداً ولم تُرسل إلى ${BRAND.displayName}.`,",
);
write('src/config/platform.ts', platformConfig);

let apiIndex = read('src/services/api/index.ts');
apiIndex = apiIndex.replace(
  '  PlatformApi,\n',
  '  CatalogApi,\n  PlatformApi,\n',
);
write('src/services/api/index.ts', apiIndex);

let catalog = read('src/features/catalog/Catalog.tsx');
catalog = catalog.replace(
  "import { isAbortError, platformApi } from '../../services/api';",
  "import { isAbortError, platformApi, type CatalogApi } from '../../services/api';",
);
catalog = catalog.replace(
  '  busyProductId?: string | null;\n}',
  '  busyProductId?: string | null;\n  catalogApi?: CatalogApi;\n}',
);
catalog = catalog.replace(
  '  busyProductId = null,\n}) => {',
  '  busyProductId = null,\n  catalogApi = platformApi.catalog,\n}) => {',
);
catalog = catalog.replace('    platformApi.catalog\n', '    catalogApi\n');
catalog = catalog.replace('  }, [reloadToken]);', '  }, [catalogApi, reloadToken]);');
write('src/features/catalog/Catalog.tsx', catalog);

write(
  'src/features/customizer/artworkValidation.ts',
  `export const MAX_ARTWORK_BYTES = 5 * 1024 * 1024;

const ALLOWED_ARTWORK_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export type ArtworkValidationError = 'unsupported-type' | 'file-too-large';

export const validateArtworkFile = (
  file: Pick<File, 'size' | 'type'>,
): ArtworkValidationError | null => {
  if (!ALLOWED_ARTWORK_TYPES.has(file.type)) {
    return 'unsupported-type';
  }

  if (file.size > MAX_ARTWORK_BYTES) {
    return 'file-too-large';
  }

  return null;
};
`,
);

let customizer = read('src/features/customizer/Customizer.tsx');
customizer = customizer.replace(
  "import { Scene } from './Scene';",
  "import { Scene } from './Scene';\nimport { validateArtworkFile } from './artworkValidation';",
);
customizer = customizer.replace(
  "\nconst MAX_ARTWORK_BYTES = 5 * 1024 * 1024;\nconst ALLOWED_ARTWORK_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);\n",
  '\n',
);
const validationStart = customizer.indexOf('    if (!ALLOWED_ARTWORK_TYPES.has(file.type)) {');
const validationEndMarker = '    setIsUploading(true);';
if (validationStart === -1 || !customizer.includes(validationEndMarker)) {
  throw new Error('Could not extract customizer artwork validation.');
}
const validationEnd = customizer.indexOf(validationEndMarker, validationStart);
customizer =
  customizer.slice(0, validationStart) +
  `    const validationError = validateArtworkFile(file);
    if (validationError) {
      const message =
        validationError === 'unsupported-type'
          ? language === 'ar'
            ? 'ارفع صورة PNG أو JPG أو WebP.'
            : 'Upload a PNG, JPG, or WebP image.'
          : language === 'ar'
            ? 'حجم الصورة أكبر من 5 ميغابايت.'
            : 'Artwork must be 5 MB or smaller.';

      showToast(message, 'error');
      return;
    }

` +
  customizer.slice(validationEnd);
write('src/features/customizer/Customizer.tsx', customizer);

write(
  'src/features/checkout/validation.ts',
  `import { z } from 'zod';

export const BAGHDAD_AREAS = [
  'Al-Mansour',
  'Al-Karrada',
  'Al-Jadriya',
  'Al-Yarmouk',
  'Al-Dora',
  'Zayouna',
  'Al-Adhamiya',
  'Al-Shaab',
  'Baghdad Al-Jadida',
  'Al-Hurriya',
  'Al-Ghazaliya',
  'Hayy Al-Jamia',
  'Al-Amiriya',
  'Al-Saydiya',
  'Other',
] as const;

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(3, 'error.min'),
  phone: z.string().trim().regex(/^07\\d{9}$/, 'error.phone'),
  area: z.string().min(1, 'error.required'),
  street: z.string().trim().min(1, 'error.required'),
  house: z.string().trim(),
});
`,
);

let checkout = read('src/features/checkout/Checkout.tsx');
checkout = checkout.replace("import { z } from 'zod';\n", '');
checkout = checkout.replace(
  "import { submitOrder } from './services';",
  "import { submitOrder } from './services';\nimport { BAGHDAD_AREAS, checkoutSchema } from './validation';",
);
const checkoutConstantsStart = checkout.indexOf('const BAGHDAD_AREAS = [');
const checkoutConstantsEndMarker = '\n\nexport const Checkout:';
if (checkoutConstantsStart === -1 || !checkout.includes(checkoutConstantsEndMarker)) {
  throw new Error('Could not extract checkout validation.');
}
const checkoutConstantsEnd = checkout.indexOf(checkoutConstantsEndMarker, checkoutConstantsStart);
checkout =
  checkout.slice(0, checkoutConstantsStart) +
  checkout.slice(checkoutConstantsEnd + 2);
write('src/features/checkout/Checkout.tsx', checkout);

write(
  'src/features/customizer/Scene.tsx',
  `import React, { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ProductType, Theme, DecalLayer } from '@/types';
import { ProceduralFallback, ShirtModel } from './ShirtModel';

interface SceneProps {
  productId: string;
  productType: ProductType;
  color: string;
  theme: Theme;
  decals: DecalLayer[];
  activeDecalId: string | null;
  enableControls: boolean;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends React.Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    if (import.meta.env.DEV) {
      console.error('3D model load failed:', error);
    }
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export const Scene: React.FC<SceneProps> = ({
  productId,
  productType,
  color,
  theme,
  decals,
  activeDecalId,
  enableControls,
  onDecalChange,
  setDraggingDecal,
}) => {
  const isDark = theme === 'dark';

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4], fov: 45 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => setDraggingDecal(false)}
    >
      <ambientLight intensity={isDark ? 0.7 : 1.1} />
      <hemisphereLight
        intensity={isDark ? 0.55 : 0.8}
        color={isDark ? '#dbeafe' : '#ffffff'}
        groundColor={isDark ? '#111827' : '#d4d4d8'}
      />
      <directionalLight
        castShadow
        intensity={isDark ? 1.6 : 2.1}
        position={[3, 5, 4]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight intensity={0.65} position={[-4, 2, -3]} />

      <ModelErrorBoundary fallback={<ProceduralFallback color={color} />}>
        <ShirtModel
          productId={productId}
          type={productType}
          color={color}
          decals={decals}
          activeDecalId={activeDecalId}
          onDecalChange={onDecalChange}
          setDraggingDecal={setDraggingDecal}
        />
      </ModelErrorBoundary>

      <OrbitControls
        makeDefault
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={6}
        enabled={enableControls}
      />
    </Canvas>
  );
};
`,
);

write(
  'src/features/catalog/Catalog.test.tsx',
  `import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/contexts/AppContext';
import { ProductType, type Product } from '@/types';
import type { CatalogApi } from '@/services/api';
import { Catalog } from './Catalog';

const product: Product = {
  id: 'classic-shirt',
  name: 'product.classic_tshirt',
  type: ProductType.TSHIRT,
  basePrice: 25_000,
  colors: ['#000000'],
  image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  inStock: true,
};

describe('Catalog failure recovery', () => {
  it('shows a retry action and recovers after a failed catalog request', async () => {
    const listProducts = vi
      .fn<CatalogApi['listProducts']>()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce([product]);

    render(
      <AppProvider>
        <Catalog
          onSelectProduct={vi.fn()}
          catalogApi={{ listProducts }}
        />
      </AppProvider>,
    );

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Products could not be loaded');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('button', { name: /Classic T-Shirt/ }),
    ).toBeInTheDocument();
    expect(listProducts).toHaveBeenCalledTimes(2);
  });
});
`,
);

write(
  'src/features/customizer/artworkValidation.test.ts',
  `import { describe, expect, it } from 'vitest';
import { MAX_ARTWORK_BYTES, validateArtworkFile } from './artworkValidation';

describe('artwork validation', () => {
  it('accepts supported artwork at the size limit', () => {
    expect(
      validateArtworkFile({ type: 'image/png', size: MAX_ARTWORK_BYTES }),
    ).toBeNull();
  });

  it('rejects unsupported files', () => {
    expect(
      validateArtworkFile({ type: 'application/pdf', size: 1024 }),
    ).toBe('unsupported-type');
  });

  it('rejects artwork larger than five megabytes', () => {
    expect(
      validateArtworkFile({ type: 'image/webp', size: MAX_ARTWORK_BYTES + 1 }),
    ).toBe('file-too-large');
  });
});
`,
);

write(
  'src/features/checkout/validation.test.ts',
  `import { describe, expect, it } from 'vitest';
import { checkoutSchema } from './validation';

describe('checkout validation', () => {
  it('normalizes a valid Iraqi delivery form', () => {
    expect(
      checkoutSchema.parse({
        fullName: '  Yasser Test  ',
        phone: '07701234567',
        area: 'Al-Mansour',
        street: '  Street 10  ',
        house: '  House 4  ',
      }),
    ).toEqual({
      fullName: 'Yasser Test',
      phone: '07701234567',
      area: 'Al-Mansour',
      street: 'Street 10',
      house: 'House 4',
    });
  });

  it('rejects an invalid Iraqi phone number', () => {
    const result = checkoutSchema.safeParse({
      fullName: 'Yasser Test',
      phone: '12345',
      area: 'Al-Mansour',
      street: 'Street 10',
      house: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('error.phone');
    }
  });

  it('requires an area and street address', () => {
    const result = checkoutSchema.safeParse({
      fullName: 'Yasser Test',
      phone: '07701234567',
      area: '',
      street: '',
      house: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['area', 'street']),
      );
    }
  });
});
`,
);

write(
  'src/contexts/AppContext.test.tsx',
  `import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider, useAppContext } from './AppContext';

const LanguageProbe = () => {
  const { language, setLanguage, t } = useAppContext();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="catalog-label">{t('nav.catalog')}</span>
      <button type="button" onClick={() => setLanguage('ar')}>
        Arabic
      </button>
    </div>
  );
};

beforeEach(() => {
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
});

describe('AppProvider language direction', () => {
  it('switches the document and translations to Arabic RTL', () => {
    render(
      <AppProvider>
        <LanguageProbe />
      </AppProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Arabic' }));

    expect(screen.getByTestId('language')).toHaveTextContent('ar');
    expect(screen.getByTestId('catalog-label')).toHaveTextContent('الموديلات');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
});
`,
);

write(
  'e2e/mobile-navigation.spec.ts',
  `import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

test('supports mobile navigation and Arabic RTL interaction', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' }),
  ).toHaveAttribute('aria-hidden', 'false');

  await page.getByRole('button', { name: 'My Designs' }).click();
  await expect(page).toHaveURL('/designs');

  await page.getByRole('button', { name: 'Switch to Arabic' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'الموديلات' }).click();
  await expect(page).toHaveURL('/catalog');
});
`,
);

write(
  'scripts/check-environment.mjs',
  `import { readFileSync } from 'node:fs';

const expectedNode = readFileSync('.nvmrc', 'utf8').trim();
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const expectedNpm = String(packageJson.packageManager ?? '').replace(/^npm@/, '');
const currentNode = process.versions.node;
const npmUserAgent = process.env.npm_config_user_agent ?? '';
const currentNpm = npmUserAgent.match(/npm\\/([^\\s]+)/)?.[1] ?? null;

const failures = [];

if (currentNode !== expectedNode) {
  failures.push(\`Node.js \${expectedNode} is required; received \${currentNode}.\`);
}

if (currentNpm && currentNpm !== expectedNpm) {
  failures.push(\`npm \${expectedNpm} is required; received \${currentNpm}.\`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(\`ERROR  \${failure}\`));
  process.exitCode = 1;
} else {
  console.log(\`Environment validated: Node.js \${currentNode}, npm \${currentNpm ?? expectedNpm}.\`);
  console.log('No application secrets or remote-backend environment variables are required.');
}
`,
);

write(
  'scripts/check-brand-boundaries.mjs',
  `import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = path.resolve('src');
const ALLOWED_FILE = path.join(SOURCE_ROOT, 'config', 'brand.ts');
const patterns = [
  ['legacy English brand', /\\bASHUS\\b/g],
  ['legacy Arabic brand', /اشوز/g],
  ['hard-coded display brand', /BGD\\/INK/g],
  ['hard-coded plain brand', /BGD INK/g],
];

const walk = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const filePath = path.join(directory, entry);
    return statSync(filePath).isDirectory() ? walk(filePath) : [filePath];
  });

const failures = [];

for (const filePath of walk(SOURCE_ROOT)) {
  if (!/\\.(ts|tsx)$/.test(filePath) || filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) {
    continue;
  }
  if (filePath === ALLOWED_FILE) continue;

  const content = readFileSync(filePath, 'utf8');
  for (const [label, pattern] of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      failures.push(\`\${path.relative(process.cwd(), filePath)} contains a \${label} literal.\`);
    }
  }
}

if (failures.length > 0) {
  console.error('Brand source-of-truth validation failed:');
  failures.forEach((failure) => console.error(\`  - \${failure}\`));
  process.exitCode = 1;
} else {
  console.log('Brand source-of-truth validation passed.');
}
`,
);

write(
  'scripts/check-import-boundaries.mjs',
  `import { readFileSync, readdirSync, statSync } from 'node:fs';
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
  const pattern = /(?:from\\s+|import\\s*\\(\\s*|import\\s+)(['"])([^'"]+)\\1/g;
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
  if (!/\\.(ts|tsx)$/.test(importer)) continue;
  const importerRelative = path.relative(SOURCE_ROOT, importer).replaceAll('\\\\', '/');
  const importerParts = importerRelative.split('/');
  const importerTop = importerParts[0];
  const importerFeature = importerTop === 'features' ? importerParts[1] : null;

  for (const specifier of importSpecifiers(readFileSync(importer, 'utf8'))) {
    if (specifier.startsWith('../')) {
      failures.push(\`\${importerRelative} uses parent-relative import "\${specifier}"; use @/ instead.\`);
    }

    const target = resolveTarget(importer, specifier);
    if (!target || !target.startsWith(SOURCE_ROOT)) continue;

    const targetRelative = path.relative(SOURCE_ROOT, target).replaceAll('\\\\', '/');
    const targetParts = targetRelative.split('/');
    const targetTop = targetParts[0];
    const targetFeature = targetTop === 'features' ? targetParts[1] : null;

    if (
      targetTop === 'features' &&
      importerRelative !== 'App.tsx' &&
      (importerTop !== 'features' || importerFeature !== targetFeature)
    ) {
      failures.push(
        \`\${importerRelative} imports feature internals from \${targetRelative}; only App.tsx may compose features.\`,
      );
    }

    const disallowed = disallowedTargets[importerTop];
    if (disallowed?.has(targetTop)) {
      failures.push(
        \`\${importerRelative} crosses the \${importerTop} boundary by importing \${targetRelative}.\`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('Import-boundary validation failed:');
  failures.forEach((failure) => console.error(\`  - \${failure}\`));
  process.exitCode = 1;
} else {
  console.log('Import-boundary validation passed.');
}
`,
);

write(
  'docs/TROUBLESHOOTING.md',
  `# BGD/INK Studio troubleshooting

## The 3D product does not load

Run \`git lfs install\` before cloning or pulling the repository, then run:

\`\`\`bash
git lfs pull
\`\`\`

Confirm the model files are not small Git LFS pointer text files. The editor shows a procedural fallback when a product model fails, but the fallback is not a production-accurate garment.

## A saved design disappeared

Local drafts are stored in IndexedDB and are tied to the current browser profile and device. Check that:

- Private browsing is disabled.
- Browser storage has not been cleared.
- Storage access is not blocked by privacy settings.
- The same browser profile is being used.

There is no cloud synchronization or account recovery in the local prototype.

## Artwork cannot be uploaded

The local editor accepts PNG, JPEG, and WebP files up to 5 MB. Verify that the browser can use IndexedDB and that the device has enough free storage.

## A direct route returns 404 after deployment

The host must route unknown application paths to \`index.html\`. Netlify uses \`public/_redirects\`. Other hosts need an equivalent single-page application fallback.

## Playwright cannot start Chromium

Install the browser and its system dependencies:

\`\`\`bash
npx playwright install --with-deps chromium
\`\`\`

Then rerun:

\`\`\`bash
npm run test:e2e
\`\`\`

## Validation reports the wrong Node.js or npm version

Use the pinned runtime:

\`\`\`bash
nvm use
npm ci
\`\`\`

The required versions are stored in \`.nvmrc\` and \`package.json\`.

## A bundle budget fails

Run:

\`\`\`bash
npm run build
npm run check:bundle
\`\`\`

The report identifies the failing initial, lazy, total JavaScript, or CSS measurement. Optimize or split the bundle instead of raising a limit automatically.
`,
);

let bundleBudgetScript = read('scripts/check-bundle-budget.mjs');
bundleBudgetScript = replaceRequired(
  bundleBudgetScript,
  "const budgetPath = path.join(rootDirectory, 'config', 'bundle-budgets.json');",
  "const budgetPath = path.join(rootDirectory, 'src', 'config', 'bundle-budgets.json');",
  'bundle budget configuration path',
);
write('scripts/check-bundle-budget.mjs', bundleBudgetScript);

const packageJson = JSON.parse(read('package.json'));
packageJson.scripts['check:environment'] = 'node scripts/check-environment.mjs';
packageJson.scripts['check:brand'] = 'node scripts/check-brand-boundaries.mjs';
packageJson.scripts['check:boundaries'] = 'node scripts/check-import-boundaries.mjs';
packageJson.scripts.check =
  'npm run check:environment && npm run typecheck && npm run lint && npm run check:brand && npm run check:boundaries && npm run test:unit && npm run build && npm run check:bundle';
write('package.json', JSON.stringify(packageJson, null, 2));

write(
  'src/config/bundle-budgets.json',
  JSON.stringify(
    {
      initialJavaScriptGzipKiB: 140,
      initialCssGzipKiB: 13,
      maximumAsyncJavaScriptChunkGzipKiB: 230,
      maximumJavaScriptChunkKiB: 800,
      totalJavaScriptGzipKiB: 410,
      totalJavaScriptKiB: 1400,
      totalCssGzipKiB: 15,
    },
    null,
    2,
  ),
);

if (existsSync(absolute('config/bundle-budgets.json'))) {
  throw new Error('The old root config directory still exists after source migration.');
}

const sourceFiles = walk('src').filter((filePath) => /\.(ts|tsx)$/.test(filePath));

const toAlias = (importerPath, specifier) => {
  const resolved = path.resolve(path.dirname(absolute(importerPath)), specifier);
  const relative = path.relative(absolute('src'), resolved).replaceAll('\\', '/');
  return relative.startsWith('..') ? specifier : `@/${relative}`;
};

for (const filePath of sourceFiles) {
  let content = read(filePath);

  const patterns = [
    /(\bfrom\s+)(['"])(\.\.\/[^'"]+)\2/g,
    /(\bimport\s*\(\s*)(['"])(\.\.\/[^'"]+)\2/g,
    /(\bimport\s+)(['"])(\.\.\/[^'"]+)\2/g,
  ];

  for (const pattern of patterns) {
    content = content.replace(pattern, (match, prefix, quote, specifier) => {
      return `${prefix}${quote}${toAlias(filePath, specifier)}${quote}`;
    });
  }

  if (filePath === 'src/App.tsx') {
    content = content.replace(
      /(\bfrom\s+)(['"])(\.\/[^'"]+)\2/g,
      (match, prefix, quote, specifier) =>
        `${prefix}${quote}@/${specifier.slice(2)}${quote}`,
    );
    content = content.replace(
      /(\bimport\s*\(\s*)(['"])(\.\/[^'"]+)\2/g,
      (match, prefix, quote, specifier) =>
        `${prefix}${quote}@/${specifier.slice(2)}${quote}`,
    );
  }

  write(filePath, content);
}

write(
  'README.md',
  `# BGD/INK Studio

BGD/INK Studio is a bilingual English/Arabic local prototype for designing and previewing custom-printed apparel in 3D.

> Designs, artwork, checkout fields, and submitted draft summaries stay on the current device. They are not sent to a shop, synchronized between devices, or written to a production database.

## P0 and P1 status

P0 and P1 are complete on \`agent/bgd-ink-p0-foundation\`:

- Central BGD/INK brand configuration and enforced brand source of truth
- Removed public prototype admin access, hardcoded PINs, client-side secrets, and false offline claims
- Compiled Tailwind CSS, strict TypeScript, warning-free ESLint, and Prettier
- Source code under \`src/\` with the \`@/\` alias and enforced import boundaries
- Recoverable URL routes, IndexedDB artwork and drafts, checkout recovery, and My Designs
- Unit, component, accessibility, desktop Chromium, mobile touch, and Arabic RTL coverage
- Pinned Node/npm, locked \`npm ci\`, CI caching, and route-aware bundle budgets
- Troubleshooting and prototype-safety documentation

P2 is the next phase and will rebuild the customizer around accurate product models, physical print areas, richer layer operations, artwork quality checks, and production proofs.

## Brand

Brand values live only in \`src/config/brand.ts\`:

- Customer-facing name: **BGD/INK**
- Product name: **BGD/INK Studio**
- Tagline: **Design it. Wear it.** / **صمّمها والبسها**
- Primary market: Baghdad, Iraq

\`npm run check:brand\` prevents customer-facing source files from reintroducing old or hardcoded brand literals.

## Technology

- React 18 and strict TypeScript
- Vite and compiled Tailwind CSS 4
- React Three Fiber, Drei, and Three.js
- GSAP
- IndexedDB for local drafts and original artwork blobs
- Vitest, Testing Library, fake IndexedDB, and axe
- Playwright for desktop and mobile Chromium journeys
- ESLint and Prettier

## Requirements

- Node.js **22.23.1**
- npm **10.9.8**
- Git LFS for GLB assets

## Local development

\`\`\`bash
git lfs install
nvm use
npm ci
npm run dev
\`\`\`

No application secret or remote-backend environment variable is required.

## Validation

\`\`\`bash
npm run check
npm run test:e2e
\`\`\`

The fast gate performs:

\`\`\`text
environment validation
→ strict TypeScript
→ warning-free ESLint
→ brand source-of-truth validation
→ import-boundary validation
→ unit, component, and accessibility tests
→ production build
→ bundle budgets
\`\`\`

Additional commands:

\`\`\`bash
npm run typecheck
npm run lint
npm run check:environment
npm run check:brand
npm run check:boundaries
npm run test
npm run test:unit
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
npm run format:check
npm run format
npm run build
npm run check:bundle
npm run preview
\`\`\`

## Routes

| Route | Purpose |
| --- | --- |
| \`/\` | Landing page |
| \`/catalog\` | Product selection |
| \`/designs\` | Recent local designs |
| \`/studio/:draftId\` | Recoverable 3D editor |
| \`/checkout/:draftId\` | Recoverable delivery form |
| \`/draft/:draftId\` | Local draft confirmation |

Browser Back/Forward navigation is supported. Netlify direct-route fallback is provided through \`public/_redirects\`.

## Local draft model

IndexedDB stores:

- Draft name, product, color, size, and notes
- Original PNG, JPEG, or WebP artwork blobs
- Layer position, rotation, scale, ordering, and active selection
- Checkout contact and address fields
- Local submission linkage

The My Designs workspace can reopen, rename, duplicate, and permanently delete local designs. Duplicate designs receive independent artwork blobs.

## Source architecture

\`\`\`text
src/
  components/       shared presentation
  config/           brand, capability, and budget configuration
  contexts/         language, theme, and toast state
  data/             prototype products and 3D asset metadata
  features/         route-level customer experiences
  hooks/            shared React hooks
  routing/          History API routing
  services/         local application and IndexedDB services
  utils/            browser prototype helpers
  App.tsx           feature composition root
  main.tsx          browser entry point
  translations.ts   English and Iraqi Arabic copy
  types.ts          shared domain types
\`\`\`

Cross-area imports use \`@/\`. Features cannot import another feature's internals, and lower-level modules cannot depend on feature or UI layers. \`npm run check:boundaries\` enforces these rules.

## Performance budgets

The build manifest is measured for initial assets, lazy assets, total JavaScript, and CSS. The limits are stored in \`src/config/bundle-budgets.json\`. The 3D ecosystem is split into dedicated lazy vendor chunks rather than one monolithic customizer file.

A budget change must be intentional and reviewed; it should not be the automatic response to a regression.

## Prototype safety boundaries

- There is no public admin portal.
- There are no browser-exposed API keys.
- Local submission creates a draft, not a confirmed order.
- Clearing browser storage can permanently remove local designs.
- There is no account recovery or cross-device synchronization.
- WhatsApp actions appear only when a real destination is configured.
- PWA/offline claims remain disabled until reliable caching is implemented.

Do not use the local prototype for real customer orders or sensitive production data.

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for Git LFS, IndexedDB, artwork upload, WebGL, deployment routing, Playwright, runtime, and bundle-budget guidance.

## Roadmap

The maintained P0-P4 checklist lives in [tasks.md](tasks.md).
`,
);

write(
  'tasks.md',
  `# BGD/INK Studio Roadmap

## Project objective

Build a production-grade bilingual custom-printing platform for Baghdad with an accurate 3D editor, durable artwork storage, secure order processing, and practical staff operations.

## P0 — Safe foundation and rebrand — COMPLETE

- [x] Create \`agent/bgd-ink-p0-foundation\` from \`main\`.
- [x] Introduce one centralized BGD/INK brand configuration.
- [x] Replace customer-facing ASHUS and اشوز references with brand tokens.
- [x] Rename package, metadata, manifest, document title, header, footer, preloader, draft prefix, and storage namespace.
- [x] Preserve legacy \`ashus_*\` browser data through a non-destructive migration.
- [x] Remove browser-exposed Gemini/API-key configuration.
- [x] Remove the hardcoded client-side admin PIN and public admin entry.
- [x] Label browser persistence and submitted designs explicitly as local prototype drafts.
- [x] Keep typed local product, artwork, draft, and submission service boundaries.
- [x] Remove misleading service-worker and offline-mode claims.
- [x] Replace the false completed checklist with the maintained P0-P4 roadmap.
- [x] Enforce the brand source of truth in CI.

## P1 — Engineering foundation — COMPLETE

- [x] Compile Tailwind locally and move global styles out of \`index.html\`.
- [x] Remove the import map and runtime Tailwind CDN.
- [x] Move application source under \`src/\`.
- [x] Configure the \`@/\` module alias and enforce architectural import boundaries.
- [x] Enable strict TypeScript.
- [x] Add warning-free ESLint and Prettier.
- [x] Add environment and runtime validation.
- [x] Add unit, component, failure-state, accessibility, Arabic RTL, and mobile interaction tests.
- [x] Add Playwright customer recovery and mobile navigation journeys.
- [x] Add GitHub Actions for locked install, typecheck, lint, tests, build, budgets, and browser journeys.
- [x] Add real routes for catalog, designs, editor, checkout, and draft confirmation.
- [x] Add recoverable IndexedDB drafts, original artwork blobs, autosave, and checkout recovery.
- [x] Add the My Designs reopen, rename, duplicate, and delete workspace.
- [x] Replace AI Studio documentation with setup, architecture, deployment, safety, and troubleshooting guidance.
- [x] Pin Node.js and npm, commit the lockfile, use cached \`npm ci\`, and cancel superseded CI runs.
- [x] Split the 3D dependency graph into lazy vendor chunks and enforce tighter production bundle budgets.

## Deferred production decisions — not a P1 blocker

- [ ] Confirm business, hosting, inventory, staff, order, and data-retention requirements.
- [ ] Select and implement a secure production catalog and order architecture.
- [ ] Add authenticated staff operations outside the public storefront.
- [ ] Store products, variants, pricing, stock, customers, and orders in the selected production system.
- [ ] Store original artwork and generated derivatives in durable object storage.

## P2 — Production-grade customizer

- [ ] Use a genuine optimized 3D model for every sellable product.
- [ ] Define front, back, sleeve, and other physical print areas in centimeters.
- [ ] Add front, back, and sleeve surface selection.
- [ ] Constrain artwork to printable surfaces and warn about seams or unsafe placement.
- [ ] Add undo and redo.
- [ ] Add layer duplicate, visibility, ordering, and rename controls.
- [ ] Add precise physical dimensions.
- [ ] Add image-resolution, transparency, aspect-ratio, and estimated-DPI checks.
- [ ] Add permanent production upload before accepting a real order.
- [ ] Distinguish mobile camera gestures from artwork movement.
- [ ] Add adaptive render quality, WebGL fallback, and context recovery.
- [ ] Generate a saved 2D proof and machine-readable production specification.
- [ ] Keep original artwork separate from preview and production derivatives.
- [ ] Optimize GLB assets and production textures with measured limits.

## P3 — Premium storefront and customer journey

- [ ] Establish the complete BGD/INK identity and owned visual asset library.
- [ ] Replace generic stock imagery, emoji, and unverified testimonials.
- [ ] Add real product photography and completed customer work.
- [ ] Add price ranges, production times, size guides, and printing-method explanations.
- [ ] Add quantities, variants, stock, delivery fees, and estimated delivery dates.
- [ ] Complete the Iraqi Arabic and RTL content review.
- [ ] Add real contact information, policies, care guidance, and frequently asked questions.
- [ ] Keep motion intentional, accessible, and restrained.
- [ ] Finish a touch-first mobile customizer and checkout.
- [ ] Link reviews to real orders or remove them.

## P4 — Operations, PWA, SEO, and growth

- [ ] Add production queues, artwork approval, status timelines, and staff audit trails.
- [ ] Create production work orders and inventory reservations from validated customer orders.
- [ ] Add WhatsApp notifications as a communication channel, not the order database.
- [ ] Add delivery tracking, coupons, campaigns, corporate accounts, bulk orders, and repeat orders.
- [ ] Add consent-aware analytics and error monitoring.
- [ ] Add structured product data, canonical URLs, social cards, sitemap, and robots controls.
- [ ] Add owned PWA icons and reliable Workbox caching with upgrade handling.
- [x] Enforce production performance budgets.

## Definition of done

A phase is complete only when its behavior, failure states, tests, documentation, dependency lock, architecture checks, performance budgets, and deployment checks all pass. Visual completion alone is not completion.
`,
);

console.log('P0/P1 migration prepared. Run formatting, validation, and browser tests next.');
