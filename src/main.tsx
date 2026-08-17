import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { I18nProvider } from "./lib/i18n";
import { ErrorBoundary } from "./components/resilience";
import { initPerformanceMonitoring } from "./lib/performance";
import { AnimationProvider } from "./contexts/AnimationContext";
import { preloadICQTheme } from "./lib/emojiCache";
import { preloadICQSounds } from "./lib/soundCache";

type ErrorHandler = {
  lastError: Error | null;
  count: number;
  timestamp: number;
};

const ERROR_HISTORY: ErrorHandler = { lastError: null, count: 0, timestamp: Date.now() };
const MAX_ERRORS_BEFORE_FATAL = 10;
const ERROR_COOLDOWN = 5000; // 5 seconds between fatal errors

const installRuntimeGuards = () => {
  let isFatalErrorShown = false;

  window.addEventListener("error", (event) => {
    const error = event.error || event.message || "Unknown error";
    ERROR_HISTORY.count++;
    ERROR_HISTORY.lastError = event.error instanceof Error ? event.error : new Error(String(event.message));

    console.error("[RuntimeGuard] Window error:", error);

    // If too many errors and they're close together, show fatal error page
    if (ERROR_HISTORY.count >= MAX_ERRORS_BEFORE_FATAL) {
      const timeSinceLastFatal = Date.now() - ERROR_HISTORY.timestamp;
      if (timeSinceLastFatal > ERROR_COOLDOWN && !isFatalErrorShown) {
        isFatalErrorShown = true;
        ERROR_HISTORY.timestamp = Date.now();
        console.error("[RuntimeGuard] FATAL: Too many errors. App may be unstable.");
      }
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const rejection = event.reason;
    console.error("[RuntimeGuard] Unhandled promise rejection:", rejection);

    // Attempt to catch and log the rejection reason
    if (rejection instanceof Error) {
      console.error("[RuntimeGuard] Rejection details:", rejection.stack || rejection.message);
    }
  });
};

const getInitialTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return document.documentElement.classList.contains('dark') ? 'dark' : 'dark';
};

const bootstrap = async () => {
  installRuntimeGuards();

  initPerformanceMonitoring();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          console.warn("[Bootstrap] Service worker registration failed:", err);
        });
    });
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <AnimationProvider>
            <App />
          </AnimationProvider>
        </I18nProvider>
      </ErrorBoundary>
    </StrictMode>,
  );

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => Promise.all([
      preloadICQTheme(getInitialTheme()),
      preloadICQSounds(),
    ]), { timeout: 4000 });
  } else {
    setTimeout(() => Promise.all([
      preloadICQTheme(getInitialTheme()),
      preloadICQSounds(),
    ]), 0);
  }
};

bootstrap();
