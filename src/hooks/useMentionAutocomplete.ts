import { useCallback, useMemo } from "react";
import type { MentionCandidate, MentionToken, MentionSuggestion } from "../types";
import { isMentionBodyChar } from "../types/mention";

export const MENTION_QUERY_LIMIT = 8;

export function findMentionToken(
  text: string,
  caret: number
): MentionToken | null {
  const safeCaret = Math.max(0, Math.min(caret, text.length));
  let end = safeCaret;
  while (end > 0 && isMentionBodyChar(text[end - 1] ?? "")) end -= 1;
  const start = end - 1;
  if (start < 0 || text[start] !== "@") return null;
  if (start > 0 && isMentionBodyChar(text[start - 1] ?? "")) return null;
  return { start, end: safeCaret, body: text.slice(start + 1, safeCaret) };
}

export function filterMentionContacts(
  contacts: MentionCandidate[],
  query: string
): MentionSuggestion[] {
  const q = query.toLowerCase();
  return contacts
    .filter((contact) => !q || contact.username.toLowerCase().startsWith(q) || contact.name.toLowerCase().includes(q))
    .slice(0, MENTION_QUERY_LIMIT);
}

export function applyMentionInsert(
  text: string,
  caret: number,
  username: string,
  literal?: string
): { text: string; caret: number } {
  const safeCaret = Math.max(0, Math.min(caret, text.length));
  const token = findMentionToken(text, safeCaret);
  const start = token?.start ?? safeCaret;
  const suffixStart = token?.end ?? safeCaret;
  const nextChar = text[safeCaret] ?? "";
  const separator = /[\p{P}\p{S}\s]/u.test(nextChar) ? "" : " ";
  const handle = literal ?? username;
  if (!handle) return { text, caret: safeCaret };
  const insert = `@${handle}${separator}`;
  return {
    text: text.slice(0, start) + insert + text.slice(suffixStart),
    caret: start + insert.length,
  };
}

export type MentionAutocompleteState = {
  token: MentionToken | null;
  suggestions: MentionSuggestion[];
  replace: (username: string) => string | null;
};

export function useMentionAutocomplete(
  value: string,
  caret: number,
  options: { contacts?: MentionCandidate[] } = {}
): MentionAutocompleteState {
  const contacts = options.contacts ?? [];
  const token = useMemo(() => findMentionToken(value, caret), [value, caret]);
  const suggestions = useMemo(
    () => filterMentionContacts(contacts, token?.body ?? ""),
    [contacts, token]
  );
  const replace = useCallback(
    (username: string) => {
      if (!token) return null;
      return applyMentionInsert(value, caret, username).text;
    },
    [value, caret, token]
  );
  return { token, suggestions, replace };
}
