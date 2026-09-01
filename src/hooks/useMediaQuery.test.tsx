import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaQuery, useIsMobile } from "./useMediaQuery";

function makeMql(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mq = {
    matches,
    media: "",
    onchange: null,
    addEventListener: (type: string, cb: (e: MediaQueryListEvent) => void) => {
      if (type === "change") listeners.add(cb);
    },
    removeEventListener: (type: string, cb: (e: MediaQueryListEvent) => void) => {
      if (type === "change") listeners.delete(cb);
    },
    addListener: undefined,
    removeListener: undefined,
    dispatchEvent: () => true,
    _listeners: listeners,
  };
  return mq;
}

function stubMatchMedia(matches: boolean) {
  const mq = makeMql(matches);
  const fn = vi.fn(() => mq);
  Object.defineProperty(window, "matchMedia", { writable: true, configurable: true, value: fn });
  return mq as any;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMediaQuery", () => {
  it("reflects initial match state", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(true);
  });

  it("reflects initial non-match state", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(false);
  });

  it("updates when the query matches on change events", () => {
    const mq = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(false);
    act(() => {
      mq._listeners.forEach((cb: (e: MediaQueryListEvent) => void) =>
        cb({ matches: true } as MediaQueryListEvent),
      );
    });
    expect(result.current).toBe(true);
  });

  it("re-evaluates query on query change", () => {
    const mq = stubMatchMedia(true);
    const { result, rerender } = renderHook(
      (q: string) => useMediaQuery(q),
      { initialProps: "(max-width: 767px)" },
    );
    expect(result.current).toBe(true);
    mq.matches = false;
    rerender("(min-width: 768px)");
    expect(result.current).toBe(false);
  });

  it("is SSR-safe: no matchMedia means false", () => {
    Object.defineProperty(window, "matchMedia", { writable: true, configurable: true, value: undefined });
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(false);
  });
});

describe("useIsMobile", () => {
  it("delegates to useMediaQuery with the mobile breakpoint", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
