const CHUNK_RELOAD_FLAG = "app-chunk-reload-at";
const CHUNK_RELOAD_WINDOW_MS = 15000;
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|chunk load/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return CHUNK_ERROR_RE.test(message);
}

export type NavigateFn = (url: string) => void;

export const navigateFresh = (url: string): void => {
  window.location.replace(url);
};

export function forceFreshReload(
  force = false,
  navigate: NavigateFn = navigateFresh,
): boolean {
  const now = Date.now();
  try {
    if (force) {
      sessionStorage.setItem(CHUNK_RELOAD_FLAG, String(now));
    } else {
      const last = Number(sessionStorage.getItem(CHUNK_RELOAD_FLAG) ?? "0");
      if (now - last < CHUNK_RELOAD_WINDOW_MS) return false;
      sessionStorage.setItem(CHUNK_RELOAD_FLAG, String(now));
    }
  } catch {
    if (!force) return false;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(now));
  navigate(url.toString());
  return true;
}
