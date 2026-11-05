import { useCallback, useEffect, useState } from "react";

/**
 * PWA install-prompt state.
 *
 * - Android / Chrome / Edge: intercepts `beforeinstallprompt` so the user can
 *   install with one tap instead of hunting for the ⋮ menu → "Add to home screen".
 * - iOS Safari: `beforeinstallprompt` never fires; the only signal is
 *   `display-mode: standalone`. We show the hint until the user dismisses it
 *   (persisted in localStorage) or the page is opened in standalone mode
 *   (meaning they already installed).
 * - Desktop: no prompt at all — PWA install is irrelevant.
 */

const DISMISS_KEY = "pwa-install-dismissed-v1";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface PwaInstallPromptState {
  /** true when the banner should be rendered */
  visible: boolean;
  /** true when `beforeinstallprompt` has been captured (Chrome/Android) */
  canPrompt: boolean;
  /** true when the user is already running in a PWA / standalone context */
  isStandalone: boolean;
  /** iOS Safari — we can't call prompt(); we show a hint instead */
  isIos: boolean;
  /** show the native install dialog (no-op on iOS) */
  promptInstall: () => Promise<void>;
  /** hide the banner for this session + persist dismissal */
  dismiss: () => void;
}

export function usePwaInstallPrompt(): PwaInstallPromptState {
  const [canPrompt, setCanPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    // iOS Safari: when installed, `standalone` is exposed via a meta tag check
    (window.navigator as any).standalone === true;

  const isIos =
    /iPad|iPhone|iPod/.test(navigator.platform) ||
    (typeof window !== "undefined" && window.navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);

  useEffect(() => {
    // Chrome / Edge (Android + desktop): intercept beforeinstallprompt.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Also listen for app installed — if the user completed install via the
    // browser menu, clear the prompt state.
    const onInstalled = () => {
      setDeferredPrompt(null);
      setCanPrompt(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* localStorage may be blocked — ignore */
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
          setCanPrompt(false);
        }
      } catch {
        // User cancelled — keep the banner so they can retry.
      }
    }
    // iOS: no programmatic API. The banner text guides the user to
    // "Share → Add to Home Screen" manually.
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Show the banner only when:
  //  - NOT already standalone (they installed — nothing to do)
  //  - NOT dismissed by the user
  //  - Mobile (iOS or beforeinstallprompt fired) — desktop doesn't need this
  const visible = !isStandalone && !dismissed && (canPrompt || isIos);

  return { visible, canPrompt, isStandalone, isIos, promptInstall, dismiss };
}
