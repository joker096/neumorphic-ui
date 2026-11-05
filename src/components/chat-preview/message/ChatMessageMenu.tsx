import { useState } from "react";
import { MessageContextMenu } from "../MessageContextMenu";
import { buildMessageMenuActions } from "../messageMenuActions";
import { type MenuAnchorRect } from "../menuPosition";
import { useReactionEmojis } from "../../../hooks/useReactionEmojis";

interface ChatMessageMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRect: MenuAnchorRect | null;
  title: string;
  t: (key: string, options?: any) => string;
  msg: any;
  isMe: boolean;
  isChannel: boolean;
  chat: any;
  chatSavedMessages: any[];
  onSelect?: (msg: any) => void;
  onReply: (msg: any) => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
  onForward?: (msg: any) => void;
  onDelete?: (msg: any, scope?: "all" | "me") => void;
  onTranslate: () => void;
  onEdit?: (msg: any) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
}

/**
 * Long-press / right-click menu for one bubble. Owns the quick-reaction strip
 * (Telegram puts the emoji row on top of the action list) and the action list
 * itself, so `ChatMessage` stays a layout-only component.
 */
export function ChatMessageMenu({
  open, onClose, anchorRect, title, msg, isMe, isChannel, chat, chatSavedMessages, t,
  onSelect, onReply, onToggleSavedMessage, onForward, onDelete, onTranslate, onEdit,
  onReactionMessage,
}: ChatMessageMenuProps) {
  const reactionEmojis = useReactionEmojis();
  return (
    <MessageContextMenu
      open={open}
      onClose={onClose}
      anchorRect={anchorRect}
      title={title}
      reactionEmojis={reactionEmojis}
      myReactions={msg.myReactions || {}}
      onReact={(emoji) => onReactionMessage(msg.id, emoji)}
      actions={buildMessageMenuActions({
        msg, isMe, t, isChannel, chat, chatSavedMessages,
        onSelect, onReply, onToggleSavedMessage, onForward, onDelete, onTranslate, onEdit,
      })}
    />
  );
}
