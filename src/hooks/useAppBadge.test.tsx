import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

import { useAppBadge } from "./useAppBadge";

const setAppBadge = vi.fn().mockResolvedValue(undefined);
const clearAppBadge = vi.fn().mockResolvedValue(undefined);

function withBadgingApi(on: boolean) {
  if (on) {
    Object.defineProperty(navigator, "setAppBadge", { value: setAppBadge, configurable: true });
    Object.defineProperty(navigator, "clearAppBadge", { value: clearAppBadge, configurable: true });
  } else {
    delete (navigator as any).setAppBadge;
    delete (navigator as any).clearAppBadge;
  }
}

describe("useAppBadge", () => {
  beforeEach(() => {
    setAppBadge.mockClear().mockResolvedValue(undefined);
    clearAppBadge.mockClear().mockResolvedValue(undefined);
    document.title = "Messenger";
  });

  afterEach(() => {
    withBadgingApi(false);
  });

  it("badges the app and prefixes the title with the unread count", () => {
    withBadgingApi(true);
    renderHook(() => useAppBadge(7));

    expect(setAppBadge).toHaveBeenCalledWith(7);
    expect(document.title).toBe("(7) Messenger");
  });

  it("clears the badge and the title prefix at zero", () => {
    withBadgingApi(true);
    const { rerender } = renderHook(({ n }) => useAppBadge(n), { initialProps: { n: 3 } });
    expect(document.title).toBe("(3) Messenger");

    rerender({ n: 0 });
    expect(clearAppBadge).toHaveBeenCalled();
    expect(document.title).toBe("Messenger");
  });

  it("never stacks title prefixes across updates", () => {
    withBadgingApi(true);
    const { rerender } = renderHook(({ n }) => useAppBadge(n), { initialProps: { n: 1 } });
    rerender({ n: 2 });
    rerender({ n: 42 });

    expect(document.title).toBe("(42) Messenger");
  });

  it("keeps a title set by another surface in the base", () => {
    withBadgingApi(true);
    document.title = "Chats — Messenger";
    renderHook(() => useAppBadge(2));
    expect(document.title).toBe("(2) Chats — Messenger");
  });

  it("drops the prefix when the shell unmounts", () => {
    withBadgingApi(true);
    const { unmount } = renderHook(() => useAppBadge(5));
    unmount();
    expect(document.title).toBe("Messenger");
  });

  it("tolerates a browser without the Badging API", () => {
    withBadgingApi(false);
    expect(() => renderHook(() => useAppBadge(4))).not.toThrow();
    expect(document.title).toBe("(4) Messenger");
  });

  it("swallows a rejected badge call (app not installed)", async () => {
    setAppBadge.mockRejectedValue(new Error("not installed"));
    withBadgingApi(true);
    expect(() => renderHook(() => useAppBadge(1))).not.toThrow();
    await Promise.resolve();
    expect(document.title).toBe("(1) Messenger");
  });

  it("ignores a negative or junk count", () => {
    withBadgingApi(true);
    renderHook(() => useAppBadge(-3));
    expect(clearAppBadge).toHaveBeenCalled();
    expect(document.title).toBe("Messenger");
  });
});
