import React, { useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useAppStore } from "../../store";
import { p2pNetwork } from "../../lib/p2p/network";
import type { MenuAnchorRect } from "./ChatContextMenu";
import { useLongPressMenu } from "./chat-list-item/useLongPressMenu";
import { ChatListItemSwipeOpenActions, ChatListItemSwipeManageActions } from "./chat-list-item/ChatListItemSwipeActions";
import { ChatListItemAvatar } from "./chat-list-item/ChatListItemAvatar";
import { ChatListItemSummary } from "./chat-list-item/ChatListItemSummary";

interface ChatListItemProps {
  chat: any;
  theme?: "light" | "dark";
  type?: "chat" | "channel";
  active?: boolean;
  onClick?: () => void;
  onArchive?: (id: string | number) => void;
  onMute?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  onAvatarClick?: (chat: any) => void;
  archiveLabel?: string;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  t: (key: string, options?: any) => string;
  pinned?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onMenuRequest?: (chat: any, anchor: { x: number; y: number } | null, anchorRect?: MenuAnchorRect | null) => void;
  draftText?: string;
}

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({
  chat,
  theme = "dark",
  type = "chat",
  active = false,
  onClick,
  onArchive,
  onMute,
  onDelete,
  onAvatarClick,
  archiveLabel,
  onCall,
  onVideoCall,
  t,
  pinned: _pinned,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onMenuRequest,
  draftText,
}: ChatListItemProps) => {
  const isDark = theme === "dark";
  const stealthMode = useAppStore((state) => state.stealthMode);
  const typingIndicators = useAppStore((state) => state.typingIndicators);
  const contactAvatars = useAppStore((state) => state.contactAvatars);
  const overrideAvatar = contactAvatars[chat.name];
  const [remoteTyping, setRemoteTyping] = React.useState(false);

  React.useEffect(() => {
    if (!typingIndicators || !chat.name) return;
    return p2pNetwork.onTypingIndicator((name, isTyping) => {
      if (name === chat.name) setRemoteTyping(isTyping);
    });
  }, [typingIndicators, chat.name]);

  const dragged = useRef(false);
  const dragDistance = useRef(0);
  const [swipedOpen, setSwipedOpen] = React.useState<"closed" | "left" | "right">("closed");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const openMenuOnLongPress = useCallback(
    (rect: DOMRect | null) => { onMenuRequest?.(chat, null, rect); },
    [onMenuRequest, chat]
  );
  const { handlePointerDown, handlePointerUp } = useLongPressMenu({
    enabled: !selectMode && !!onMenuRequest,
    onLongPress: openMenuOnLongPress,
  });

  const isArchived = archiveLabel === t("chat.unarchive");
  const roundedClass = "rounded-full";

  const fuzzedTime = React.useMemo(() => {
    if (!stealthMode || !chat.time) return chat.time;
    const match = chat.time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return chat.time;
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const offset = (chat.id % 11) - 5;
    m += offset;
    if (m < 0) { m += 60; h = (h - 1 + 24) % 24; }
    else if (m >= 60) { m -= 60; h = (h + 1) % 24; }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }, [chat.time, chat.id, stealthMode]);

  const handleSwipeAction = (action: string) => {
    if (action === "message") {
      setSwipedOpen("closed");
      onClick?.();
      return;
    } else if (action === "call" && onCall) {
      onCall(chat.name, chat.color);
      setSwipedOpen("closed");
      return;
    } else if (action === "video" && onVideoCall) {
      onVideoCall(chat.name, chat.color);
      setSwipedOpen("closed");
      return;
    } else if (action === "mute" && onMute) {
      onMute(chat.id);
    } else if (action === "archive" && onArchive) {
      onArchive(chat.id);
    } else if (action === "delete") {
      setSwipedOpen("closed");
      setShowDeleteConfirm(true);
      return;
    }
    setSwipedOpen("closed");
  };

  const targetX = swipedOpen === "left" ? -186 : swipedOpen === "right" ? 200 : 0;

  return (
    <div
      className={`relative mb-1 last:mb-0 overflow-hidden chat-list-item group ${active ? "chat-list-item-active" : ""}`}
      role="listitem"
      onContextMenu={(e) => {
        e.preventDefault();
        onMenuRequest?.(chat, { x: e.clientX, y: e.clientY });
      }}
    >
      <ChatListItemSwipeOpenActions
        isOpen={swipedOpen === "right"}
        t={t}
        canOpen={!!onClick}
        canCall={!!onCall}
        canVideoCall={!!onVideoCall}
        onAction={handleSwipeAction}
      />
      <ChatListItemSwipeManageActions
        isOpen={swipedOpen === "left"}
        isDark={isDark}
        t={t}
        isMuted={!!chat.isMuted}
        isArchived={isArchived}
        archiveLabel={archiveLabel}
        canMute={!!onMute}
        canArchive={!!onArchive}
        canDelete={!!onDelete}
        onAction={handleSwipeAction}
      />
      <motion.div
        drag={selectMode ? false : "x"}
        dragConstraints={{ left: -200, right: 240 }}
        dragElastic={0.05}
        onDragStart={() => {
          dragged.current = false;
          dragDistance.current = 0;
        }}
        onDrag={(_, info) => {
          dragDistance.current = Math.abs(info.offset.x);
        }}
        onDragEnd={(_, info) => {
          const wasClosed = swipedOpen === "closed";
          let next: "closed" | "left" | "right" = swipedOpen;
          if (wasClosed) {
            if (info.offset.x < -70) next = "left";
            else if (info.offset.x > 70) next = "right";
          } else if (swipedOpen === "left" && info.offset.x > 30) next = "closed";
          else if (swipedOpen === "right" && info.offset.x < -30) next = "closed";
          if (next !== swipedOpen && next !== "closed") navigator.vibrate?.(20);
          setSwipedOpen(next);
          if (dragDistance.current > 10) dragged.current = true;
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={(e: any) => {
          if (swipedOpen !== "closed") {
            setSwipedOpen("closed");
            e.stopPropagation();
            return;
          }
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          if (selectMode) {
            onToggleSelect?.();
            return;
          }
          onClick?.();
        }}
        animate={{ x: targetX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`relative z-10 w-full px-2.5 md:px-3 py-[var(--chat-item-pad-y,0.625rem)] md:py-[var(--chat-item-pad-y-md,0.75rem)] flex items-center gap-3 cursor-pointer transition-all duration-200 select-none min-h-[var(--chat-item-min-h,68px)] chat-item ${active ? "active" : ""}`}
      >
        <ChatListItemAvatar
          chat={chat}
          isDark={isDark}
          active={active}
          type={type}
          selectMode={selectMode}
          selected={selected}
          overrideAvatar={overrideAvatar}
          t={t}
          onToggleSelect={onToggleSelect}
          onAvatarClick={onAvatarClick}
        />
        <ChatListItemSummary
          chat={chat}
          active={active}
          type={type}
          fuzzedTime={fuzzedTime}
          draftText={draftText}
          typingIndicators={typingIndicators}
          remoteTyping={remoteTyping}
          t={t}
        />
      </motion.div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t("chat.deleteChat")}
        message={t("chat.deleteConfirm")}
        variant="danger"
        theme={theme}
        confirmLabel={t("chat.delete")}
        cancelLabel={t("common.cancel")}
        confirmIcon={<Trash2 size={18} />}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete?.(chat.id);
          setShowDeleteConfirm(false);
        }}
      />
    </div>
  );
});




