/**
 * Mention-autocomplete contracts (shared between `useMentionAutocomplete`
 * hook, `ChatInputArea` composer and their consumers).
 *
 * `MentionCandidate` is deliberately a plain minimal shape — the composer
 * feeds it from any contact-like list (chat contacts, CRM leads, members).
 * `MentionToken` is a caret-anchored `@body` slice returned by the tokenizer.
 */

/** One selectable row produced by the mention filter. */
export interface MentionCandidate {
  id: string;
  name: string;
  username: string;
  /** Contact avatar — may be absent (initial-based fallback in the UI). */
  avatar?: string;
}

/** A `@body` slice found before the caret (both indices into the raw text). */
export interface MentionToken {
  start: number;
  end: number;
  body: string;
}

/** A mention ready to be suggested/inserted — alias over the candidate shape. */
export type MentionSuggestion = MentionCandidate;
