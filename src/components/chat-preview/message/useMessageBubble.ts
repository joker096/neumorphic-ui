/**
 * Per-bubble derived state: menu, edit mode, identity, gestures, translation,
 * morse toggle and the corner/ sticker lookups the bubble render needs.
 *
 * Kept out of `ChatMessage` so the render body stays a pure description of the
 * bubble; every value here is derived from the message and the chat only.
 */
import React from 'react';
import { getICQStickerSrc } from '../../../lib/icqEmojis';
import { getBubbleCornerClass, type GroupPosition } from '../../../utils/chatUtils';
import { decodeMorse, isMorseCode } from '../../MorseDecoder';
import { floatsTimestamp } from './MessageTextBlock';
import { useMessageGestures } from '../useMessageGestures';
import type { MenuAnchorRect } from '../menuPosition';
import { useSelfDestructExpiry, useMessageTranslation, useMorseToggle } from './useMessageChrome';

interface UseMessageBubbleArgs {
  msg: any;
  isMe: boolean;
  isChannel?: boolean;
  chat: any;
  theme: "light" | "dark";
  selectionMode?: boolean;
  onToggleSelect?: (id: string | number) => void;
  onReply: (msg: any) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
  onSetBounceMsgId: (id: string | number | null) => void;
  translate: any;
  lang: string;
  /** True when the bubble renders a thread-replies chip under the text. */
  hasThreads?: boolean;
  t: (key: string, vars?: Record<string, any>) => string;
}

export function useMessageBubble({
  msg, isMe, isChannel, chat, theme, selectionMode,
  onToggleSelect, onReply, onReactionMessage, onSetBounceMsgId,
  translate, lang, hasThreads, t,
}: UseMessageBubbleArgs) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuAnchorRect, setMenuAnchorRect] = React.useState<MenuAnchorRect | null>(null);
  const openMessageMenu = React.useCallback((anchorRect: MenuAnchorRect | null) => {
    setMenuAnchorRect(anchorRect);
    setMenuOpen(true);
  }, []);
  const [editing, setEditing] = React.useState(false);
  const isGroupFirst =
    msg._groupPosition === "first" || msg._groupPosition === "single";
  const displayName = String(msg.sender || chat?.name || "");
  const isGroup = chat?.type === "group" || Array.isArray(chat?.members);
  // Telegram rule: the avatar is drawn once per incoming run, on the last bubble.
  // Outgoing messages never get one — the screen edge already marks "mine", and a
  // column of self-avatars only steals width from the bubble.
  const showAvatar = !isChannel && !isMe && msg._isLastInGroup !== false;
  // The sender label owns the first bubble of a run, the avatar the last one, so
  // the two never compete for the same spot (name on top, avatar at the bottom).
  const showSenderName = !isChannel && isGroup && !isMe && isGroupFirst && !!displayName;
  const forwardedFrom = msg.forwarded ? (msg.forwardedFrom || msg.forwardedFromChat) : undefined;
  const expired = useSelfDestructExpiry(msg.selfDestructAt as number | undefined);

  const {
    handleBubbleClick,
    handleContextMenu,
    handlePointerDown,
    handlePointerUp,
    handlePointerLeave,
    handlePointerCancel,
  } = useMessageGestures({
    msgId: msg.id,
    selectionMode,
    onToggleSelect,
    onReply,
    onReactionMessage,
    onSetBounceMsgId,
    onOpenMenu: openMessageMenu,
  });
  const { translation, translating, onTranslate } = useMessageTranslation({
    translate, text: String(msg.text ?? ''), lang, t,
  });
  const [morseDecoded, toggleMorse] = useMorseToggle();
  const isMorse = typeof msg.text === "string" && msg.type !== "sticker" && msg.type !== "payment" && msg.type !== "story" && msg.type !== "location" && msg.type !== "article" && isMorseCode(msg.text);
  const stickerSrc = React.useMemo(
    () => (msg.type === "sticker" ? getICQStickerSrc(msg.text, theme) : null),
    [msg.text, msg.type, theme],
  );
  const bubbleCornerClass = getBubbleCornerClass(msg._groupPosition as GroupPosition, isMe);
  // Telegram/WhatsApp parity: a plain text bubble carries its clock on the last
  // text line, so the bubble is one line shorter than a media bubble.
  const bodyText = morseDecoded ? decodeMorse(String(msg.text ?? "")) : String(msg.text ?? "");
  const inlineMeta =
    !editing &&
    msg._isLastInGroup === true &&
    floatsTimestamp({ msg, text: bodyText, editing, isMorse, hasThreads: Boolean(hasThreads) });

  return {
    menuOpen, setMenuOpen, menuAnchorRect, openMessageMenu,
    editing, setEditing, isGroupFirst, displayName, showAvatar, isGroup,
    showSenderName, forwardedFrom, expired,
    handleBubbleClick, handleContextMenu,
    handlePointerDown, handlePointerUp, handlePointerLeave, handlePointerCancel,
    translation, translating, onTranslate,
    morseDecoded, toggleMorse, isMorse, stickerSrc, bubbleCornerClass,
    bodyText, inlineMeta,
  };
}
