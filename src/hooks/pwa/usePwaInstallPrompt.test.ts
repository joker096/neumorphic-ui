import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePwaInstallPrompt } from "./usePwaInstallPrompt";

// --- localStorage mock ---
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((k: string) => store[k] ?? null),
  setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
  removeItem: vi.fn((k: string) => { delete store[k]; }),
  clear: vi.fn(() => { store = {}; }),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

function setupEnvironment(opts: {
  standalone?: boolean;
  ios?: boolean;
  beforeInstallPrompt?: boolean;
  dismissed?: boolean;
}) {
  store = opts.dismissed ? { "pwa-install-dismissed-v1": "1" } : {};

  // matchMedia
  const mql = { matches: !!opts.standalone };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;

  // iOS detection: patch navigator via Object.defineProperty
  const navDesc = Object.getOwnPropertyDescriptor(navigator, "platform") || {
    configurable: true,
    get: () => "Win32",
  };
  Object.defineProperty(navigator, "platform", {
    configurable: true,
    value: opts.ios ? "iPhone" : "Win32",
  });
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: opts.ios ? 1 : 0,
  });

  return { navDesc };
}

describe("usePwaInstallPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is hidden when already standalone", () => {
    setupEnvironment({ standalone: true });
    const { result } = renderHook(() => usePwaInstallPrompt());
    expect(result.current.visible).toBe(false);
    expect(result.current.isStandalone).toBe(true);
  });

  it("is hidden when dismissed", () => {
    setupEnvironment({ dismissed: true, beforeInstallPrompt: true });
    const { result } = renderHook(() => usePwaInstallPrompt());
    expect(result.current.visible).toBe(false);
  });

  it("is hidden on desktop without install prompt", () => {
    setupEnvironment({ ios: false });
    const { result } = renderHook(() => usePwaInstallPrompt());
    expect(result.current.visible).toBe(false);
  });

  it("is visible on iOS", () => {
    setupEnvironment({ ios: true });
    const { result } = renderHook(() => usePwaInstallPrompt());
    expect(result.current.visible).toBe(true);
    expect(result.current.isIos).toBe(true);
    expect(result.current.canPrompt).toBe(false);
  });

  it("is visible when beforeinstallprompt fires (Android/Chrome)", async () => {
    setupEnvironment({});
    const { result } = renderHook(() => usePwaInstallPrompt());

    // Simulate the beforeinstallprompt event
    const promptFn = vi.fn();
    const event = new Event("beforeinstallprompt") as any;
    event.prompt = promptFn;
    event.userChoice = Promise.resolve({ outcome: "accepted", platform: "mobile" });

    await act(async () => {
      window.dispatchEvent(event);
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.canPrompt).toBe(true);
  });

  it("dismiss persists to localStorage", () => {
    setupEnvironment({ ios: true });
    const { result } = renderHook(() => usePwaInstallPrompt());
    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.visible).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith("pwa-install-dismissed-v1", "1");
  });

  it("promptInstall calls beforeinstallprompt.prompt()", async () => {
    setupEnvironment({});
    const { result } = renderHook(() => usePwaInstallPrompt());

    const promptFn = vi.fn();
    const userChoice = Promise.resolve({ outcome: "accepted", platform: "mobile" });
    const event = new Event("beforeinstallprompt") as any;
    event.prompt = promptFn;
    event.userChoice = userChoice;

    await act(async () => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(promptFn).toHaveBeenCalled();
  });
});
