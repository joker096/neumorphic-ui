import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act, fireEvent } from "@testing-library/react";
import { useInstallPrompt, type BeforeInstallPromptEvent } from "./useInstallPrompt";

function makePromptEvent(prompt?: () => Promise<void>): BeforeInstallPromptEvent {
  const evt = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
  evt.prompt = prompt ?? vi.fn().mockResolvedValue(undefined);
  evt.userChoice = new Promise(() => {});
  return evt;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useInstallPrompt", () => {
  it("defaults: not installable, not standalone", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isStandalone).toBe(false);
  });

  it("canInstall flips on beforeinstallprompt; promptInstall invokes the deferred prompt", () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      fireEvent(window, makePromptEvent(prompt));
    });
    expect(result.current.canInstall).toBe(true);
    act(() => {
      result.current.promptInstall();
    });
    expect(prompt).toHaveBeenCalledOnce();
  });

  it("canInstall resets on appinstalled; promptInstall no-ops without a deferred prompt", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      fireEvent(window, makePromptEvent());
    });
    expect(result.current.canInstall).toBe(true);
    act(() => {
      fireEvent(window, new Event("appinstalled"));
    });
    expect(result.current.canInstall).toBe(false);
    expect(() => act(() => result.current.promptInstall())).not.toThrow();
  });
});
