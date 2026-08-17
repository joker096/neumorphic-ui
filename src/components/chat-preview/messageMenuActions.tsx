import {
  Check, Reply, Copy, Languages, Bookmark, Pin, Forward, Trash2, Flag,
} from "lucide-react";
import { toast } from "../ui/Toast";
import { useAppStore } from "../../store";
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
}

export function buildMessageMenuActions({
  msg, isMe, t, isChannel, chat, chatSavedMessages,
  onSelect, onReply, onToggleSavedMessage, onForward, onDelete, onTranslate,
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
          icon: <Check size={18} />,
          onClick: () => onSelect(msg),
        }]
      : []),
    {
      key: "reply",
      label: t("chat.reply"),
      icon: <Reply size={18} />,
      onClick: () => onReply(msg),
    },
    ...(typeof msg.text === "string" && msg.text
      ? [{
          key: "copy",
          label: t("chat.copy", "Copy"),
          icon: <Copy size={18} />,
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
          icon: <Languages size={18} />,
          onClick: () => onTranslate(),
        }]
      : []),
    ...(isChannel
      ? []
      : [{
          key: "save",
          label: isSaved ? t("chat.saved") : t("chat.save"),
          icon: <Bookmark size={18} />,
          onClick: () => onToggleSavedMessage(chat, msg),
        }]),
    {
      key: "pin",
      label: isPinned ? t("chat.unpin", "Unpin") : t("chat.pin", "Pin"),
      icon: <Pin size={18} />,
      onClick: () => {
        const st = useAppStore.getState();
        if (isPinned) {
          st.removePinnedMessage(msg.id);
          toast(t("chat.unpinned", "Unpinned"));
        } else {
          st.addPinnedMessage({ id: msg.id, chatId: chat.id, pinBy: "me" });
          toast(t("chat.pinned", "Pinned"));
        }
      },
    },
    {
      key: "forward",
      label: t("chat.forward", "Forward"),
      icon: <Forward size={18} />,
      onClick: () => (onForward ? onForward(msg) : toast(t("chat.forwardUnavailable", "Forward not available"))),
    },
    ...(isMe
      ? [{
          key: "delete",
          label: t("chat.delete", "Delete"),
          icon: <Trash2 size={18} />,
          danger: true,
          onClick: () => (onDelete ? onDelete(msg) : toast(t("chat.deleteUnavailable", "Delete not available"))),
        }]
      : [{
          key: "report",
          label: t("chat.report", "Report"),
          icon: <Flag size={18} />,
          danger: true,
          onClick: () => toast(t("chat.reported", "Reported")),
        }]),
  ];
}
