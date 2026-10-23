import { useEffect } from "react";

type BadgingNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/** `(12) ` prefix we may have written on a previous run. */
const TITLE_PREFIX = /^\(\d+\)\s*/;

/**
 * Mirrors the total unread count onto the two surfaces a user sees while the
 * app is in the background: the OS app badge (installed PWA) and the document
 * title. Both are best-effort — the Badging API is missing on most desktops and
 * rejects when the app is not installed, so calls are feature-detected and their
 * rejections swallowed rather than surfaced.
 */
export function useAppBadge(totalUnread: number) {
  useEffect(() => {
    const count = Math.max(0, Math.floor(Number(totalUnread) || 0));
    const nav = navigator as BadgingNavigator;

    try {
      if (count > 0) {
        if (typeof nav.setAppBadge === "function") void nav.setAppBadge(count).catch(() => {});
      } else if (typeof nav.clearAppBadge === "function") {
        void nav.clearAppBadge().catch(() => {});
      }
    } catch {
      // Unsupported / not installed — the badge is a nicety, never an error.
    }
  }, [totalUnread]);

  useEffect(() => {
    const count = Math.max(0, Math.floor(Number(totalUnread) || 0));
    const base = document.title.replace(TITLE_PREFIX, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
    // Restore an unprefixed title when the shell unmounts, so a signed-out
    // landing page never keeps a stale counter.
    return () => {
      document.title = document.title.replace(TITLE_PREFIX, "");
    };
  }, [totalUnread]);
}
