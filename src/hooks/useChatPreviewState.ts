import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store";
import { groupMessages, formatClockTime, formatDateLabel } from "../utils/chatUtils";
import { useDebounce } from "./useDebounce";
import { encodeMorse } from "../components/MorseDecoder";
import { useI18n } from "../lib/i18n";
import { queueMessage } from "../lib/messageQueue";
import { useOfflineQueue } from "./useOfflineQueue";
import { encodeChatReadReceipt, encodeChatText, nextFrameSeq } from "../lib/p2p/chatFrame";
import { encodeChatLocation, encodeChatArticle } from "../lib/p2p/chatRichFrames";
import { p2pNetwork } from "../lib/p2p/network";
import { useFileSend } from "./useFileSend";
import { applyDefaultSelfDestruct, wireSelfDestructTtl, resolveSelfDestructTimer } from "../lib/selfDestruct";
import { blurCoordinate } from "../constants/liveLocation";
import { toast } from "../components/ui/Toast";

/**
 * Stamp the self-destruct timer onto an outgoing message. Every send path
 * uses it, so the timer covers text, geo, article and attachments alike
 * instead of text only. A per-chat override wins over the global default.
 */
function applySelfDestruct(msg: any, chatId?: string | number): void {
  const s = useAppStore.getState();
  applyDefaultSelfDestruct(
    msg,
    resolveSelfDestructTimer(chatId, s.selfDestructDefault, s.chatSelfDestruct, s.premiumEntitlement?.premium ?? false),
  );
}

export function useChatPreviewState(
  chat: any,
  onUpdateChat?: (chat: any) => void,
  onReply?: (message: any) => void,
  savedMessages: any[] = [],
  onToggleSavedMessage?: (chat: any, message: any) => void,
  deliveryReceipts = true,
  readReceipts = true,
  messageText?: string,
  setMessageText?: (text: string) => void,
  morseMode?: boolean,
  setMorseMode?: (mode: boolean) => void,
  silentMode?: boolean,
  setSilentMode?: (mode: boolean) => void,
  showStickerPicker?: boolean,
  setShowStickerPicker?: (show: boolean) => void,
  isRecordingVoice?: boolean,
  setIsRecordingVoice?: (recording: boolean) => void,
  voiceNoteError?: string,
  setVoiceNoteError?: (error: string) => void,
  scheduleDateTime?: string,
  setScheduleDateTime?: (value: string) => void,
  showSchedulePopup?: boolean,
  setShowSchedulePopup?: (show: boolean) => void,
  replyTarget?: any,
  setReplyTargetProp?: (target: any) => void,
  sendStickerMessage?: (sticker: string) => void,
  handleSendMessageProp?: () => void,
  onScheduleChange?: (value: string) => void,
  onToggleMute?: () => void,
  onAttachImage?: (message: any) => void,
  onToggleSchedulePopup?: () => void,
  onToggleSilent?: () => void,
  onToggleMorse?: () => void,
  onToggleStickerPicker?: () => void,
  setChats?: (updater: any[] | ((prev: any[]) => any[])) => void,
  setEditingContact?: (contact: any) => void,
  onAction?: (action: string) => void,
  onCall?: (name: string, color?: string) => void,
  onVideoCall?: (name: string, color?: string) => void,
  onMessage?: (name: string, color?: string) => void,
) {
  const stealthMode = useAppStore(s => s.stealthMode);
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const setChatsStore = useAppStore(s => s.setChats);
  const startLiveLocationStore = useAppStore(s => s.startLiveLocation);
  const stopLiveLocationStore = useAppStore(s => s.stopLiveLocation);
  const setChannels = useAppStore(s => s.setChannels);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const { t, lang } = useI18n();
  const queueOffline = useOfflineQueue();
  const { sendFile, sendFiles } = useFileSend(chat, { setChats: setChatsStore, setActiveChat: onUpdateChat });

  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [activeMediaMsg, setActiveMediaMsg] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [mediaTab, setMediaTab] = useState<'all' | 'photos' | 'audio' | 'links'>('all');
  const [filterBySender, setFilterBySender] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'media' | 'files' | 'links'>('all');
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | string | null>(null);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [bounceMsgId, setBounceMsgId] = useState<string | number | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadSinceScroll, setUnreadSinceScroll] = useState(0);
  const lastReadReceiptRef = useRef<string | null>(null);
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState === "visible");
  useEffect(() => {
    const onVisibilityChange = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const updateMsgStatusInChat = useCallback((chatArg: any, msgId: string | number, status: string) => {
    const updatedChat = {
      ...chatArg,
      history: (chatArg.history || []).map((m: any) => (m.id === msgId ? { ...m, status } : m)),
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    setChatsStore((prev: any[]) => prev.map((c: any) => (c.id === chatArg.id ? updatedChat : c)));
    if (chatArg.isChannel) {
      setChannels((prev: any[]) => prev.map((c: any) => (c.id === chatArg.id ? updatedChat : c)));
    }
  }, [onUpdateChat, setChatsStore, setChannels]);

  const [localMessageText, setLocalMessageText] = useState("");
  const [localMorseMode, setLocalMorseMode] = useState(false);
  const [localSilentMode, setLocalSilentMode] = useState(false);
  const [localShowStickerPicker, setLocalShowStickerPicker] = useState(false);
  const [localIsRecordingVoice, setLocalIsRecordingVoice] = useState(false);
  const [localVoiceNoteError, setLocalVoiceNoteError] = useState("");
  const [localScheduleDateTime, setLocalScheduleDateTime] = useState("");
  const [localShowSchedulePopup, setLocalShowSchedulePopup] = useState(false);
  const [localReplyTarget, setLocalReplyTarget] = useState<any>(null);

  const eMsgText = messageText ?? localMessageText;
  const eMorseMode = morseMode ?? localMorseMode;
  const eSilentMode = silentMode ?? localSilentMode;
  const eShowStickerPicker = showStickerPicker ?? localShowStickerPicker;
  const eIsRecordingVoice = isRecordingVoice ?? localIsRecordingVoice;
  const eVoiceNoteError = voiceNoteError ?? localVoiceNoteError;
  const eScheduleDateTime = scheduleDateTime ?? localScheduleDateTime;
  const eShowSchedulePopup = showSchedulePopup ?? localShowSchedulePopup;
  const eReplyTarget = replyTarget ?? localReplyTarget;
  const setMsgTextFn = setMessageText ?? ((v: string) => { setLocalMessageText(v); });
  const setMorseModeFn2 = setMorseMode ?? ((v: boolean) => { setLocalMorseMode(v); });
  const setSilentModeFn2 = setSilentMode ?? ((v: boolean) => { setLocalSilentMode(v); });
  const setShowStickerPickerFn2 = setShowStickerPicker ?? ((v: boolean) => { setLocalShowStickerPicker(v); });
  const setIsRecordingVoiceFn2 = setIsRecordingVoice ?? ((v: boolean) => { setLocalIsRecordingVoice(v); });
  const setVoiceNoteErrFn2 = setVoiceNoteError ?? ((v: string) => { setLocalVoiceNoteError(v); });
  const setScheduleDtFn2 = setScheduleDateTime ?? ((v: string) => { setLocalScheduleDateTime(v); });
  const setShowSchedulePopupFn2 = setShowSchedulePopup ?? ((v: boolean) => { setLocalShowSchedulePopup(v); });
  const setReplyTargetFn2 = setReplyTargetProp ?? ((t: any) => { setLocalReplyTarget(t); });

  const lastTapRef = useRef<{ time: number; msgId: string | number }>({ time: 0, msgId: 0 });
  const [swipeReplyId, setSwipeReplyId] = useState<string | number | null>(null);
  const msgListRef = useRef<{ scrollToBottom: () => void; scrollToIndex?: (index: number, align?: 'start' | 'center' | 'end') => void }>(null);
  const prevHistoryLen = useRef(chat.history?.length || 0);

  useEffect(() => {
    const curLen = chat.history?.length || 0;
    if (!isNearBottom && curLen > prevHistoryLen.current) {
      setUnreadSinceScroll(prev => prev + (curLen - prevHistoryLen.current));
    }
    prevHistoryLen.current = curLen;
  }, [chat.history?.length, isNearBottom]);

  useEffect(() => {
    setActiveMediaMsg(null);
  }, [chat.id]);

  useEffect(() => {
    if (!readReceipts || !isNearBottom || !tabVisible || chat.isChannel) return;
    const lastIncoming = [...(chat.history || [])].reverse().find((message: any) => message.sender !== "me");
    if (!lastIncoming) return;
    const messageId = String(lastIncoming.id);
    if (lastReadReceiptRef.current === messageId) return;
    lastReadReceiptRef.current = messageId;
    void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeChatReadReceipt({
      type: "chat-read",
      seq: nextFrameSeq(),
      messageId,
      chatId: String(chat.id),
      timestamp: Date.now(),
    })).catch(() => {});
  }, [chat.id, chat.history, chat.isChannel, isNearBottom, readReceipts, tabVisible]);

  const sendMessage = (attachment?: { url: string; type: 'image' | 'video' } | Array<{ url: string; type: 'image' | 'video' }>) => {
    const textToSend = eMorseMode ? encodeMorse(eMsgText) : eMsgText.trim();
    const attachments = Array.isArray(attachment) ? attachment : attachment ? [attachment] : [];
    const hasAttachment = attachments.length > 0;
    if (!textToSend && !hasAttachment) return;
    if (textToSend && textToSend.length > 20000) return;
    const newMessage: any = {
      id: Date.now(),
      sender: "me",
      text: textToSend,
      ts: Date.now(),
      time: formatClockTime(Date.now()),
      status: navigator.onLine ? "sent" : "queued",
      silent: eSilentMode,
    };
    applySelfDestruct(newMessage, chat?.id);
    if (hasAttachment) {
      newMessage.type = attachments[0]!.type;
      newMessage.attachment = attachments[0]!.url;
      if (attachments.length > 1) {
        newMessage.album = attachments.map((a) => ({ url: a.url, type: a.type }));
      }
    } else {
      newMessage.type = eMorseMode ? "morse" : undefined;
      newMessage.replyTo = eReplyTarget ? {
        id: eReplyTarget.id,
        sender: eReplyTarget.sender,
        text: eReplyTarget.text,
        type: eReplyTarget.type,
        duration: eReplyTarget.duration
      } : undefined;
    }
    queueOffline({ ...newMessage, chatId: chat.id, chatName: chat.name }, () =>
      updateMsgStatusInChat(chat, newMessage.id, "failed"),
    );
    const updatedChat = {
      ...chat,
      history: [...(chat.history || []), newMessage],
      ...(chat.isChannel
        ? { postCount: (chat.postCount ?? chat.history?.length ?? 0) + 1 }
        : {}),
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    if (chat.isChannel) {
      setChannels((prev: any[]) =>
        prev.map((c: any) =>
          c.id === chat.id
            ? { ...c, history: updatedChat.history, postCount: updatedChat.postCount }
            : c
        )
      );
    }
    if (!newMessage.type) {
      const sender = useAppStore.getState().userProfile;
      void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeChatText({
        type: "chat-text",
        seq: nextFrameSeq(),
        messageId: String(newMessage.id),
        chatId: String(chat.id),
        chatName: String(chat.name || ""),
        senderName: sender?.name || sender?.username || "User",
        text: String(newMessage.text || ""),
        silent: !!newMessage.silent,
        timestamp: Number(newMessage.id) || Date.now(),
        ttlMs: wireSelfDestructTtl(newMessage.selfDestructAt),
      })).then(() => updateMsgStatusInChat(updatedChat, newMessage.id, "sent")).catch(() => {});
    }
    setMsgTextFn("");
    setReplyTargetFn2(null);
    setMorseModeFn2(false);
    setLocalSilentMode(false);
  };

  const sendGeoMessage = (lat: number, lng: number) => {
    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const newMessage: any = {
      id: Date.now(),
      sender: "me",
      type: "location",
      lat,
      lng,
      text: "",
      ts: Date.now(),
      time: formatClockTime(Date.now()),
      status: navigator.onLine ? "sent" : "queued",
      silent: eSilentMode,
    };
    applySelfDestruct(newMessage, chat?.id);
    queueOffline({ ...newMessage, chatId: chat.id, chatName: chat.name }, () =>
      updateMsgStatusInChat(chat, newMessage.id, "failed"),
    );
    const updatedChat = {
      ...chat,
      history: [...(chat.history || []), newMessage],
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    const sender = useAppStore.getState().userProfile;
    void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeChatLocation({
      type: "chat-location",
      seq: nextFrameSeq(),
      messageId: String(newMessage.id),
      chatId: String(chat.id),
      chatName: String(chat.name || ""),
      senderName: sender?.name || sender?.username || "User",
      lat,
      lng,
      silent: !!newMessage.silent,
      timestamp: Number(newMessage.id) || Date.now(),
      ttlMs: wireSelfDestructTtl(newMessage.selfDestructAt),
    })).then(() => updateMsgStatusInChat(updatedChat, newMessage.id, "sent")).catch(() => {});
  };

  /**
   * Stream a live share: every accepted position patches the same local bubble
   * and is broadcast as a `chat-location` frame carrying the same `messageId`.
   *
   * Blurring happens here, not at the wire boundary, so the bubble the user
   * sees is exactly the precision the peer receives. Blurring only on send
   * would let the local copy imply a detail that never left the device.
   */
  const startLiveLocationShare = (opts: { durationMs?: number; approximate?: boolean } = {}) => {
    if (!chat) return;
    const chatId = chat.id;
    const chatName = String(chat.name || "");

    const emit = (share: any, live: boolean) => {
      const point = share.approximate
        ? blurCoordinate(share.latitude, share.longitude)
        : { latitude: share.latitude, longitude: share.longitude };
      const id = share.id;
      const ts = share.timestamp;
      // Functional updater: a share can outlive many other messages, so writing
      // back the `chat` captured in this closure would resurrect a stale
      // history and silently drop everything sent meanwhile.
      onUpdateChat?.((prev: any) => {
        const history = [...(prev?.history || [])];
        const idx = history.findIndex((m: any) => String(m.id) === String(id));
        const bubble: any = {
          id,
          sender: "me",
          type: "location",
          lat: point.latitude,
          lng: point.longitude,
          accuracy: share.accuracy,
          approximate: share.approximate,
          isLive: live,
          // Kept on the local bubble after the share ends too, so the local
          // card and the wire frame agree on when the share was meant to stop.
          // `GeoMessageCard` treats a past deadline on a non-live pin as a plain
          // static pin, so this changes nothing visually.
          expiresAt: share.expiresAt,
          text: "",
          status: navigator.onLine ? "sent" : "queued",
          silent: eSilentMode,
        };
        if (idx === -1) {
          // Stamped once, on creation: the receiver pins the original send time
          // so a moving bubble cannot reorder, and the sender must agree.
          bubble.ts = ts;
          bubble.time = formatClockTime(ts);
          history.push(bubble);
        } else {
          history[idx] = { ...history[idx], ...bubble };
        }
        return { ...prev, history };
      });

      const sender = useAppStore.getState().userProfile;
      void p2pNetwork.sendAddressed(
        p2pNetwork.peerForChat(chatId) ?? p2pNetwork.peerForChatName(chatName),
        encodeChatLocation({
          type: "chat-location",
          seq: nextFrameSeq(),
          messageId: String(id),
          chatId: String(chatId),
          chatName,
          senderName: sender?.name || sender?.username || "User",
          lat: point.latitude,
          lng: point.longitude,
          silent: !!eSilentMode,
          timestamp: ts,
          live,
          // Carried on the closing frame too, not just the live ones. A peer
          // that never sees this final frame — closed tab, dropped connection —
          // has no other way to learn the share ended, and a static pin with no
          // deadline is a bubble nothing can ever expire. A legacy client
          // ignores the field it does not know, so it costs nothing there, while
          // any client that does read it gets a deadline for every pin.
          expiresAt: share.expiresAt,
          approximate: share.approximate,
          accuracy: share.accuracy,
        }),
      ).catch(() => {});
    };

    startLiveLocationStore({
      chatId,
      durationMs: opts.durationMs,
      approximate: opts.approximate,
      onUpdate: (share) => emit(share, true),
      onEnd: (share) => emit(share, false),
      onError: () => toast(t("chat.liveLocationDenied", "Location unavailable"), "error"),
    });
  };

  const stopLiveLocationShare = () => stopLiveLocationStore();

  const sendArticleMessage = (url: string, title?: string) => {
    const trimmed = String(url || "").trim();
    if (!/^https?:\/\//i.test(trimmed)) return;
    const newMessage: any = {
      id: Date.now(),
      sender: "me",
      type: "article",
      url: trimmed,
      title: typeof title === "string" ? title.trim() : "",
      text: "",
      ts: Date.now(),
      time: formatClockTime(Date.now()),
      status: navigator.onLine ? "sent" : "queued",
      silent: eSilentMode,
    };
    applySelfDestruct(newMessage, chat?.id);
    queueOffline({ ...newMessage, chatId: chat.id, chatName: chat.name }, () =>
      updateMsgStatusInChat(chat, newMessage.id, "failed"),
    );
    const updatedChat = {
      ...chat,
      history: [...(chat.history || []), newMessage],
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    const sender = useAppStore.getState().userProfile;
    void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeChatArticle({
      type: "chat-article",
      seq: nextFrameSeq(),
      messageId: String(newMessage.id),
      chatId: String(chat.id),
      chatName: String(chat.name || ""),
      senderName: sender?.name || sender?.username || "User",
      url: trimmed,
      title: newMessage.title || undefined,
      silent: !!newMessage.silent,
      timestamp: Number(newMessage.id) || Date.now(),
      ttlMs: wireSelfDestructTtl(newMessage.selfDestructAt),
    })).then(() => updateMsgStatusInChat(updatedChat, newMessage.id, "sent")).catch(() => {});
  };

  const attachFiles = (files: File[], _chatData: any, _onUpdChat: ((c: any) => void) | undefined, silent: boolean) => {
    if (files.length === 1) {
      void sendFile(files[0], { silent });
    } else if (files.length > 1) {
      void sendFiles(files, { silent });
    }
  };

  const sendVideoNote = (file: File) => {
    void sendFile(file, { silent: false, videoNote: true });
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>, chatData: any, onUpdChat: ((c: any) => void) | undefined, silent: boolean) => {
    const files = e.target.files ? [...e.target.files] : [];
    if (files.length === 0) return;
    attachFiles(files, chatData, onUpdChat, silent);
  };

  const handleFileDrop = (files: FileList | null | undefined, chatData: any, onUpdChat: ((c: any) => void) | undefined) => {
    const arr = files ? [...files] : [];
    if (arr.length === 0) return;
    attachFiles(arr, chatData, onUpdChat, false);
  };

  const retryFailedMessage = useCallback((msg: any) => {
    if (!chat || !msg) return;
    const deliver = () => {
      void queueMessage({ ...msg, chatId: chat.id })
        .then(() => {
          if (navigator.onLine) {
            updateMsgStatusInChat(chat, msg.id, "sent");
            // 'delivered' is simulated locally only for non-wire chats (mock /
            // uuid peers). For a real P2P peer the wire chat-ack (handled by
            // useP2PMessages) drives the transition — no guessing here.
            const isWirePeer = p2pNetwork.peerForChat(String(chat.id)) !== undefined
              || /^[0-9a-f]{64}$/.test(String(chat.id));
            if (!isWirePeer) setTimeout(() => updateMsgStatusInChat(chat, msg.id, "delivered"), 1000);
          }
        })
        .catch(() => updateMsgStatusInChat(chat, msg.id, "failed"));
    };
    updateMsgStatusInChat(chat, msg.id, "queued");
    // settings.offlineMode: retrying into a disabled queue would leave the
    // bubble spinning forever, so report the failure straight away.
    if (!useAppStore.getState().offlineMode) {
      updateMsgStatusInChat(chat, msg.id, "failed");
      return;
    }
    deliver();
  }, [chat, updateMsgStatusInChat]);

  const handleReactionMessage = (msgId: string | number, emoji: string) => {
    const target = (chat.history || []).find((m: any) => m.id === msgId);
    if (target && target.sender === "me") return;
    const updatedChat = {
      ...chat,
      history: (chat.history || []).map((m: any) => {
        if (m.id === msgId) {
          const currentReactions = m.reactions || {};
          return { ...m, reactions: { ...currentReactions, [emoji]: (currentReactions[emoji] || 0) + 1 } };
        }
        return m;
      })
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    setChatsStore(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    setActiveReactionPicker(null);
  };

  useEffect(() => {
    if (!chat || !chat.history) return;
    // Real P2P chats: 'read' must come from the peer's wire chat-read frame
    // (useP2PMessages), never from a local timer. Simulation only.
    const isWirePeer = p2pNetwork.peerForChat(String(chat.id)) !== undefined
      || /^[0-9a-f]{64}$/.test(String(chat.id));
    if (isWirePeer) return;
    const hasDelivered = chat.history.some((m: any) => m.sender === "me" && m.status === "delivered");
    if (!hasDelivered) return;
    const timer = setTimeout(() => {
      const updatedHistory = chat.history.map((m: any) => {
        if (m.sender === "me" && m.status === "delivered") return { ...m, status: "read" };
        return m;
      });
      const updatedChat = { ...chat, history: updatedHistory };
      if (onUpdateChat) onUpdateChat(updatedChat);
      setChatsStore(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    }, 1500);
    return () => clearTimeout(timer);
  }, [chat, onUpdateChat, setChatsStore]);

  const debouncedSearch = useDebounce(searchQuery, 200);

  const filteredHistory = useMemo(() =>
    chat.history?.filter((msg: any, idx: number) => {
      if (filterBySender === 'me' && msg.sender !== 'me') return false;
      if (filterBySender === 'them' && msg.sender === 'me') return false;
      if (filterStartDate || filterEndDate) {
        const msgDate = new Date(idx * 86400000 + Date.now());
        if (filterStartDate && msgDate < new Date(filterStartDate)) return false;
        if (filterEndDate && msgDate > new Date(filterEndDate)) return false;
      }
      const matchesType =
        searchTypeFilter === 'all' ? true :
        searchTypeFilter === 'media' ? (msg.type === 'image' || msg.type === 'video') :
        searchTypeFilter === 'files' ? msg.type === 'file' :
        searchTypeFilter === 'links' ? (typeof msg.text === 'string' && /https?:\/\//i.test(msg.text)) :
        true;
      if (!matchesType) return false;
      return debouncedSearch ? msg.text?.toLowerCase().includes(debouncedSearch.toLowerCase()) || !msg.text : true;
    }) || [],
    [chat.history, filterBySender, filterStartDate, filterEndDate, debouncedSearch, searchTypeFilter]
  );

  const mediaItems = useMemo(() =>
    (chat.history || []).filter((msg: any) => {
      if (filterBySender === 'me' && msg.sender !== 'me') return false;
      if (filterBySender === 'them' && msg.sender === 'me') return false;
      if (debouncedSearch && !msg.text?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (mediaTab === 'photos') return msg.type === 'image';
      if (mediaTab === 'audio') return msg.type === 'audio';
      if (mediaTab === 'links') return typeof msg.text === 'string' && /https?:\/\//i.test(msg.text);
      return msg.type === 'image' || msg.type === 'audio' || (typeof msg.text === 'string' && /https?:\/\//i.test(msg.text));
    }),
    [chat.history, filterBySender, debouncedSearch, mediaTab]
  );

  const chatSavedMessages = useMemo(() =>
    savedMessages.filter((saved: any) => saved.chatId === chat.id),
    [savedMessages, chat.id]
  );

  const chatScheduledMessages = useMemo(() =>
    scheduledQueue.messages.filter((m: any) => m.chatId === chat.id),
    [scheduledQueue.messages, chat.id]
  );

  const flatItems = useMemo(() => {
    const groups = groupMessages(filteredHistory);
    const items: any[] = [];
    const dayLabels = {
      lang,
      today: t('chat.today', 'Today'),
      yesterday: t('chat.yesterday', 'Yesterday'),
    };
    let lastDateLabel = '';
    for (const group of groups) {
      const firstMsg = group.messages[0];
      const dateLabel = formatDateLabel(firstMsg.time, firstMsg.ts, dayLabels);
      if (dateLabel !== lastDateLabel && items.length > 0) {
        items.push({ id: `sep-${dateLabel}`, _isDateSeparator: true, _dateLabel: dateLabel });
      }
      lastDateLabel = dateLabel;
      group.messages.forEach((msg: any, mi: number) => {
        items.push({ ...msg, _groupPosition: group.groupPositions[mi], _isLastInGroup: mi === group.messages.length - 1 });
      });
    }
    return items;
  }, [filteredHistory, lang, t]);

  // In-chat search: match navigation (бриф §5.4 "переход к сообщению")
  const matchIndices = useMemo(() => {
    const q = (debouncedSearch || '').toLowerCase().trim();
    if (!q) return [] as number[];
    const out: number[] = [];
    flatItems.forEach((item: any, idx: number) => {
      if (!item._isDateSeparator && typeof item.text === 'string' && item.text.toLowerCase().includes(q)) {
        out.push(idx);
      }
    });
    return out;
  }, [flatItems, debouncedSearch]);

  const [activeMatch, setActiveMatch] = useState(0);
  useEffect(() => {
    if (matchIndices.length === 0) {
      setActiveMatch(0);
      return;
    }
    setActiveMatch(0);
    msgListRef.current?.scrollToIndex?.(matchIndices[0], 'center');
  }, [matchIndices]);

  const goToMatch = useCallback((dir: 1 | -1) => {
    if (matchIndices.length === 0) return;
    const next = (activeMatch + dir + matchIndices.length) % matchIndices.length;
    setActiveMatch(next);
    msgListRef.current?.scrollToIndex?.(matchIndices[next], 'center');
  }, [activeMatch, matchIndices, msgListRef]);

  return {
    videoOpen, setVideoOpen,
    photoOpen, setPhotoOpen,
    activePhotoUrl, setActivePhotoUrl,
    activeMediaMsg, setActiveMediaMsg,
    searchQuery, setSearchQuery,
    showSearch, setShowSearch,
    showMediaPanel, setShowMediaPanel,
    selectedContact, setSelectedContact,
    mediaTab, setMediaTab,
    filterBySender, setFilterBySender,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    showFilterMenu, setShowFilterMenu,
    showDateFilter, setShowDateFilter,
    searchTypeFilter, setSearchTypeFilter,
    showComments, setShowComments,
    activePostId, setActivePostId,
    activeReactionPicker, setActiveReactionPicker,
    showSavedPanel, setShowSavedPanel,
    bounceMsgId, setBounceMsgId,
    isNearBottom, setIsNearBottom,
    unreadSinceScroll, setUnreadSinceScroll,
    eMsgText, setMsgTextFn,
    eMorseMode, setMorseModeFn2,
    eSilentMode, setSilentModeFn2,
    eShowStickerPicker, setShowStickerPickerFn2,
    eIsRecordingVoice, setIsRecordingVoiceFn2,
    eVoiceNoteError, setVoiceNoteErrFn2,
    eScheduleDateTime, setScheduleDtFn2,
    eShowSchedulePopup, setShowSchedulePopupFn2,
    eReplyTarget, setReplyTargetFn2,
    lastTapRef,
    swipeReplyId, setSwipeReplyId,
    msgListRef,
    sendMessage,
    sendGeoMessage,
    startLiveLocationShare,
    stopLiveLocationShare,
    sendArticleMessage,
    handleImageAttach,
    handleFileDrop,
    sendVideoNote,
    handleReactionMessage,
    retryFailedMessage,
    filteredHistory,
    mediaItems,
    chatSavedMessages,
    chatScheduledMessages,
    flatItems,
    matchCount: matchIndices.length,
    activeMatch,
    goToNextMatch: () => goToMatch(1),
    goToPrevMatch: () => goToMatch(-1),
    scheduledQueue,
    stealthMode,
    setChatsStore,
    setChannels,
    contacts,
    setContacts,
    debouncedSearch,
  };
}
