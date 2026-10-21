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
import { isMorseCode } from '../../MorseDecoder';
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
  t: (key: string, vars?: Record<string, any>) => string;
}

export function useMessageBubble({
  msg, isMe, isChannel, chat, theme, selectionMode,
  onToggleSelect, onReply, onReactionMessage, onSetBounceMsgId,
  translate, lang, t,
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
  const showAvatar = !isChannel;
  // Avatars live in the outer gutter for every non-channel message, so identity
  // stays readable for media, stickers and edits too — not just plain text.
  const isGroup = chat?.type === "group" || Array.isArray(chat?.members);
  const showSenderName = showAvatar && isGroup && isGroupFirst && !isMe && !!displayName;
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

  return {
    menuOpen, setMenuOpen, menuAnchorRect, openMessageMenu,
    editing, setEditing, isGroupFirst, displayName, showAvatar, isGroup,
    showSenderName, forwardedFrom, expired,
    handleBubbleClick, handleContextMenu,
    handlePointerDown, handlePointerUp, handlePointerLeave, handlePointerCancel,
    translation, translating, onTranslate,
    morseDecoded, toggleMorse, isMorse, stickerSrc, bubbleCornerClass,
  };
}
