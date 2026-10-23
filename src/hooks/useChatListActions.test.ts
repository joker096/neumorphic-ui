import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatListActions } from "./useChatListActions";

const setChatsMock = vi.hoisted(() => vi.fn());
const setChatUnreadMock = vi.hoisted(() => vi.fn());
const setChatMuteUntilMock = vi.hoisted(() => vi.fn());
const clearChatHistoryMock = vi.hoisted(() => vi.fn());
const setPinnedOrderMock = vi.hoisted(() => vi.fn());

vi.mock("../store", () => ({
  useAppStore: () => ({
    setChats: setChatsMock,
    setChatUnread: setChatUnreadMock,
    setChatMuteUntil: setChatMuteUntilMock,
    clearChatHistory: clearChatHistoryMock,
    setPinnedOrder: setPinnedOrderMock,
  }),
}));

const releaseMediaMock = vi.hoisted(() => vi.fn());
vi.mock("../lib/messageMedia", () => ({ releaseMessageMedia: releaseMediaMock }));

const downloadExportMock = vi.hoisted(() => vi.fn());
vi.mock("../lib/chatExport", () => ({ downloadChatExport: downloadExportMock }));

const toastMock = vi.hoisted(() => vi.fn());
vi.mock("../components/ui/Toast", () => ({ toast: toastMock }));

vi.mock("../components/chat-preview/ChatContextMenu", () => ({
  buildMenuIcon: (kind: string) => kind,
}));

function renderActions(overrides: Record<string, any> = {}) {
  const args = {
    t: (key: string) => key,
    activeFolder: "all",
    toggleArchive: vi.fn(),
    setActiveChat: vi.fn(),
    activeChatId: null,
    ...overrides,
  };
  const { result } = renderHook(() => useChatListActions(args));
  return { result, setActiveChat: args.setActiveChat };
}

beforeEach(() => {
  setChatsMock.mockReset();
  setChatUnreadMock.mockReset();
  setChatMuteUntilMock.mockReset();
  clearChatHistoryMock.mockReset();
  releaseMediaMock.mockReset();
  setPinnedOrderMock.mockReset();
});

describe("useChatListActions mark all read", () => {
  const unread = (id: string) => ({ id, name: id, unread: 3 });
  const read = (id: string) => ({ id, name: id, unread: 0 });

  it("clears only the chats in scope", () => {
    const { result } = renderActions();
    setChatsMock.mockImplementation((fn: any) => fn([unread("a"), unread("b"), read("c")]));
    act(() => result.current.handleMarkAllRead(["a", "c"]));
    const next = setChatsMock.mock.results[0].value;
    expect(next.find((c: any) => c.id === "a").unread).toBe(0);
    expect(next.find((c: any) => c.id === "b").unread).toBe(3);
  });

  it("returns the previous array when nothing in scope had unread", () => {
    const { result } = renderActions();
    const prev = [read("a")];
    let received: any;
    setChatsMock.mockImplementation((fn: any) => { received = fn(prev); });
    act(() => result.current.handleMarkAllRead(["a"]));
    expect(received).toBe(prev);
  });

  it("does nothing for an empty scope", () => {
    const { result } = renderActions();
    act(() => result.current.handleMarkAllRead([]));
    expect(setChatsMock).not.toHaveBeenCalled();
  });
});

describe("useChatListActions clear history", () => {
  const chatsWithHistory = () => ({
    id: "dm-1",
    name: "Ann",
    history: [{ id: "m1", sender: "me", type: "audio", voiceId: "v1" }, { id: "m2", sender: "Ann", text: "hi" }],
  });

  it("offers the row and keeps it separate from delete", () => {
    const { result } = renderActions();
    act(() => result.current.openMenu(chatsWithHistory(), null));
    const ids = result.current.menuItems.map(i => i.id);
    expect(ids).toContain("clearHistory");
    expect(ids).toContain("delete");
    expect(ids.indexOf("clearHistory")).toBeLessThan(ids.indexOf("delete"));
  });

  it("asks for confirmation first and does nothing until confirmed", () => {
    const { result } = renderActions();
    act(() => result.current.openMenu(chatsWithHistory(), null));
    act(() => result.current.menuItems.find(i => i.id === "clearHistory")!.onClick());
    expect(result.current.deleteConfirm).toEqual({ kind: "clear", chat: chatsWithHistory() });
    expect(clearChatHistoryMock).not.toHaveBeenCalled();
    expect(releaseMediaMock).not.toHaveBeenCalled();
  });

  it("empties the chat, releases media and keeps the chat in the list", () => {
    const chat = chatsWithHistory();
    const { result } = renderActions({ activeChatId: null });
    act(() => result.current.openMenu(chat, null));
    act(() => result.current.menuItems.find(i => i.id === "clearHistory")!.onClick());
    act(() => result.current.confirmDelete());

    expect(releaseMediaMock).toHaveBeenCalledWith(chat.history);
    expect(clearChatHistoryMock).toHaveBeenCalledWith("dm-1");
    // The chat object itself must survive: clearing history is not deletion.
    expect(setChatsMock).not.toHaveBeenCalled();
    expect(result.current.deleteConfirm).toBeNull();
  });

  it("mirrors the wipe into the open chat when it is the active one", () => {
    const chat = chatsWithHistory();
    const { result, setActiveChat } = renderActions({ activeChatId: "dm-1" });
    act(() => result.current.handleMenuClearHistory(chat));

    expect(setActiveChat).toHaveBeenCalledWith({ ...chat, history: [], messages: [], unread: 0 });
  });

  it("leaves an unrelated open chat untouched", () => {
    const { result, setActiveChat } = renderActions({ activeChatId: "other" });
    act(() => result.current.handleMenuClearHistory(chatsWithHistory()));

    expect(clearChatHistoryMock).toHaveBeenCalledWith("dm-1");
    expect(setActiveChat).not.toHaveBeenCalled();
  });
});

describe("useChatListActions mute presets", () => {
  it("offers the four Telegram durations for an unmuted chat", () => {
    const { result } = renderActions();
    act(() => result.current.openMenu({ id: "dm-1", isMuted: false }, null));
    const ids = result.current.menuItems.map(i => i.id);
    expect(ids).toEqual(expect.arrayContaining(["mute1h", "mute8h", "mute2d", "muteForever"]));
    expect(ids).not.toContain("mute");
    expect(ids).not.toContain("unmute");
  });

  it("mutes for the picked duration using an absolute deadline", () => {
    const { result } = renderActions();
    act(() => result.current.openMenu({ id: "dm-1", isMuted: false }, null));
    const before = Date.now();
    act(() => result.current.menuItems.find(i => i.id === "mute1h")!.onClick());
    const [, until] = setChatMuteUntilMock.mock.calls[0];
    expect(until).toBeGreaterThanOrEqual(before + 60 * 60 * 1000);
    expect(until).toBeLessThanOrEqual(Date.now() + 60 * 60 * 1000);
  });

  it('mutes forever without a deadline', () => {
    const { result } = renderActions();
    act(() => result.current.openMenu({ id: "dm-1" }, null));
    act(() => result.current.menuItems.find(i => i.id === "muteForever")!.onClick());
    expect(setChatMuteUntilMock).toHaveBeenCalledWith("dm-1", "forever");
  });

  it("replaces the presets with a single unmute row for a muted chat", () => {
    const { result } = renderActions();
    act(() => result.current.openMenu({ id: "dm-1", isMuted: true }, null));
    const ids = result.current.menuItems.map(i => i.id);
    expect(ids).toContain("unmute");
    expect(ids.filter(id => id.startsWith("mute"))).toEqual([]);
    act(() => result.current.menuItems.find(i => i.id === "unmute")!.onClick());
    expect(setChatMuteUntilMock).toHaveBeenCalledWith("dm-1", null);
  });
});

describe("useChatListActions unread toggle", () => {
  const openWith = (chat: any) => {
    const { result } = renderActions();
    act(() => result.current.openMenu(chat, null));
    return result;
  };

  it("offers Mark Read and clears unread for a chat with unread messages", () => {
    const result = openWith({ id: "dm-1", pinned: false, isMuted: false, unread: 3 });
    const item = result.current.menuItems.find(i => i.id === "markRead");
    expect(item?.label).toBe("chat.markRead");
    expect(item?.disabled).toBeFalsy();
    act(() => item?.onClick());
    expect(setChatUnreadMock).toHaveBeenCalledWith("dm-1", false);
  });

  it("offers Mark as unread for an already read chat instead of a dead row", () => {
    const result = openWith({ id: "dm-2", pinned: false, isMuted: false, unread: 0 });
    const item = result.current.menuItems.find(i => i.id === "markUnread");
    expect(item?.label).toBe("chat.markUnread");
    expect(result.current.menuItems.find(i => i.id === "markRead")).toBeUndefined();
    act(() => item?.onClick());
    expect(setChatUnreadMock).toHaveBeenCalledWith("dm-2", true);
  });

  it("opening a chat clears its unread counter through the store action", () => {
    const { result, setActiveChat } = renderActions();
    act(() => result.current.handleChatOpen({ id: "dm-3", unread: 2, name: "Bob" }));
    expect(setChatUnreadMock).toHaveBeenCalledWith("dm-3", false);
    expect(setActiveChat).toHaveBeenCalledWith({ id: "dm-3", unread: 2, name: "Bob" });
  });
});

describe("useChatListActions delete confirmation", () => {
  it("single: requestMenuDelete holds the chat without writing to the store", () => {
    const { result } = renderActions();
    act(() => result.current.requestMenuDelete({ id: "dm-1", name: "Alice" }));
    expect(result.current.deleteConfirm).toEqual({ kind: "single", chat: { id: "dm-1", name: "Alice" } });
    expect(setChatsMock).not.toHaveBeenCalled();
  });

  it("single: confirmDelete deletes the chat, clears the confirm, and clears the active chat when it matches", () => {
    const setActiveChat = vi.fn();
    const { result } = renderActions({ activeChatId: "dm-1", setActiveChat });
    act(() => result.current.requestMenuDelete({ id: "dm-1", name: "Alice" }));
    act(() => result.current.confirmDelete());
    expect(result.current.deleteConfirm).toBeNull();
    expect(setChatsMock).toHaveBeenCalledTimes(1);
    const updater = setChatsMock.mock.calls[0][0];
    expect(updater([{ id: "dm-1" }, { id: "dm-2" }])).toEqual([{ id: "dm-2" }]);
    expect(setActiveChat).toHaveBeenCalledWith(null);
  });

  it("single: deleting a non-active chat does not clear the active chat", () => {
    const setActiveChat = vi.fn();
    const { result } = renderActions({ activeChatId: "other", setActiveChat });
    act(() => result.current.requestMenuDelete({ id: "dm-1", name: "Alice" }));
    act(() => result.current.confirmDelete());
    expect(setChatsMock).toHaveBeenCalledTimes(1);
    expect(setActiveChat).not.toHaveBeenCalled();
  });

  it("cancelDelete discards the pending delete without touching the store", () => {
    const { result } = renderActions();
    act(() => result.current.requestMenuDelete({ id: "dm-1", name: "Alice" }));
    act(() => result.current.cancelDelete());
    expect(result.current.deleteConfirm).toBeNull();
    expect(setChatsMock).not.toHaveBeenCalled();
  });

  it("bulk: confirmDelete filters every selected chat and exits select mode", () => {
    const { result } = renderActions();
    act(() => {
      result.current.handleToggleSelect("a");
      result.current.handleToggleSelect("b");
    });
    expect([...result.current.selectedIds]).toEqual(["a", "b"]);
    act(() => result.current.requestBulkDelete());
    expect(result.current.deleteConfirm).toEqual({ kind: "bulk" });
    expect(setChatsMock).not.toHaveBeenCalled();

    act(() => result.current.confirmDelete());
    expect(result.current.deleteConfirm).toBeNull();
    const updater = setChatsMock.mock.calls[0][0];
    expect(updater([{ id: "a" }, { id: "b" }, { id: "c" }])).toEqual([{ id: "c" }]);
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("context-menu Delete requests confirmation instead of deleting", () => {
    const { result } = renderActions();
    act(() => result.current.openMenu({ id: "dm-1", pinned: false, isMuted: false, unread: 0 }, null));
    const del = result.current.menuItems.find((item) => item.id === "delete");
    expect(del).toBeDefined();
    act(() => del?.onClick());
    expect(result.current.deleteConfirm).toEqual(expect.objectContaining({ kind: "single" }));
    expect(setChatsMock).not.toHaveBeenCalled();
  });

  it("bulk mute toggles isMuted on the selected chats only and exits select mode", () => {
    const { result } = renderActions();
    act(() => {
      result.current.handleToggleSelect("a");
      result.current.handleToggleSelect("b");
    });
    act(() => result.current.handleBulkMute());
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
    const updater = setChatsMock.mock.calls[0][0];
    const next = updater([
      { id: "a", isMuted: false },
      { id: "b", isMuted: true },
      { id: "c", isMuted: false },
    ]);
    // Both keys are written on purpose: the list/swipe/icon read `isMuted`,
    // older persisted snapshots and the notification gate read `muted`.
    expect(next).toEqual([
      { id: "a", isMuted: true, muted: true },
      { id: "b", isMuted: false, muted: false },
      { id: "c", isMuted: false },
    ]);
  });

  it("exports the chat transcript from the context menu", () => {
    const { result } = renderActions();
    const chat = { id: "c1", name: "Alice", history: [{ id: 1, sender: "me", text: "hi" }] };
    act(() => result.current.openMenu(chat, { x: 0, y: 0 }));
    const row = result.current.menuItems.find((item: any) => item.id === "export");
    expect(row?.label).toBe("chat.export");
    act(() => row?.onClick());
    expect(downloadExportMock).toHaveBeenCalledWith(chat, expect.objectContaining({
      labels: expect.objectContaining({ selfName: "me", title: "chat.export" }),
    }));
    expect(toastMock).toHaveBeenCalledWith("chat.exportDone", "success");
  });
});

describe("useChatListActions pinned reorder", () => {
  it("pin assigns the next numeric rank after the max existing", () => {
    const { result } = renderActions();
    act(() => result.current.handleMenuPin({ id: "dm-1", name: "Alice" }));
    expect(setChatsMock).toHaveBeenCalledTimes(1);
    const updater = setChatsMock.mock.calls[0][0];
    const next = updater([
      { id: "dm-1", pinned: false },
      { id: "dm-2", pinned: true, pinRank: 1 },
      { id: "dm-3", pinned: false },
    ]);
    expect(next.find((c: any) => c.id === "dm-1")).toEqual({ id: "dm-1", pinned: true, pinRank: 2 });
    expect(next.find((c: any) => c.id === "dm-2")).toEqual({ id: "dm-2", pinned: true, pinRank: 1 });
    expect(next.find((c: any) => c.id === "dm-3")).toEqual({ id: "dm-3", pinned: false });
  });

  it("unpin drops the pinRank", () => {
    const { result } = renderActions();
    act(() => result.current.handleMenuPin({ id: "dm-1", pinned: true, pinRank: 0 }));
    const updater = setChatsMock.mock.calls[0][0];
    const next = updater([{ id: "dm-1", pinned: true, pinRank: 0 }]);
    expect(next).toEqual([{ id: "dm-1", pinned: false }]);
  });

  it("handleReorderPinned forwards the dragged order as ids", () => {
    const { result } = renderActions();
    act(() => result.current.handleReorderPinned([{ id: "b" }, { id: "a" }]));
    expect(setPinnedOrderMock).toHaveBeenCalledWith(["b", "a"]);
  });
});
