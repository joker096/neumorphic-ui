import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Increase chunk size warning limit since this is a complex application
      // with crypto, p2p, and other heavy dependencies
      chunkSizeWarningLimit: 500, // 500 KB
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('lucide-react') || id.includes('zustand')) {
                return 'vendor';
              }
              if (id.includes('motion')) {
                return 'motion';
              }
              if (id.includes('crypto-js') || id.includes('tweetnacl') || id.includes('@privacyresearch/libsignal-protocol-typescript')) {
                return 'crypto';
              }
              return 'vendor';
            }
            if (id.includes('src/lib/p2p/')) {
              return 'p2p';
            }
            if (id.includes('src/lib/crypto/')) {
              return 'crypto';
            }
            if (id.includes('src/components/ui/')) {
              return 'ui';
            }
            if (id.includes('src/components/')) {
              return 'components';
            }
            if (id.includes('src/lib/')) {
              return 'lib';
            }
          },
        },
      },
    },
  };
});
