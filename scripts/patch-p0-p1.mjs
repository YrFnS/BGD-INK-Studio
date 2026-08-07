import { readFileSync, writeFileSync } from 'node:fs';

const indexedDbPath = 'src/services/drafts/indexedDb.ts';
let indexedDbContent = readFileSync(indexedDbPath, 'utf8');

const oldMessage =
  "        'Another tab is blocking the design database. Close older BGD/INK tabs and try again.',";
const nextMessage =
  '        `Another tab is blocking the design database. Close older ${BRAND.displayName} tabs and try again.`,';

if (!indexedDbContent.includes(oldMessage) && !indexedDbContent.includes(nextMessage)) {
  throw new Error('The IndexedDB blocked-tab message was not found.');
}

indexedDbContent = indexedDbContent.replace(oldMessage, nextMessage);
writeFileSync(indexedDbPath, indexedDbContent);

writeFileSync(
  'vite.config.ts',
  `import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const manualChunks = (id: string): string | undefined => {
  const normalizedId = id.replaceAll('\\\\', '/');

  if (normalizedId.includes('/node_modules/three/')) {
    return 'three-core';
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
