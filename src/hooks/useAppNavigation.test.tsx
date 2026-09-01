import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const storeMock = vi.hoisted(() => ({
  activeCall: null as any,
}));

const callManagerMock = vi.hoisted(() => ({
  startPreviewCall: vi.fn(async () => {}),
  endCall: vi.fn(async () => {}),
}));

vi.mock("../store", () => ({
  useAppStore: Object.assign(
    (sel: any) => sel({}),
    { getState: () => ({ activeCall: storeMock.activeCall }) },
  ),
}));
vi.mock("../lib/call/CallManager", () => ({ callManager: callManagerMock }));

import { useAppNavigation } from "./useAppNavigation";

beforeEach(() => {
  storeMock.activeCall = null;
  callManagerMock.startPreviewCall.mockClear().mockResolvedValue(undefined);
  callManagerMock.endCall.mockClear().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

const makeArgs = (over: any = {}) => {
  const setView = vi.fn();
  const setSubView = vi.fn();
  const setActiveChat = vi.fn();
  const setChats = vi.fn();
  const setActiveCall = vi.fn();
  const openChat = "openChat" in over ? over.openChat : vi.fn();
  const chats = over.chats ?? [{ id: 1, name: "Alice", type: "direct" }];
  return {
    view: over.view ?? "chats",
    chats,
    activeChat: over.activeChat ?? null,
    setView,
    setSubView,
    setActiveChat,
    setChats,
    setActiveCall,
    openChat,
    _setView: setView,
    _setSubView: setSubView,
    _setActiveChat: setActiveChat,
    _setChats: setChats,
    _setActiveCall: setActiveCall,
    _openChat: openChat,
  };
};

const render = (over: any = {}) => {
  const a = makeArgs(over);
  const { result } = renderHook(() =>
    useAppNavigation(
      a.view,
      a.chats,
      a.activeChat,
      a.setView,
      a.setSubView,
      a.setActiveChat,
      a.setChats,
      a.setActiveCall,
      a.openChat,
    ),
  );
  return { result, a };
};

describe("useAppNavigation", () => {
  it("handleNavigate sets the view and clears subView", () => {
    const { result, a } = render();
    act(() => result.current.handleNavigate("contacts"));
    expect(a.setView).toHaveBeenCalledWith("contacts");
    expect(a.setSubView).toHaveBeenCalledWith(null);
  });

  it("handlePreviewCall reuses an existing active call of the same type", () => {
    const existing = { callType: "video", status: "connected" };
    storeMock.activeCall = existing;
    const { result, a } = render();
    act(() => result.current.handlePreviewCall("Alice", "red", "video"));
    expect(a.setActiveCall).toHaveBeenCalledWith(existing);
    expect(callManagerMock.startPreviewCall).not.toHaveBeenCalled();
  });

  it("handlePreviewCall starts a new preview call when none active", async () => {
    const { result } = render();
    await act(async () => {
      result.current.handlePreviewCall("Bob", "blue", "audio");
    });
    expect(callManagerMock.startPreviewCall).toHaveBeenCalledWith("preview", "Bob", "audio");
  });

  it("handlePreviewCall auto-dismisses a connecting preview after 30s", async () => {
    vi.useFakeTimers();
    // No active call -> hook starts a preview and arms a 30s auto-dismiss timer.
    storeMock.activeCall = null;
    const { result } = render();
    result.current.handlePreviewCall("Bob", "blue", "audio");
    // Simulate a preview still stuck connecting when the timer fires.
    storeMock.activeCall = { isPreview: true, status: "connecting", callType: "audio" };
    await vi.advanceTimersByTimeAsync(30001);
    expect(callManagerMock.endCall).toHaveBeenCalled();
  });

  it("handlePreviewMessage opens an existing direct chat by name", () => {
    const { result, a } = render();
    act(() => result.current.handlePreviewMessage("Alice"));
    expect(a.openChat).toHaveBeenCalledWith({ id: 1, name: "Alice", type: "direct" });
    expect(a.setChats).not.toHaveBeenCalled();
  });

  it("handlePreviewMessage creates and prepends a new chat when missing", () => {
    const { result, a } = render();
    act(() => result.current.handlePreviewMessage("Carol", "green"));
    const newChat = a.setChats.mock.calls[0][0]([]);
    expect(newChat[0].name).toBe("Carol");
    expect(newChat[0].type).toBe("direct");
    expect(newChat[0].color).toBe("green");
    expect(newChat[0].online).toBe(true);
    expect(a.openChat).toHaveBeenCalled();
  });

  it("falls back to setView/setActiveChat when openChat is absent", () => {
    const { result, a } = render({ openChat: undefined });
    act(() => result.current.handlePreviewMessage("Alice"));
    expect(a.setView).toHaveBeenCalledWith("chats");
    expect(a.setActiveChat).toHaveBeenCalledWith({ id: 1, name: "Alice", type: "direct" });
  });

  it("isChatListRoute is true only for chats/channels/bots views", () => {
    const { result } = render({ view: "chats" });
    expect(result.current.isChatListRoute).toBe(true);
    const { result: r2 } = render({ view: "settings" });
    expect(r2.current.isChatListRoute).toBe(false);
  });
});
