import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatListActions } from "./useChatListActions";

const setChatsMock = vi.hoisted(() => vi.fn());

vi.mock("../store", () => ({
  useAppStore: () => ({ setChats: setChatsMock }),
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
