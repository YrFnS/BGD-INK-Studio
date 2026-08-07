import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      gsap: fileURLToPath(new URL('./src/utils/gsap-lite.ts', import.meta.url)),
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
