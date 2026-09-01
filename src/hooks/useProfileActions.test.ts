import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { renderHook, act } from "@testing-library/react";
import { useProfileActions } from "./useProfileActions";

function makeHarness() {
  const [chats, setChats] = useState<any[]>([
    { id: "chat_1", name: "Alice", isFavorite: false },
    { id: "chat_only", name: "Bob", isFavorite: false },
  ]);
  const [contacts, setContacts] = useState<any[]>([
    { id: "chat_1", name: "Alice", isFavorite: false },
  ]);
  const [globalSelectedContact, setGlobalSelectedContact] = useState<any>(null);
  const actions = useProfileActions(
    chats,
    null,
    globalSelectedContact,
    vi.fn(),
    vi.fn(),
    setChats,
    setContacts,
    setGlobalSelectedContact,
    vi.fn(),
    vi.fn(),
    vi.fn(),
  );
  return { chats, contacts, globalSelectedContact, ...actions };
}

describe("useProfileActions", () => {
  it("updates chats state for a chat-only id (not present in contacts)", () => {
    const { result } = renderHook(() => makeHarness());
    act(() => {
      result.current.handleProfileToggleFavorite("chat_only", true);
    });
    expect(result.current.chats.find((c: any) => c.id === "chat_only")?.isFavorite).toBe(true);
    expect(result.current.contacts).toHaveLength(1);
  });

  it("toggles favorite for a shared id on both chats and contacts", () => {
    const { result } = renderHook(() => makeHarness());
    act(() => {
      result.current.handleProfileToggleFavorite("chat_1", true);
    });
    expect(result.current.contacts[0].isFavorite).toBe(true);
    expect(result.current.chats[0].isFavorite).toBe(true);
  });

  it("toggles favorite back to false", () => {
    const { result } = renderHook(() => makeHarness());
    act(() => {
      result.current.handleProfileToggleFavorite("chat_1", true);
    });
    act(() => {
      result.current.handleProfileToggleFavorite("chat_1", false);
    });
    expect(result.current.chats[0].isFavorite).toBe(false);
  });
});
