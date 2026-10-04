import { formatClockTime } from "../utils/chatUtils";
import { useAppStore } from "../store";
import { encodeChatLocation } from "../lib/p2p/chatRichFrames";
import { nextFrameSeq } from "../lib/p2p/chatFrame";
import { p2pNetwork } from "../lib/p2p/network";
import { blurCoordinate } from "../constants/liveLocation";
import { toast } from "../components/ui/Toast";

interface UseChatPreviewLiveLocationArgs {
  chat: any;
  onUpdateChat?: (chat: any) => void;
  silent: boolean;
  t: (key: string, fallback?: string) => string;
  startLiveLocation: (opts: any) => void;
  stopLiveLocation: () => void;
}

/**
 * Live location sharing for the chat preview.
 */
export function useChatPreviewLiveLocation({ chat, onUpdateChat, silent, t, startLiveLocation, stopLiveLocation }: UseChatPreviewLiveLocationArgs) {
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
          silent,
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
          silent: !!silent,
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

    startLiveLocation({
      chatId,
      durationMs: opts.durationMs,
      approximate: opts.approximate,
      onUpdate: (share: any) => emit(share, true),
      onEnd: (share: any) => emit(share, false),
      onError: () => toast(t("chat.liveLocationDenied", "Location unavailable"), "error"),
    });
  };

  const stopLiveLocationShare = () => stopLiveLocation();

  return { startLiveLocationShare, stopLiveLocationShare };
}