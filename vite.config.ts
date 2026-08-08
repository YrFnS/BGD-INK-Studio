import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const manualChunks = (id: string): string | undefined => {
  const normalizedId = id.replaceAll('\\', '/');

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
  plugins: [tailwindcss()],
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
      gsap: fileURLToPath(new URL('./src/utils/gsap-lite.ts', import.meta.url)),
    },
  },
});
