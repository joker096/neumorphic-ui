import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBrowserBackNavigation } from "./useBrowserBackNavigation";

const baseParams = {
  view: "chats",
  subView: null,
  activeChatId: null,
  chats: [{ id: "c1", name: "A" }],
  channels: [{ id: "ch1", name: "Ch" }],
  setView: vi.fn(),
  setSubView: vi.fn(),
  setActiveChat: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  baseParams.setView.mockClear();
  baseParams.setSubView.mockClear();
  baseParams.setActiveChat.mockClear();
  vi.spyOn(window.history, "pushState").mockImplementation(() => {});
  vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
});

describe("useBrowserBackNavigation", () => {
  it("replaces state on mount with current view", () => {
    renderHook(() => useBrowserBackNavigation(baseParams));
    expect(window.history.replaceState).toHaveBeenCalledWith(
      { view: "chats", activeChatId: null, subView: null },
      "",
    );
  });

  it("pushes state when view changes", () => {
    const { rerender } = renderHook((p) => useBrowserBackNavigation(p), {
      initialProps: baseParams,
    });
    (window.history.pushState as any).mockClear();
    rerender({ ...baseParams, view: "contacts" });
    expect(window.history.pushState).toHaveBeenCalledWith(
      { view: "contacts", activeChatId: null, subView: null },
      "",
    );
  });

  it("does not push duplicate state", () => {
    const { rerender } = renderHook((p) => useBrowserBackNavigation(p), {
      initialProps: baseParams,
    });
    (window.history.pushState as any).mockClear();
    rerender({ ...baseParams });
    rerender({ ...baseParams });
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it("handles popstate by restoring view/subView and resolving the chat", () => {
    renderHook(() => useBrowserBackNavigation(baseParams));
    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: { view: "chat", subView: "info", activeChatId: "c1" } }),
      );
    });
    expect(baseParams.setView).toHaveBeenCalledWith("chat");
    expect(baseParams.setSubView).toHaveBeenCalledWith("info");
    expect(baseParams.setActiveChat).toHaveBeenCalledWith({ id: "c1", name: "A" });
  });

  it("resolves channel ids too", () => {
    renderHook(() => useBrowserBackNavigation(baseParams));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: { view: "chat", activeChatId: "ch1" } }));
    });
    expect(baseParams.setActiveChat).toHaveBeenCalledWith({ id: "ch1", name: "Ch" });
  });

  it("sets null when the active chat id is unknown or view is absent", () => {
    renderHook(() => useBrowserBackNavigation(baseParams));
    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: { view: "chat", activeChatId: "nope" } }),
      );
    });
    expect(baseParams.setActiveChat).toHaveBeenCalledWith(null);
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    });
    expect(baseParams.setActiveChat).toHaveBeenCalledTimes(1);
  });

  it("skips the next push after a popstate (no duplicate history entry)", () => {
    const { rerender } = renderHook((p) => useBrowserBackNavigation(p), {
      initialProps: baseParams,
    });
    (window.history.pushState as any).mockClear();
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: { view: "chat", activeChatId: "c1" } }));
    });
    rerender({ ...baseParams, view: "chat", activeChatId: "c1" });
    expect(window.history.pushState).not.toHaveBeenCalled();
  });
});
