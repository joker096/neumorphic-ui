import { useEffect } from "react";
import { useUiStore } from "../store/uiStore";

/**
 * App-wide Ctrl/Cmd+K shortcut that toggles the global search overlay.
 * Mount once at the root shell so the shortcut works from any view.
 */
export function useGlobalSearchShortcut(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        useUiStore.getState().setGlobalSearchOpen(!useUiStore.getState().globalSearchOpen);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}
