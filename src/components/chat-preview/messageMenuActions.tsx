import {
  Check, Reply, Copy, Languages, Bookmark, Pin, Forward, Trash2, Pencil,
} from "lucide-react";
import { toast } from "../ui/Toast";
import { useAppStore } from "../../store";
import { sendChatPin } from "../../lib/p2p/pinSync";
import { type MessageContextAction } from "./MessageContextMenu";

interface BuildMessageMenuArgs {
  msg: any;
  isMe: boolean;
  t: (key: string, options?: any) => string;
  isChannel: boolean;
  chat: any;
  chatSavedMessages: any[];
  onSelect?: (msg: any) => void;
  onReply: (msg: any) => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
  onForward?: (msg: any) => void;
  onDelete?: (msg: any) => void;
  onTranslate: () => void;
  onEdit?: (msg: any) => void;
}

export function buildMessageMenuActions({
  msg, isMe, t, isChannel, chat, chatSavedMessages,
  onSelect, onReply, onToggleSavedMessage, onForward, onDelete, onTranslate, onEdit,
}: BuildMessageMenuArgs): MessageContextAction[] {
  const isPinned = useAppStore.getState().pinnedMessageList.some(
    (p: any) => p.id === msg.id && p.chatId === chat.id,
  );
  const isSaved = chatSavedMessages.some((s: any) => s.messageId === msg.id);

  return [
    ...(onSelect
      ? [{
          key: "select",
          label: t("chat.select", "Select"),
          icon: <Check size={16} />,
          onClick: () => onSelect(msg),
        }]
      : []),
    {
      key: "reply",
      label: t("chat.reply"),
      icon: <Reply size={16} />,
      onClick: () => onReply(msg),
    },
    ...(typeof msg.text === "string" && msg.text
      ? [{
          key: "copy",
          label: t("chat.copy", "Copy"),
          icon: <Copy size={16} />,
          onClick: () => {
            navigator.clipboard?.writeText(msg.text).catch(() => {});
            toast(t("chat.copied", "Copied"));
          },
        }]
      : []),
    ...(typeof msg.text === "string" && msg.text
      ? [{
          key: "translate",
          label: t("chat.translate", "Translate"),
          icon: <Languages size={16} />,
          onClick: () => onTranslate(),
        }]
      : []),
    ...(isChannel
      ? []
      : [{
          key: "save",
          label: isSaved ? t("chat.saved") : t("chat.save"),
          icon: <Bookmark size={16} />,
          onClick: () => onToggleSavedMessage(chat, msg),
        }]),
    {
      key: "pin",
      label: isPinned ? t("chat.unpin", "Unpin") : t("chat.pin", "Pin"),
      icon: <Pin size={16} />,
      onClick: () => {
        const st = useAppStore.getState();
        if (isPinned) {
          st.removePinnedMessage(msg.id, chat.id);
          sendChatPin(chat, msg.id, "unpin");
          toast(t("chat.unpinned", "Unpinned"));
        } else {
          st.addPinnedMessage({ id: msg.id, chatId: chat.id, pinBy: "me" });
          sendChatPin(chat, msg.id, "pin");
          toast(t("chat.pinned", "Pinned"));
        }
      },
    },
    {
      key: "forward",
      label: t("chat.forward", "Forward"),
      icon: <Forward size={16} />,
      onClick: () => (onForward ? onForward(msg) : toast(t("chat.forwardUnavailable", "Forward not available"))),
    },
    ...(isMe && typeof msg.text === "string" && msg.text && onEdit
      ? [{
          key: "edit",
          label: t("chat.edit", "Edit"),
          icon: <Pencil size={16} />,
          onClick: () => onEdit(msg),
        }]
      : []),
    ...(isMe
      ? [{
          key: "delete",
          label: t("chat.delete", "Delete"),
          icon: <Trash2 size={16} />,
          danger: true,
          onClick: () => (onDelete ? onDelete(msg) : toast(t("chat.deleteUnavailable", "Delete not available"))),
        }]
      : []),
  ];
}
