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
      // The admin SPA carries its own React copy in admin/node_modules. A root
      // test that renders an admin component would otherwise load two React
      // instances and the hooks would break ("Cannot read properties of null").
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      react: path.resolve(__dirname, './node_modules/react'),
      // The router lives in the admin package only. It is aliased as well so a
      // root test can render an admin page (and mock the router) instead of
      // failing to resolve the module.
      'react-router-dom': path.resolve(__dirname, './admin/node_modules/react-router-dom'),
    },
  },
});
