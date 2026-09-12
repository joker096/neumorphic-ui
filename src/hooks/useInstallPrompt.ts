import { useCallback, useEffect, useRef, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * PWA install prompt hook.
 * Captures `beforeinstallprompt` (Chrome/Edge/Android) and tracks standalone mode.
 * SSR/jsdom safe: all flags default to false.
 */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standaloneQuery = window.matchMedia ? window.matchMedia("(display-mode: standalone)") : null;
    setIsStandalone(
      standaloneQuery ? standaloneQuery.matches : (navigator as unknown as { standalone?: boolean }).standalone === true,
    );
    const onStandaloneChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    standaloneQuery?.addEventListener("change", onStandaloneChange);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      standaloneQuery?.removeEventListener("change", onStandaloneChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(() => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return;
    void deferred.prompt();
  }, []);

  return { canInstall, isStandalone, promptInstall };
}
