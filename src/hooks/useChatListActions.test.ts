import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatListActions } from "./useChatListActions";

const setChatsMock = vi.hoisted(() => vi.fn());
const setChatUnreadMock = vi.hoisted(() => vi.fn());

vi.mock("../store", () => ({
  useAppStore: () => ({ setChats: setChatsMock, setChatUnread: setChatUnreadMock }),
}));

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
    expect(next).toEqual([
      { id: "a", isMuted: true },
      { id: "b", isMuted: false },
      { id: "c", isMuted: false },
    ]);
  });
});
