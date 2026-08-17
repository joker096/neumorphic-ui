import { useEffect, useState } from "react";

/**
 * Reactive media-query hook.
 * Returns true when the viewport matches the given query.
 * SSR-safe: defaults to `false` until mounted.
 *
 * @param query  media query, e.g. "(max-width: 767px)"
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if ((mq as any).addListener) (mq as any).addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else if ((mq as any).removeListener) (mq as any).removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/** True when viewport is narrower than md breakpoint (768px, Tailwind default). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
