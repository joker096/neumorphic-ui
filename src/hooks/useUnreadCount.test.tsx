import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAppStore } from "../store";
import { useUnreadCount } from "./useUnreadCount";

let ch: Array<{ id: string; unread?: number }> = [];

vi.mock("../store", () => ({
  useAppStore: (sel: any) => sel({ companyChannels: ch }),
}));

beforeEach(() => {
  ch = [];
  vi.clearAllMocks();
});

describe("useUnreadCount", () => {
  it("sums unread across chats", () => {
    const { result } = renderHook(() =>
      useUnreadCount(
        [
          { id: "a", unread: 3 },
          { id: "b", unread: 5 },
        ],
        [],
      ),
    );
    expect(result.current.chatsUnread).toBe(8);
  });

  it("sums unread across company channels from the store", () => {
    ch = [
      { id: "c1", unread: 2 },
      { id: "c2", unread: 4 },
    ];
    const { result } = renderHook(() => useUnreadCount([], []));
    expect(result.current.companyUnread).toBe(6);
  });

  it("treats missing unread as 0", () => {
    const { result } = renderHook(() =>
      useUnreadCount([{ id: "a" }, { id: "b", unread: 1 }], []),
    );
    expect(result.current.chatsUnread).toBe(1);
  });

  it("defaults to 0 for empty lists and missing companyChannels", () => {
    const { result } = renderHook(() => useUnreadCount([], []));
    expect(result.current.chatsUnread).toBe(0);
    expect(result.current.companyUnread).toBe(0);
  });
});
