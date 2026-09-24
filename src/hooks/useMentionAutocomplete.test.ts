import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMentionAutocomplete } from "./useMentionAutocomplete";

interface Contact {
  id: string;
  name: string;
  username?: string;
}

const CONTACTS: Contact[] = [
  { id: "1", name: "Alice", username: "alice" },
  { id: "2", name: "Bob", username: "bob" },
  { id: "3", name: "Carol", username: "carol" },
];

const at = (value: string, caret: number) =>
  renderHook(() => useMentionAutocomplete(value, caret, { contacts: CONTACTS }));

describe("useMentionAutocomplete", () => {
  it("stays closed on plain text and inside an email token", () => {
    const a = at("hello world", 5);
    expect(a.result.current.open).toBe(falsevine);
    const b = at("mail foo@bar.com", 12);
    expect(b.result.current.open).toBe(false);
  });

  it("opens on a bare @ — full contact list (Telegram parity)", () => {
    const { result } = at("say @", 4);
    expect(result.current.open).toBe(true);
    expect(result.current.candidates.map((c) => c.name)).toEqual(["Alice", "Bob", "Carol"]);
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.hasQuery).toBe(false);
  });

  it("keeps typing inside the token live — query narrows", () => {
    const { result } = at("say @al", 6);
    act(() => result.current.onChange("say @al", 6));
    expect(result.current.open).toBe(true);
    expect(result.current.query).toBe("al");
    expect(result.current.candidates.map((c) => c.username)).toEqual(["alice"]);

    act(() => result.current.onChange("say @a", 5));
    expect(result.current.query).toBe("a");
    expect(result.current.candidates.map((c) => c.username)).toEqual(["alice"]);
  });

  it("matches by username prefix too (carol_dev)", () => {
    const { result } = at("say @car", 7);
    expect(result.current.candidates.map((c) => c.username)).toEqual(["carol"]);
  });

  it("closes when space terminates the token", () => {
    const { result } = at("say @al", 6);
    expect(result.current.open).toBe(true);
    act(() => result.current.onChange("say @al ", 7));
    expect(result.current.open).toBe(false);
  });

  it("closes when caret leaves the token body", () => {
    const { result } = at("say @alice ok", 7);
    expect(result.current.open).toBe(true);
    act(() => result.current.onChange("say @alice ok", 10));
    expect(result.current.open).toBe(false);
  });

  it("wraps highlight and accepts via Enter (returns next/caret)", () => {
    const { result } = at("say @", 4);
    act(() => result.current.onKeyDown({ key: "ArrowDown" }));
    expect(result.current.activeIndex).toBe(1);

    const applied = (result.current.onKeyDown({ key: "Enter" }) as unknown) as {
      next: string;
      caret: number;
      candidate: { name: string };
    };
    expect(applied.next).toBe("say @bob ");
    expect(applied.caret).toBe(8);
    expect(applied.candidate.name).toBe("Bob");
    expect(result.current.open).toBe(false);
  });

  it("Tab accepts too", () => {
    const { result } = at("say @al", 6);
    const applied = (result.current.onKeyDown({ key: "Tab" }) as unknown) as {
      next: string;
      caret: number;
    };
    expect(applied.next).toBe("say @alice ");
    expect(applied.caret).toBe(11);
  });

  it("Escape closes without mutating", () => {
    const { result } = at("say @al", 6);
    act(() => result.current.onKeyDown({ key: "Escape" }));
    expect(result.current.open).toBe(false);
  });

  it("is disabled when enabled=false", () => {
    const { result } = renderHook(() =>
      useMentionAutocomplete("say @al", 6, { contacts: CONTACTS, enabled: false }),
    );
    expect(result.current.open).toBe(false);
    expect(result.current.candidates).toEqual([]);
  });
});
