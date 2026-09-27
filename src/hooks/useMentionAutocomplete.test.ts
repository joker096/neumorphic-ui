import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { MentionCandidate } from "../types";
import { createMentionHandle } from "../types/mention";
import { parseMentions } from "../constants/uiConfig";
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
    expect(findMentionToken("Привет @al", 10)).toEqual({
      start: 7,
      end: 10,
      body: "al",
    });
  });

  it("поддерживает Unicode body и останавливается до punctuation", () => {
    const text = "Привет @алиса, мир";
    expect(findMentionToken(text, text.indexOf(","))).toEqual({
      start: 7,
      end: 13,
      body: "алиса",
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

  it("фильтрует Unicode query по имени", () => {
    expect(filterMentionContacts(contacts, "алис").map((contact) => contact.username)).toEqual(["alice"]);
  });
});

describe("parseMentions", () => {
  it("парсит Unicode mention и не принимает email за mention", () => {
    const text = "Пиши @Анна_Иванова, test@gmail.com";
    expect(parseMentions(text).mentions).toEqual([
      { name: "Анна_Иванова", index: text.indexOf("@Анна_Иванова") },
    ]);
  });
});

describe("createMentionHandle", () => {
  it("сохраняет Unicode и нормализует разделители", () => {
    expect(createMentionHandle(" Иван-Петров ")).toBe("Иван_Петров");
    expect(createMentionHandle("微信 用户")).toBe("微信_用户");
  });
});

describe("applyMentionInsert", () => {
  it("заменяет токен на @username + пробел", () => {
    const r = applyMentionInsert("Привет @al", 10, "alice");
    expect(r.text).toBe("Привет @alice ");
    expect(r.caret).toBe(14);
  });

  it("сохраняет punctuation без лишнего пробела", () => {
    const text = "Привет @алиса, мир";
    const r = applyMentionInsert(text, text.indexOf(","), "Анна_Иванова");
    expect(r.text).toBe("Привет @Анна_Иванова, мир");
    expect(r.caret).toBe(20);
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
