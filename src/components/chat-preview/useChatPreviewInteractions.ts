import React from "react";
import { useAppStore } from "../../store";
import { toast } from "../ui/Toast";
import { resolveLeadSuggestion } from "../../lib/crm/leadSuggestion";

type TFn = (key: string, arg?: any) => string;

interface MsgListRef {
  scrollToBottom: () => void;
  scrollToIndex?: (index: number, align?: "start" | "center" | "end") => void;
}

interface UseChatPreviewInteractionsArgs {
  chat: any;
  t: TFn;
  onUpdateChat?: (chat: any) => void;
  onToggleSavedMessage?: (chat: any, message: any) => void;
  msgListRef: React.RefObject<MsgListRef | null>;
  flatItems: any[];
  selectedIds: Set<string | number>;
  chatSavedMessages: any[];
  setSelectedContact: (contact: any) => void;
  setIsNearBottom: (nearBottom: boolean) => void;
  /** `useChatMessageActions` delete executors. */
  handleDeleteMessage: (msg: any) => void;
  handleDeleteSelected: (messages: any[]) => void;
}

/**
 * Interaction state of the chat preview that no store owns: the delete-confirm
 * state machine, the contact-profile target, the unknown-contact → CRM lead
 * suggestion (including its per-chat dismissal), pinned-message jumps, the
 * search deep-link scroll and the selection bulk actions.
 */
export function useChatPreviewInteractions({
  chat,
  t,
  onUpdateChat,
  onToggleSavedMessage,
  msgListRef,
  flatItems,
  selectedIds,
  chatSavedMessages,
  setSelectedContact,
  setIsNearBottom,
  handleDeleteMessage,
  handleDeleteSelected,
}: UseChatPreviewInteractionsArgs) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ kind: "single" | "bulk"; msg?: any } | null>(null);

  const confirmSingleDelete = (msg: any) => setDeleteConfirm({ kind: "single", msg });
  const confirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirm({ kind: "bulk" });
  };
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.kind === "single") handleDeleteMessage(deleteConfirm.msg);
    else handleDeleteSelected(chat.history || []);
    setDeleteConfirm(null);
  };

  // Unknown incoming contact → suggest saving them as a CRM lead.
  const contacts = useAppStore((s) => s.contacts);
  const crmContacts = useAppStore((s) => s.crmContacts);
  const [dismissedLeadChats, setDismissedLeadChats] = React.useState<string[]>([]);
  const leadSuggestion = React.useMemo(
    () => resolveLeadSuggestion(chat, contacts, crmContacts),
    [chat, contacts, crmContacts],
  );
  const leadSuggestionVisible = !!leadSuggestion && !dismissedLeadChats.includes(String(chat.id));
  const addLeadSuggestion = () => {
    if (!leadSuggestion) return;
    useAppStore.getState().syncMessengerContacts([leadSuggestion.contact]);
    toast(t("crm.leadAdded", "Lead added to CRM"));
    setDismissedLeadChats((prev) => [...prev, String(chat.id)]);
  };
  const dismissLeadSuggestion = () => setDismissedLeadChats((prev) => [...prev, String(chat.id)]);

  // Deep-link: jump to a message when opened via search (chat carries __jumpToMessageId).
  React.useEffect(() => {
    const target = (chat as any)?.__jumpToMessageId;
    if (target == null) return;
    const idx = flatItems.findIndex((item: any) => !item._isDateSeparator && item.id === target);
    if (idx >= 0) setIsNearBottom(false);
    const frame = window.requestAnimationFrame(() => {
      if (idx >= 0) (msgListRef.current as any)?.scrollToIndex?.(idx, "center");
      if (onUpdateChat) onUpdateChat({ ...chat, __jumpToMessageId: undefined });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [chat.id, (chat as any)?.__jumpToMessageId]);

  const handleProfileClick = () => {
    const groupish = chat.type === 'group' || chat.type === 'channel' || chat.type === 'bot' || chat.isChannel;
    if (groupish) {
      setProfileOpen(true);
      return;
    }
    const allContacts = useAppStore.getState().contacts;
    const profileContact = allContacts.find((ct: any) => ct.name === chat.name);
    setSelectedContact({
      id: `hash_${chat.id}`,
      name: chat.name,
      color: chat.color,
      // Real liveness only: useChatPresence stamps chat.lastSeen on peer
      // disconnect and real contacts carry it from creation/import.
      // 0 = unknown, which ContactProfileModal renders as "—".
      lastSeen: chat.online ? 0 : (chat.lastSeen ?? profileContact?.lastSeen ?? 0),
      online: chat.online,
      isFavorite: chat.isFavorite,
      localFields: profileContact?.localFields
    });
  };

  const handleJumpToMessage = (id: string | number) => {
    // Virtualizer indices cover flatItems (bubbles + date separators), so the
    // jump resolves there — same pattern as the search deep-link above.
    const idx = flatItems.findIndex((item: any) => !item._isDateSeparator && item.id === id);
    if (idx >= 0 && msgListRef.current) {
      (msgListRef.current as any).scrollToIndex?.(idx, "center");
    }
  };

  const handleJumpToPinned = (id: number) => handleJumpToMessage(id);

  const handleScrollToBottom = () => {
    msgListRef.current?.scrollToBottom();
  };

  const selectedMessages = (chat.history || []).filter((m: any) => selectedIds.has(m.id));
  const handleCopySelected = async () => {
    const texts = selectedMessages
      .map((m: any) => (typeof m.text === "string" ? m.text : ""))
      .filter(Boolean)
      .join("\n");
    if (!texts) return;
    try {
      await navigator.clipboard.writeText(texts);
      toast(t("chat.copied", "Copied"));
    } catch {
      /* clipboard unavailable */
    }
  };
  const handleSaveSelected = () => {
    const savedKeys = new Set(chatSavedMessages.map((m: any) => m.messageId));
    let added = 0;
    for (const m of selectedMessages) {
      if (!savedKeys.has(m.id)) {
        onToggleSavedMessage?.(chat, m);
        added += 1;
      }
    }
    if (added > 0) toast(t("chat.saved", "Saved"));
  };

  return {
    profileOpen,
    setProfileOpen,
    deleteConfirm,
    selectedCount: selectedIds.size,
    confirmSingleDelete,
    confirmBulkDelete,
    cancelDelete,
    confirmDelete,
    leadSuggestion,
    leadSuggestionVisible,
    addLeadSuggestion,
    dismissLeadSuggestion,
    handleProfileClick,
    handleJumpToMessage,
    handleJumpToPinned,
    handleScrollToBottom,
    handleCopySelected,
    handleSaveSelected,
  };
}