import { encodeChatDeliveryAck, nextFrameSeq } from "../chatFrame";
import type { ChatArticleFrame, ChatLocationFrame } from "../chatRichFrames";
import { p2pNetwork } from "../network";
import { resolveInboundSelfDestruct } from "../../selfDestruct";
import { formatClockTime } from "../../../utils/chatUtils";
import { authorizeInboundChatFrame } from "./inboundGate";
import { appendIncomingToDmChat, upsertIncomingToDmChat } from "./inboundChatStore";

/** Live location / geo pin. Streamed fixes upsert one bubble instead of appending. */
export const handleChatLocation = (location: ChatLocationFrame, senderId: string) => {
  const chat = authorizeInboundChatFrame(location.chatId, location.chatName, senderId, "location");
  if (!chat) return;
  // A live share expires on an absolute clock rather than relying on a
  // final "stop" frame arriving. If it never does, the receiver must
  // still stop treating the bubble as live — so an already-expired
  // frame is demoted to a static pin here.
  const isLive = location.live === true
    && location.expiresAt !== undefined
    && location.expiresAt > Date.now();
  const { created } = upsertIncomingToDmChat(chat, {
    id: location.messageId,
    sender: chat.name,
    type: "location",
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy,
    approximate: location.approximate,
    isLive,
    expiresAt: location.expiresAt,
    text: "",
    ts: location.timestamp,
    time: formatClockTime(location.timestamp),
    status: "delivered",
    silent: location.silent,
    selfDestructAt: resolveInboundSelfDestruct(location.ttlMs),
  });
  // Acknowledging every GPS fix would flood the wire, so only the
  // frame that actually created the bubble is confirmed.
  if (!created && typeof location.live === 'boolean') return;
  void p2pNetwork.sendAddressed(senderId, encodeChatDeliveryAck({
    type: "chat-ack",
    seq: nextFrameSeq(),
    messageId: location.messageId,
    chatId: location.chatId,
    timestamp: Date.now(),
  })).catch(() => {});
};

/** Inbound article preview card. */
export const handleChatArticle = (article: ChatArticleFrame, senderId: string) => {
  const chat = authorizeInboundChatFrame(article.chatId, article.chatName, senderId, "article");
  if (!chat) return;
  appendIncomingToDmChat(chat, {
    id: article.messageId,
    sender: chat.name,
    type: "article",
    url: article.url,
    title: article.title || "",
    text: "",
    ts: article.timestamp,
    time: formatClockTime(article.timestamp),
    status: "delivered",
    silent: article.silent,
    selfDestructAt: resolveInboundSelfDestruct(article.ttlMs),
  });
  void p2pNetwork.sendAddressed(senderId, encodeChatDeliveryAck({
    type: "chat-ack",
    seq: nextFrameSeq(),
    messageId: article.messageId,
    chatId: article.chatId,
    timestamp: Date.now(),
  })).catch(() => {});
};