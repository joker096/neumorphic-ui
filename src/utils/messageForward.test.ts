import { describe, it, expect, afterEach } from "vitest";

import { buildForwardedMessage, isWireForwardable } from "./messageForward";

const originalDate = globalThis.Date;

afterEach(() => {
  globalThis.Date = originalDate;
});

describe("buildForwardedMessage", () => {
  it("stamps a fresh id, sender and real clock time (never the literal 'now')", () => {
    const copy = buildForwardedMessage({ id: 42, sender: "Alice", text: "hi", time: "10:00" }, { now: 1000 });

    expect(copy.id).toBe(1000);
    expect(copy.ts).toBe(1000);
    expect(copy.sender).toBe("me");
    expect(copy.text).toBe("hi");
    expect(copy.time).not.toBe("now");
    expect(copy.time).toMatch(/\d{1,2}:\d{2}/);
    expect(copy.forwarded).toBe(true);
    expect(copy.forwardedFrom).toBe("Alice");
  });

  it("keeps batch ids unique and ordered via now + index", () => {
    const a = buildForwardedMessage({ id: 1, sender: "me" }, { now: 500, index: 0 });
    const b = buildForwardedMessage({ id: 2, sender: "me" }, { now: 500, index: 1 });

    expect(a.id).toBe(500);
    expect(b.id).toBe(501);
    expect(a.id).toBeLessThan(b.id);
  });

  it("carries media payloads over so a photo keeps rendering", () => {
    const copy = buildForwardedMessage(
      { id: 7, sender: "Alice", type: "image", attachment: "ftr1:abc", text: "" },
      { now: 10 },
    );

    expect(copy.type).toBe("image");
    expect(copy.attachment).toBe("ftr1:abc");
  });

  it("does not inherit the source expiry, reactions, reply quote or render grouping", () => {
    const copy = buildForwardedMessage(
      {
        id: 9,
        sender: "Alice",
        text: "hi",
        selfDestructAt: Date.now() + 60_000,
        reactions: { "👍": 1 },
        replyTo: { id: 1, text: "older" },
        linkPreview: { title: "x" },
        edited: true,
        _groupPosition: "middle",
        _isLastInGroup: false,
        _isDateSeparator: true,
        _dateLabel: "Today",
      },
      { now: 20 },
    );

    expect(copy.selfDestructAt).toBeUndefined();
    expect(copy.reactions).toBeUndefined();
    expect(copy.replyTo).toBeUndefined();
    expect(copy.linkPreview).toBeUndefined();
    expect(copy.edited).toBeUndefined();
    expect(copy._groupPosition).toBeUndefined();
    expect(copy._isLastInGroup).toBeUndefined();
    expect(copy._isDateSeparator).toBeUndefined();
    expect(copy._dateLabel).toBeUndefined();
  });

  it("replaces an already-forwarded label instead of nesting it", () => {
    const copy = buildForwardedMessage(
      { id: 3, sender: "me", forwarded: true, forwardedFrom: "Bob", forwardedFromChat: "Old" },
      { now: 30, sourceChatName: "New chat" },
    );

    expect(copy.forwarded).toBe(true);
    expect(copy.forwardedFrom).toBeUndefined();
    expect(copy.forwardedFromChat).toBe("New chat");
  });

  it("passes the host status through and defaults to sent", () => {
    expect(buildForwardedMessage({ id: 1 }, { now: 1 }).status).toBe("sent");
    expect(buildForwardedMessage({ id: 1 }, { now: 1, status: "queued" }).status).toBe("queued");
  });
});

describe("isWireForwardable", () => {
  it("treats plain text as wire-forwardable and attachments as local-only", () => {
    expect(isWireForwardable({ text: "hi" })).toBe(true);
    expect(isWireForwardable({ type: "image" })).toBe(false);
    expect(isWireForwardable({ type: "sticker" })).toBe(false);
    expect(isWireForwardable(undefined)).toBe(false);
  });
});
