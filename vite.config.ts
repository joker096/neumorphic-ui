import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "style-src-attr 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
        "connect-src 'self' ws: wss: https: http://localhost:*",
        "media-src 'self' blob: https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('lucide-react') || id.includes('zustand')) {
              return 'vendor';
            }
            if (id.includes('motion')) {
              return 'motion';
            }
            if (id.includes('crypto-js') || id.includes('tweetnacl') || id.includes('@privacyresearch/libsignal-protocol-typescript') || id.includes('@noble/post-quantum')) {
              return 'crypto';
            }
            return 'vendor';
          }
          if (id.includes('src/lib/i18n')) {
            return 'i18n';
          }
          if (id.includes('src/components/ui')) {
            return 'ui';
          }
          if (id.includes('src/components/app')) {
            return 'app';
          }
          if (id.includes('src/components/chat')) {
            return 'chat';
          }
          if (id.includes('src/components/features')) {
            return 'features';
          }
          if (id.includes('src/lib/call') || id.includes('src/components/call')) {
            return 'call';
          }
          return undefined;
        },
      },
    },
  },
});
