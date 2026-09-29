import React from "react";
import { useAppStore } from "../../store";
import { useMentionAutocomplete } from "../../hooks/useMentionAutocomplete";
import type { MentionCandidate, MentionSuggestion } from "../../types";
import { createMentionHandle } from "../../types/mention";

/** Anything a mention can be resolved from: a contact, a group member, a chat. */
type MentionSource = {
  id?: string | number;
  name?: string;
  username?: string;
  telegram?: string;
  avatar?: string;
};

const toMentionCandidate = (
  source: MentionSource | null | undefined,
): MentionCandidate | null => {
  const name = typeof source?.name === "string" ? source.name.trim() : "";
  const suppliedUsername = typeof source?.username === "string"
    ? source.username.trim()
    : typeof source?.telegram === "string"
      ? source.telegram.trim()
      : "";
  const username = createMentionHandle((suppliedUsername || name).replace(/^@/, ""));
  if (!name || !username) return null;
  return {
    id: String(source?.id ?? username),
    name,
    username,
    avatar: typeof source?.avatar === "string" ? source.avatar : undefined,
  };
};

export interface UseChatMentionsArgs {
  isChannel: boolean;
  chat: any;
  msgText: string;
  setMsgText: (value: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export interface ChatMentions {
  /** Suggestions to render; empty when the menu must stay closed. */
  suggestions: MentionSuggestion[];
  activeIndex: number;
  /** True while the menu should be visible and owns the Enter key. */
  open: boolean;
  /** Replace the active `@token` with a picked suggestion. */
  applyMention: (suggestion: MentionSuggestion) => void;
  /** Report the caret after typing so a fresh `@` re-evaluates the token. */
  trackCaret: (caret: number) => void;
  /**
   * Consume a key press for the menu.
   *
   * Returns true when the menu handled it (arrow navigation, Enter to pick,
   * Escape to dismiss) so the caller can leave its own Enter-to-send handling
   * untouched. `send` is only invoked on an Enter that the menu did not take.
   */
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>, send: () => void) => void;
}

/**
 * `@name` autocomplete for the message composer.
 *
 * Candidates are resolved from the store rather than the chat: a DM peer may be
 * addressed by contact id, handle or bare name, while a group can only mention
 * its own members. Channels have no mention surface at all.
 */
export function useChatMentions({
  isChannel,
  chat,
  msgText,
  setMsgText,
  inputRef,
}: UseChatMentionsArgs): ChatMentions {
  const contacts = useAppStore((state) => state.contacts);
  const userProfile = useAppStore((state) => state.userProfile);
  const [caret, setCaret] = React.useState(0);
  const [index, setIndex] = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);

  // Lookup indexes rebuilt once per contacts change. Scanning the array per
  // lookup re-normalized every contact's handle (NFKC + two regex passes) for
  // each candidate examined; here each contact is indexed exactly once.
  const { byId, byName, byUsername } = React.useMemo(() => {
    const id = new Map<string, MentionSource>();
    const name = new Map<string, MentionSource>();
    const username = new Map<string, MentionSource>();
    for (const contact of (contacts ?? []) as MentionSource[]) {
      const idKey = String(contact?.id ?? "");
      if (idKey && !id.has(idKey)) id.set(idKey, contact);
      const nameKey = typeof contact?.name === "string" ? contact.name.trim().toLowerCase() : "";
      if (nameKey && !name.has(nameKey)) name.set(nameKey, contact);
      const handle = toMentionCandidate(contact)?.username.toLowerCase();
      if (handle && !username.has(handle)) username.set(handle, contact);
    }
    return { byId: id, byName: name, byUsername: username };
  }, [contacts]);

  const candidates = React.useMemo<MentionCandidate[]>(() => {
    if (isChannel) return [];
    const selfId = String(userProfile.id);

    const isGroup = chat?.type === "group" || Array.isArray(chat?.members);
    if (isGroup) {
      const memberIds = Array.isArray(chat?.memberIds) ? chat.memberIds : undefined;
      const members: MentionSource[] = Array.isArray(chat?.members) && chat.members.length > 0
        ? chat.members
        : memberIds
          ? memberIds.map((id: string) => byId.get(String(id))).filter(Boolean) as MentionSource[]
          : [];
      // Single pass with a seen-set: the previous `all.findIndex(...)` filter was
      // quadratic in the member count (a 500-member group did 250k comparisons).
      const seen = new Set<string>();
      const result: MentionCandidate[] = [];
      for (const member of members) {
        const candidate = toMentionCandidate(member);
        if (!candidate || candidate.id === selfId || seen.has(candidate.id)) continue;
        seen.add(candidate.id);
        result.push(candidate);
      }
      return result;
    }

    const chatName = typeof chat?.name === "string" ? chat.name.trim() : "";
    const peerId = chat?.contactId ?? chat?.peerId ?? chat?.memberIds?.[0];
    const chatUsername = typeof chat?.username === "string"
      ? createMentionHandle(chat.username.replace(/^@/, "")).toLowerCase()
      : "";
    const peer = (peerId !== undefined && peerId !== null ? byId.get(String(peerId)) : undefined)
      ?? (chatUsername ? byUsername.get(chatUsername) : undefined)
      ?? (chatName !== "" ? byName.get(chatName.toLowerCase()) : undefined);
    const candidate = toMentionCandidate(peer ?? (chatName
      ? { id: chat?.id ?? chatName, name: chatName, username: chat?.username }
      : null));
    return candidate && candidate.id !== selfId ? [candidate] : [];
  }, [byId, byName, byUsername, chat, isChannel, userProfile.id]);

  const { token, suggestions, replace } = useMentionAutocomplete(msgText, caret, { contacts: candidates });
  const open = !dismissed && !!token && suggestions.length > 0;
  const activeIndex = suggestions.length > 0 ? Math.min(index, suggestions.length - 1) : 0;

  // A different chat means a different set of mentionable people.
  React.useEffect(() => {
    setCaret(0);
    setIndex(0);
    setDismissed(false);
  }, [chat?.id]);

  const trackCaret = (next: number) => {
    setCaret(next);
    setIndex(0);
    setDismissed(false);
  };

  const applyMention = (suggestion: MentionSuggestion) => {
    const next = replace(suggestion.username);
    if (next === null || !token) return;
    const suffix = msgText.slice(token.end);
    const nextCaret = next.length - suffix.length;
    setMsgText(next);
    setCaret(nextCaret);
    setIndex(0);
    setDismissed(true);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>, send: () => void) => {
    if (open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const picked = suggestions[activeIndex];
        if (picked) applyMention(picked);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setDismissed(true);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return { suggestions, activeIndex, open, applyMention, trackCaret, handleKeyDown };
}
