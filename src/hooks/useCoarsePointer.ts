import { useEffect, useState } from "react";

const COARSE_POINTER_QUERY = "(pointer: coarse)";

function detectCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(COARSE_POINTER_QUERY).matches;
}

/**
 * True on touch-first devices. Popups anchored to an element keep the 44px row
 * height there, because a long press is a touch gesture and must stay a valid
 * tap target; mouse-driven popovers use the denser 36px row.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(detectCoarsePointer);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(COARSE_POINTER_QUERY);
    const onChange = () => setCoarse(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return coarse;
}
