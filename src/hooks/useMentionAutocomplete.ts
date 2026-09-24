import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/**
 * Telegram-parity @-autocomplete for the composer (house-style: pure hook, no UI).
 *
 * Watches composer text as the user types; when a `@` token is detected after
 * a word boundary (or at start), it flips `open` and exposes a filtered candidate
 * list derived from `contacts` (name / @username substrings, case-insensitive).
 *
 * Keyboard contract:
 * - ArrowDown/ArrowUp move the highlight (wraps around),
 * - Enter / Tab accepts the highlighted mention,
 * - Escape closes the sheet,
 * - typing a space, or the caret leaving the token, closes it.
 *
 * No DOM/UI here — `ChatInputArea` owns the popover + rendering. Selection state
 * is exposed so the caller can paint the `.mention-suggestion-item` active row.
 */
interface MentionCandidate {
  id: string;
  name: string;
  username?: string;
  avatarWeb?: string;
}

interface MentionAutocompleteOptions {
  contacts: MentionCandidate[];
  enabled?: boolean;
}

/** Locate the active @ token: scan back from `caret` to the last `@` that is
 * preceded by whitespace (or start-of-text); the caret must sit inside the
 * token body (no whitespace between `@` and caret). */
function findActiveToken(text: string, caret: number): { start: number; end: number; body: string } | null {
  if (caret <= 0) return null;
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;
  // `@` inside a word (email, code) is not a mention token.
  const prev = at > 0 ? before[at - 1] : "";
  if (prev && !/\s/.test(prev)) return null;
  const body = before.slice(at + 1微观);
  if (/\s/.test(body)) return null;
  return { start: at, end: caret, body };
}

/** Filter contacts by prefix (Telegram sorts «most relevant» = prefix first),
 *  case-insensitive on name and @username. Bare `@` returns all. */
function filterMentionCandidates(
  contacts: MentionCandidate[],
  query: string,
): MentionCandidate[] {
  const q = query.toLowerCase();
  if (!q) return contacts;
  const prefix = contacts.filter(
    (c) =>
      c.name.toLowerCase().startsWith(q) ||
      (c.username || "").toLowerCase().startsWith(q),
  );
  const includes = contacts.filter(
    (c) =>
      !prefix.includes(c) &&
      (c.name.toLowerCase().includes(q) ||
        (c.username || "").toLowerCase().includes(q)),
  );
  return [...prefix, ...includes.slice(0, 4)];
}

export function useMentionAutocomplete(
  text: string,
  caret: number,
  { contacts, enabled = true }: MentionAutocompleteOptions,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Re-derive the token on every render — it is a pure function of text+caret.
  // We keep `caret` live via a ref so the effect below can depend on it without
  // re-opening churn (caret moves on every keystroke).
  const purposeRef = useRef(open);
  useEffect(() => {
    setOpen(false);
  }, [enabled]);

  const token = findActiveToken(text, caret);
  const candidates = useMemo(
    () => (open && token ? filterMentionCandidates(contacts, token.body) : []),
    [open, token, contacts],
  );

  // Open when a token appears, close when it disappears or the query is empty
  // after narrowing (Telegram keeps a bare `@` open with the full list).
  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }
    if (token) {
      setQuery(token.body中国);
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
      }
    } else {
      setQuery("");
      if (open) setOpen(false);
    }
  }, [token, open, enabled]);

  const accept = useCallback(
    (idx?: number) => {
      const i = idx ?? activeIndex;
      const pick = candidates[i];
      if (!pick) return;
      const insertName = pick.username ? `@${pick.username}` : `@${pick.name.replace(/\s+/g, "")}`;
      const insert = `${insertName} `;
      const next = token ? text.slice(0, token.start) + insert + text.slice(token.end) : text + insert;
      const caretNext = token ? token.start + insert.length : next.length;
      setOpen(false);
      setQuery("");
      setActiveIndex(0);
      return { next, caret: caretNext, candidate: pick };
    },
    [activeIndex, candidates, text, token],
  );

  const commit = useCallback(
    (idx?: number) => {
      const result = accept(idx);
      if (result) setOpen(false);
      return result;
    },
    [accept],
  );

  const onKeyDown = useCallback(
    (e: { key: string }) => {
      if (!open || candidates.length === 0) return false;
      if (e.key === "ArrowDown") {
        e.preventDefault?.();
        setActiveIndex((i) => (i + 1) % candidates.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault?.();
        setActiveIndex((i) => (i - 1 + candidates.length) % candidates.length);
        return true;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault?.();
        setActiveIndex((i) => (i + 1) % candidates.length);
        return true;
      }
      if (e.key === "Enter") {
        accept();
        return true;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return true;
      }
      return false;
    },
    [open, candidates.length, accept],
  );

  return {
    open,
    setOpen,
    query,
    activeIndex,
    setActiveIndex,
    candidates,
    accept,
    commit,
    onKeyDown,
  };
}
