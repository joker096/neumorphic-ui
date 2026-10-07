import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const buildDate = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default defineConfig({
  define: {
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // `exclude` replaces vitest's defaults, so dist/** must be listed
    // explicitly: a build output can carry test-named artifacts (stale copies
    // or hashed chunks) that would otherwise be collected as duplicate suites
    // and make the run counts depend on whatever the last build left behind.
    exclude: ['e2e/**', 'admin/**', 'dist/**', 'android/**', 'node_modules/**', '.kilo/**', '.agents/**', '.qwen/**', '.kilocode/**'],
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
