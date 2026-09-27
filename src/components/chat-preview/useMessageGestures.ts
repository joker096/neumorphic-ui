import React from "react";
import { toMenuAnchorRect, type MenuAnchorRect } from "./menuPosition";

interface UseMessageGesturesArgs {
  msgId: string | number;
  selectionMode: boolean;
  onToggleSelect?: (id: string | number) => void;
  onReply: (msg: any) => void;
  onReactionMessage: (id: string | number, emoji: string) => void;
  onSetBounceMsgId: (id: string | number | null) => void;
  /** Receives the pressed bubble's rect so the menu can anchor next to it. */
  onOpenMenu: (anchorRect: MenuAnchorRect | null) => void;
}

/**
 * Encapsulates tap / long-press / context-menu gesture handling for a single
 * chat bubble. Kept separate from the render tree so the message component stays
 * focused on layout and the gesture state (refs + timers) is reusable.
 */
export function useMessageGestures({
  msgId,
  selectionMode,
  onToggleSelect,
  onReply,
  onReactionMessage,
  onSetBounceMsgId,
  onOpenMenu,
}: UseMessageGesturesArgs) {
  const lastTapRef = React.useRef<{ time: number; msgId: string | number }>({
    time: 0,
    msgId: 0,
  });
  const longPressTimer = React.useRef<number | null>(null);
  const longPressed = React.useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
  };

  const handleBubbleClick = () => {
    if (selectionMode) {
      onToggleSelect?.(msgId);
      return;
    }
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current.time < 300 && lastTapRef.current.msgId === msgId) {
      onReactionMessage(msgId, "👍");
      onSetBounceMsgId(msgId);
      window.setTimeout(() => onSetBounceMsgId(null), 300);
      lastTapRef.current = { time: 0, msgId: 0 };
    } else {
      lastTapRef.current = { time: now, msgId };
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (selectionMode) return;
    e.preventDefault();
    onOpenMenu(toMenuAnchorRect(e.currentTarget.getBoundingClientRect()));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (selectionMode) return;
    longPressed.current = false;
    clearLongPress();
    const anchorRect = toMenuAnchorRect(e.currentTarget.getBoundingClientRect());
    longPressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      onOpenMenu(anchorRect);
    }, 480);
  };

  return {
    lastTapRef,
    longPressed,
    longPressTimer,
    handleBubbleClick,
    handleContextMenu,
    handlePointerDown,
    handlePointerUp: clearLongPress,
    handlePointerLeave: clearLongPress,
    handlePointerCancel: clearLongPress,
  };
}
