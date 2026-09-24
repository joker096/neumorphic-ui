import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { MentionCandidate } from "../types";
import {
  findMentionToken,
  filterMentionContacts,
  applyMentionInsert,
  useMentionAutocomplete,
} from "./useMentionAutocomplete";

const contacts: MentionCandidate[] = [
  { id: "1", name: "Первый", username: "first" },
  { id: "2", name: "Второй", username: "second" },
  { id: "3", name: "Алиса", username: "alice" },
];

describe("findMentionToken", () => {
  it("находит @-токен перед caret (caret на последней букве body)", () => {
    // "Привет @al" — 10 символов, caret 10 = сразу после "l"
    expect(findMentionToken("Привет @al", 10)).toEqual({
      start: 7,
      end: 10,
      body: "al",
    });
  });

  it("null когда нет @ или @ внутри слова", () => {
    expect(findMentionToken("просто", 4)).toBeNull();
    expect(findMentionToken("test@gmail.com", 13)).toBeNull();
  });
});

describe("filterMentionContacts", () => {
  it("фильтрует по username/name, prefix-first, limit", () => {
    const r = filterMentionContacts(contacts, "a");
    expect(r.map((c) => c.username)).toEqual(["alice"]);
    expect(r).toHaveLength(1);
  });
});

describe("applyMentionInsert", () => {
  it("заменяет токен на @username + пробел", () => {
    const r = applyMentionInsert("Привет @al", 10, "alice");
    expect(r.text).toBe("Привет @alice ");
    expect(r.caret).toBe(14);
  });
});

describe("useMentionAutocomplete", () => {
  it("возвращает токен и suggestions", () => {
    const { result } = renderHook(() =>
      useMentionAutocomplete("Привет @al", 10, { contacts })
    );
    expect(result.current.token).toEqual({ start: 7, end: 10, body: "al" });
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].username).toBe("alice");
  });
});
