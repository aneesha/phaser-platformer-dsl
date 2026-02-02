import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/playground',
  build: {
    outDir: '../../dist/playground',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3001,
    open: true,
  },
});
