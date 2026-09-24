import { useCallback, useMemo, useRef, useState } from "react";
import type { MentionCandidate, MentionToken, MentionSuggestion } from "../types";

const tokenChars = "@\w'.@-";

export function findMentionToken(
  text: string,
  caret: number
): MentionToken | null {
  if (caret <= 0) return null;
  const before = text.slice(0, Math.max(0, caret));
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  const prev = at > 0 ? before[at - 1] : "";
  if (prev && !/\s/.test(prev)) return null;
  const body = before.slice(at + 1);
  if (/\s/.test(body)) return null;
  return { start: at, end: caret, body };
}

export function mentionTokenFor(
  text: string,
  caret: number
): { at: number; len: number; raw: string } | null {
  const t = findMentionToken(text, caret);
  if (!t) return null;
  return { at: t.start, len: t.body.length + 1, raw: text.slice(t.start, t.end) };
}

const isCandidateTokenChar = (c: string) => /[\w'.]/.test(c);

export function filterMentionContacts(
  contacts: MentionCandidate[],
  query: string
): MentionSuggestion[] {
  if (!query) return contacts.map((c) => ({ id: c.id, username: c.username, name: c.name, avatar: c.avatar }));
  const q = query.toLowerCase();
  return contacts
    .filter((c) => c.name.toLowerCase().includes(q) || (c.username && c.username.toLowerCase().includes(q)))
    .map((c) => ({ id: c.id, username: c.username, name: c.name, avatar: c.avatar }));
}

export function applyMentionInsert(
  text: string,
  caret: number,
  username: string,
  literal?: string
): { text: string; caret: number } {
  const tok = findMentionToken(text, caret);
  const start = tok ? tok.start : caret;
  const insert = "@" + (literal || username) + " ";
  return { text: text.slice(0, start) + insert + text.slice(caret), caret: start + insert.length };
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

export const mentionTokenForDebug = mentionTokenFor;
