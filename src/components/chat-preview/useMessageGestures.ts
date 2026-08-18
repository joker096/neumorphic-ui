import React from "react";

interface UseMessageGesturesArgs {
  msgId: string | number;
  selectionMode: boolean;
  onToggleSelect?: (id: string | number) => void;
  onReply: (msg: any) => void;
  onReactionMessage: (id: string | number, emoji: string) => void;
  onSetBounceMsgId: (id: string | number | null) => void;
  onOpenMenu: () => void;
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
    onOpenMenu();
  };

  const handlePointerDown = () => {
    if (selectionMode) return;
    longPressed.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      onOpenMenu();
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
