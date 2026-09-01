import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const netMock = vi.hoisted(() => ({
  onTypingIndicator: vi.fn() as any,
}));

const storeMock = vi.hoisted(() => ({
  typingIndicators: true,
}));

vi.mock("../lib/p2p/network", () => ({ p2pNetwork: netMock }));
vi.mock("../store", () => ({
  useAppStore: (sel: any) => sel({ typingIndicators: storeMock.typingIndicators }),
}));

import { useChatPreviewTyping } from "./useChatPreviewTyping";

beforeEach(() => {
  netMock.onTypingIndicator.mockReset().mockReturnValue(() => {});
  storeMock.typingIndicators = true;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useChatPreviewTyping", () => {
  it("returns false when typing indicators are disabled", () => {
    storeMock.typingIndicators = false;
    const { result } = renderHook(() =>
      useChatPreviewTyping("c1", "Alice", true, "direct"),
    );
    expect(result.current).toBe(false);
    expect(netMock.onTypingIndicator).not.toHaveBeenCalled();
  });

  it("subscribes and reflects real typing for a matching chat name", async () => {
    const unsub = vi.fn();
    let cb: ((name: string, isTyping: boolean) => void) | undefined;
    netMock.onTypingIndicator.mockImplementation((handler: any) => {
      cb = handler;
      return unsub;
    });
    const { result } = renderHook(() =>
      useChatPreviewTyping("c1", "Alice", true, "direct"),
    );
    expect(netMock.onTypingIndicator).toHaveBeenCalled();
    act(() => cb!("Alice", true));
    expect(result.current).toBe(true);
    act(() => cb!("Alice", false));
    expect(result.current).toBe(false);
  });

  it("ignores typing events for a different chat name", async () => {
    let cb: ((name: string, isTyping: boolean) => void) | undefined;
    netMock.onTypingIndicator.mockImplementation((handler: any) => {
      cb = handler;
      return () => {};
    });
    const { result } = renderHook(() =>
      useChatPreviewTyping("c1", "Alice", true, "direct"),
    );
    act(() => cb!("Bob", true));
    expect(result.current).toBe(false);
  });

  it("produces simulated typing on a timer for online direct chats", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deterministic delays: first ON at 8000ms, OFF at 10500ms
    const { result } = renderHook(() =>
      useChatPreviewTyping("c1", "Alice", true, "direct"),
    );
    expect(result.current).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8500);
    });
    expect(result.current).toBe(true);
  });

  it("never schedules simulated typing for channels", async () => {
    const { result } = renderHook(() =>
      useChatPreviewTyping("ch1", "News", true, "channel"),
    );
    act(() => {
      vi.advanceTimersByTime(40000);
    });
    expect(result.current).toBe(false);
  });

  it("unsubscribes the typing indicator on unmount", () => {
    const unsub = vi.fn();
    netMock.onTypingIndicator.mockReturnValue(unsub as any);
    const { unmount } = renderHook(() =>
      useChatPreviewTyping("c1", "Alice", true, "direct"),
    );
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});
