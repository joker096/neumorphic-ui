import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAppStorage, useAppStore } from './store';
import { I18nProvider } from './lib/i18n';
import { preloadLocales } from './lib/i18n';

const bootstrap = async () => {
  try {
     await initAppStorage();
     useAppStore.persist.rehydrate();
     await preloadLocales();
  } catch (e) {
     console.error("Failed to initialize storage keys", e);
  }

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }
  
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
};

bootstrap();
