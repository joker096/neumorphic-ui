import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAppStorage, useAppStore } from "./store";
import { I18nProvider, preloadLocales } from "./lib/i18n";
import { ErrorBoundary } from "./components/resilience";

const installRuntimeGuards = () => {
  window.addEventListener("error", (event) => {
    console.error("Window error:", event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });
};

const bootstrap = async () => {
  try {
     await initAppStorage();
     useAppStore.persist.rehydrate();
     await preloadLocales();
  } catch (e) {
     console.error("Failed to initialize storage keys", e);
  }

  installRuntimeGuards();

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }
  
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
};

bootstrap();
