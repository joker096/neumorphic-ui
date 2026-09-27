import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const storeState = vi.hoisted(() => ({
  chats: [] as any[],
  userProfile: { name: "Me" },
  setChats: vi.fn(),
}));

const sent: any[] = vi.hoisted(() => []);

vi.mock("../store", () => ({
  useAppStore: Object.assign(
    (selector: any) => selector(storeState),
    { getState: () => storeState },
  ),
}));

vi.mock("../lib/i18n", () => ({
  useI18n: () => ({ t: (_key: string, fallback?: any) => fallback ?? _key }),
}));

vi.mock("../components/ui/Toast", () => ({ toast: vi.fn() }));

vi.mock("../lib/p2p/network", () => ({
  p2pNetwork: {
    sendAddressed: vi.fn((_peer: any, frame: any) => {
      sent.push(frame);
      return Promise.resolve();
    }),
    peerForChat: () => undefined,
    peerForChatName: () => undefined,
  },
}));

import { useMessageForward } from "./useMessageForward";
import { parseChatText } from "../lib/p2p/chatFrame";

function Harness({ sourceChat, onReady }: { sourceChat: any; onReady: (api: any) => void }) {
  const api = useMessageForward(sourceChat);
  onReady(api);
  return (
    <div>
      <button type="button" onClick={() => api.openForward({ id: 1, sender: "Alice", type: "image", attachment: "ftr1:x" })}>
        forward-photo
      </button>
      <button type="button" onClick={() => api.openForward([{ id: 2, sender: "me", text: "a" }, { id: 3, sender: "me", text: "b" }])}>
        forward-batch
      </button>
      <span data-testid="state">{api.forwardOpen ? `open:${api.forwardCount}` : "closed"}</span>
    </div>
  );
}

describe("useMessageForward", () => {
  let api: any;

  beforeEach(() => {
    sent.length = 0;
    storeState.chats = [
      { id: "source", name: "Alice", history: [{ id: 1, sender: "Alice", type: "image" }] },
      { id: "target", name: "Bob", history: [] },
    ];
    storeState.setChats.mockImplementation((updater: any) => {
      storeState.chats = updater(storeState.chats);
    });
  });

  it("writes the forwarded copy into chat.history, not the unrendered chat.messages", async () => {
    render(<Harness sourceChat={{ id: "source", name: "Alice" }} onReady={(a) => (api = a)} />);

    fireEvent.click(screen.getByText("forward-photo"));
    expect(screen.getByTestId("state")).toHaveTextContent("open:1");

    await act(async () => {
      api.forwardTo({ id: "target", name: "Bob" });
    });

    const target = storeState.chats.find((c) => c.id === "target");
    expect(target.history).toHaveLength(1);
    expect((target as any).messages).toBeUndefined();
    expect(target.history[0]).toMatchObject({
      sender: "me",
      type: "image",
      attachment: "ftr1:x",
      forwarded: true,
      forwardedFrom: "Alice",
      forwardedFromChat: "Alice",
    });
    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });

  it("appends a batch in order without mutating the source chat", async () => {
    render(<Harness sourceChat={{ id: "source", name: "Alice" }} onReady={(a) => (api = a)} />);

    fireEvent.click(screen.getByText("forward-batch"));
    await act(async () => {
      api.forwardTo({ id: "target", name: "Bob" });
    });

    const target = storeState.chats.find((c) => c.id === "target");
    expect(target.history.map((m: any) => m.text)).toEqual(["a", "b"]);
    expect(target.history[0].id).toBeLessThan(target.history[1].id);
    expect(storeState.chats.find((c) => c.id === "source").history).toHaveLength(1);
  });

  it("sends a wire frame for forwarded text only", async () => {
    render(<Harness sourceChat={{ id: "source", name: "Alice" }} onReady={(a) => (api = a)} />);

    fireEvent.click(screen.getByText("forward-photo"));
    await act(async () => api.forwardTo({ id: "target", name: "Bob" }));
    expect(sent).toHaveLength(0);

    fireEvent.click(screen.getByText("forward-batch"));
    await act(async () => api.forwardTo({ id: "target", name: "Bob" }));
    await waitFor(() => expect(sent).toHaveLength(2));
    const texts = sent.map((frame) => parseChatText(String(frame)));
    expect(texts[0]).toMatchObject({ type: "chat-text", chatId: "target", chatName: "Bob", text: "a" });
    expect(texts[1]).toMatchObject({ type: "chat-text", chatId: "target", chatName: "Bob", text: "b" });
  });

  it("ignores an empty payload and a missing target", async () => {
    render(<Harness sourceChat={{ id: "source", name: "Alice" }} onReady={(a) => (api = a)} />);

    act(() => api.openForward([]));
    expect(screen.getByTestId("state")).toHaveTextContent("closed");

    fireEvent.click(screen.getByText("forward-photo"));
    await act(async () => api.forwardTo(null));
    expect(storeState.chats.find((c) => c.id === "target").history).toHaveLength(0);
    // The picker stays open so the user can retry with another chat.
    expect(screen.getByTestId("state")).toHaveTextContent("open:1");
  });
});
