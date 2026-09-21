import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
