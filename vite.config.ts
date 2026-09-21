import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import compression from 'vite-plugin-compression';

const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const buildDate = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default defineConfig({
  define: {
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [
    {
      name: 'html-no-cache',
      configurePreviewServer(server) {
        server.middlewares.use((req, res) => {
          const url = (req.url || '').split('?')[0];
          if (url === '/' || url.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        });
      },
    },
    react(),
    tailwindcss(),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "style-src-attr 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' wss: https:",
        "media-src 'self' blob: data: https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Expect-CT': 'max-age=86400, enforce',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()',
    },
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8766',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_SIGNALING_WS_TARGET || 'ws://127.0.0.1:8971',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'wasm-unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "style-src-attr 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' wss: https:",
        "media-src 'self' blob: data: https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Expect-CT': 'max-age=86400, enforce',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()',
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    modulePreload: { polyfill: true },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        embed: path.resolve(__dirname, 'src/embed-entry.tsx'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'embed' ? 'embed.js' : 'assets/[name]-[hash].js',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-dom/client'],
          state: ['zustand'],
          crypto: ['tweetnacl'],
          animation: ['motion'],
          icons: ['lucide-react'],
          ui: ['@tanstack/react-virtual', 'sonner'],
        },
      },
    },
    manifest: false,
    reportCompressedSize: false,
  },
});
